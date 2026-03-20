import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  X, 
  Loader2, 
  Search,
  Calendar,
  Clock,
  UserCheck,
  ShieldCheck,
  Phone,
  FileText,
  User,
  Camera,
  Filter,
  MoreVertical,
  Eye,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';

interface Visitor {
  id: number;
  name: string;
  document: string;
  document_type: string;
  phone: string;
  photo: string | null;
  prisoner_id: number;
  prisoner_name: string;
  prisoner_registration: string;
  relation: string;
  visit_date: string;
  visit_time: string;
  status: string;
}

interface Prisoner {
  id: number;
  name: string;
  registration_number: string;
}

const STATUS_CONFIG = {
  'Agendada': { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  'Confirmada': { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  'Cancelada': { color: 'bg-rose-100 text-rose-800 border-rose-200', icon: XCircle },
  'Realizada': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: UserCheck },
};

const RELATION_OPTIONS = [
  'Pai / Mãe',
  'Cônjuge',
  'Filho(a)',
  'Irmão(ã)',
  'Avô / Avó',
  'Amigo',
  'Advogado',
  'Outro'
];

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '14:00', '15:00'
];

const DOCUMENT_TYPES = ['RG', 'CPF', 'Passaporte'];

export default function Visits() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [prisoners, setPrisoners] = useState<Prisoner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    date: '',
    prisonerId: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    document_type: 'RG',
    document: '',
    phone: '',
    photo: null as string | null,
    prisoner_id: '',
    relation: 'Pai / Mãe',
    other_relation: '',
    visit_date: new Date().toISOString().split('T')[0],
    visit_time: '09:00',
    status: 'Agendada'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [vRes, pRes] = await Promise.all([
        apiFetch('/api/visitors', { headers: { 'Authorization': `Bearer ${token}` } }),
        apiFetch('/api/prisoners?limit=1000', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (vRes.ok && pRes.ok) {
        setVisitors(await vRes.json());
        const pData = await pRes.json();
        setPrisoners(pData.data || []);
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check visitor limit per prisoner (Requirement 14)
    // Count unique visitors (by document) for this prisoner
    const currentVisitor = visitors.find(v => v.id === editingId);
    const isNewPerson = !currentVisitor || currentVisitor.document !== formData.document;
    
    if (isNewPerson) {
      const uniqueVisitors = new Set(
        visitors
          .filter(v => v.prisoner_id === Number(formData.prisoner_id) && v.status !== 'Cancelada')
          .map(v => v.document)
      );
      
      if (!uniqueVisitors.has(formData.document) && uniqueVisitors.size >= 5) {
        alert('Este detento já atingiu o limite máximo de 5 visitantes cadastrados.');
        return;
      }
    }

    const finalRelation = formData.relation === 'Outro' ? formData.other_relation : formData.relation;
    const payload = {
      ...formData,
      relation: finalRelation
    };

    try {
      const url = editingId ? `/api/visitors/${editingId}` : '/api/visitors';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await apiFetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        closeModal();
        fetchData();
      } else {
        const data = await response.json();
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      document_type: 'RG',
      document: '',
      phone: '',
      photo: null,
      prisoner_id: '',
      relation: 'Pai / Mãe',
      other_relation: '',
      visit_date: new Date().toISOString().split('T')[0],
      visit_time: '09:00',
      status: 'Agendada'
    });
  };

  const handleEdit = (visitor: Visitor) => {
    setEditingId(visitor.id);
    const isStandardRelation = RELATION_OPTIONS.includes(visitor.relation);
    setFormData({
      name: visitor.name,
      document_type: visitor.document_type || 'RG',
      document: visitor.document,
      phone: visitor.phone || '',
      photo: visitor.photo,
      prisoner_id: String(visitor.prisoner_id),
      relation: isStandardRelation ? visitor.relation : 'Outro',
      other_relation: isStandardRelation ? '' : visitor.relation,
      visit_date: visitor.visit_date,
      visit_time: visitor.visit_time,
      status: visitor.status
    });
    setIsModalOpen(true);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await apiFetch(`/api/visitors/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir este registro de visitante?')) return;
    try {
      const response = await apiFetch(`/api/visitors/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredVisitors = visitors.filter(v => {
    const matchesSearch = 
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.prisoner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.document.includes(searchTerm);
    
    const matchesStatus = !filters.status || v.status === filters.status;
    const matchesDate = !filters.date || v.visit_date === filters.date;
    const matchesPrisoner = !filters.prisonerId || v.prisoner_id === Number(filters.prisonerId);

    return matchesSearch && matchesStatus && matchesDate && matchesPrisoner;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão de Visitas</h1>
          <p className="text-slate-500">Controle de acesso e agendamento de visitantes.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Novo Visitante
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por visitante, detento ou documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={filters.status}
            onChange={e => setFilters({...filters, status: e.target.value})}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos Status</option>
            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          
          <input 
            type="date"
            value={filters.date}
            onChange={e => setFilters({...filters, date: e.target.value})}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select 
            value={filters.prisonerId}
            onChange={e => setFilters({...filters, prisonerId: e.target.value})}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 max-w-[150px]"
          >
            <option value="">Todos Detentos</option>
            {prisoners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          {(filters.status || filters.date || filters.prisonerId) && (
            <button 
              onClick={() => setFilters({ status: '', date: '', prisonerId: '' })}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Visitante</th>
                <th className="px-6 py-4">Documento</th>
                <th className="px-6 py-4">Detento</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Hora</th>
                <th className="px-6 py-4">Parentesco</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                    <span className="text-slate-400">Carregando visitantes...</span>
                  </td>
                </tr>
              ) : filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-slate-300" />
                      </div>
                      <div className="max-w-xs mx-auto">
                        <h3 className="text-slate-900 font-bold">Nenhuma visita registrada ainda.</h3>
                        <p className="text-slate-500 text-sm mt-1">Cadastre visitantes e agende visitas aos detentos da unidade.</p>
                      </div>
                      <button 
                        onClick={() => setIsModalOpen(true)}
                        className="mt-2 text-blue-600 font-bold text-sm hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Novo Visitante
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((v) => {
                  const status = (STATUS_CONFIG[v.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG['Agendada']);
                  const StatusIcon = status.icon;
                  
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-600 font-bold text-sm flex-shrink-0">
                            {v.photo ? (
                              <img src={v.photo} alt={v.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              v.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">{v.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              {v.phone || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-slate-400 uppercase">{v.document_type || 'DOC'}</div>
                        <div className="text-sm text-slate-600 font-medium">{v.document}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-blue-600">{v.prisoner_name}</div>
                        <div className="text-xs text-slate-400 font-mono">MAT: {v.prisoner_registration || '---'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(v.visit_date).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {v.visit_time}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                          {v.relation}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
                          status.color
                        )}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {v.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleEdit(v)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleStatusChange(v.id, 'Cancelada')}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Cancelar"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(v.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
              <span className="text-slate-400">Carregando...</span>
            </div>
          ) : filteredVisitors.length === 0 ? (
             <div className="p-12 text-center text-slate-400">Nenhuma visita registrada.</div>
          ) : (
            filteredVisitors.map((v) => (
              <div key={v.id} className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-600 font-bold text-lg">
                      {v.photo ? <img src={v.photo} alt={v.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : v.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{v.name}</div>
                      <div className="text-xs text-slate-500">{v.document_type}: {v.document}</div>
                    </div>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded-full text-xs font-bold border uppercase",
                    (STATUS_CONFIG[v.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG['Agendada']).color
                  )}>
                    {v.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-400 uppercase">Detento</div>
                    <div className="font-bold text-blue-600">{v.prisoner_name}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-400 uppercase">Parentesco</div>
                    <div className="font-medium text-slate-700">{v.relation}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-400 uppercase">Data</div>
                    <div className="font-medium text-slate-700">{new Date(v.visit_date).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-400 uppercase">Horário</div>
                    <div className="font-medium text-slate-700">{v.visit_time}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => handleEdit(v)} className="flex-1 py-2 bg-slate-50 text-slate-600 font-bold rounded-lg text-xs border border-slate-200">Editar</button>
                  <button onClick={() => handleStatusChange(v.id, 'Realizada')} className="flex-1 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg text-xs border border-blue-200">Realizada</button>
                  <button onClick={() => handleDelete(v.id)} className="p-2 text-red-600 bg-red-50 rounded-lg border border-red-100"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Cadastro/Edição */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-4"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingId ? 'Editar Visitante' : 'Cadastrar Novo Visitante'}
                  </h3>
                  <p className="text-xs text-slate-500">Preencha as informações para agendar a visita.</p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
                {/* Section 1: Identification */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">1</div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Identificação do Visitante</h4>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-shrink-0">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Foto do Visitante</label>
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                          {formData.photo ? (
                            <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <>
                              <Camera className="w-6 h-6 text-slate-400" />
                              <span className="text-[8px] font-bold text-slate-400 mt-1">UPLOAD</span>
                            </>
                          )}
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {formData.photo && (
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, photo: null})}
                            className="absolute -top-1.5 -right-1.5 p-1 bg-rose-500 text-white rounded-full shadow-lg"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="space-y-1">
                        <label className="text-sm font-bold text-slate-700">Nome Completo *</label>
                        <input 
                          required
                          type="text" 
                          placeholder="Ex: João da Silva"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-slate-700">Tipo de Documento *</label>
                          <select 
                            required
                            value={formData.document_type}
                            onChange={e => setFormData({...formData, document_type: e.target.value})}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          >
                            {DOCUMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-slate-700">Número *</label>
                          <input 
                            required
                            type="text" 
                            placeholder="000.000.000-00"
                            value={formData.document}
                            onChange={e => setFormData({...formData, document: e.target.value})}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-bold text-slate-700">Telefone *</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input 
                            required
                            type="tel" 
                            placeholder="+258 84 XXX XXXX"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Visit Data */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">2</div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Dados da Visita</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Detento a Visitar *</label>
                      <select 
                        required
                        value={formData.prisoner_id}
                        onChange={e => setFormData({...formData, prisoner_id: e.target.value})}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      >
                        <option value="">Selecione um detento</option>
                        {prisoners.map(p => (
                          <option key={p.id} value={p.id}>{p.name} — Matrícula {p.registration_number}</option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Info className="w-2.5 h-2.5" />
                        Máximo de 5 visitantes por detento.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Parentesco *</label>
                      <select 
                        required
                        value={formData.relation}
                        onChange={e => setFormData({...formData, relation: e.target.value})}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      >
                        {RELATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>

                  {formData.relation === 'Outro' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-1"
                    >
                      <label className="text-xs font-bold text-slate-700">Especifique o Parentesco *</label>
                      <input 
                        required
                        type="text" 
                        placeholder="Ex: Vizinho, Primo, etc."
                        value={formData.other_relation}
                        onChange={e => setFormData({...formData, other_relation: e.target.value})}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Section 3: Scheduling */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">3</div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Agendamento</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-slate-700">Data da Visita *</label>
                      <input 
                        required
                        type="date" 
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.visit_date}
                        onChange={e => setFormData({...formData, visit_date: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Horário Disponível *</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {TIME_SLOTS.map(slot => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setFormData({...formData, visit_time: slot})}
                            className={cn(
                              "py-1.5 rounded-lg text-xs font-bold border transition-all",
                              formData.visit_time === slot 
                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20" 
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"
                            )}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Status da Visita *</label>
                    <select 
                      required
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    >
                      {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-slate-500 text-sm font-bold hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
                  >
                    {editingId ? 'Salvar Alterações' : 'Agendar Visita'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
