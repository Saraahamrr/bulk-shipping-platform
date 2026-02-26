from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
import uuid
import os
from django.utils import timezone

class UserProfile(models.Model):
    """Extended user profile"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    account_balance = models.DecimalField(max_digits=10, decimal_places=2, default=1000.00)
    
    def __str__(self):
        return f"{self.user.username}'s profile"

class SavedAddress(models.Model):
    """Saved addresses for quick access"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_addresses', default=1)
    name = models.CharField(max_length=200)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    address_line1 = models.CharField(max_length=200)
    address_line2 = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2)
    zip_code = models.CharField(max_length=10)
    phone = models.CharField(max_length=20, blank=True)
    
    class Meta:
        ordering = ['name']
        unique_together = ['user', 'name']  # Each user's address names must be unique
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"
    
    def get_full_address(self):
        parts = [f"{self.first_name} {self.last_name}"]
        parts.append(self.address_line1)
        if self.address_line2:
            parts.append(self.address_line2)
        parts.append(f"{self.city}, {self.state} {self.zip_code}")
        return ", ".join(parts)

class SavedPackage(models.Model):
    """Saved package presets"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_packages', default=1)
    name = models.CharField(max_length=100)
    length = models.DecimalField(max_digits=6, decimal_places=2)
    width = models.DecimalField(max_digits=6, decimal_places=2)
    height = models.DecimalField(max_digits=6, decimal_places=2)
    weight_lbs = models.IntegerField(default=0)
    weight_oz = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['name']
        unique_together = ['user', 'name']
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"
    
    def get_dimensions(self):
        return f"{self.length}x{self.width}x{self.height} inches"
    
    def get_weight(self):
        if self.weight_lbs > 0:
            return f"{self.weight_lbs} lb {self.weight_oz} oz"
        return f"{self.weight_oz} oz"

class ShipmentRecord(models.Model):
    """Individual shipment record"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processed', 'Processed'),
        ('error', 'Error'),
    ]
    
    # User association
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shipments', default=1)
    
    # Ship From
    from_first_name = models.CharField(max_length=100, blank=True)
    from_last_name = models.CharField(max_length=100, blank=True)
    from_address = models.CharField(max_length=200, blank=True)
    from_address2 = models.CharField(max_length=200, blank=True)
    from_city = models.CharField(max_length=100, blank=True)
    from_zip = models.CharField(max_length=50, blank=True)
    from_state = models.CharField(max_length=50, blank=True)
    
    # Ship To
    to_first_name = models.CharField(max_length=100)
    to_last_name = models.CharField(max_length=100)
    to_address = models.CharField(max_length=200)
    to_address2 = models.CharField(max_length=200, blank=True)
    to_city = models.CharField(max_length=100)
    to_zip = models.CharField(max_length=50)
    to_state = models.CharField(max_length=50)
    
    # Package Details
    weight_lbs = models.IntegerField(default=0)
    weight_oz = models.IntegerField(default=0)
    length = models.DecimalField(max_digits=6, decimal_places=2)
    width = models.DecimalField(max_digits=6, decimal_places=2)
    height = models.DecimalField(max_digits=6, decimal_places=2)
    
    # Contact
    phone_num1 = models.CharField(max_length=20, blank=True)
    phone_num2 = models.CharField(max_length=20, blank=True)
    
    # Reference
    order_no = models.CharField(max_length=100)
    item_sku = models.CharField(max_length=100, blank=True)
    
    # Shipping
    shipping_service = models.CharField(max_length=50, default='ground')
    shipping_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Shipment {self.order_no} - {self.user.username}"
    
    def get_from_address_formatted(self):
        if not self.from_first_name:
            return "Not provided"
        parts = [f"{self.from_first_name} {self.from_last_name}"]
        parts.append(self.from_address)
        if self.from_address2:
            parts.append(self.from_address2)
        parts.append(f"{self.from_city}, {self.from_state} {self.from_zip}")
        return ", ".join(parts)
    
    def get_to_address_formatted(self):
        parts = [f"{self.to_first_name} {self.to_last_name}"]
        parts.append(self.to_address)
        if self.to_address2:
            parts.append(self.to_address2)
        parts.append(f"{self.to_city}, {self.to_state} {self.to_zip}")
        return ", ".join(parts)
    
    def get_package_details(self):
        dims = f"{self.length}x{self.width}x{self.height} inches"
        weight = f"{self.weight_lbs} lb {self.weight_oz} oz" if self.weight_lbs > 0 else f"{self.weight_oz} oz"
        return f"{dims}, {weight}"
    
    def calculate_shipping_price(self):
        """Calculate shipping price based on weight and dimensions"""
        total_oz = (self.weight_lbs * 16) + self.weight_oz
        if self.shipping_service == 'priority':
            return 5.00 + (total_oz * 0.10)
        else:  # ground
            return 2.50 + (total_oz * 0.05)