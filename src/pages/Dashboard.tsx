import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Box, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  ChevronRight,
  UserX,
  UserCheck,
  ArrowLeftRight,
  Shield
} from 'lucide-react';
import { motion } from 'motion/react';
import { apiFetch } from '../lib/api';

interface Stats {
  prisoners: number;
  cells: number;
  occupiedCells: number;
  availableCells: number;
  isolated: number;
  visitors: number;
  lawyerVisits: number;
  recentTransfers: any[];
  recentLawyerVisits: any[];
  recentIncidents: any[];
}

import { dashboardService } from '../services/DashboardService';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (err: any) {
        // Only log if it's not an auth error (which ApiService handles by redirecting)
        if (!err.message.includes('401') && !err.message.includes('403') && !err.message.includes('Sessão expirada')) {
          console.error('Dashboard fetch error:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);


  if (loading) return <div className="flex items-center justify-center h-full">Carregando...</div>;

  const cards = [
    { label: 'Detentos Cadastrados', value: stats?.prisoners || 0, icon: Users, color: 'blue' },
    { label: 'Celas Ocupadas', value: stats?.occupiedCells || 0, icon: Box, color: 'amber' },
    { label: 'Celas Disponíveis', value: stats?.availableCells || 0, icon: Box, color: 'emerald' },
    { label: 'Detentos em Isolamento', value: stats?.isolated || 0, icon: UserX, color: 'red' },
    { label: 'Assistência Jurídica', value: stats?.lawyerVisits || 0, icon: UserCheck, color: 'indigo' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Painel de Controle - SIGEP</h1>
              <p className="text-slate-500">Gestão Penitenciária em tempo real.</p>
            </div>
          </div>
          <button 
            onClick={async () => {
              try {
                const res = await apiFetch('/api/public/test');
                const data = await res.json();
                alert('Public API Success: ' + JSON.stringify(data));
              } catch (err: any) {
                alert('Public API Error: ' + err.message);
              }
            }}
            className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-xs hover:bg-slate-300 transition-colors"
          >
            Debug API
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 group hover:border-blue-200 transition-all cursor-pointer"
            onClick={() => {
              if (card.label === 'Detentos Cadastrados') navigate('/prisoners');
              if (card.label === 'Celas Ocupadas' || card.label === 'Celas Disponíveis') navigate('/cells');
              if (card.label === 'Assistência Jurídica') navigate('/lawyers');
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-${card.color}-50 text-${card.color}-600 group-hover:bg-${card.color}-600 group-hover:text-white transition-all`}>
                <card.icon className="w-6 h-6" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-all" />
            </div>
            <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{card.label}</h3>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
              <ArrowLeftRight className="w-5 h-5 text-blue-600" />
              Transferências Recentes
            </h3>
            <button 
              onClick={() => navigate('/transfers')}
              className="text-blue-600 text-xs sm:text-sm font-semibold hover:underline"
            >
              Ver todas
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {(stats?.recentTransfers?.length || 0) === 0 ? (
              <div className="p-12 text-center text-slate-400">Nenhuma transferência registrada recentemente.</div>
            ) : (
              stats?.recentTransfers.map((transfer: any) => (
                <div key={transfer.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                    {transfer.prisoner_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 truncate text-sm sm:text-base">{transfer.prisoner_name}</h4>
                    <p className="text-xs text-slate-500 truncate">
                      {transfer.origin} → {transfer.destination}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        transfer.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {transfer.status === 'completed' ? 'OK' : 'Pendente'}
                      </span>
                      <div className="text-xs text-slate-400 mt-1">{transfer.date}</div>
                    </div>
                    <button 
                      onClick={() => navigate('/transfers')}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Ver Detalhes"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-blue-50 rounded-2xl p-6 text-slate-900 border border-blue-100 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2 text-blue-900">Protocolo de Segurança</h3>
            <p className="text-blue-700/70 text-sm mb-6">Lembre-se de seguir todos os protocolos de segurança ao realizar movimentações.</p>
            <ul className="space-y-4">
              {[
                'Verificação dupla de trancas',
                'Registro obrigatório de saída',
                'Uso de EPIs em áreas críticas',
                'Comunicação via rádio constante'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium text-blue-800">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {i + 1}
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="absolute -bottom-6 -right-6 opacity-5 rotate-12">
            <Shield size={120} className="text-blue-900" />
          </div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl" />
        </div>

        {/* Recent Lawyer Visits */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              Visitas Jurídicas Recentes
            </h3>
            <button 
              onClick={() => navigate('/lawyers')}
              className="text-indigo-600 text-xs sm:text-sm font-semibold hover:underline"
            >
              Ver todas
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {(stats?.recentLawyerVisits?.length || 0) === 0 ? (
              <div className="p-12 text-center text-slate-400">Nenhuma visita jurídica registrada recentemente.</div>
            ) : (
              stats?.recentLawyerVisits.map((visit: any) => (
                <div key={visit.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                    {visit.lawyer_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 truncate text-sm sm:text-base">{visit.lawyer_name}</h4>
                    <p className="text-xs text-slate-500 truncate">
                      Visitou: <span className="font-medium text-slate-700">{visit.prisoner_name}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">{visit.visit_date}</div>
                      <div className="text-xs text-slate-400 mt-1 truncate max-w-[100px] sm:max-w-[150px]">{visit.notes || 'Sem obs.'}</div>
                    </div>
                    <button 
                      onClick={() => navigate('/lawyers')}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Ver Detalhes"
                    >
                      <UserCheck className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
