import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  FileText, 
  Download, 
  Filter, 
  Loader2, 
  TrendingUp,
  Users,
  Building2,
  AlertTriangle,
  History,
  UserX,
  UserCheck,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { apiFetch } from '../lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const [statsRes, cellsRes, crimesRes] = await Promise.all([
          apiFetch('/api/dashboard/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
          apiFetch('/api/cells', { headers: { 'Authorization': `Bearer ${token}` } }),
          apiFetch('/api/crimes', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (statsRes.ok && cellsRes.ok && crimesRes.ok) {
          const stats = await statsRes.json();
          const cells = await cellsRes.json();
          const crimesRaw = await crimesRes.json();
          const crimes = Array.isArray(crimesRaw) ? crimesRaw : [];

          // Process data for charts
          const cellOccupancyData = cells.map((c: any) => ({
            name: c.number,
            ocupacao: c.current_occupancy,
            capacidade: c.capacity
          }));

          const crimesByArticle = (crimes || []).reduce((acc: any, curr: any) => {
            acc[curr.article] = (acc[curr.article] || 0) + 1;
            return acc;
          }, {});

          const crimeData = Object.keys(crimesByArticle).map(key => ({
            name: key,
            value: crimesByArticle[key]
          }));

          setData({
            stats,
            cellOccupancyData,
            crimeData
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const generatePDF = async (type: string) => {
    const doc = new jsPDF();
    const token = localStorage.getItem('token');
    const now = new Date().toLocaleString('pt-BR');

    doc.setFontSize(20);
    doc.text('SIGEP - Sistema de Gerenciamento Prisional', 14, 22);
    doc.setFontSize(12);
    doc.text(`Relatório: ${type}`, 14, 32);
    doc.text(`Gerado em: ${now}`, 14, 40);
    doc.setLineWidth(0.5);
    doc.line(14, 45, 196, 45);

    try {
      if (type === 'Detentos por Pavilhão') {
        const res = await apiFetch('/api/prisoners?limit=1000', { headers: { 'Authorization': `Bearer ${token}` } });
        const { data: prisoners } = await res.json();
        const cellsRes = await apiFetch('/api/cells', { headers: { 'Authorization': `Bearer ${token}` } });
        const cells = await cellsRes.json();

        const tableData = prisoners.map((p: any) => {
          const cell = cells.find((c: any) => c.id === p.cell_id);
          return [p.registration_number, p.name, cell ? cell.pavilion_name : 'N/A', cell ? cell.number : 'N/A', p.status];
        });

        autoTable(doc, {
          startY: 50,
          head: [['Matrícula', 'Nome', 'Pavilhão', 'Cela', 'Status']],
          body: tableData,
        });
      } else if (type === 'Detentos Reincidentes') {
        const res = await apiFetch('/api/crimes', { headers: { 'Authorization': `Bearer ${token}` } });
        const crimesRaw = await res.json();
        const crimes = Array.isArray(crimesRaw) ? crimesRaw : [];
        const pRes = await apiFetch('/api/prisoners?limit=1000', { headers: { 'Authorization': `Bearer ${token}` } });
        const { data: prisoners } = await pRes.json();

        const crimeCounts = (crimes || []).reduce((acc: any, curr: any) => {
          acc[curr.prisoner_id] = (acc[curr.prisoner_id] || 0) + 1;
          return acc;
        }, {});

        const reincidentes = prisoners.filter((p: any) => crimeCounts[p.id] > 1);
        const tableData = reincidentes.map((p: any) => [p.registration_number, p.name, crimeCounts[p.id], p.status]);

        autoTable(doc, {
          startY: 50,
          head: [['Matrícula', 'Nome', 'Qtd. Crimes', 'Status']],
          body: tableData,
        });
      } else if (type === 'Detentos em Isolamento') {
        const res = await apiFetch('/api/prisoners?limit=1000', { headers: { 'Authorization': `Bearer ${token}` } });
        const { data: prisoners } = await res.json();
        const isolated = prisoners.filter((p: any) => p.is_isolated === 1 || p.status === 'Isolamento' || p.status === 'Solitária');
        
        const tableData = isolated.map((p: any) => [p.registration_number, p.name, p.status]);

        autoTable(doc, {
          startY: 50,
          head: [['Matrícula', 'Nome', 'Status/Tipo']],
          body: tableData,
        });
      } else if (type === 'Histórico de Transferências') {
        const res = await apiFetch('/api/transfers', { headers: { 'Authorization': `Bearer ${token}` } });
        const transfers = await res.json();
        
        const tableData = transfers.map((t: any) => [t.prisoner_name, t.origin, t.destination, t.date, t.inspector_name || 'Sistema']);

        autoTable(doc, {
          startY: 50,
          head: [['Detento', 'Origem', 'Destino', 'Data', 'Responsável']],
          body: tableData,
        });
      } else if (type === 'Relatório de Visitas') {
        const res = await apiFetch('/api/visitors', { headers: { 'Authorization': `Bearer ${token}` } });
        const visitors = await res.json();
        
        const tableData = visitors.map((v: any) => [v.name, v.document, v.prisoner_name, v.visit_date, v.visit_time]);

        autoTable(doc, {
          startY: 50,
          head: [['Visitante', 'Documento', 'Detento', 'Data', 'Hora']],
          body: tableData,
        });
      }

      doc.save(`relatorio_${type.toLowerCase().replace(/ /g, '_')}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios e Documentos</h1>
          <p className="text-slate-500">Geração de documentos oficiais e análise de indicadores.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <button 
          onClick={() => generatePDF('Detentos por Pavilhão')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"
        >
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-slate-700">Lista por Pavilhão</span>
        </button>

        <button 
          onClick={() => generatePDF('Detentos Reincidentes')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"
        >
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <History className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-slate-700">Reincidentes</span>
        </button>

        <button 
          onClick={() => generatePDF('Detentos em Isolamento')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-red-500 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"
        >
          <div className="p-3 rounded-lg bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
            <UserX className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-slate-700">Isolamento</span>
        </button>

        <button 
          onClick={() => generatePDF('Histórico de Transferências')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"
        >
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <TrendingUp className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-slate-700">Transferências</span>
        </button>

        <button 
          onClick={() => generatePDF('Relatório de Visitas')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"
        >
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <UserCheck className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-slate-700">Visitas</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ocupação por Cela */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Ocupação por Cela
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.cellOccupancyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="ocupacao" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Ocupação Atual" />
                <Bar dataKey="capacidade" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Capacidade Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Distribuição de Crimes */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Distribuição por Artigo/Crime
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.crimeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data?.crimeData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Resumo Geral */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
        >
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-600" />
            Resumo de Indicadores
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-xs font-bold text-slate-500 uppercase mb-1">Taxa de Ocupação</div>
              <div className="text-2xl font-bold text-slate-900">
                {data?.stats.cells > 0 ? Math.round((data?.stats.occupiedCells / data?.stats.cells) * 100) : 0}%
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-xs font-bold text-slate-500 uppercase mb-1">Média Detentos/Cela</div>
              <div className="text-2xl font-bold text-slate-900">
                {data?.stats.cells > 0 ? (data?.stats.prisoners / data?.stats.cells).toFixed(1) : '0.0'}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-xs font-bold text-slate-500 uppercase mb-1">Detentos em Isolamento</div>
              <div className="text-2xl font-bold text-red-600">
                {data?.stats.isolated}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-xs font-bold text-slate-500 uppercase mb-1">Total de Visitantes</div>
              <div className="text-2xl font-bold text-blue-600">
                {data?.stats.visitors}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-red-50 p-6 rounded-2xl border border-red-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h3 className="font-bold text-red-900">Zona de Perigo</h3>
          </div>
          <p className="text-sm text-red-700 mb-6">
            As ações abaixo são irreversíveis. Tenha certeza antes de prosseguir.
          </p>
          <button 
            onClick={async () => {
              if (confirm('ATENÇÃO: Isso apagará TODOS os detentos, celas, pavilhões, advogados, visitas e históricos. Esta ação NÃO pode ser desfeita. Deseja continuar?')) {
                try {
                  const res = await apiFetch('/api/system/reset', {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                  });
                  if (res.ok) {
                    alert('Sistema resetado com sucesso.');
                    window.location.reload();
                  } else {
                    alert('Erro ao resetar sistema.');
                  }
                } catch (err) {
                  alert('Erro de conexão.');
                }
              }
            }}
            className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Limpar Todo o Banco de Dados
          </button>
        </motion.div>
      </div>
    </div>
  );
}
