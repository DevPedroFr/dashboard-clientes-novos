import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, LayoutDashboard, Activity, AlertTriangle, Settings, LogOut, GripVertical, X, Bell, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

const API_URL = 'http://localhost:8000/api';

// Componente de Chat Flutuante - Assistente para tirar dúvidas sobre o monitoramento
const FloatingChat = ({ user, monitoringData, alerts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Olá! Sou o assistente de monitoramento da ${user?.company_name || 'sua empresa'}. Posso te ajudar a entender o que está acontecendo com seus sistemas. Pergunte sobre:\n\n• Status atual dos links\n• Problemas detectados\n• Situação dos firewalls\n• Alertas recentes` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Função que gera respostas baseadas nos dados reais do monitoramento
  const generateContextualResponse = (userInput) => {
    const text = userInput.toLowerCase();
    const company = user?.company_name || 'sua empresa';
    
    // Dados atuais
    const devices = monitoringData?.devices || [];
    const currentAlerts = alerts || monitoringData?.alerts || [];
    const firewall = devices.find(d => d.type === 'firewall');
    const switchDevice = devices.find(d => d.type === 'switch');
    const database = devices.find(d => d.type === 'database');
    const internet = devices.find(d => d.type === 'internet');
    
    // Alertas críticos e warnings
    const criticalAlerts = currentAlerts.filter(a => a.severity === 'critical');
    const warningAlerts = currentAlerts.filter(a => a.severity === 'warning');
    
    // PERGUNTAS SOBRE PROBLEMAS / O QUE ESTÁ ACONTECENDO
    if (text.includes('problema') || text.includes('errado') || text.includes('acontecendo') || text.includes('situação') || text.includes('resumo')) {
      let response = `📊 **Resumo atual da ${company}:**\n\n`;
      
      if (criticalAlerts.length > 0) {
        response += `🔴 **${criticalAlerts.length} problema(s) crítico(s):**\n`;
        criticalAlerts.forEach(a => {
          response += `• ${a.title || a.message}\n`;
        });
        response += '\n';
      }
      
      if (warningAlerts.length > 0) {
        response += `🟡 **${warningAlerts.length} alerta(s) de atenção:**\n`;
        warningAlerts.forEach(a => {
          response += `• ${a.title || a.message}\n`;
        });
        response += '\n';
      }
      
      if (criticalAlerts.length === 0 && warningAlerts.length === 0) {
        response += '✅ Todos os sistemas estão operando normalmente!\n';
      }
      
      return response;
    }
    
    // PERGUNTAS SOBRE LINKS / INTERNET
    if (text.includes('link') || text.includes('internet') || text.includes('conexão') || text.includes('conectividade') || text.includes('claro') || text.includes('vivo')) {
      const linkAlerts = currentAlerts.filter(a => 
        a.device?.toLowerCase().includes('link') || 
        a.message?.toLowerCase().includes('link') ||
        a.title?.toLowerCase().includes('link') ||
        a.title?.toLowerCase().includes('latência')
      );
      
      let response = `🌐 **Status dos Links de Internet:**\n\n`;
      
      if (internet) {
        response += `• Latência atual: ${internet.latency_ms}ms ${internet.latency_ms > 50 ? '⚠️ (elevada)' : '✅'}\n`;
        response += `• Uso de banda: ${internet.bandwidth_usage}%\n`;
        response += `• Status geral: ${internet.status === 'online' ? '✅ Online' : '⚠️ ' + internet.status}\n\n`;
      }
      
      if (linkAlerts.length > 0) {
        response += `⚠️ **Alertas de conectividade:**\n`;
        linkAlerts.forEach(a => {
          response += `• ${a.title || a.message} (${a.unit || 'Central'})\n`;
        });
      } else {
        response += `✅ Nenhum problema de conectividade no momento.`;
      }
      
      return response;
    }
    
    // PERGUNTAS SOBRE FIREWALL / SEGURANÇA
    if (text.includes('firewall') || text.includes('segurança') || text.includes('ameaça') || text.includes('ataque') || text.includes('bloqueado')) {
      let response = `🛡️ **Status de Segurança:**\n\n`;
      
      if (firewall) {
        response += `• Status: ${firewall.status === 'online' ? '✅ Operacional' : '⚠️ ' + firewall.status}\n`;
        response += `• CPU: ${firewall.cpu}% ${firewall.cpu > 80 ? '⚠️' : ''}\n`;
        response += `• Memória: ${firewall.memory}%\n`;
        response += `• Ameaças bloqueadas hoje: ${firewall.threats_blocked} 🚫\n\n`;
      }
      
      const securityAlerts = currentAlerts.filter(a => 
        a.device?.toLowerCase().includes('firewall') || 
        a.title?.toLowerCase().includes('ameaça') ||
        a.title?.toLowerCase().includes('bloqueada')
      );
      
      if (securityAlerts.length > 0) {
        response += `📋 **Eventos recentes:**\n`;
        securityAlerts.slice(0, 3).forEach(a => {
          response += `• ${a.title || a.message}\n`;
        });
      }
      
      return response;
    }
    
    // PERGUNTAS SOBRE ALERTAS
    if (text.includes('alerta') || text.includes('notificação') || text.includes('aviso')) {
      let response = `🔔 **Alertas Recentes:**\n\n`;
      
      if (currentAlerts.length === 0) {
        return '✅ Não há alertas no momento. Todos os sistemas estão operando normalmente!';
      }
      
      currentAlerts.slice(0, 5).forEach(a => {
        const icon = a.severity === 'critical' ? '🔴' : a.severity === 'warning' ? '🟡' : a.severity === 'success' ? '🟢' : '🔵';
        response += `${icon} **${a.title || a.message}**\n`;
        response += `   ${a.device || 'Sistema'} • ${new Date(a.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\n`;
      });
      
      return response;
    }
    
    // PERGUNTAS SOBRE DATABASE / BANCO
    if (text.includes('banco') || text.includes('database') || text.includes('dados') || text.includes('query') || text.includes('conexões')) {
      let response = `🗄️ **Status do Banco de Dados:**\n\n`;
      
      if (database) {
        response += `• Status: ${database.status === 'online' ? '✅ Online' : '⚠️ ' + database.status}\n`;
        response += `• Conexões ativas: ${database.connections}\n`;
        response += `• Queries/segundo: ${database.queries_per_sec}\n`;
      }
      
      if (database?.status === 'warning') {
        response += `\n⚠️ O banco está em estado de atenção. Recomendo verificar o uso de recursos.`;
      }
      
      return response;
    }
    
    // PERGUNTAS SOBRE SWITCH / REDE
    if (text.includes('switch') || text.includes('rede') || text.includes('porta') || text.includes('tráfego')) {
      let response = `🔌 **Status da Rede:**\n\n`;
      
      if (switchDevice) {
        response += `• Status: ${switchDevice.status === 'online' ? '✅ Online' : '⚠️ ' + switchDevice.status}\n`;
        response += `• Portas ativas: ${switchDevice.ports_active}/48\n`;
        response += `• Tráfego: ${switchDevice.traffic_mbps} Mbps\n`;
      }
      
      return response;
    }
    
    // PERGUNTAS SOBRE UNIDADES ESPECÍFICAS
    if (text.includes('unidade') || text.includes('loja') || text.includes('filial') || text.includes('são paulo') || text.includes('taubaté')) {
      return `📍 **Monitoramento por Unidade:**\n\nPara ver o status detalhado de cada unidade, clique em "Abrir detalhes" no card de Links ou Firewall no dashboard.\n\nCada unidade possui:\n• Links redundantes (Claro/Vivo)\n• Firewall dedicado\n• Monitoramento 24/7`;
    }
    
    // SAUDAÇÕES
    if (text.includes('olá') || text.includes('oi') || text.includes('hey') || text.includes('bom dia') || text.includes('boa tarde')) {
      const hora = new Date().getHours();
      const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
      return `${saudacao}! 👋 Como posso ajudar com o monitoramento da ${company} hoje?`;
    }
    
    // AJUDA
    if (text.includes('ajuda') || text.includes('help') || text === '?') {
      return `🤖 **Como posso ajudar:**\n\n• "O que está acontecendo?" - Resumo geral\n• "Como estão os links?" - Status de conectividade\n• "Tem algum problema?" - Alertas ativos\n• "Status do firewall" - Segurança\n• "Alertas recentes" - Últimas notificações\n\nPergunte naturalmente sobre qualquer aspecto do monitoramento!`;
    }
    
    // RESPOSTA PADRÃO
    return `Posso te ajudar com informações sobre:\n\n• **Links de internet** - conectividade das unidades\n• **Firewall** - segurança e ameaças\n• **Alertas** - problemas detectados\n• **Banco de dados** - performance\n\nO que você gostaria de saber?`;
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);
    
    // Simula "pensamento" da IA
    setTimeout(() => {
      const response = generateContextualResponse(currentInput);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setLoading(false);
    }, 800 + Math.random() * 700);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Sugestões rápidas
  const quickQuestions = [
    "O que está acontecendo?",
    "Como estão os links?",
    "Tem algum problema?"
  ];

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center hover:scale-110 z-50"
          title="Tirar dúvidas com IA"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
          <div className="bg-blue-600 text-white px-5 py-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Assistente de Monitoramento</h3>
                <p className="text-xs text-blue-100">Tire suas dúvidas sobre o sistema</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md border border-gray-200 shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Sugestões rápidas */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex gap-2 flex-wrap">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => { setInput(q); }}
                  className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <div className="border-t border-gray-200 p-3 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pergunte sobre o monitoramento..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Componente de Toast/Notificação Pop-up
const ToastNotification = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(notification.id), 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'error': return 'border-l-red-500';
      case 'warning': return 'border-l-yellow-500';
      case 'success': return 'border-l-green-500';
      default: return 'border-l-blue-500';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 border-l-4 ${getBorderColor()} p-4 max-w-sm animate-slide-in`}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <p className="font-medium text-gray-900 text-sm">{notification.title}</p>
          <p className="text-gray-600 text-xs mt-1">{notification.message}</p>
          <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {notification.time}
          </p>
        </div>
        <button onClick={() => onClose(notification.id)} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Container de Notificações
const NotificationsContainer = ({ notifications, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {notifications.map((notif) => (
        <ToastNotification key={notif.id} notification={notif} onClose={onClose} />
      ))}
    </div>
  );
};

// Modal de Detalhes do Alerta
const AlertDetailModal = ({ alert, onClose }) => {
  if (!alert) return null;

  const getSeverityInfo = () => {
    switch (alert.severity) {
      case 'critical': return { color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="w-6 h-6 text-red-600" />, label: 'Crítico' };
      case 'warning': return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />, label: 'Atenção' };
      case 'success': return { color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle className="w-6 h-6 text-green-600" />, label: 'Resolvido' };
      default: return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <Bell className="w-6 h-6 text-blue-600" />, label: 'Info' };
    }
  };

  const info = getSeverityInfo();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <div className={`px-6 py-4 border-b ${info.color} rounded-t-2xl flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {info.icon}
            <span className="font-semibold">{info.label}</span>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800 p-1 hover:bg-white/50 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{alert.title || alert.message}</h3>
          <p className="text-gray-600 mb-4">{alert.description || alert.message}</p>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Dispositivo:</span>
              <span className="font-medium text-gray-900">{alert.device || 'Sistema'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Unidade:</span>
              <span className="font-medium text-gray-900">{alert.unit || 'Central'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Horário:</span>
              <span className="font-medium text-gray-900">{new Date(alert.timestamp).toLocaleString('pt-BR')}</span>
            </div>
            {alert.action && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ação recomendada:</span>
                <span className="font-medium text-blue-600">{alert.action}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button 
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Fechar
            </button>
            <button 
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Marcar como resolvido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UnitBadge = ({ status }) => {
  const color = status === 'online' ? 'bg-green-100 text-green-800' : status === 'degraded' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{status}</span>;
};

const DetailsPage = ({ user, type, onBack }) => {
  const [units, setUnits] = useState([]);

  useEffect(() => {
    // Mock das unidades para Magazine TORRA com status de Claro/Vivo e Firewall
    // Em produção, substituir por chamada real à API
    const company = (user?.company_name || '').toLowerCase();
    const isMagazine = company.includes('torra');
    const isNipo = company.includes('nipo');
    const baseUnits = [
      'Taubaté','Mogi das Cruzes','São José dos Campos','Sorocaba','Santo André','Guarulhos','São Paulo','Bauru','Ribeirão Preto','Campinas',
      'Recife','Belém','Manaus','Curitiba','Londrina','Joinville','Fortaleza','Salvador','Aracaju','Pelotas'
    ];
    const makeStatus = () => {
      const up = Math.random() > 0.08;
      const degraded = !up && Math.random() > 0.5;
      return up ? 'online' : degraded ? 'degraded' : 'offline';
    };
    if (isNipo) {
      // Dados baseados no anexo de NIPO (resumo e simplificação)
      const nipoUnits = [
        { name: 'Liberdade - SP', providers: ['TIM ENKYO', 'WCS ENKYO'], address: 'RUA FAGUNDES, 00121 - LIBERDADE - SÃO PAULO - SP' },
        { name: 'Parque Novo Mundo - SP', providers: ['WCS NIPO', 'ALGAR NIPO'], address: 'RUA PISTÓIA, 100 - PARQUE NOVO MUNDO - SÃO PAULO - SP' },
        { name: 'São Miguel Arcanjo - SP', providers: ['SMANET', 'VIVO SMA'], address: 'R. TADASHI TAKENAKA, 100 - CENTRO - SÃO MIGUEL ARCANJO - SP' },
        { name: 'Itapetininga - SP', providers: ['CLARO / NET'], address: 'R. PADRE ALBUQUERQUE, 245 - CENTRO - ITAPETININGA - SP' },
        { name: 'Rio de Janeiro - RJ', providers: ['MUNDIVOX'], address: 'V BARTHOLOMEU DE CARLOS 401 LOJA 2007, JD Flor da Montanha - RJ' }
      ];
      const data = nipoUnits.map((u, idx) => ({
        id: idx + 1,
        name: u.name,
        providers: u.providers,
        address: u.address,
        claro: u.providers.some(p => p.toLowerCase().includes('claro')) ? makeStatus() : 'offline',
        vivo: u.providers.some(p => p.toLowerCase().includes('vivo')) ? makeStatus() : 'offline',
        firewall: makeStatus(),
        switch: makeStatus(),
        switch_ports_total: 24 + Math.floor(Math.random() * 24),
        switch_ports_active: 8 + Math.floor(Math.random() * 16),
        switch_traffic_mbps: 50 + Math.floor(Math.random() * 450),
        switch_model: ['Cisco Catalyst 2960', 'HP ProCurve 2530', 'Ubiquiti EdgeSwitch'][Math.floor(Math.random() * 3)],
        latency_ms: 12 + Math.floor(Math.random() * 40),
        bandwidth_usage: 35 + Math.floor(Math.random() * 50)
      }));
      setUnits(data);
    } else {
      const data = baseUnits.map((name, idx) => ({
        id: idx + 1,
        name,
        providers: ['Claro', 'Vivo'],
        claro: makeStatus(),
        vivo: makeStatus(),
        firewall: makeStatus(),
        switch: makeStatus(),
        switch_ports_total: 24 + Math.floor(Math.random() * 24),
        switch_ports_active: 8 + Math.floor(Math.random() * 16),
        switch_traffic_mbps: 50 + Math.floor(Math.random() * 450),
        switch_model: ['Cisco Catalyst 2960', 'HP ProCurve 2530', 'Ubiquiti EdgeSwitch', 'Dell PowerConnect'][Math.floor(Math.random() * 4)],
        latency_ms: 10 + Math.floor(Math.random() * 50),
        bandwidth_usage: 30 + Math.floor(Math.random() * 60)
      }));
      setUnits(isMagazine ? data : data.slice(0, 8));
    }
  }, [user]);

  const title = type === 'internet' ? 'Status dos Links (Claro/Vivo)' : type === 'firewall' ? 'Status dos Firewalls' : type === 'switch' ? 'Status dos Switches' : type === 'database' ? 'Status dos Bancos' : 'Detalhes';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">{title}</h1>
              <p className="text-sm text-gray-600">{user.company_name}</p>
            </div>
          </div>
          <button onClick={onBack} className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">← Voltar</button>
        </div>
      </div>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4">
            <p className="text-gray-600 text-sm">Clique nos cards no dashboard para abrir esta visão detalhada por unidade.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg-grid-cols-3 lg:grid-cols-3 gap-6">
            {units.map((u) => (
              <div key={u.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 truncate">{u.name}</h3>
                  {type === 'internet' ? (
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-gray-600">Claro</span>
                      <UnitBadge status={u.claro} />
                      <span className="text-xs text-gray-600 ml-2">Vivo</span>
                      <UnitBadge status={u.vivo} />
                    </div>
                  ) : type === 'firewall' ? (
                    <UnitBadge status={u.firewall} />
                  ) : type === 'switch' ? (
                    <UnitBadge status={u.switch} />
                  ) : (
                    <UnitBadge status={u.firewall} />
                  )}
                </div>
                {type === 'internet' && (
                  <p className="text-xs text-gray-500 mb-2 truncate">Provedores: {(u.providers || []).join(', ')}</p>
                )}
                {type === 'internet' && (
                  <div className="space-y-2 mt-3">
                    <div className="flex justify-between"><span className="text-sm text-gray-600">Latência média</span><span className="font-semibold text-gray-800">{u.latency_ms}ms</span></div>
                    <div className="flex justify-between"><span className="text-sm text-gray-600">Uso de banda</span><span className="font-semibold text-gray-800">{u.bandwidth_usage}%</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${u.bandwidth_usage}%` }}></div></div>
                  </div>
                )}
                {type === 'firewall' && (
                  <div className="space-y-2 mt-3">
                    <div className="flex justify-between"><span className="text-sm text-gray-600">Eventos bloqueados</span><span className="font-semibold text-gray-800">{100 + Math.floor(Math.random() * 900)}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-gray-600">CPU</span><span className="font-semibold text-gray-800">{30 + Math.floor(Math.random() * 60)}%</span></div>
                    <div className="flex justify-between"><span className="text-sm text-gray-600">Memória</span><span className="font-semibold text-gray-800">{35 + Math.floor(Math.random() * 55)}%</span></div>
                  </div>
                )}
                {type === 'switch' && (
                  <div className="space-y-2 mt-3">
                    <p className="text-xs text-gray-500 mb-2">{u.switch_model}</p>
                    <div className="flex justify-between"><span className="text-sm text-gray-600">Portas ativas</span><span className="font-semibold text-gray-800">{u.switch_ports_active}/{u.switch_ports_total}</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${(u.switch_ports_active / u.switch_ports_total) * 100}%` }}></div></div>
                    <div className="flex justify-between"><span className="text-sm text-gray-600">Tráfego</span><span className="font-semibold text-gray-800">{u.switch_traffic_mbps} Mbps</span></div>
                    <div className="flex justify-between"><span className="text-sm text-gray-600">Uptime</span><span className="font-semibold text-gray-800">{Math.floor(Math.random() * 30) + 1}d {Math.floor(Math.random() * 24)}h</span></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <FloatingChat 
        user={user} 
        monitoringData={{
          links: { 
            total: units.length * 2, 
            active: units.filter(u => u.claro === 'online').length + units.filter(u => u.vivo === 'online').length,
            items: units.flatMap(u => [
              { name: `${u.name} - Link 1`, status: u.claro === 'online' ? 'online' : 'offline' },
              { name: `${u.name} - Link 2`, status: u.vivo === 'online' ? 'online' : 'offline' }
            ])
          },
          firewalls: {
            total: units.length,
            active: units.filter(u => u.firewall === 'online').length,
            items: units.map(u => ({ name: `Firewall ${u.name}`, status: u.firewall }))
          },
          alerts: units.filter(u => u.claro === 'offline' || u.vivo === 'offline' || u.firewall === 'offline')
            .map(u => ({
              message: `Unidade ${u.name} com problemas`,
              severity: 'critical',
              unit: u.name
            }))
        }} 
      />
    </div>
  );
};

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError('Credenciais inválidas');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      console.error('Erro:', err);
      if (username === 'magazine' && password === 'demo123') {
        onLogin({ id: 1, username: 'magazine', company_name: 'Magazine TORRA', is_first_login: true });
      } else if (username === 'nipo' && password === 'demo123') {
        onLogin({ id: 2, username: 'nipo', company_name: 'NIPO', is_first_login: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard IA</h1>
          <p className="text-gray-600 mt-2">Sistema de Monitoramento Inteligente</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuário</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="magazine ou nipo" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="demo123" required />
          </div>
          {error && (<div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>)}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center"><strong>Demo:</strong> magazine/demo123 ou nipo/demo123</p>
        </div>
      </div>
    </div>
  );
};

const Widget = ({ widget, data, draggableProps, onOpen, onAlertClick }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-100 hover:bg-red-100';
      case 'warning': return 'bg-yellow-50 border-yellow-100 hover:bg-yellow-100';
      case 'success': return 'bg-green-50 border-green-100 hover:bg-green-100';
      default: return 'bg-blue-50 border-blue-100 hover:bg-blue-100';
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow select-none"
      {...draggableProps}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
          <h3 className="font-semibold text-gray-800">{widget.title}</h3>
        </div>
        {widget.type !== 'alerts' && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(data?.status)}`}>{data?.status || 'N/A'}</span>
        )}
        {widget.type === 'alerts' && data && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {data.filter(a => a.severity === 'critical' || a.severity === 'warning').length} ativos
          </span>
        )}
      </div>
      {widget.type !== 'alerts' && (
        <button
          onClick={onOpen}
          className="w-full mt-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-3 py-2 transition-colors"
        >
          Abrir detalhes
        </button>
      )}
      {widget.type === 'firewall' && data && (
        <div className="space-y-3">
          <div className="flex justify-between items-center"><span className="text-sm text-gray-600">CPU</span><span className="font-semibold text-gray-800">{data.cpu}%</span></div>
          <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${data.cpu}%` }}></div></div>
          <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Memória</span><span className="font-semibold text-gray-800">{data.memory}%</span></div>
          <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${data.memory}%` }}></div></div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-100"><span className="text-sm text-gray-600">Ameaças Bloqueadas</span><span className="font-semibold text-red-600">{data.threats_blocked}</span></div>
        </div>
      )}
      {widget.type === 'switch' && data && (
        <div className="space-y-3">
          <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Portas Ativas</span><span className="font-semibold text-gray-800">{data.ports_active}/48</span></div>
          <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${(data.ports_active / 48) * 100}%` }}></div></div>
          <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Tráfego</span><span className="font-semibold text-gray-800">{data.traffic_mbps} Mbps</span></div>
        </div>
      )}
      {widget.type === 'database' && data && (
        <div className="space-y-3">
          <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Conexões Ativas</span><span className="font-semibold text-gray-800">{data.connections}</span></div>
          <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Queries/seg</span><span className="font-semibold text-gray-800">{data.queries_per_sec}</span></div>
        </div>
      )}
      {widget.type === 'internet' && data && (
        <div className="space-y-3">
          <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Latência</span><span className="font-semibold text-gray-800">{data.latency_ms}ms</span></div>
          <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Uso de Banda</span><span className="font-semibold text-gray-800">{data.bandwidth_usage}%</span></div>
          <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${data.bandwidth_usage}%` }}></div></div>
        </div>
      )}
      {widget.type === 'alerts' && data && (
        <div className="space-y-2">
          {data.slice(0, 4).map((alert) => (
            <div 
              key={alert.id} 
              onClick={() => onAlertClick && onAlertClick(alert)}
              className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-all ${getSeverityBg(alert.severity)}`}
            >
              {getSeverityIcon(alert.severity)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{alert.title || alert.message}</p>
                <p className="text-xs text-gray-500 mt-1">{alert.device} • {new Date(alert.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <span className="text-xs text-gray-400">→</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DashboardPage = ({ user, onLogout, onOpenDetails }) => {
  const [widgets, setWidgets] = useState([
    { id: 1, title: 'Firewall Principal', type: 'firewall' },
    { id: 2, title: 'Switch Core', type: 'switch' },
    { id: 3, title: 'Database Server', type: 'database' },
    { id: 4, title: 'Link Internet', type: 'internet' },
    { id: 5, title: 'Alertas Recentes', type: 'alerts' }
  ]);
  const [monitoringData, setMonitoringData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [dragState, setDragState] = useState({ draggingId: null });
  const [notifications, setNotifications] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Gera notificações popup periódicas para simular eventos em tempo real
  useEffect(() => {
    const notificationTypes = [
      { type: 'warning', title: 'Latência Alta Detectada', message: 'Link Vivo em Taubaté apresentando latência de 85ms', device: 'Link Vivo' },
      { type: 'success', title: 'Backup Concluído', message: 'Backup automático do Database Server finalizado com sucesso', device: 'Database' },
      { type: 'info', title: 'Atualização Disponível', message: 'Nova versão de firmware disponível para Switch Core', device: 'Switch' },
      { type: 'warning', title: 'CPU Elevada', message: 'Firewall Principal com uso de CPU em 78%', device: 'Firewall' },
      { type: 'error', title: 'Link Offline', message: 'Link Claro em Sorocaba apresentando instabilidade', device: 'Link Claro' },
      { type: 'success', title: 'Ameaça Bloqueada', message: 'Tentativa de acesso não autorizado bloqueada pelo Firewall', device: 'Firewall' },
    ];

    const showRandomNotification = () => {
      const randomNotif = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const newNotif = {
        id: Date.now(),
        ...randomNotif,
        time: 'agora'
      };
      setNotifications(prev => [newNotif, ...prev].slice(0, 3));
    };

    // Mostra uma notificação após 3 segundos do carregamento
    const initialTimer = setTimeout(showRandomNotification, 3000);
    // E depois a cada 15-25 segundos
    const interval = setInterval(() => {
      if (Math.random() > 0.4) showRandomNotification();
    }, 15000 + Math.random() * 10000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(() => { fetchMonitoringData(); setLastUpdate(new Date()); }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMonitoringData = async () => {
    try {
      const response = await fetch(`${API_URL}/monitoring/?company=${user.company_name}`);
      const data = await response.json();
      setMonitoringData(data);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      const companyName = user?.company_name || 'Empresa';
      setMonitoringData({
        devices: [
          { id: 1, name: 'Firewall Principal', type: 'firewall', status: 'online', cpu: Math.floor(Math.random() * 60) + 20, memory: Math.floor(Math.random() * 50) + 30, threats_blocked: Math.floor(Math.random() * 400) + 100 },
          { id: 2, name: 'Switch Core', type: 'switch', status: 'online', ports_active: Math.floor(Math.random() * 28) + 20, traffic_mbps: Math.floor(Math.random() * 800) + 100 },
          { id: 3, name: 'Database Server', type: 'database', status: Math.random() > 0.7 ? 'warning' : 'online', connections: Math.floor(Math.random() * 150) + 50, queries_per_sec: Math.floor(Math.random() * 900) + 100 },
          { id: 4, name: 'Link Internet', type: 'internet', status: 'online', latency_ms: Math.floor(Math.random() * 40) + 10, bandwidth_usage: Math.floor(Math.random() * 55) + 40 }
        ],
        alerts: [
          { 
            id: 1, 
            severity: 'critical', 
            title: 'Link Offline Detectado',
            message: 'Link Claro em São Paulo apresentou queda de conexão',
            description: 'O link principal da operadora Claro na unidade São Paulo está offline há 5 minutos. O sistema realizou failover automático para o link Vivo.',
            device: 'Link Claro',
            unit: 'São Paulo - SP',
            action: 'Verificar status com operadora',
            timestamp: new Date(Date.now() - 5 * 60000).toISOString() 
          },
          { 
            id: 2, 
            severity: 'warning', 
            title: 'CPU Elevada',
            message: 'Uso de CPU em 78% no Database Server',
            description: 'O servidor de banco de dados está operando com alta utilização de CPU devido ao processamento de relatórios mensais.',
            device: 'Database Server',
            unit: 'Central',
            action: 'Monitorar e aguardar conclusão',
            timestamp: new Date(Date.now() - 15 * 60000).toISOString() 
          },
          { 
            id: 3, 
            severity: 'warning', 
            title: 'Latência Alta',
            message: 'Link Vivo em Taubaté com latência de 95ms',
            description: 'A latência do link Vivo está acima do limite aceitável (50ms). Isso pode afetar sistemas que dependem de baixa latência.',
            device: 'Link Vivo',
            unit: 'Taubaté - SP',
            action: 'Abrir chamado com operadora',
            timestamp: new Date(Date.now() - 30 * 60000).toISOString() 
          },
          { 
            id: 4, 
            severity: 'success', 
            title: 'Backup Concluído',
            message: 'Backup automático realizado com sucesso',
            description: 'O backup diário foi concluído às 03:00 sem erros. Todos os dados foram replicados para o storage secundário.',
            device: 'Database Server',
            unit: 'Central',
            timestamp: new Date(Date.now() - 2 * 3600000).toISOString() 
          },
          { 
            id: 5, 
            severity: 'info', 
            title: 'Atualização Disponível',
            message: 'Firmware v2.4.1 disponível para Switch Core',
            description: 'Uma nova versão de firmware está disponível com correções de segurança e melhorias de performance.',
            device: 'Switch Core',
            unit: 'Central',
            action: 'Agendar janela de manutenção',
            timestamp: new Date(Date.now() - 5 * 3600000).toISOString() 
          },
          { 
            id: 6, 
            severity: 'success', 
            title: 'Ameaça Bloqueada',
            message: 'Tentativa de intrusão bloqueada pelo Firewall',
            description: 'O firewall detectou e bloqueou uma tentativa de acesso não autorizado originada do IP 192.168.45.102.',
            device: 'Firewall Principal',
            unit: 'Central',
            timestamp: new Date(Date.now() - 45 * 60000).toISOString() 
          }
        ]
      });
    }
  };

  const getWidgetData = (widget) => {
    if (!monitoringData) return null;
    if (widget.type === 'alerts') return monitoringData.alerts;
    return monitoringData.devices?.find(d => d.type === widget.type);
  };

  const getTimeSinceUpdate = () => {
    const seconds = Math.floor((new Date() - lastUpdate) / 1000);
    if (seconds < 5) return 'agora mesmo';
    return `há ${seconds}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notificações Pop-up */}
      <NotificationsContainer notifications={notifications} onClose={removeNotification} />
      
      {/* Modal de Detalhes do Alerta */}
      {selectedAlert && (
        <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}

      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Dashboard de Monitoramento</h1>
              <p className="text-sm text-gray-600">{user.company_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>
              <p className="text-gray-600">Monitoramento em tempo real da infraestrutura</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Atualizado {getTimeSinceUpdate()}
            </div>
          </div>
          {!monitoringData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Carregando dados...</p>
            </div>
          ) : (
            <>
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                onDragOver={(e) => e.preventDefault()}
              >
                {widgets.map((widget, index) => (
                  <Widget
                    key={widget.id}
                    widget={widget}
                    data={getWidgetData(widget)}
                    onOpen={() => onOpenDetails(widget.type)}
                    onAlertClick={(alert) => setSelectedAlert(alert)}
                    draggableProps={{
                      draggable: true,
                      onDragStart: () => setDragState({ draggingId: widget.id }),
                      onDragEnd: () => setDragState({ draggingId: null }),
                      onDrop: (e) => {
                        e.preventDefault();
                        setDragState({ draggingId: null });
                      },
                      onDragEnter: () => {
                        if (dragState.draggingId && dragState.draggingId !== widget.id) {
                          const fromIndex = widgets.findIndex(w => w.id === dragState.draggingId);
                          const toIndex = index;
                          if (fromIndex === -1 || toIndex === -1) return;
                          const next = [...widgets];
                          const [moved] = next.splice(fromIndex, 1);
                          next.splice(toIndex, 0, moved);
                          setWidgets(next);
                        }
                      }
                    }}
                  />
                ))}
              </div>
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Settings className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Dica</h3>
                    <p className="text-sm text-blue-700 mt-1">Use o chat no canto inferior direito para tirar dúvidas sobre o que está acontecendo com seus sistemas!</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <FloatingChat user={user} monitoringData={monitoringData} />
    </div>
  );
};

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [detailsType, setDetailsType] = useState(null);
  const handleLogin = (userData) => { setUser(userData); setCurrentPage('dashboard'); };
  const handleLogout = () => { setUser(null); setCurrentPage('login'); };
  const openDetails = (type) => { setDetailsType(type); setCurrentPage('details'); };
  const closeDetails = () => { setCurrentPage('dashboard'); setDetailsType(null); };
  return (
    <div>
      {currentPage === 'login' && <LoginPage onLogin={handleLogin} />}
      {currentPage === 'dashboard' && <DashboardPage user={user} onLogout={handleLogout} onOpenDetails={openDetails} />}
      {currentPage === 'details' && (
        <DetailsPage
          user={user}
          type={detailsType}
          onBack={closeDetails}
        />
      )}
    </div>
  );
}

export default App;
