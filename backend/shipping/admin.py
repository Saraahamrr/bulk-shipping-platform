from django.contrib import admin
from .models import SavedAddress, SavedPackage, ShipmentRecord

@admin.register(SavedAddress)
class SavedAddressAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'state', 'zip_code']
    search_fields = ['name', 'address_line1', 'city']

@admin.register(SavedPackage)
class SavedPackageAdmin(admin.ModelAdmin):
    list_display = ['name', 'get_dimensions', 'get_weight']
    search_fields = ['name']

@admin.register(ShipmentRecord)
class ShipmentRecordAdmin(admin.ModelAdmin):
    list_display = ['order_no', 'to_first_name', 'to_last_name', 'to_city', 'to_state', 'status']
    list_filter = ['status', 'shipping_service']
    search_fields = ['order_no', 'to_first_name', 'to_last_name', 'to_address']