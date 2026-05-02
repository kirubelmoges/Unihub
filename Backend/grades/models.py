from django.db import models

class Grade(models.Model):
    courseName = models.CharField(max_length=255)
    id_no = models.CharField(max_length=255)
    grade = models.IntegerField()
    university = models.CharField(max_length=255)
    departement = models.CharField(max_length=255)
    carear_year = models.IntegerField()
    grad_undergrad = models.CharField(max_length=255)
    description = models.CharField(max_length=600,default=False)
