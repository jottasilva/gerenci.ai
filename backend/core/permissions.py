from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied

# Permission Matrix Mapping
# Maps granual permission keys to the roles that possess them
PERMISSION_MAP = {
    # PDV
    'pdv.vender': ['ADMIN', 'GERENTE', 'VENDEDOR'],
    'pdv.cancelar': ['ADMIN', 'GERENTE'],
    'pdv.estornar': ['ADMIN', 'GERENTE'],
    'pdv.desconto': ['ADMIN', 'GERENTE'], # Operador tem limite fixo (5%)
    
    # Caixa
    'caixa.abrir': ['ADMIN', 'GERENTE', 'VENDEDOR'],
    'caixa.fechar': ['ADMIN', 'GERENTE', 'VENDEDOR'],
    'caixa.sangria': ['ADMIN', 'GERENTE'],
    'caixa.suprimento': ['ADMIN', 'GERENTE'],
    'caixa.ajustar': ['ADMIN', 'GERENTE'],
    
    # Produtos & Estoque
    'produto.gerenciar': ['ADMIN', 'GERENTE'],
    'estoque.ajustar': ['ADMIN', 'GERENTE'],
    'categoria.gerenciar': ['ADMIN', 'GERENTE'],
    
    # Gestão
    'relatorio.financeiro': ['ADMIN'],
    'relatorio.vendas': ['ADMIN', 'GERENTE'],
    'usuario.gerenciar': ['ADMIN'],
    'config.atendente': ['ADMIN', 'GERENTE'],
    'config.global': ['ADMIN'],
}

class HasRolePermission(permissions.BasePermission):
    """
    DRF Permission class that checks if the user's role has the required permission.
    Usage:
        permission_classes = [HasRolePermission]
        required_permission = 'pdv.vender'
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin bypass
        if request.user.role == 'ADMIN' or request.user.is_superuser:
            return True
            
        # 1. Check for action-specific permission
        required_perm = None
        perms_map = getattr(view, 'required_permissions', {})
        action = getattr(view, 'action', None)
        
        if action and perms_map and action in perms_map:
            required_perm = perms_map[action]
            
        # 2. Fallback to class-level required_permission
        if not required_perm:
            required_perm = getattr(view, 'required_permission', None)
            
        # 3. If no permission is explicitly required, check IsAuthenticated as minimum
        if not required_perm:
            return request.user and request.user.is_authenticated
            
        allowed_roles = PERMISSION_MAP.get(required_perm, [])
        if request.user.role in allowed_roles:
            return True
            
        return False

def check_permission(user, permission_key):
    """Utility function to check permission in non-view logic."""
    if not user or not user.is_authenticated:
        return False
    if user.role == 'ADMIN' or user.is_superuser:
        return True
    return user.role in PERMISSION_MAP.get(permission_key, [])
