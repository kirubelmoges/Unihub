from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Payment
from .serializers import PaymentSerializer

# Get all payments
@api_view(['GET'])
def getPayments(request):
    payments = Payment.objects.all()
    serializer = PaymentSerializer(payments, many=True)
    return Response(serializer.data)

# Get payment by ID
@api_view(['GET'])
def getPaymentById(request, id):
    try:
        payment = Payment.objects.get(id=id)
    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=404)
    serializer = PaymentSerializer(payment)
    return Response(serializer.data)

# Get payment by Name
@api_view(['GET'])
def getPaymentByName(request, name):
    payments = Payment.objects.filter(name=name)
    serializer = PaymentSerializer(payments, many=True)
    return Response(serializer.data)

# Create a new payment
@api_view(['POST'])
def createPayment(request):
    serializer = PaymentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'status': 'Payment created', 'payment': serializer.data})
    return Response(serializer.errors, status=400)

# Update a payment
@api_view(['PUT'])
def updatePayment(request, id):
    try:
        payment = Payment.objects.get(id=id)
    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=404)
    
    serializer = PaymentSerializer(payment, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

# Delete a payment
@api_view(['DELETE'])
def deletePayment(request, id):
    try:
        payment = Payment.objects.get(id=id)
    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=404)
    
    payment.delete()
    return Response({'status': 'Payment deleted'})


