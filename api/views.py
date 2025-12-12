from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from .models import Company, User, DashboardPreference, MonitoringData
from .serializers import *
import random
from datetime import datetime, timedelta
import os
from google import genai
from google.genai import types

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

@csrf_exempt
@api_view(['POST'])
def ai_assistant(request):
    """
    Conversational AI endpoint that enriches the prompt with current monitoring data
    for the user's company and returns a response from Gemini.
    """
    user_id = request.data.get('user_id')
    prompt = request.data.get('prompt') or request.data.get('message')

    if not prompt:
        return Response({'error': 'Prompt não informado'}, status=400)

    try:
        user = User.objects.get(id=user_id) if user_id else None
    except User.DoesNotExist:
        user = None

    # Collect monitoring context: prefer database rows, fallback to mock generator
    context_blocks = []
    if user and user.company:
        rows = list(MonitoringData.objects.filter(company=user.company).order_by('-timestamp')[:50])
        if rows:
            # Summarize rows into a compact JSON-like text
            devices_summary = []
            for r in rows:
                devices_summary.append({
                    'device_type': r.device_type,
                    'device_name': r.device_name,
                    'status': r.status,
                    'metrics': r.metrics,
                    'timestamp': r.timestamp.isoformat(),
                })
            context_blocks.append(f"Contexto de monitoramento (últimos {len(devices_summary)} registros):\n" + str(devices_summary))
    
    if not context_blocks:
        # Fallback to mock_monitoring_data
        mock = {
            'devices': [
                {
                    'name': 'Firewall Principal', 'type': 'firewall', 'status': 'online',
                },
                {
                    'name': 'Switch Core', 'type': 'switch', 'status': 'online',
                },
                {
                    'name': 'Database Server', 'type': 'database', 'status': 'warning',
                },
                {
                    'name': 'Link Internet Principal', 'type': 'internet', 'status': 'online',
                }
            ]
        }
        context_blocks.append("Contexto de monitoramento (mock):\n" + str(mock))

    system_text = (
        "Você é um agente de IA integrado à plataforma de dashboard de clientes da DKRLI. "
        "Ajude os clientes a entender e visualizar os dados (Firewalls, Switches, Links de internet, APs e Banco de dados). "
        "Nunca vaze dados sensíveis. Dê respostas claras, contextualizadas e acionáveis."
    )

    # Prepare Google GenAI client
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        return Response({'error': 'Chave GEMINI_API_KEY não configurada'}, status=500)

    client = genai.Client(api_key=api_key)

    contents = [
        types.Content(role="user", parts=[types.Part.from_text(text=\
            f"{system_text}\n\nContexto:\n" + "\n\n".join(context_blocks) + "\n\nPergunta do usuário:\n" + prompt
        )])
    ]

    try:
        result_stream = client.models.generate_content_stream(
            model="gemini-2.5-pro",
            contents=contents,
            config=types.GenerateContentConfig()
        )

        # Aggregate streamed text into a single response
        response_text = ""
        for chunk in result_stream:
            if getattr(chunk, 'text', None):
                response_text += chunk.text

        if not response_text:
            # Fallback textual response based on prompt keywords
            lower = prompt.lower()
            if 'firewall' in lower:
                response_text = 'Vou destacar status dos firewalls, eventos bloqueados, uso de CPU/memória e recomendações de tuning.'
            elif 'switch' in lower:
                response_text = 'Incluirei portas ativas, tráfego por interface e alertas de erros/CRC.'
            elif 'banco' in lower or 'database' in lower:
                response_text = 'Mostrarei conexões ativas, queries/seg, latência de consultas e possíveis gargalos.'
            elif 'internet' in lower or 'link' in lower:
                response_text = 'Exibirei latência, perda de pacotes, uso de banda e disponibilidade dos provedores.'
            else:
                response_text = 'Posso organizar seu dashboard com base nos dispositivos e métricas disponíveis. Diga o que deseja priorizar.'

        return Response({
            'response': response_text,
            'timestamp': datetime.now().isoformat(),
        })
    except Exception as e:
        # Graceful fallback on errors: return contextual canned response
        fallback = 'Tive um problema ao gerar a resposta da IA. '
        if context_blocks:
            fallback += 'Com base no contexto atual, posso montar uma visão com status e métricas dos dispositivos. '
        fallback += 'Descreva o que deseja ver (firewall, switches, banco, internet) e eu configuro os widgets.'
        return Response({
            'response': fallback,
            'error': f'Falha na IA: {str(e)}',
            'timestamp': datetime.now().isoformat(),
        }, status=200)