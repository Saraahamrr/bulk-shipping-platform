import csv
import io
import uuid
import pandas as pd
from django.http import HttpResponse
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import SavedAddress, SavedPackage, ShipmentRecord
from .serializers import (
    SavedAddressSerializer, 
    SavedPackageSerializer, 
    ShipmentRecordSerializer,
    BulkShipmentUpdateSerializer
)

def get_session_id(request):
    """Get or create session ID"""
    session_id = request.headers.get('X-Session-ID')
    if not session_id:
        session_id = request.COOKIES.get('session_id')
    if not session_id:
        session_id = str(uuid.uuid4())
    return session_id

class SavedAddressList(APIView):
    def get(self, request):
        addresses = SavedAddress.objects.all()
        serializer = SavedAddressSerializer(addresses, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = SavedAddressSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SavedAddressDetail(APIView):
    def get_object(self, pk):
        try:
            return SavedAddress.objects.get(pk=pk)
        except SavedAddress.DoesNotExist:
            return None
    
    def put(self, request, pk):
        address = self.get_object(pk)
        if not address:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = SavedAddressSerializer(address, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        address = self.get_object(pk)
        if not address:
            return Response(status=status.HTTP_404_NOT_FOUND)
        address.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class SavedPackageList(APIView):
    def get(self, request):
        packages = SavedPackage.objects.all()
        serializer = SavedPackageSerializer(packages, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = SavedPackageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SavedPackageDetail(APIView):
    def get_object(self, pk):
        try:
            return SavedPackage.objects.get(pk=pk)
        except SavedPackage.DoesNotExist:
            return None
    
    def put(self, request, pk):
        package = self.get_object(pk)
        if not package:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = SavedPackageSerializer(package, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        package = self.get_object(pk)
        if not package:
            return Response(status=status.HTTP_404_NOT_FOUND)
        package.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
def upload_csv(request):
    """Upload and parse CSV file"""
    session_id = get_session_id(request)
    
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    
    try:
        # Read CSV file
        df = pd.read_csv(file, skiprows=1, header=None, encoding='utf-8')
        
        # Column mapping based on Template.csv structure
        records = []
        for index, row in df.iterrows():
            # Skip empty rows
            if pd.isna(row[7]) and pd.isna(row[8]):  # Skip if no recipient name
                continue
                
            # Create shipment record
            record = ShipmentRecord(
                session_id=session_id,
                
                # Ship From (may be empty)
                from_first_name=str(row[0]) if not pd.isna(row[0]) else '',
                from_last_name=str(row[1]) if not pd.isna(row[1]) else '',
                from_address=str(row[2]) if not pd.isna(row[2]) else '',
                from_address2=str(row[3]) if not pd.isna(row[3]) else '',
                from_city=str(row[4]) if not pd.isna(row[4]) else '',
                from_zip=str(row[5]) if not pd.isna(row[5]) else '',
                from_state=str(row[6]) if not pd.isna(row[6]) else '',
                
                # Ship To
                to_first_name=str(row[7]) if not pd.isna(row[7]) else '',
                to_last_name=str(row[8]) if not pd.isna(row[8]) else '',
                to_address=str(row[9]) if not pd.isna(row[9]) else '',
                to_address2=str(row[10]) if not pd.isna(row[10]) else '',
                to_city=str(row[11]) if not pd.isna(row[11]) else '',
                to_zip=str(row[12]) if not pd.isna(row[12]) else '',
                to_state=str(row[13]) if not pd.isna(row[13]) else '',
                
                # Package Details
                weight_lbs=int(row[14]) if not pd.isna(row[14]) else 0,
                weight_oz=int(row[15]) if not pd.isna(row[15]) else 0,
                length=float(row[16]) if not pd.isna(row[16]) else 0,
                width=float(row[17]) if not pd.isna(row[17]) else 0,
                height=float(row[18]) if not pd.isna(row[18]) else 0,
                
                # Contact
                phone_num1=str(row[19]) if not pd.isna(row[19]) else '',
                phone_num2=str(row[20]) if not pd.isna(row[20]) else '',
                
                # Reference
                order_no=str(row[21]) if not pd.isna(row[21]) else f"ORDER-{index}",
                item_sku=str(row[22]) if not pd.isna(row[22]) else '',
                
                # Default shipping
                shipping_service='ground'
            )
            
            # Calculate initial shipping price
            record.shipping_price = record.calculate_shipping_price()
            records.append(record)
        
        # Bulk create records
        with transaction.atomic():
            ShipmentRecord.objects.filter(session_id=session_id).delete()
            ShipmentRecord.objects.bulk_create(records)
        
        # Get created records
        created_records = ShipmentRecord.objects.filter(session_id=session_id)
        serializer = ShipmentRecordSerializer(created_records, many=True)
        
        response = Response({
            'message': f'Successfully imported {len(records)} records',
            'records': serializer.data,
            'session_id': session_id
        })
        
        # Set session cookie
        response.set_cookie('session_id', session_id, max_age=3600, httponly=True)
        
        return response
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_shipments(request):
    """Get all shipments for current session"""
    session_id = get_session_id(request)
    shipments = ShipmentRecord.objects.filter(session_id=session_id)
    serializer = ShipmentRecordSerializer(shipments, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
def update_shipment(request, pk):
    """Update a single shipment"""
    try:
        shipment = ShipmentRecord.objects.get(pk=pk)
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
def delete_shipment(request, pk):
    """Delete a single shipment"""
    try:
        shipment = ShipmentRecord.objects.get(pk=pk)
        shipment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except ShipmentRecord.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def bulk_update_shipments(request):
    """Bulk update multiple shipments"""
    serializer = BulkShipmentUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    record_ids = data.pop('record_ids', [])
    
    # Filter out None values
    update_data = {k: v for k, v in data.items() if v is not None and v != ''}
    
    if not update_data:
        return Response({'error': 'No fields to update'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Update records
    with transaction.atomic():
        records = ShipmentRecord.objects.filter(id__in=record_ids)
        
        # Handle shipping service update
        if 'shipping_service' in update_data:
            for record in records:
                record.shipping_service = update_data['shipping_service']
                record.shipping_price = record.calculate_shipping_price()
            ShipmentRecord.objects.bulk_update(records, ['shipping_service', 'shipping_price'])
            del update_data['shipping_service']
        
        # Update other fields
        if update_data:
            records.update(**update_data)
    
    # Return updated records
    updated = ShipmentRecord.objects.filter(id__in=record_ids)
    response_serializer = ShipmentRecordSerializer(updated, many=True)
    
    return Response(response_serializer.data)

@api_view(['POST'])
def bulk_delete_shipments(request):
    """Bulk delete shipments"""
    record_ids = request.data.get('record_ids', [])
    
    if not record_ids:
        return Response({'error': 'No records specified'}, status=status.HTTP_400_BAD_REQUEST)
    
    ShipmentRecord.objects.filter(id__in=record_ids).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
def purchase_shipments(request):
    """Simulate purchase of selected shipments"""
    record_ids = request.data.get('record_ids', [])
    label_format = request.data.get('label_format', 'letter')
    
    if not record_ids:
        return Response({'error': 'No records specified'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Update status to processed
    records = ShipmentRecord.objects.filter(id__in=record_ids)
    records.update(status='processed')
    
    # Calculate total
    total = sum(record.shipping_price for record in records)
    
    return Response({
        'message': f'Successfully purchased {len(record_ids)} labels',
        'total': total,
        'label_format': label_format,
        'records_processed': len(record_ids)
    })

@api_view(['GET'])
def download_template(request):
    """Download the template CSV"""
    # Create CSV content
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write headers
    writer.writerow(['From,,,,,,,To,,,,,,,weight*,weight*,Dimensions*,Dimensions*,Dimensions*,,,,'])
    writer.writerow([
        'First name*', 'Last name', 'Address*', 'Address2', 'City*', 'ZIP/Postal code*', 'Abbreviation*',
        'First name*', 'Last name', 'Address*', 'Address2', 'City*', 'ZIP/Postal code*', 'Abbreviation*',
        'lbs', 'oz', 'Length', 'width', 'Height', 'phone num1', 'phone num2', 'order no', 'Item-sku'
    ])
    
    # Add sample data
    writer.writerow([
        '', '', '', '', '', '', '',
        'Salina', 'Dixon', '61 Sunny Trail Rd', 'Apt 10885', 'Wallace', '28466-9087', 'NC',
        '', '', '', '', '', '', '', 'Apt 10885', ''
    ])
    
    response = HttpResponse(output.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="shipping_template.csv"'
    
    return response