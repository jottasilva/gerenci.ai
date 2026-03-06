import io
import json
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.graphics.shapes import Drawing as GraphicDrawing
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.legends import Legend
from django.utils import timezone
from django.db.models import Sum, Avg, Count, F, Q
from django.db.models.functions import TruncDate
from django.contrib.admin.models import LogEntry, CHANGE, DELETION, ADDITION
from products.models import StockMovement, Product
from orders.models import Order, OrderItem
from core.models import DataAccessLog
from accounts.models import User

# --- Mapeamento de Termos para o Usuário ---
FRIENDLY_NAMES = {
    'PDV.VENDER': 'Venda Finalizada',
    'CANCEL_ORDER': 'Cancelamento de Pedido',
    'UPDATE_STATUS': 'Alteração de Status',
    'CREATE_ORDER': 'Novo Pedido',
    'MANUAL_STOCK': 'Ajuste de Estoque',
    'DINHEIRO': 'Dinheiro',
    'PIX': 'PIX',
    'CARTAO_DEBITO': 'Cartão de Débito',
    'CARTAO_CREDITO': 'Cartão de Crédito',
    'FIADO': 'Fiado',
    'BALCAO': 'Balcão',
    'ENTREGA': 'Entrega',
    'RETIRADA': 'Retirada',
    'REALIZADO': 'Realizado',
    'PREPARANDO': 'Preparando',
    'ENVIADO': 'Enviado',
    'FINALIZADO': 'Finalizado',
    'CANCELADO': 'Cancelado',
}

def get_friendly(key):
    return FRIENDLY_NAMES.get(key, key)

def format_change_message(edit):
    """
    Traduz e formata a mensagem de mudança do LogEntry para algo legível.
    """
    msg = edit.change_message
    
    # 1. Tentar parsear se for JSON (nossa auditoria crítica)
    try:
        data = json.loads(msg)
        if isinstance(data, dict) and 'action' in data:
            action = get_friendly(data['action'])
            reason = data.get('reason', '')
            return f"{action}" + (f" ({reason})" if reason else "")
    except (json.JSONDecodeError, TypeError):
        pass

    # 2. Tradução de flag de ação básica
    prefix = ""
    if edit.action_flag == ADDITION: prefix = "Criação"
    elif edit.action_flag == DELETION: prefix = "Exclusão"
    elif edit.action_flag == CHANGE: prefix = "Alteração"

    # 3. Tentar limpar mensagens padrão do Django
    if str(msg).startswith('[{'):
        try:
            changes = json.loads(msg)
            readable = []
            for c in changes:
                if 'changed' in c:
                    fields = c['changed'].get('fields', [])
                    readable.append(f"Campos: {', '.join(fields)}")
                elif 'added' in c:
                    readable.append("Novo registro")
            if readable:
                return f"{prefix}: {'; '.join(readable)}"
        except:
            pass

    return f"{prefix}: {msg}" if prefix else msg

def create_payment_chart(payment_counts):
    """Gera um gráfico de pizza para métodos de pagamento."""
    d = GraphicDrawing(400, 150)
    pc = Pie()
    pc.x = 150
    pc.y = 10
    pc.width = 120
    pc.height = 120
    
    data = []
    labels = []
    for item in payment_counts:
        data.append(item['count'])
        labels.append(get_friendly(item['payment_method']))
    
    if not data:
        return None
        
    pc.data = data
    pc.labels = [f"{l} ({v})" for l, v in zip(labels, data)]
    pc.slices.strokeWidth = 0.5
    
    # Cores variadas
    slice_colors = [colors.dodgerblue, colors.limegreen, colors.orange, colors.tomato, colors.darkviolet]
    for i, color in enumerate(slice_colors):
        pc.slices[i].fillColor = color
        
    d.add(pc)
    return d

def create_revenue_chart(revenue_by_date):
    """Gera um gráfico de barras para faturamento por dia."""
    d = GraphicDrawing(450, 180)
    bc = VerticalBarChart()
    bc.x = 50
    bc.y = 30
    bc.height = 125
    bc.width = 350
    
    data = []
    labels = []
    for item in revenue_by_date:
        data.append(float(item['revenue']))
        labels.append(item['date'].strftime('%d/%m'))
        
    if not data:
        return None
        
    bc.data = [data]
    bc.categoryAxis.categoryNames = labels
    bc.categoryAxis.labels.angle = 45
    bc.categoryAxis.labels.boxAnchor = 'ne'
    bc.valueAxis.valueMin = 0
    bc.bars[0].fillColor = colors.HexColor('#2980b9')
    
    d.add(bc)
    return d

