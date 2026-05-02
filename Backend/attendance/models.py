from django.db import models

class Atendance(models.Model):   
    name = models.CharField(max_length=255)
    email = models.EmailField()
    id_no = models.CharField(max_length=255)
    country = models.CharField(max_length=255)
    university = models.CharField(max_length=255)
    departement = models.CharField(max_length=255)
    carear_year = models.IntegerField()
    grad_undergrad = models.CharField(max_length=255)
    Precence = models.CharField(max_length=1) 
