from django.urls import path
from . import views

urlpatterns = [
    path('payments/', views.getPayments, name='getPayments'),
    path('payments/id/<int:id>/', views.getPaymentById, name='getPaymentById'),
    path('payments/name/<str:name>/', views.getPaymentByName, name='getPaymentByName'),
    path('payments/create/', views.createPayment, name='createPayment'),
    path('payments/update/<int:id>/', views.updatePayment, name='updatePayment'),
    path('payments/delete/<int:id>/', views.deletePayment, name='deletePayment'),
]
