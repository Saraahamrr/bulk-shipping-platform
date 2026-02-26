from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import SavedAddress, SavedPackage, ShipmentRecord, UserProfile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['user', 'account_balance']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    account_balance = serializers.DecimalField(max_digits=10, decimal_places=2, default=1000.00, required=False)

    class Meta:
        model = User
        fields = ['username', 'password', 'password2', 'email', 'first_name', 'last_name', 'account_balance']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        account_balance = validated_data.pop('account_balance', 1000.00)
        validated_data.pop('password2')
        
        user = User.objects.create_user(**validated_data)
        
        # Create user profile
        UserProfile.objects.create(user=user, account_balance=account_balance)
        
        return user

class SavedAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedAddress
        fields = '__all__'
        read_only_fields = ['user']

class SavedPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedPackage
        fields = '__all__'
        read_only_fields = ['user']

class ShipmentRecordSerializer(serializers.ModelSerializer):
    from_address_formatted = serializers.SerializerMethodField()
    to_address_formatted = serializers.SerializerMethodField()
    package_details = serializers.SerializerMethodField()
    
    class Meta:
        model = ShipmentRecord
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']
    
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
    status = serializers.CharField(required=False)
    shipping_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)