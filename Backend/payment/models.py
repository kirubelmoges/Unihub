from django.db import models

class Payment(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    id_no = models.CharField(max_length=255)
    country = models.CharField(max_length=255,default=False)
    university = models.CharField(max_length=255)
    departement = models.CharField(max_length=255)
    carear_year = models.IntegerField()
    grad_undergrad = models.CharField(max_length=255)
    paymentSession = models.CharField(max_length=255)
    paymentType = models.CharField(max_length=255)
    paymentLink = models.CharField(max_length=2080)
    paidOrUnpaid = models.CharField(max_length=255)
    description = models.CharField(max_length=600,default=False)
