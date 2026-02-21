from rest_framework import viewsets, permissions, generics, status
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.response import Response
from .models import Store
from .serializers import StoreSerializer


class MultiTenantViewSet(viewsets.ModelViewSet):
    def _get_effective_store(self):
        """Returns the store to use for filtering. Admins can override via X-Store-ID header."""
        user = self.request.user
        store_id = self.request.headers.get('X-Store-ID')
        if store_id and (user.is_staff or getattr(user, 'role', None) == 'ADMIN'):
            try:
                return Store.objects.get(id=store_id)
            except Store.DoesNotExist:
                pass
        return user.store

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            store = self._get_effective_store()
            if store:
                return self.queryset.filter(store=store)
        return self.queryset.none()

    def perform_create(self, serializer):
        store = self._get_effective_store()
        serializer.save(store=store)


class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.all()
    serializer_class = StoreSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'role', None) == 'ADMIN':
            return Store.objects.all()
        if user.store:
            return Store.objects.filter(id=user.store.id)
        return Store.objects.none()


class StoreSettingsView(generics.RetrieveUpdateAPIView):
    """GET /api/store/me/  — returns & updates the current user's store."""
    serializer_class = StoreSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, JSONParser)
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_object(self):
        user = self.request.user
        store_id = self.request.headers.get('X-Store-ID')
        
        if store_id and (user.is_staff or getattr(user, 'role', None) == 'ADMIN'):
            try:
                return Store.objects.get(id=store_id)
            except Store.DoesNotExist:
                from rest_framework.exceptions import NotFound
                raise NotFound("Loja especificada não encontrada.")
                
        store = user.store
        if not store:
            from rest_framework.exceptions import NotFound
            raise NotFound("Nenhuma loja associada ao usuário.")
        return store
