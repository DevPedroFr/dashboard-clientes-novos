from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from .models import Company, User, DashboardPreference, MonitoringData
from .serializers import *
import random
from datetime import datetime, timedelta

@csrf_exempt
@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    if user:
        return Response({
            'success': True,
            'user': UserSerializer(user).data
        })
    return Response({'success': False, 'error': 'Credenciais inválidas'}, status=400)

@csrf_exempt
@api_view(['POST'])
def chat_message(request):
    message = request.data.get('message')
    user_id = request.data.get('user_id')
    
    # Simulação de resposta da IA
    responses = {
        'widgets': 'Entendi! Vou adicionar widgets para você. Que tipo de informação você quer visualizar? Status dos dispositivos, gráficos de performance, alertas críticos?',
        'firewall': 'Perfeito! Vou configurar o dashboard para exibir o status dos firewalls, tentativas de invasão bloqueadas e regras ativas.',
        'switch': 'Ótimo! Adicionarei informações sobre switches: portas ativas, tráfego de rede e dispositivos conectados.',
        'banco': 'Entendido! Vou incluir métricas de banco de dados: conexões ativas, queries lentas e uso de memória.',
        'internet': 'Configurando! Vou mostrar informações dos links de internet: latência, banda utilizada e disponibilidade.',
        'pronto': 'Dashboard configurado com sucesso! Você será redirecionado em instantes.',
    }
    
    response_text = 'Como posso ajudar você a personalizar seu dashboard?'
    for key, value in responses.items():
        if key in message.lower():
            response_text = value
            break
    
    return Response({
        'response': response_text,
        'timestamp': datetime.now().isoformat()
    })

@csrf_exempt
@api_view(['GET'])
def mock_monitoring_data(request):
    company_slug = request.query_params.get('company')
    
    data = {
        'devices': [
            {
                'id': 1,
                'name': 'Firewall Principal',
                'type': 'firewall',
                'status': 'online',
                'cpu': random.randint(20, 80),
                'memory': random.randint(30, 70),
                'threats_blocked': random.randint(100, 500),
            },
            {
                'id': 2,
                'name': 'Switch Core',
                'type': 'switch',
                'status': 'online',
                'ports_active': random.randint(20, 48),
                'traffic_mbps': random.randint(100, 900),
            },
            {
                'id': 3,
                'name': 'Database Server',
                'type': 'database',
                'status': 'warning',
                'connections': random.randint(50, 200),
                'queries_per_sec': random.randint(100, 1000),
            },
            {
                'id': 4,
                'name': 'Link Internet Principal',
                'type': 'internet',
                'status': 'online',
                'latency_ms': random.randint(10, 50),
                'bandwidth_usage': random.randint(40, 95),
            }
        ],
        'alerts': [
            {
                'id': 1,
                'severity': 'warning',
                'message': 'Uso de CPU elevado no Database Server',
                'timestamp': (datetime.now() - timedelta(minutes=15)).isoformat(),
            },
            {
                'id': 2,
                'severity': 'info',
                'message': 'Backup automático concluído com sucesso',
                'timestamp': (datetime.now() - timedelta(hours=2)).isoformat(),
            }
        ],
        'tickets': [
            {
                'id': 'GLI-001',
                'title': 'Lentidão no acesso ao sistema',
                'status': 'Em andamento',
                'priority': 'Alta',
                'created': (datetime.now() - timedelta(days=1)).isoformat(),
            }
        ]
    }
    
    return Response(data)

@csrf_exempt
@api_view(['POST'])
def save_preferences(request):
    user_id = request.data.get('user_id')
    preferences = request.data.get('preferences')
    
    try:
        user = User.objects.get(id=user_id)
        pref, created = DashboardPreference.objects.get_or_create(user=user)
        pref.layout = preferences.get('layout', {})
        pref.widgets = preferences.get('widgets', [])
        pref.save()
        
        user.is_first_login = False
        user.save()
        
        return Response({'success': True})
    except User.DoesNotExist:
        return Response({'success': False, 'error': 'Usuário não encontrado'}, status=404)

@csrf_exempt
@api_view(['GET'])
def get_preferences(request):
    user_id = request.query_params.get('user_id')
    
    try:
        user = User.objects.get(id=user_id)
        pref = DashboardPreference.objects.get(user=user)
        return Response({
            'layout': pref.layout,
            'widgets': pref.widgets,
        })
    except (User.DoesNotExist, DashboardPreference.DoesNotExist):
        return Response({'layout': {}, 'widgets': []})