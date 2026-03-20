import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  Plus, 
  Trash2, 
  X, 
  Loader2, 
  Search,
  Calendar,
  MapPin,
  AlertTriangle,
  User,
  Truck,
  Filter,
  Eye,
  Edit2,
  CheckCircle2,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';

interface Transfer {
  id: number;
  prisoner_id: number;
  prisoner_name: string;
  origin: string;
  destination: string;
  date: string;
  reason: string;
  status: string;
  inspector_name: string;
  type?: 'Interna' | 'Externa';
}

interface Inspector {
  id: number;
  name: string;
}

interface Prisoner {
  id: number;
  name: string;
  registration_number: string;
  cell_id: number;
  cell_number: string;
}

interface Cell {
  id: number;
  number: string;
  pavilion_name: string;
  type: string;
}

export default function Transfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [prisoners, setPrisoners] = useState<Prisoner[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Todos');

  const [formData, setFormData] = useState({
    prisoner_id: '',
    origin: 'Unidade Atual',
    destination: '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
    custom_reason: '',
    is_external: false,
    new_cell_id: '',
    new_status: 'Ativo',
    inspector_id: ''
  });

  const units = [
    'Penitenciária Central',
    'Penitenciária Norte',
    'Centro de Detenção Provisória',
    'Colônia Agrícola',
    'Hospital de Custódia',
    'Unidade de Segurança Máxima'
  ];

  const reasons = [
    'Transferência disciplinar',
    'Superlotação',
    'Segurança',
    'Decisão judicial',
    'Tratamento médico',
    'Outro'
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [tRes, pRes, cRes, iRes] = await Promise.all([
        apiFetch('/api/transfers', { headers: { 'Authorization': `Bearer ${token}` } }),
        apiFetch('/api/prisoners?limit=1000', { headers: { 'Authorization': `Bearer ${token}` } }),
        apiFetch('/api/cells', { headers: { 'Authorization': `Bearer ${token}` } }),
        apiFetch('/api/inspectors', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (tRes.ok && pRes.ok && cRes.ok) {
        setTransfers(await tRes.json());
        const pData = await pRes.json();
        setPrisoners(pData.data);
        setCells(await cRes.json());
        if (iRes.ok) setInspectors(await iRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        reason: formData.reason === 'Outro' ? formData.custom_reason : formData.reason
      };
      const response = await apiFetch('/api/transfers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setFormData({
          prisoner_id: '',
          origin: 'Unidade Atual',
          destination: '',
          date: new Date().toISOString().split('T')[0],
          reason: '',
          custom_reason: '',
          is_external: false,
          new_cell_id: '',
          new_status: 'Ativo',
          inspector_id: ''
        });
        fetchData();
      } else {
        const data = await response.json();
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir este registro de transferência?')) return;
    try {
      const response = await apiFetch(`/api/transfers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTransfers = transfers.filter(t => {
    const matchesSearch = 
      t.prisoner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.destination.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'Todos' || 
      (filterType === 'Interna' && !t.type?.includes('Externa')) || 
      (filterType === 'Externa' && t.type?.includes('Externa'));

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Controle de Transferências</h1>
          <p className="text-slate-500">Registro de movimentações internas e externas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
        >
          <Plus className="w-5 h-5" />
          Registrar Transferência
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar detento, origem ou destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Todos">Todos os Tipos</option>
              <option value="Interna">Interna</option>
              <option value="Externa">Externa</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Detento</th>
                <th className="px-6 py-4">Movimentação</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Responsável</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                    <span className="text-slate-400">Carregando transferências...</span>
                  </td>
                </tr>
              ) : filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <Truck className="w-8 h-8 text-slate-300" />
                      </div>
                      <div className="max-w-xs mx-auto">
                        <p className="text-slate-900 font-bold">Nenhuma transferência registrada ainda.</p>
                        <p className="text-slate-500 text-sm mt-1">Registre movimentações internas ou externas dos detentos entre unidades.</p>
                      </div>
                      <button 
                        onClick={() => setIsModalOpen(true)}
                        className="mt-2 text-blue-600 font-bold text-sm hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Registrar Transferência
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">{t.prisoner_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-500">{t.origin}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <ArrowRight className="w-3.5 h-3.5 text-blue-400 ml-0.5" />
                          <span className="font-bold text-slate-900">{t.destination}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold uppercase px-2 py-1 rounded-full",
                        t.type === 'Externa' || t.status === 'Transferido'
                          ? "bg-orange-50 text-orange-600 border border-orange-100"
                          : "bg-blue-50 text-blue-600 border border-blue-100"
                      )}>
                        {t.type || (t.status === 'Transferido' ? 'Externa' : 'Interna')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <User className="w-4 h-4 text-slate-400" />
                        {t.inspector_name || 'Sistema'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {t.date}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setSelectedTransfer(t);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(t.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="px-6 py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
              <span className="text-slate-400">Carregando transferências...</span>
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">Nenhuma transferência registrada.</div>
          ) : (
            filteredTransfers.map((t) => (
              <div key={t.id} className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{t.prisoner_name}</div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded mt-1 inline-block",
                      t.type === 'Externa' || t.status === 'Transferido'
                        ? "bg-orange-50 text-orange-600 border border-orange-100"
                        : "bg-blue-50 text-blue-600 border border-blue-100"
                    )}>
                      {t.type || (t.status === 'Transferido' ? 'Externa' : 'Interna')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setSelectedTransfer(t);
                        setIsDetailModalOpen(true);
                      }}
                      className="p-2 text-blue-600 bg-blue-50 rounded-lg"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(t.id)}
                      className="p-2 text-red-600 bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex-1">
                      <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Origem</div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5" />
                        {t.origin}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-blue-400" />
                    <div className="flex-1">
                      <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Destino</div>
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {t.destination}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-slate-50/50 rounded-lg">
                      <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Data</div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="w-3.5 h-3.5" />
                        {t.date}
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50/50 rounded-lg">
                      <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Responsável</div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <User className="w-3.5 h-3.5" />
                        {t.inspector_name || 'Sistema'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-amber-50/30 rounded-lg border border-amber-100/50">
                    <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Motivo</div>
                    <div className="text-slate-700 text-xs">{t.reason || 'Não informado'}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Detalhes da Transferência */}
      <AnimatePresence>
        {isDetailModalOpen && selectedTransfer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-xl font-bold text-slate-900">Detalhes da Transferência</h3>
                <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Detento</div>
                    <div className="text-lg font-bold text-slate-900">{selectedTransfer.prisoner_name}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <ArrowRightLeft className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Movimentação</span>
                    </div>
                    
                    <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Origem</div>
                        <div className="text-sm font-bold text-slate-700">{selectedTransfer.origin}</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-blue-400" />
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Destino</div>
                        <div className="text-sm font-bold text-slate-900">{selectedTransfer.destination}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Data</span>
                      </div>
                      <div className="text-sm font-medium text-slate-700">{selectedTransfer.date}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <User className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Responsável</span>
                      </div>
                      <div className="text-sm font-medium text-slate-700">{selectedTransfer.inspector_name || 'Sistema'}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Motivo</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed">
                      {selectedTransfer.reason || 'Nenhum motivo detalhado informado.'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tipo</span>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-3 py-1 rounded-full",
                      selectedTransfer.type === 'Externa' || selectedTransfer.status === 'Transferido'
                        ? "bg-orange-50 text-orange-600 border border-orange-100"
                        : "bg-blue-50 text-blue-600 border border-blue-100"
                    )}>
                      {selectedTransfer.type || (selectedTransfer.status === 'Transferido' ? 'Externa' : 'Interna')}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => setIsDetailModalOpen(false)}
                    className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Nova Transferência */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-xl font-bold text-slate-900">Registrar Transferência</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* 1. Detento */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-blue-600">
                    <User className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Detento</span>
                  </div>
                  <select 
                    required
                    value={formData.prisoner_id}
                    onChange={e => {
                      const p = prisoners.find(pr => pr.id === parseInt(e.target.value));
                      setFormData({
                        ...formData, 
                        prisoner_id: e.target.value,
                        origin: p ? `Cela ${p.cell_number || 'N/A'}` : 'Unidade Atual'
                      });
                    }}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Selecione um detento</option>
                    {prisoners.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.registration_number})</option>
                    ))}
                  </select>
                </div>

                {/* 2. Movimentação */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-blue-600">
                    <ArrowRightLeft className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Movimentação</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] items-center gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Origem *</label>
                      <input 
                        required
                        type="text" 
                        value={formData.origin}
                        onChange={e => setFormData({...formData, origin: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="hidden sm:block mt-5">
                      <ArrowRight className="w-5 h-5 text-slate-300" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Destino *</label>
                      {formData.is_external ? (
                        <select 
                          required
                          value={formData.destination}
                          onChange={e => setFormData({...formData, destination: e.target.value})}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Selecionar unidade</option>
                          {units.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      ) : (
                        <input 
                          disabled
                          type="text" 
                          value={formData.destination}
                          className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Detalhes */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Detalhes</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Data da Transferência *</label>
                      <div className="flex gap-2">
                        <input 
                          required
                          type="date" 
                          value={formData.date}
                          onChange={e => setFormData({...formData, date: e.target.value})}
                          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, date: new Date().toISOString().split('T')[0]})}
                          className="px-3 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          Hoje
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Responsável *</label>
                      <select 
                        required
                        value={formData.inspector_id}
                        onChange={e => setFormData({...formData, inspector_id: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Selecionar servidor</option>
                        {inspectors.map(i => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. Motivo */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-blue-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Motivo</span>
                  </div>
                  <div className="space-y-3">
                    <select 
                      required
                      value={formData.reason}
                      onChange={e => setFormData({...formData, reason: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Selecione o motivo</option>
                      {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {formData.reason === 'Outro' && (
                      <textarea 
                        required
                        value={formData.custom_reason}
                        onChange={e => setFormData({...formData, custom_reason: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                        placeholder="Descreva o motivo detalhadamente..."
                      />
                    )}
                  </div>
                </div>

                {/* 5. Tipo */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Truck className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Tipo de Transferência</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      !formData.is_external ? "bg-blue-50 border-blue-600" : "bg-white border-slate-100 hover:border-slate-200"
                    )}>
                      <input 
                        type="radio" 
                        name="transfer_type"
                        checked={!formData.is_external}
                        onChange={() => setFormData({...formData, is_external: false, destination: 'Movimentação Interna'})}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Interna</div>
                        <div className="text-[10px] text-slate-500">Dentro da unidade</div>
                      </div>
                    </label>
                    <label className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      formData.is_external ? "bg-orange-50 border-orange-600" : "bg-white border-slate-100 hover:border-slate-200"
                    )}>
                      <input 
                        type="radio" 
                        name="transfer_type"
                        checked={formData.is_external}
                        onChange={() => setFormData({...formData, is_external: true, destination: ''})}
                        className="w-4 h-4 text-orange-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Externa</div>
                        <div className="text-[10px] text-slate-500">Para outra unidade</div>
                      </div>
                    </label>
                  </div>
                  {formData.is_external && (
                    <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-100">
                      <AlertTriangle className="w-4 h-4" />
                      Transferências externas alteram o status do detento para "Transferido".
                    </div>
                  )}
                </div>

                {!formData.is_external && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Nova Cela de Destino *</label>
                      <select 
                        required
                        value={formData.new_cell_id}
                        onChange={e => {
                          const cell = cells.find(c => c.id === parseInt(e.target.value));
                          setFormData({
                            ...formData, 
                            new_cell_id: e.target.value,
                            destination: cell ? `Cela ${cell.number} (${cell.pavilion_name})` : formData.destination,
                            new_status: cell?.type === 'Isolamento' ? 'Isolamento' : 
                                        cell?.type === 'Solitária' ? 'Solitária' : 'Ativo'
                          });
                        }}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Selecione a nova cela</option>
                        {cells.map(c => (
                          <option key={c.id} value={c.id}>Cela {c.number} ({c.pavilion_name})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Novo Status do Detento *</label>
                      <select 
                        required
                        value={formData.new_status}
                        onChange={e => setFormData({...formData, new_status: e.target.value})}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="Ativo">Normal (Ativo)</option>
                        <option value="Isolamento">Isolamento</option>
                        <option value="Solitária">Solitária</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                  >
                    Concluir Transferência
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
