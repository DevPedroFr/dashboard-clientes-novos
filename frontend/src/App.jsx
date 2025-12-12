import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, LayoutDashboard, Activity, AlertTriangle, Settings, LogOut, GripVertical } from 'lucide-react';

const API_URL = 'http://localhost:8000/api';
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
              </div>
            ))}
          </div>
        </div>
      </div>
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

const ChatPage = ({ user, onComplete }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! Sou seu assistente de personalização. Vou ajudar você a configurar seu dashboard. Que tipo de informações você gostaria de monitorar? (firewall, switches, banco de dados, links de internet)' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [thinkingDots, setThinkingDots] = useState('');

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setThinkingDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
    } else {
      setThinkingDots('');
    }
    return () => interval && clearInterval(interval);
  }, [loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/ai/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, user_id: user.id })
      });
      const data = await response.json();
      if (!response.ok && !data.response) {
        throw new Error(data.error || 'Falha na IA');
      }
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      setError('');
      if (input.toLowerCase().includes('pronto') || input.toLowerCase().includes('finalizar')) {
        setTimeout(() => onComplete(), 2000);
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError('O assistente está com instabilidade. Mostrei uma resposta alternativa.');
      let response = 'Entendi! Vou configurar isso para você. O que mais gostaria de adicionar?';
      if (input.toLowerCase().includes('pronto') || input.toLowerCase().includes('finalizar')) {
        response = 'Perfeito! Seu dashboard está sendo configurado. Redirecionando...';
        setTimeout(() => onComplete(), 2000);
      } else if (input.toLowerCase().includes('firewall')) {
        response = 'Ótimo! Vou adicionar widgets de monitoramento de firewall com informações sobre ameaças bloqueadas, status e uso de recursos.';
      } else if (input.toLowerCase().includes('switch')) {
        response = 'Perfeito! Vou incluir dados dos switches: portas ativas, tráfego de rede e status das conexões.';
      } else if (input.toLowerCase().includes('banco')) {
        response = 'Excelente! Adicionarei métricas de banco de dados: conexões ativas, queries e performance.';
      } else if (input.toLowerCase().includes('internet') || input.toLowerCase().includes('link')) {
        response = 'Configurando! Vou mostrar informações dos links de internet: latência, banda utilizada e status.';
      }
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } finally { setLoading(false); }
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Personalização do Dashboard</h1>
              <p className="text-sm text-gray-600">{user.company_name}</p>
            </div>
          </div>
          <button onClick={onComplete} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Pular para Dashboard →</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl px-6 py-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 shadow-sm border border-gray-200'}`}>{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-200">
                <div className="text-sm text-gray-700">Assistente está pensando{thinkingDots}</div>
                <div className="flex gap-2 mt-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="flex justify-start">
              <div className="bg-yellow-50 px-6 py-4 rounded-2xl shadow-sm border border-yellow-200 text-yellow-800 text-sm">
                {error}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Digite sua mensagem... (ex: 'quero ver firewall e switches')" className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          <button onClick={sendMessage} disabled={loading || !input.trim()} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Widget = ({ widget, data, draggableProps, onOpen }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(data?.status)}`}>{data?.status || 'N/A'}</span>
      </div>
      <button
        onClick={onOpen}
        className="w-full mt-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-3 py-2 transition-colors"
      >
        Abrir detalhes
      </button>
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
          {data.slice(0, 3).map((alert) => (
            <div key={alert.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
              <AlertTriangle className={`w-4 h-4 mt-1 flex-shrink-0 ${alert.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(alert.timestamp).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DashboardPage = ({ user, onLogout, onOpenDetails, onOpenAI }) => {
  const [widgets, setWidgets] = useState([
    { id: 1, title: 'Firewall Principal', type: 'firewall' },
    { id: 2, title: 'Switch Core', type: 'switch' },
    { id: 3, title: 'Database Server', type: 'database' },
    { id: 4, title: 'Link Internet', type: 'internet' },
    { id: 5, title: 'Alertas Recentes', type: 'alerts' }
  ]);
  const [monitoringData, setMonitoringData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isAIMode, setIsAIMode] = useState(false);
  const [dragState, setDragState] = useState({ draggingId: null });

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
      setMonitoringData({
        devices: [
          { id: 1, name: 'Firewall Principal', type: 'firewall', status: 'online', cpu: Math.floor(Math.random() * 60) + 20, memory: Math.floor(Math.random() * 50) + 30, threats_blocked: Math.floor(Math.random() * 400) + 100 },
          { id: 2, name: 'Switch Core', type: 'switch', status: 'online', ports_active: Math.floor(Math.random() * 28) + 20, traffic_mbps: Math.floor(Math.random() * 800) + 100 },
          { id: 3, name: 'Database Server', type: 'database', status: Math.random() > 0.7 ? 'warning' : 'online', connections: Math.floor(Math.random() * 150) + 50, queries_per_sec: Math.floor(Math.random() * 900) + 100 },
          { id: 4, name: 'Link Internet', type: 'internet', status: 'online', latency_ms: Math.floor(Math.random() * 40) + 10, bandwidth_usage: Math.floor(Math.random() * 55) + 40 }
        ],
        alerts: [
          { id: 1, severity: 'warning', message: 'Uso de CPU elevado no Database Server', timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
          { id: 2, severity: 'info', message: 'Backup automático concluído com sucesso', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
          { id: 3, severity: 'info', message: 'Atualização de firmware disponível para Switch Core', timestamp: new Date(Date.now() - 5 * 3600000).toISOString() }
        ]
      });
    }
  };

  const getWidgetData = (widget) => {
    if (!monitoringData) return null;
    if (widget.type === 'alerts') return monitoringData.alerts;
    const base = monitoringData.devices?.find(d => d.type === widget.type);
    if (!isAIMode || !base) return base;
    // Simulação leve de "edição por IA":
    // Ajusta números para valores mais estáveis e adiciona pequenas melhorias descritivas
    const jitter = (v, pct = 0.05) => {
      const delta = v * pct * (Math.random() * 2 - 1);
      const nv = Math.max(0, Math.round(v + delta));
      return nv;
    };
    if (widget.type === 'firewall') {
      return {
        ...base,
        cpu: jitter(base.cpu, 0.03),
        memory: jitter(base.memory, 0.03),
        threats_blocked: jitter(base.threats_blocked, 0.08),
        status: base.cpu > 85 || base.memory > 85 ? 'warning' : 'online'
      };
    }
    if (widget.type === 'switch') {
      return {
        ...base,
        ports_active: jitter(base.ports_active, 0.04),
        traffic_mbps: jitter(base.traffic_mbps, 0.07)
      };
    }
    if (widget.type === 'database') {
      return {
        ...base,
        connections: jitter(base.connections, 0.05),
        queries_per_sec: jitter(base.queries_per_sec, 0.06)
      };
    }
    if (widget.type === 'internet') {
      return {
        ...base,
        latency_ms: jitter(base.latency_ms, 0.05),
        bandwidth_usage: Math.min(100, jitter(base.bandwidth_usage, 0.05))
      };
    }
    return base;
  };

  const getTimeSinceUpdate = () => {
    const seconds = Math.floor((new Date() - lastUpdate) / 1000);
    if (seconds < 5) return 'agora mesmo';
    return `há ${seconds}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
            <button
              onClick={onOpenAI}
              className="px-4 py-2 rounded-lg transition-colors text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
              title="Chamar assistente de IA"
            >
              Chamar IA
            </button>
            <button
              onClick={() => setIsAIMode(v => !v)}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${isAIMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              title="Alternar ajustes de IA"
            >
              {isAIMode ? 'Ajustes de IA: ON' : 'Ajustes de IA: OFF'}
            </button>
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
                    <h3 className="font-semibold text-blue-900">Dica de Personalização</h3>
                    <p className="text-sm text-blue-700 mt-1">Arraste os cards para reorganizar. Ative "Ajustes de IA" para ver o assistente estabilizar métricas em tempo real.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [detailsType, setDetailsType] = useState(null);
  const handleLogin = (userData) => { setUser(userData); if (userData.is_first_login) { setCurrentPage('chat'); } else { setCurrentPage('dashboard'); } };
  const handleChatComplete = () => { setCurrentPage('dashboard'); };
  const handleLogout = () => { setUser(null); setCurrentPage('login'); };
  const openDetails = (type) => { setDetailsType(type); setCurrentPage('details'); };
  const closeDetails = () => { setCurrentPage('dashboard'); setDetailsType(null); };
  const openAI = () => { setCurrentPage('chat'); };
  return (
    <div>
      {currentPage === 'login' && <LoginPage onLogin={handleLogin} />}
      {currentPage === 'chat' && <ChatPage user={user} onComplete={handleChatComplete} />}
      {currentPage === 'dashboard' && <DashboardPage user={user} onLogout={handleLogout} onOpenDetails={openDetails} onOpenAI={openAI} />}
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
