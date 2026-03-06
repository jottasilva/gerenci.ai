from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.http import HttpResponse
from django.utils import timezone
from datetime import datetime
from stores.models import Store
from .reports_service import generate_pdf_report
from core.permissions import HasRolePermission

class ReportExportView(APIView):
    permission_classes = [permissions.IsAuthenticated, HasRolePermission]
    required_permissions = {
        'get': 'relatorio.vendas'
    }

    def get(self, request):
        # Default store from user
        store = getattr(request.user, 'store', None)
        
        # Check if a specific store_id was requested
        requested_store_id = request.query_params.get('store_id')
        if requested_store_id:
            try:
                # If admin, can see any store. Otherwise, must be the user's store.
                if request.user.role == 'ADMIN':
                    store = Store.objects.get(id=requested_store_id)
                elif store and str(store.id) == str(requested_store_id):
                    # Already set to user.store, just validating
                    pass
                else:
                    return Response({"error": "Você não tem permissão para acessar esta loja."}, status=403)
            except (Store.DoesNotExist, ValueError):
                return Response({"error": "Loja não encontrada."}, status=404)

        if not store:
            return Response({"error": "Nenhuma loja selecionada ou vinculada ao usuário."}, status=400)
            
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        start_date = None
        end_date = None
        period = request.query_params.get('period')
        
        try:
            if period == 'diario':
                start_date = timezone.localtime(timezone.now()).replace(hour=0, minute=0, second=0, microsecond=0)
            elif period == 'semanal':
                start_date = timezone.localtime(timezone.now()) - timezone.timedelta(days=7)
            elif period == 'mensal':
                start_date = timezone.localtime(timezone.now()) - timezone.timedelta(days=30)
            
            if start_date_str:
                start_date = timezone.make_aware(datetime.strptime(start_date_str, '%Y-%m-%d'))
            if end_date_str:
                # End of day for end_date
                end_date = timezone.make_aware(datetime.strptime(f"{end_date_str} 23:59:59", '%Y-%m-%d %H:%M:%S'))
        except ValueError:
            return Response({"error": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)
            
        pdf_content = generate_pdf_report(store, start_date=start_date, end_date=end_date)
        
        response = HttpResponse(pdf_content, content_type='application/pdf')
        timestamp = timezone.now().strftime('%Y%m%d_%H%M')
        filename = f"relatorio_{store.name.replace(' ', '_')}_{timestamp}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