def generate_pdf_report(store, start_date=None, end_date=None):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = styles['Title']
    heading_style = styles['Heading2']
    subheading_style = styles['Heading3']
    normal_style = styles['Normal']
    
    # Custom style for KPI cards
    kpi_style = ParagraphStyle(
        'KPI',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.whitesmoke,
        alignment=1,
    )
    
    # 1. HEADER
    elements.append(Paragraph(f"RELATÓRIO GERENCIAL COMPLETO", title_style))
    elements.append(Paragraph(f"Loja: {store.name}", styles['Heading3']))
    
    period_str = "Geral (Todo o Histórico)"
    if start_date and end_date:
        period_str = f"{start_date.strftime('%d/%m/%Y')} até {end_date.strftime('%d/%m/%Y')}"
    elif start_date:
        period_str = f"Desde {start_date.strftime('%d/%m/%Y')}"
        
    elements.append(Paragraph(f"Período de Análise: {period_str}", normal_style))
    elements.append(Paragraph(f"Data de Emissão: {timezone.now().strftime('%d/%m/%Y %H:%M')}", normal_style))
    elements.append(Spacer(1, 20))
    
    # Queries base
    orders_query = Order.objects.filter(store=store).exclude(status='CANCELADO').select_related('operator')
    if start_date:
        orders_query = orders_query.filter(created_at__gte=start_date)
    if end_date:
        orders_query = orders_query.filter(created_at__lte=end_date)

    # Pre-calculate costs and profits for summary
    order_items_all = OrderItem.objects.filter(order__in=orders_query).select_related('product')
    total_cost_period = 0
    for item in order_items_all:
        cost = item.product.cost_price if item.product and item.product.cost_price else 0
        total_cost_period += (cost * item.quantity)
    
    # 2. RESUMO EXECUTIVO (KPIs)
    stats = orders_query.aggregate(
        total_revenue=Sum('total'),
        avg_ticket=Avg('total'),
        order_count=Count('id')
    )
    revenue = stats['total_revenue'] or 0.0
    avg_ticket = stats['avg_ticket'] or 0.0
    count = stats['order_count'] or 0
    profit_period = float(revenue) - float(total_cost_period)
    profit_margin_period = (profit_period / float(revenue) * 100) if revenue > 0 else 0
    
    kpi_data = [
        [
            Paragraph(f"<b>FATURAMENTO</b><br/>R$ {revenue:,.2f}", kpi_style),
            Paragraph(f"<b>CUSTO TOTAL</b><br/>R$ {total_cost_period:,.2f}", kpi_style),
            Paragraph(f"<b>LUCRO ESTIMADO</b><br/>R$ {profit_period:,.2f}", kpi_style),
        ],
        [
            Paragraph(f"<b>TICKET MÉDIO</b><br/>R$ {avg_ticket:,.2f}", kpi_style),
            Paragraph(f"<b>PEDIDOS</b><br/>{count}", kpi_style),
            Paragraph(f"<b>MARGEM</b><br/>{profit_margin_period:.1f}%", kpi_style),
        ]
    ]
    
    t_kpi = Table(kpi_data, colWidths=[175, 175, 175])
    t_kpi.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#1a252f')),
        ('BOX', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(t_kpi)
    elements.append(Spacer(1, 20))

    # --- ADD CHARTS ---
    revenue_by_date = orders_query.annotate(date=TruncDate('created_at')).values('date').annotate(revenue=Sum('total')).order_by('-date')[:30]
    revenue_by_date = sorted(list(revenue_by_date), key=lambda l: l['date'])
    
    chart_revenue = create_revenue_chart(revenue_by_date)
    if chart_revenue:
        elements.append(Paragraph("Desempenho de Faturamento Diário", subheading_style))
        elements.append(chart_revenue)
        elements.append(Spacer(1, 10))
        
    payment_counts = orders_query.values('payment_method').annotate(count=Count('id')).order_by('-count')
    chart_payment = create_payment_chart(list(payment_counts))
    if chart_payment:
        elements.append(Paragraph("Distribuição de Métodos de Pagamento", subheading_style))
        elements.append(chart_payment)
        elements.append(Spacer(1, 20))

    # 3. DETALHAMENTO DE ESTOQUE COMPLETO
    elements.append(Paragraph("3. Status Completo de Estoque", heading_style))
    products = Product.objects.filter(store=store).select_related('category').order_by('name')
    
    stock_data = [['Produto', 'Categoria', 'Estoque', 'P. Custo', 'P. Venda', 'V. Total (Venda)']]
    total_stock_value = 0
    total_stock_cost = 0
    for p in products:
        p_total_sale = (p.stock or 0) * (p.price or 0)
        p_total_cost = (p.stock or 0) * (p.cost_price or 0)
        total_stock_value += p_total_sale
        total_stock_cost += p_total_cost
        stock_data.append([
            Paragraph(p.name[:50], styles['Normal']),
            (p.category.name[:20] if p.category else "-"),
            str(p.stock),
            f"R$ {p.cost_price or 0:,.2f}",
            f"R$ {p.price:,.2f}",
            f"R$ {p_total_sale:,.2f}"
        ])
    
    summary_stock = f"Patrimônio em Estoque (Custo): R$ {total_stock_cost:,.2f} | Valor Potencial (Venda): R$ {total_stock_value:,.2f}"
    elements.append(Paragraph(summary_stock, styles['Italic']))
    
    t_stock = Table(stock_data, colWidths=[150, 90, 50, 70, 70, 90], repeatRows=1)
    t_stock.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2980b9')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(t_stock)
    elements.append(PageBreak())
    
    # 4. HISTÓRICO DETALHADO DE VENDAS
    elements.append(Paragraph("4. Histórico de Vendas Detalhado", heading_style))
    orders_detail = orders_query.order_by('-created_at')[:100].prefetch_related('items__product')
    
    sales_data = [['ID', 'Data', 'Total (Venda)', 'Custo Est.', 'Lucro Est.', 'Pagamento']]
    
    # Accumulators for the table footer
    sum_sale_table = 0
    sum_cost_table = 0
    
    for o in orders_detail:
        o_cost = 0
        for item in o.items.all():
            cost = item.product.cost_price if item.product and item.product.cost_price else 0
            o_cost += (cost * item.quantity)
        
        o_profit = float(o.total) - float(o_cost)
        sum_sale_table += float(o.total)
        sum_cost_table += float(o_cost)
        
        sales_data.append([
            f"#{o.id}",
            o.created_at.strftime('%d/%m/%Y'),
            f"R$ {o.total:,.2f}",
            f"R$ {o_cost:,.2f}",
            f"R$ {o_profit:,.2f}",
            get_friendly(o.payment_method)
        ])
    
    # Add Totals row to the sales table
    sum_profit_table = sum_sale_table - sum_cost_table
    margin_table = (sum_profit_table / sum_sale_table * 100) if sum_sale_table > 0 else 0
    
    sales_data.append([
        'TOTAIS',
        '',
        f"R$ {sum_sale_table:,.2f}",
        f"R$ {sum_cost_table:,.2f}",
        f"R$ {sum_profit_table:,.2f} ({margin_table:.1f}%)",
        ''
    ])
        
    t_sales = Table(sales_data, colWidths=[50, 80, 100, 100, 100, 90], repeatRows=1)
    t_sales.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#27ae60')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        # Styling for the totals row
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#d5f5e3')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.black),
    ]))
    elements.append(t_sales)
    elements.append(Spacer(1, 20))

    # --- NEW: PRODUTOS VENDIDOS NO PERÍODO ---
    elements.append(Paragraph("Totais de Produtos Vendidos (Por Item)", subheading_style))
    
    # Query for product aggregation in the selected period
    product_stats = OrderItem.objects.filter(
        order__in=orders_query
    ).values('product_name').annotate(
        total_qty=Sum('quantity'),
        total_sale=Sum('subtotal'),
    ).order_by('-total_qty')
    
    prod_summary_data = [['Produto', 'Qtd Vendida', 'Total Venda', 'Custo Est. Total', 'Lucro Est.']]
    
    for ps in product_stats:
        # Try to find the product to get cost_price
        try:
            p_obj = Product.objects.get(name=ps['product_name'], store=store)
            cost_unit = p_obj.cost_price or 0
        except:
            cost_unit = 0
            
        ps_total_cost = float(cost_unit) * ps['total_qty']
        ps_profit = float(ps['total_sale']) - ps_total_cost
        
        prod_summary_data.append([
            Paragraph(ps['product_name'][:50], styles['Normal']),
            str(ps['total_qty']),
            f"R$ {ps['total_sale']:,.2f}",
            f"R$ {ps_total_cost:,.2f}",
            f"R$ {ps_profit:,.2f}"
        ])
        
    if len(prod_summary_data) > 1:
        t_prod_sum = Table(prod_summary_data, colWidths=[200, 80, 80, 80, 80])
        t_prod_sum.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8e44ad')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ]))
        elements.append(t_prod_sum)
    else:
        elements.append(Paragraph("Nenhum item vendido no período.", normal_style))
    
    elements.append(Spacer(1, 20))

    # 5. GESTÃO DE OPERADORES E ACESSOS
    elements.append(Paragraph("5. Equipe e Auditoria", heading_style))
    
    # Operadores
    elements.append(Paragraph("Equipe da Loja", subheading_style))
    operators = User.objects.filter(store=store)
    op_data = [['Nome', 'WhatsApp/Login', 'Cargo', 'Status']]
    for op in operators:
        op_data.append([
            op.first_name or "S/N",
            op.whatsapp,
            get_friendly(op.role),
            "Ativo" if op.ativo else "Inativo"
        ])
    t_op = Table(op_data, colWidths=[150, 150, 100, 100])
    t_op.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f39c12')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
    ]))
    elements.append(t_op)
    elements.append(Spacer(1, 15))
    
    # Auditoria de Edições (LogEntry)
    elements.append(Paragraph("Log de Alterações (Edições)", subheading_style))
    from django.contrib.contenttypes.models import ContentType
    relevant_models = [Product, Order, User]
    ct_ids = [ContentType.objects.get_for_model(m).id for m in relevant_models]
    
    edits = LogEntry.objects.filter(
        content_type_id__in=ct_ids,
        user__store=store
    ).order_by('-action_time')[:50]
    
    edit_data = [['Data', 'Usuário', 'Objeto', 'Evento']]
    for edit in edits:
        edit_data.append([
            edit.action_time.strftime('%d/%m/%Y %H:%M'),
            edit.user.first_name or "Admin",
            f"{edit.content_type.name} #{edit.object_id}",
            Paragraph(format_change_message(edit), styles['Normal'])
        ])
    
    if len(edit_data) > 1:
        t_edit = Table(edit_data, colWidths=[90, 80, 110, 240])
        t_edit.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#c0392b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(t_edit)
    else:
        elements.append(Paragraph("Nenhuma edição registrada.", normal_style))
        
    elements.append(Spacer(1, 15))
    
    # Logins (DataAccessLog)
    elements.append(Paragraph("Últimos Acessos (Logins)", subheading_style))
    store_user_whatsapps = list(operators.values_list('whatsapp', flat=True))
    logins = DataAccessLog.objects.filter(
        Q(action='LOGIN') & (Q(user__store=store) | Q(resource_id__in=store_user_whatsapps))
    ).order_by('-created_at')[:30]
    
    login_data = [['Data/Hora', 'Operador', 'IP de Origem']]
    for log in logins:
        op_name = log.user.first_name if log.user else ""
        if not op_name:
            try:
                u = User.objects.get(whatsapp=log.resource_id)
                op_name = u.first_name
            except:
                op_name = log.resource_id or "Desconhecido"
                
        login_data.append([
            log.created_at.strftime('%d/%m/%Y %H:%M'),
            op_name,
            log.ip_address or "N/A"
        ])
    
    if len(login_data) > 1:
        t_login = Table(login_data, colWidths=[150, 200, 150])
        t_login.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#34495e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
        ]))
        elements.append(t_login)

    # FINAL BUILD
    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
