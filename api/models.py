from django.db import models
from django.contrib.auth.models import AbstractUser
import json

class Company(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True)
    is_first_login = models.BooleanField(default=True)
    
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='api_user_groups',
        blank=True,
        help_text='The groups this user belongs to.'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='api_user_permissions',
        blank=True,
        help_text='Specific permissions for this user.'
    )

class DashboardPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    layout = models.JSONField(default=dict)
    widgets = models.JSONField(default=list)
    chat_history = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class MonitoringData(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    device_type = models.CharField(max_length=50)
    device_name = models.CharField(max_length=200)
    status = models.CharField(max_length=50)
    metrics = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)