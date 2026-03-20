import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  X, 
  Loader2, 
  Search,
  Phone,
  Mail,
  UserCheck,
  Shield,
  Calendar,
  Clock,
  FileText,
  Eye,
  Edit2,
  ExternalLink,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface LinkedPrisoner {
  id: number;
  name: string;
  registration_number: string;
}

interface Lawyer {
  id: number;
  name: string;
  oab: string;
  phone: string;
  email: string;
  prisoner_count: number;
  linked_prisoners?: LinkedPrisoner[];
}

interface LawyerVisit {
  id: number;
  lawyer_id: number;
  lawyer_name: string;
  lawyer_oab: string;
  prisoner_id: number;
  prisoner_name: string;
  visit_date: string;
  visit_time?: string;
  visit_type?: string;
  notes: string;
  inspector_name?: string;
  created_at?: string;
}

interface Prisoner {
  id: number;
  name: string;
  registration_number: string;
}

export default function Lawyers() {
  const [activeTab, setActiveTab] = useState<'lawyers' | 'visits'>('lawyers');
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [visits, setVisits] = useState<LawyerVisit[]>([]);
  const [prisoners, setPrisoners] = useState<Prisoner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [visitFilters, setVisitFilters] = useState({
    date: '',
    lawyer: '',
    prisoner: ''
  });

  const [formData, setFormData] = useState({
    id: null as number | null,
    name: '',
    oab: '',
    phone: '',
    email: '',
    prisoner_ids: [] as string[]
  });

  const [visitFormData, setVisitFormData] = useState({
    lawyer_id: '',
    prisoner_id: '',
    visit_date: new Date().toISOString().split('T')[0],
    visit_time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    visit_type: 'Atendimento Jurídico',
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [lRes, pRes, vRes] = await Promise.all([
        apiFetch('/api/lawyers', { headers: { 'Authorization': `Bearer ${token}` } }),
        apiFetch('/api/prisoners?limit=1000', { headers: { 'Authorization': `Bearer ${token}` } }),
        apiFetch('/api/lawyer-visits', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (lRes.ok && pRes.ok && vRes.ok) {
        setLawyers(await lRes.json());
        const pData = await pRes.json();
        setPrisoners(pData.data);
        setVisits(await vRes.json());
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

  const maskOAB = (value: string) => {
    const cleanValue = value.replace(/[^0-9A-Za-z]/g, '');
    if (cleanValue.length <= 6) return cleanValue;
    const number = cleanValue.slice(0, 6);
    const uf = cleanValue.slice(6, 8).toUpperCase();
    return `${number}/${uf}`;
  };

  const maskPhone = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 2) return cleanValue;
    if (cleanValue.length <= 7) return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2)}`;
    return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 7)}-${cleanValue.slice(7, 11)}`;
  };

  const generateReceipt = (visit: LawyerVisit) => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Comprovante de Visita Jurídica', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Sistema de Gestão Prisional - Módulo Jurídico', 105, 28, { align: 'center' });
    
    doc.line(20, 35, 190, 35);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Dados do Advogado:', 20, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${visit.lawyer_name}`, 20, 52);
    doc.text(`OAB: ${visit.lawyer_oab}`, 20, 59);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Dados do Detento:', 20, 75);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${visit.prisoner_name}`, 20, 82);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhes da Visita:', 20, 98);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data: ${visit.visit_date}`, 20, 105);
    doc.text(`Horário: ${visit.visit_time || '-'}`, 20, 112);
    doc.text(`Tipo: ${visit.visit_type || 'Atendimento Jurídico'}`, 20, 119);
    
    if (visit.notes) {
      doc.setFont('helvetica', 'bold');
      doc.text('Observações:', 20, 135);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(visit.notes, 170);
      doc.text(splitNotes, 20, 142);
    }
    
    doc.line(20, 240, 190, 240);
    doc.setFontSize(10);
    doc.text(`Registrado por: ${visit.inspector_name || 'Administrador'}`, 20, 250);
    doc.text(`Data do Registro: ${visit.created_at ? new Date(visit.created_at).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')}`, 20, 257);
    
    doc.setFontSize(8);
    doc.text('Assinatura Digital do Sistema', 105, 280, { align: 'center' });
    doc.text('Este documento é um comprovante oficial de atendimento jurídico.', 105, 285, { align: 'center' });
    
    doc.save(`comprovante_visita_${visit.id}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditing ? `/api/lawyers/${formData.id}` : '/api/lawyers';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await apiFetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setIsEditing(false);
        setFormData({
          id: null,
          name: '',
          oab: '',
          phone: '',
          email: '',
          prisoner_ids: []
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

  const handleEdit = (lawyer: Lawyer) => {
    setFormData({
      id: lawyer.id,
      name: lawyer.name,
      oab: lawyer.oab,
      phone: lawyer.phone,
      email: lawyer.email,
      prisoner_ids: lawyer.linked_prisoners?.map(p => p.id.toString()) || []
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir este registro de advogado?')) return;
    try {
      const response = await apiFetch(`/api/lawyers/${id}`, {
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

  const handleDeleteVisit = async (id: number) => {
    if (!confirm('Deseja excluir este registro de visita jurídica?')) return;
    try {
      const response = await apiFetch(`/api/lawyer-visits/${id}`, {
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

  const handleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Block future dates
    const today = new Date().toISOString().split('T')[0];
    if (visitFormData.visit_date > today) {
      alert('Não é possível registrar visitas em datas futuras.');
      return;
    }

    try {
      const response = await apiFetch('/api/lawyer-visits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(visitFormData),
      });

      if (response.ok) {
        setIsVisitModalOpen(false);
        setVisitFormData({
          lawyer_id: '',
          prisoner_id: '',
          visit_date: new Date().toISOString().split('T')[0],
          visit_time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          visit_type: 'Atendimento Jurídico',
          notes: ''
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

  const filteredLawyers = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return lawyers.filter(l => 
      l.name.toLowerCase().includes(searchLower) ||
      l.oab.toLowerCase().includes(searchLower) ||
      l.phone.includes(searchTerm) ||
      l.linked_prisoners?.some(p => p.name.toLowerCase().includes(searchLower))
    );
  }, [lawyers, searchTerm]);

  const filteredVisits = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return visits.filter(v => {
      const matchesSearch = 
        v.lawyer_name.toLowerCase().includes(searchLower) ||
        v.prisoner_name.toLowerCase().includes(searchLower) ||
        v.lawyer_oab.toLowerCase().includes(searchLower);
      
      const matchesDate = !visitFilters.date || v.visit_date === visitFilters.date;
      const matchesLawyer = !visitFilters.lawyer || v.lawyer_id.toString() === visitFilters.lawyer;
      const matchesPrisoner = !visitFilters.prisoner || v.prisoner_id.toString() === visitFilters.prisoner;

      return matchesSearch && matchesDate && matchesLawyer && matchesPrisoner;
    });
  }, [visits, searchTerm, visitFilters]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assistência Jurídica</h1>
          <p className="text-slate-500">Gestão de advogados e registros de visitas jurídicas.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsVisitModalOpen(true)}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
          >
            <Calendar className="w-5 h-5 text-blue-600" />
            Registrar Visita Jurídica
          </button>
          <button 
            onClick={() => {
              setIsEditing(false);
              setFormData({ id: null, name: '', oab: '', phone: '', email: '', prisoner_ids: [] });
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus className="w-5 h-5" />
            Cadastrar Advogado
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('lawyers')}
          className={cn(
            "px-6 py-3 font-bold text-sm transition-all border-b-2",
            activeTab === 'lawyers' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Advogados Cadastrados
        </button>
        <button
          onClick={() => setActiveTab('visits')}
          className={cn(
            "px-6 py-3 font-bold text-sm transition-all border-b-2",
            activeTab === 'visits' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Histórico de Visitas
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder={activeTab === 'lawyers' ? "Buscar por nome, OAB, telefone ou detento..." : "Buscar por advogado, detento ou OAB..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
              />
            </div>
            
            {activeTab === 'visits' && (
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm min-w-fit">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <input 
                    type="date" 
                    value={visitFilters.date}
                    onChange={e => setVisitFilters({...visitFilters, date: e.target.value})}
                    className="text-xs outline-none bg-transparent"
                  />
                </div>
                <button 
                  onClick={() => setVisitFilters({ date: '', lawyer: '', prisoner: '' })}
                  className="text-xs text-blue-600 font-bold hover:underline px-2 min-w-fit"
                >
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'lawyers' ? (
            <>
              <table className="w-full text-left border-collapse hidden md:table">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">Advogado</th>
                    <th className="px-6 py-4">OAB</th>
                    <th className="px-6 py-4">Contato</th>
                    <th className="px-6 py-4">Detentos Atendidos</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                        <span className="text-slate-400">Carregando advogados...</span>
                      </td>
                    </tr>
                  ) : filteredLawyers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Briefcase className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-slate-900 font-bold mb-1">Nenhum advogado cadastrado ainda.</h3>
                        <p className="text-slate-500 text-sm mb-6">Cadastre advogados para registrar visitas jurídicas e gerenciar atendimentos.</p>
                        <button 
                          onClick={() => setIsModalOpen(true)}
                          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                        >
                          <UserPlus className="w-5 h-5" />
                          Cadastrar Primeiro Advogado
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredLawyers.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                              {l.name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-900">{l.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">
                            OAB {l.oab}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="w-3.5 h-3.5" />
                              {l.phone}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail className="w-3.5 h-3.5" />
                              {l.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => {
                              setSelectedLawyer(l);
                              setIsDetailsModalOpen(true);
                            }}
                            className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <UserCheck className="w-4 h-4" />
                            {l.prisoner_count} detentos
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => {
                                setSelectedLawyer(l);
                                setIsDetailsModalOpen(true);
                              }}
                              title="Ver Detalhes"
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleEdit(l)}
                              title="Editar"
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(l.id)}
                              title="Excluir"
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Mobile Card View for Lawyers */}
              <div className="md:hidden divide-y divide-slate-100">
                {loading ? (
                  <div className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                    <span className="text-slate-400">Carregando advogados...</span>
                  </div>
                ) : filteredLawyers.length === 0 ? (
                  <div className="px-6 py-12 text-center text-slate-400">Nenhum advogado cadastrado.</div>
                ) : (
                  filteredLawyers.map((l) => (
                    <div key={l.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                            {l.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{l.name}</div>
                            <div className="text-xs text-slate-500">OAB: {l.oab}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDelete(l.id)}
                          className="p-2 text-red-600 bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="col-span-2 flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Phone className="w-3 h-3" />
                            {l.phone}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Mail className="w-3 h-3" />
                            {l.email}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
                            <UserCheck className="w-4 h-4" />
                            {l.prisoner_count} detentos ativos
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <table className="w-full text-left border-collapse hidden md:table">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">Advogado</th>
                    <th className="px-6 py-4">Detento</th>
                    <th className="px-6 py-4">Data/Hora</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Observações</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                        <span className="text-slate-400">Carregando visitas...</span>
                      </td>
                    </tr>
                  ) : filteredVisits.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Nenhuma visita jurídica registrada.</td></tr>
                  ) : (
                    filteredVisits.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-bold text-slate-900">{v.lawyer_name}</div>
                            <div className="text-sm text-slate-500">OAB {v.lawyer_oab}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-blue-600">{v.prisoner_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {v.visit_date}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Clock className="w-3.5 h-3.5" />
                              {v.visit_time || '--:--'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                            v.visit_type === 'Audiência' ? "bg-purple-100 text-purple-700" :
                            v.visit_type === 'Entrega de documentos' ? "bg-amber-100 text-amber-700" :
                            "bg-blue-100 text-blue-700"
                          )}>
                            {v.visit_type || 'Atendimento'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                          {v.notes || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => generateReceipt(v)}
                              title="Baixar Comprovante"
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteVisit(v.id)}
                              title="Excluir"
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Mobile Card View for Lawyer Visits */}
              <div className="md:hidden divide-y divide-slate-100">
                {loading ? (
                  <div className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                    <span className="text-slate-400">Carregando visitas...</span>
                  </div>
                ) : filteredVisits.length === 0 ? (
                  <div className="px-6 py-12 text-center text-slate-400">Nenhuma visita jurídica registrada.</div>
                ) : (
                  filteredVisits.map((v) => (
                    <div key={v.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{v.lawyer_name}</div>
                          <div className="text-xs text-slate-500">OAB {v.lawyer_oab}</div>
                        </div>
                        <button 
                          onClick={() => handleDeleteVisit(v.id)}
                          className="p-2 text-red-600 bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-slate-400 text-[10px] uppercase font-bold">Detento</div>
                          <div className="font-bold text-blue-600">{v.prisoner_name}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px] uppercase font-bold">Data</div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Calendar className="w-3 h-3" />
                            {v.visit_date}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-slate-400 text-[10px] uppercase font-bold">Observações</div>
                          <div className="text-slate-600 italic">{v.notes || 'Sem observações'}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Registrar Visita Jurídica */}
      <AnimatePresence>
        {isVisitModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsVisitModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">Registrar Visita Jurídica</h3>
                <button onClick={() => setIsVisitModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleVisitSubmit} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Advogado *</label>
                  <select 
                    required
                    value={visitFormData.lawyer_id}
                    onChange={e => setVisitFormData({...visitFormData, lawyer_id: e.target.value, prisoner_id: ''})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="">Selecione um advogado</option>
                    {lawyers.map(l => (
                      <option key={l.id} value={l.id}>{l.name} (OAB {l.oab})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Detento (Cliente) *</label>
                  <select 
                    required
                    value={visitFormData.prisoner_id}
                    onChange={e => setVisitFormData({...visitFormData, prisoner_id: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="">Selecione um detento</option>
                    {(visitFormData.lawyer_id 
                      ? lawyers.find(l => l.id.toString() === visitFormData.lawyer_id)?.linked_prisoners || []
                      : prisoners
                    ).map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.registration_number})</option>
                    ))}
                  </select>
                  {visitFormData.lawyer_id && (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Exibindo apenas detentos vinculados a este advogado.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Data da Visita *</label>
                    <input 
                      required
                      type="date" 
                      max={new Date().toISOString().split('T')[0]}
                      value={visitFormData.visit_date}
                      onChange={e => setVisitFormData({...visitFormData, visit_date: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Horário</label>
                    <input 
                      type="time" 
                      value={visitFormData.visit_time}
                      onChange={e => setVisitFormData({...visitFormData, visit_time: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tipo de Visita *</label>
                  <select 
                    required
                    value={visitFormData.visit_type}
                    onChange={e => setVisitFormData({...visitFormData, visit_type: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  >
                    <option value="Atendimento Jurídico">Atendimento Jurídico</option>
                    <option value="Entrega de documentos">Entrega de documentos</option>
                    <option value="Audiência">Audiência</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Observações / Notas</label>
                  <textarea 
                    value={visitFormData.notes}
                    onChange={e => setVisitFormData({...visitFormData, notes: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] text-sm"
                    placeholder="Ex: Atendimento sobre processo X, solicitação de documentos, etc."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsVisitModalOpen(false)}
                    className="px-4 py-2 text-slate-600 text-sm font-bold hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                  >
                    Registrar Visita
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Novo Advogado */}
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
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">
                  {isEditing ? 'Editar Advogado' : 'Cadastrar Novo Advogado'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 mb-2">
                  <h4 className="text-[10px] uppercase font-bold text-blue-600 mb-2 flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3" />
                    Dados Profissionais
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Nome Completo *</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Número da OAB *</label>
                        <input 
                          required
                          type="text" 
                          placeholder="000000/UF"
                          value={formData.oab}
                          onChange={e => setFormData({...formData, oab: maskOAB(e.target.value)})}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Telefone *</label>
                        <input 
                          required
                          type="text" 
                          placeholder="(00) 00000-0000"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">E-mail</label>
                      <input 
                        type="email" 
                        placeholder="advogado@exemplo.com"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Vincular Detentos (Opcional)</label>
                  <div className="relative">
                    <select 
                      multiple
                      value={formData.prisoner_ids}
                      onChange={e => {
                        const values = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                        setFormData({...formData, prisoner_ids: values});
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px] text-sm"
                    >
                      {prisoners.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.registration_number})</option>
                      ))}
                    </select>
                    <div className="absolute top-2 right-2 pointer-events-none">
                      <Search className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] text-slate-400">Segure Ctrl (ou Cmd) para selecionar múltiplos detentos.</p>
                    <p className="text-[9px] font-bold text-blue-600">{formData.prisoner_ids.length} selecionados</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-600 text-sm font-bold hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                  >
                    {isEditing ? 'Salvar Alterações' : 'Salvar Advogado'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Detalhes do Advogado */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedLawyer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                    {selectedLawyer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedLawyer.name}</h3>
                    <p className="text-xs text-slate-500">OAB {selectedLawyer.oab}</p>
                  </div>
                </div>
                <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Informações de Contato */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Telefone</span>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{selectedLawyer.phone || 'Não informado'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">E-mail</span>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{selectedLawyer.email || 'Não informado'}</span>
                    </div>
                  </div>
                </div>

                {/* Detentos Vinculados */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    Detentos Atendidos ({selectedLawyer.linked_prisoners?.length || 0})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedLawyer.linked_prisoners && selectedLawyer.linked_prisoners.length > 0 ? (
                      selectedLawyer.linked_prisoners.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-bold text-[10px]">
                              {p.registration_number.slice(-3)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800">{p.name}</div>
                              <div className="text-[10px] text-slate-500">Matrícula: {p.registration_number}</div>
                            </div>
                          </div>
                          <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 py-4 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Nenhum detento vinculado a este advogado.
                      </div>
                    )}
                  </div>
                </div>

                {/* Histórico Recente de Visitas */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Histórico Recente de Visitas
                  </h4>
                  <div className="space-y-2">
                    {visits.filter(v => v.lawyer_id === selectedLawyer.id).length > 0 ? (
                      visits.filter(v => v.lawyer_id === selectedLawyer.id).slice(0, 5).map(v => (
                        <div key={v.id} className="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-white shadow-sm rounded-r-xl border border-slate-100">
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-900">Visita a {v.prisoner_name}</div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {v.visit_date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {v.visit_time || '--:--'}
                              </span>
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-bold uppercase">
                                {v.visit_type || 'Atendimento'}
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={() => generateReceipt(v)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Nenhuma visita registrada para este advogado.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                <button 
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 text-sm font-bold hover:bg-slate-200 rounded-xl transition-all"
                >
                  Fechar
                </button>
                <button 
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    handleEdit(selectedLawyer);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar Cadastro
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
