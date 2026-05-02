from django.db import models

class Departement(models.Model):
    image = models.CharField(max_length=2083,default=False)
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=600,default=False)
    din = models.CharField(max_length=255,default=False)
    councelor = models.CharField(max_length=255,default=False)


class Course(models.Model):
    image = models.CharField(max_length=2083,default=False)
    credit_hour = models.IntegerField()
    instructor = models.CharField(max_length=255,default=False)
    ects = models.IntegerField()
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=600,default=False)


class ClassToEnroll(models.Model):
    fallOrSpring = models.CharField(max_length=255)
    description = models.CharField(max_length=600,default=False)
    Departement = models.CharField(max_length=255)




    

