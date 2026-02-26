from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('auth/register/', views.register, name='auth-register'),
    path('auth/login/', views.login_view, name='auth-login'),
    path('auth/logout/', views.logout_view, name='auth-logout'),
    path('auth/profile/', views.get_user_profile, name='auth-profile'),
    
    # Saved addresses
    path('addresses/', views.SavedAddressList.as_view(), name='address-list'),
    path('addresses/<int:pk>/', views.SavedAddressDetail.as_view(), name='address-detail'),
    
    # Saved packages
    path('packages/', views.SavedPackageList.as_view(), name='package-list'),
    path('packages/<int:pk>/', views.SavedPackageDetail.as_view(), name='package-detail'),
    
    # Shipments
    path('shipments/', views.get_shipments, name='shipment-list'),
    path('shipments/<int:pk>/', views.update_shipment, name='shipment-detail'),
    path('shipments/<int:pk>/delete/', views.delete_shipment, name='shipment-delete'),
    path('shipments/bulk/update/', views.bulk_update_shipments, name='shipment-bulk-update'),
    path('shipments/bulk/delete/', views.bulk_delete_shipments, name='shipment-bulk-delete'),
    path('shipments/delete-all/', views.delete_all_shipments, name='delete_all_shipments'),

    # Upload
    path('upload/', views.upload_csv, name='upload-csv'),
    
    # Purchase
    path('purchase/', views.purchase_shipments, name='purchase'),
    
    # Template
    path('template/', views.download_template, name='download-template'),
]