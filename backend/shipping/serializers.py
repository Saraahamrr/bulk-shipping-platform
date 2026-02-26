from rest_framework import serializers
from .models import SavedAddress, SavedPackage, ShipmentRecord

class SavedAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedAddress
        fields = '__all__'

class SavedPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedPackage
        fields = '__all__'

class ShipmentRecordSerializer(serializers.ModelSerializer):
    from_address_formatted = serializers.SerializerMethodField()
    to_address_formatted = serializers.SerializerMethodField()
    package_details = serializers.SerializerMethodField()
    
    class Meta:
        model = ShipmentRecord
        fields = '__all__'
        read_only_fields = ['session_id']
    
    def get_from_address_formatted(self, obj):
        return obj.get_from_address_formatted()
    
    def get_to_address_formatted(self, obj):
        return obj.get_to_address_formatted()
    
    def get_package_details(self, obj):
        return obj.get_package_details()

class BulkShipmentUpdateSerializer(serializers.Serializer):
    record_ids = serializers.ListField(child=serializers.IntegerField())
    
    # Ship From fields (optional)
    from_first_name = serializers.CharField(required=False, allow_blank=True)
    from_last_name = serializers.CharField(required=False, allow_blank=True)
    from_address = serializers.CharField(required=False, allow_blank=True)
    from_address2 = serializers.CharField(required=False, allow_blank=True)
    from_city = serializers.CharField(required=False, allow_blank=True)
    from_zip = serializers.CharField(required=False, allow_blank=True)
    from_state = serializers.CharField(required=False, allow_blank=True)
    
    # Package fields (optional)
    length = serializers.DecimalField(max_digits=6, decimal_places=2, required=False)
    width = serializers.DecimalField(max_digits=6, decimal_places=2, required=False)
    height = serializers.DecimalField(max_digits=6, decimal_places=2, required=False)
    weight_lbs = serializers.IntegerField(required=False)
    weight_oz = serializers.IntegerField(required=False)
    
    # Shipping service (optional)
    shipping_service = serializers.CharField(required=False, allow_blank=True)
     # ✅ New: Status
    status = serializers.CharField(required=False)

    # ✅ New: Manual price override
    shipping_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False
    )