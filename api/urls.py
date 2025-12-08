from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view),
    path('chat/', views.chat_message),
    path('monitoring/', views.mock_monitoring_data),
    path('preferences/save/', views.save_preferences),
    path('preferences/get/', views.get_preferences),
]