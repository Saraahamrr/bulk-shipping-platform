import csv
import io
import pandas as pd
from django.http import HttpResponse
from django.db import transaction
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import SavedAddress, SavedPackage, ShipmentRecord, UserProfile
from .serializers import (
    UserSerializer, RegisterSerializer, UserProfileSerializer,
    SavedAddressSerializer, SavedPackageSerializer, 
    ShipmentRecordSerializer, BulkShipmentUpdateSerializer
)
from .permissions import IsOwner

# Helper functions for safe conversion
def safe_int(value, default=0):
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return default

def safe_float(value, default=0.0):
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

# ============== AUTHENTICATION VIEWS ==============

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })
    else:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        logout(request)
        return Response({'message': 'Successfully logged out'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    user = request.user
    profile = user.profile
    
    return Response({
        'user': UserSerializer(user).data,
        'profile': UserProfileSerializer(profile).data
    })

# ============== SAVED ADDRESSES ==============

class SavedAddressList(generics.ListCreateAPIView):
    serializer_class = SavedAddressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SavedAddress.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SavedAddressDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SavedAddressSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    
    def get_queryset(self):
        return SavedAddress.objects.filter(user=self.request.user)

# ============== SAVED PACKAGES ==============

class SavedPackageList(generics.ListCreateAPIView):
    serializer_class = SavedPackageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SavedPackage.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SavedPackageDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SavedPackageSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    
    def get_queryset(self):
        return SavedPackage.objects.filter(user=self.request.user)

# ============== SHIPMENTS ==============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_shipments(request):
    """Get all shipments for current user"""
    shipments = ShipmentRecord.objects.filter(user=request.user)
    serializer = ShipmentRecordSerializer(shipments, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_shipment(request, pk):
    """Update a single shipment"""
    try:
        shipment = ShipmentRecord.objects.get(pk=pk, user=request.user)
    except ShipmentRecord.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    serializer = ShipmentRecordSerializer(shipment, data=request.data, partial=True)
    if serializer.is_valid():
        # Update shipping price if service changed
        if 'shipping_service' in request.data:
            shipment.shipping_service = request.data['shipping_service']
            request.data['shipping_price'] = shipment.calculate_shipping_price()
        
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_shipment(request, pk):
    """Delete a single shipment"""
    try:
        shipment = ShipmentRecord.objects.get(pk=pk, user=request.user)
        shipment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except ShipmentRecord.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_all_shipments(request):
    """Delete all shipments for the current user"""
    user = request.user
    shipments = ShipmentRecord.objects.filter(user=user)
    
    count = shipments.count()
    if count == 0:
        return Response({'message': 'No shipments to delete'}, status=status.HTTP_200_OK)
    
    shipments.delete()
    return Response({
        'message': f'Successfully deleted all shipments ({count} records)'
    }, status=status.HTTP_200_OK)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def bulk_update_shipments(request):
    """Bulk update multiple shipments"""
    serializer = BulkShipmentUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    record_ids = data.pop('record_ids', [])

    if not record_ids:
        return Response(
            {'error': 'No record IDs provided'},
            status=status.HTTP_400_BAD_REQUEST
        )

    records = ShipmentRecord.objects.filter(id__in=record_ids, user=request.user)

    if not records.exists():
        return Response(
            {"error": f"No shipments found for IDs: {record_ids}"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check for invalid IDs
    existing_ids = set(records.values_list('id', flat=True))
    invalid_ids = [rid for rid in record_ids if rid not in existing_ids]

    if invalid_ids:
        return Response(
            {"error": f"Invalid shipment IDs: {invalid_ids}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Remove None or empty values
    update_data = {
        k: v for k, v in data.items()
        if v is not None and v != ''
    }

    if not update_data:
        return Response(
            {'error': 'No fields to update'},
            status=status.HTTP_400_BAD_REQUEST
        )

    with transaction.atomic():
        if 'shipping_service' in update_data:
            new_service = update_data.pop('shipping_service')
            for record in records:
                record.shipping_service = new_service
                record.shipping_price = record.calculate_shipping_price()
            ShipmentRecord.objects.bulk_update(
                records,
                ['shipping_service', 'shipping_price']
            )

        if 'shipping_price' in update_data:
            manual_price = update_data.pop('shipping_price')
            for record in records:
                record.shipping_price = manual_price
            ShipmentRecord.objects.bulk_update(
                records,
                ['shipping_price']
            )
            
        if 'status' in update_data:
            new_status = update_data.pop('status')
            for record in records:
                record.status = new_status
            ShipmentRecord.objects.bulk_update(
                records,
                ['status']
            )

        if update_data:
            records.update(**update_data)

    updated = ShipmentRecord.objects.filter(id__in=record_ids, user=request.user)
    response_serializer = ShipmentRecordSerializer(updated, many=True)

    return Response(response_serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_delete_shipments(request):
    """Bulk delete shipments"""
    record_ids = request.data.get('record_ids', [])

    if not record_ids:
        return Response({'error': 'No record IDs provided'}, status=status.HTTP_400_BAD_REQUEST)

    records = ShipmentRecord.objects.filter(id__in=record_ids, user=request.user)

    if not records.exists():
        return Response(
            {"error": f"No shipments found for IDs: {record_ids}"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check for invalid IDs
    existing_ids = set(records.values_list('id', flat=True))
    invalid_ids = [rid for rid in record_ids if rid not in existing_ids]
    if invalid_ids:
        return Response(
            {"error": f"Invalid shipment IDs: {invalid_ids}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Delete valid records
    records.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# ============== UPLOAD ==============

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_csv(request):
    """Upload and parse CSV file with row-level error handling"""
    
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    
    try:
        df = pd.read_csv(file, skiprows=2, header=None, encoding='utf-8')
        
        records = []
        errors = []

        for index, row in df.iterrows():
            try:
                if pd.isna(row[7]) and pd.isna(row[8]):
                    continue  # skip empty rows
                
                record = ShipmentRecord(
                    user=request.user,
                    from_first_name=str(row[0])[:50] if not pd.isna(row[0]) else '',
                    from_last_name=str(row[1])[:50] if not pd.isna(row[1]) else '',
                    from_address=str(row[2])[:100] if not pd.isna(row[2]) else '',
                    from_address2=str(row[3])[:100] if not pd.isna(row[3]) else '',
                    from_city=str(row[4])[:50] if not pd.isna(row[4]) else '',
                    from_zip=str(row[5])[:20] if not pd.isna(row[5]) else '',
                    from_state=str(row[6])[:50] if not pd.isna(row[6]) else '',
                    to_first_name=str(row[7])[:50] if not pd.isna(row[7]) else '',
                    to_last_name=str(row[8])[:50] if not pd.isna(row[8]) else '',
                    to_address=str(row[9])[:100] if not pd.isna(row[9]) else '',
                    to_address2=str(row[10])[:100] if not pd.isna(row[10]) else '',
                    to_city=str(row[11])[:50] if not pd.isna(row[11]) else '',
                    to_zip=str(row[12])[:20] if not pd.isna(row[12]) else '',
                    to_state=str(row[13])[:50] if not pd.isna(row[13]) else '',
                    weight_lbs=safe_int(row[14]),
                    weight_oz=safe_int(row[15]),
                    length=safe_float(row[16]),
                    width=safe_float(row[17]),
                    height=safe_float(row[18]),
                    phone_num1=str(row[19])[:20] if not pd.isna(row[19]) else '',
                    phone_num2=str(row[20])[:20] if not pd.isna(row[20]) else '',
                    order_no=str(row[21])[:30] if not pd.isna(row[21]) else f"ORDER-{index}",
                    item_sku=str(row[22])[:30] if not pd.isna(row[22]) else '',
                    shipping_service='ground'
                )
                
                record.shipping_price = record.calculate_shipping_price()
                records.append(record)
            
            except Exception as row_error:
                errors.append({'row': index + 2, 'error': str(row_error)})
        
        # Save all valid records
        with transaction.atomic():
            # Optionally delete existing pending shipments for this user
            # ShipmentRecord.objects.filter(user=request.user, status='pending').delete()
            ShipmentRecord.objects.bulk_create(records)
        
        serializer = ShipmentRecordSerializer(
            ShipmentRecord.objects.filter(user=request.user),
            many=True
        )
        
        return Response({
            'message': f'Successfully imported {len(records)} records',
            'records': serializer.data,
            'errors': errors,
        })

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# ============== PURCHASE ==============

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def purchase_shipments(request):
    """Simulate purchase of selected shipments"""
    record_ids = request.data.get('record_ids', [])
    label_format = request.data.get('label_format', 'letter')
    
    if not record_ids:
        return Response({'error': 'No records specified'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get records belonging to this user
    records = ShipmentRecord.objects.filter(id__in=record_ids, user=request.user)
    
    if not records.exists():
        return Response({'error': 'No valid records found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user has enough balance
    total = sum(record.shipping_price for record in records)
    
    if request.user.profile.account_balance < total:
        return Response({
            'error': 'Insufficient balance',
            'required': total,
            'available': request.user.profile.account_balance
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Process purchase
    with transaction.atomic():
        # Deduct from user balance
        profile = request.user.profile
        profile.account_balance -= total
        profile.save()
        
        # Update status to processed
        records.update(status='processed')
    
    return Response({
        'message': f'Successfully purchased {len(records)} labels',
        'total': total,
        'label_format': label_format,
        'records_processed': len(records),
        'new_balance': profile.account_balance
    })

# ============== TEMPLATE ==============

@api_view(['GET'])
@permission_classes([AllowAny])
def download_template(request):
    """Download the template CSV matching the exact structure"""
    # Create CSV content
    output = io.StringIO()
    writer = csv.writer(output)

    # Row 1: Top-level categories
    writer.writerow([
        'From', '', '', '', '', '', '', '',
        'To', '', '', '', '', '', '', '',
        'weight*', 'weight*',
        'Dimensions*', 'Dimensions*', 'Dimensions*',
        '', '', '', ''
    ])

    # Row 2: Column headers
    writer.writerow([
        'First name*', 'Last name', 'Address*', 'Address2', 'City*', 'ZIP/Postal code*', 'Abbreviation*',
        'First name*', 'Last name', 'Address*', 'Address2', 'City*', 'ZIP/Postal code*', 'Abbreviation*',
        'lbs', 'oz', 'Length', 'width', 'Height',
        'phone num1', 'phone num2', 'order no', 'Item-sku'
    ])

    # Row 3: Sample data
    writer.writerow([
        '', '', '', '', '', '', '',
        'Salina', 'Dixon', '61 Sunny Trail Rd', 'Apt 10885', 'Wallace', '28466-9087', 'NC',
        '', '', '', '',
        '', '', '', ''
    ])

    # Return as CSV attachment
    response = HttpResponse(output.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="shipping_template.csv"'

    return response