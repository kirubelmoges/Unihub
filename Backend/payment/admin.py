from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'id_no', 'paymentType', 'paidOrUnpaid')
    search_fields = ('name', 'email', 'id_no')

