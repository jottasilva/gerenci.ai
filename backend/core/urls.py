from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import UserViewSet, RegisterView, CustomTokenObtainPairView, SetupPasswordView, CheckUserView
from stores.views import StoreViewSet, StoreSettingsView
from products.views import ProductViewSet, CategoryViewSet, StockMovementViewSet
from customers.views import CustomerViewSet
from orders.views import OrderViewSet
from billing.views import BillingViewSet, SubscriptionPlanViewSet, LicenseKeyViewSet
from suppliers.views import SupplierViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'stores', StoreViewSet)
router.register(r'products', ProductViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'stock-movements', StockMovementViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'plans', SubscriptionPlanViewSet, basename='plan')
router.register(r'license-keys', LicenseKeyViewSet, basename='license-key')
router.register(r'suppliers', SupplierViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),

    # Auth
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/check-user/', CheckUserView.as_view(), name='check_user'),
    path('api/auth/setup-password/', SetupPasswordView.as_view(), name='setup_password'),

    # Store settings
    path('api/store/me/', StoreSettingsView.as_view(), name='store-settings'),

    # Billing actions (non-CRUD)
    path('api/billing/status/', BillingViewSet.as_view({'get': 'status'}), name='billing-status'),
    path('api/billing/plans/', BillingViewSet.as_view({'get': 'plans'}), name='billing-plans'),
    path('api/billing/subscribe/', BillingViewSet.as_view({'post': 'subscribe'}), name='billing-subscribe'),
    path('api/billing/history/', BillingViewSet.as_view({'get': 'history'}), name='billing-history'),
]

from django.conf import settings
from django.conf.urls.static import static
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
