from django.db import models

class Analytics(models.Model):
    subject = models.CharField(max_length=255)
    writterEmail = models.EmailField(max_length=255)
    bodyImageLink = models.FileField(default=False)
    bodyVidioLink = models.FileField(max_length=2080,default=False)
    country = models.CharField(max_length=255,default=False)
    university = models.CharField(max_length=255)
    departement = models.CharField(max_length=255)
    carear_year = models.IntegerField()
    grad_undergrad = models.CharField(max_length=255)
    description = models.CharField(max_length=600,default=False)
