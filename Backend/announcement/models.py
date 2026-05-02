from django.db import models

class Anouncement(models.Model): 
    AnnouncerName = models.CharField(max_length=100)
    AnnouncerPosition = models.CharField(max_length=100)
    AnnouncementSubject = models.CharField(max_length=200)
    AnnouncementBody = models.CharField(max_length=600)
    AnnouncerEmail = models.EmailField()


