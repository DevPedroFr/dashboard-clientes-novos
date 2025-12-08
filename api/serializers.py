from rest_framework import serializers
from .models import Company, User, DashboardPreference, MonitoringData

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'company', 'company_name', 'is_first_login']

class DashboardPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardPreference
        fields = '__all__'

class MonitoringDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonitoringData
        fields = '__all__'