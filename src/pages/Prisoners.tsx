import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  UserPlus,
  FileEdit,
  Eye,
  FileDown,
  Trash2,
  X,
  Camera,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  UserMinus,
  Gavel,
  Calendar,
  User,
  FileText,
  Home,
  CheckCircle2,
  Info,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Prisoner {
  id: number;
  name: string;
  registration_number: string;
  cell_id: number;
  cell_number: string;
  entry_date: string;
  crime: string;
  status: string;
  age: number;
  parents: string;
  marital_status: string;
  photo: string;
  is_recidivist: number;
  birth_date?: string;
  father_name?: string;
  mother_name?: string;
  observations?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

import { prisonerService } from '../services/PrisonerService';

export default function Prisoners() {
  const navigate = useNavigate();
  const [prisoners, setPrisoners] = useState<Prisoner[]>([]);
  const [cells, setCells] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrisoner, setEditingPrisoner] = useState<Prisoner | null>(null);
  const [viewingPrisoner, setViewingPrisoner] = useState<Prisoner | null>(null);
  const [prisonerVisitors, setPrisonerVisitors] = useState<any[]>([]);
  const [loadingVisitors, setLoadingVisitors] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isDischarging, setIsDischarging] = useState<number | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const initialFormState = {
    name: '',
    registration_number: '',
    cell_id: '',
    entry_date: new Date().toISOString().split('T')[0],
    crime: '',
    age: '',
    birth_date: '',
    father_name: '',
    mother_name: '',
    parents: '',
    marital_status: 'Solteiro(a)',
    photo: '',
    is_recidivist: false,
    status: 'Ativo',
    observations: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const month = today.getMonth() - birth.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age.toString();
  };

  const fetchData = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // We still need cells, I'll keep it simple for now but ideally it would have its own service
      const cRes = await apiFetch('/api/cells', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      
      const pData = await prisonerService.getPrisoners(page, 10, search);
      setPrisoners(pData.data);
      setPagination(pData.pagination);
      
      if (cRes.ok) {
        setCells(await cRes.json());
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, searchTerm);
  }, [currentPage]);

  useEffect(() => {
    if (viewingPrisoner) {
      const fetchPrisonerVisitors = async () => {
        setLoadingVisitors(true);
        try {
          const token = localStorage.getItem('token');
          const res = await apiFetch(`/api/visitors?prisoner_id=${viewingPrisoner.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            setPrisonerVisitors(await res.json());
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingVisitors(false);
        }
      };
      fetchPrisonerVisitors();
    } else {
      setPrisonerVisitors([]);
    }
  }, [viewingPrisoner]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData(1, searchTerm);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPrisoner) {
        await prisonerService.updatePrisoner(editingPrisoner.id, formData);
        setToast({ message: 'Dados do detento atualizados com sucesso!', type: 'success' });
      } else {
        await prisonerService.createPrisoner(formData);
        setToast({ message: 'Detento cadastrado com sucesso!', type: 'success' });
      }

      setIsModalOpen(false);
      setEditingPrisoner(null);
      setFormData(initialFormState);
      fetchData(currentPage, searchTerm);
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleEdit = (prisoner: Prisoner) => {
    setEditingPrisoner(prisoner);
    setFormData({
      name: prisoner.name,
      registration_number: prisoner.registration_number,
      cell_id: (prisoner.cell_id || '').toString(),
      entry_date: prisoner.entry_date,
      crime: prisoner.crime,
      age: (prisoner.age || '').toString(),
      birth_date: prisoner.birth_date || '',
      father_name: prisoner.father_name || '',
      mother_name: prisoner.mother_name || '',
      parents: prisoner.parents || '',
      marital_status: prisoner.marital_status || 'Solteiro(a)',
      photo: prisoner.photo || '',
      is_recidivist: !!prisoner.is_recidivist,
      status: prisoner.status || 'Ativo',
      observations: prisoner.observations || ''
    });
    setIsModalOpen(true);
  };

  const generatePDF = async (p: Prisoner) => {
    setIsGeneratingPDF(p.id);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Fetch crimes for this prisoner
    let crimes = [];
    try {
      crimes = await prisonerService.getCrimesByPrisoner(p.id);
    } catch (err) {
      console.error('Erro ao buscar crimes para o PDF:', err);
    }
    
    // Header
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('FICHA INDIVIDUAL DO DETENTO', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('SISTEMA INTEGRADO DE GESTÃO PRISIONAL - SIGEP', pageWidth / 2, 30, { align: 'center' });

    // Photo placeholder or actual photo
    if (p.photo) {
      try {
        doc.addImage(p.photo, 'JPEG', 15, 50, 40, 50);
      } catch (e) {
        doc.setDrawColor(200, 200, 200);
        doc.rect(15, 50, 40, 50);
        doc.setTextColor(150, 150, 150);
        doc.text('SEM FOTO', 35, 75, { align: 'center' });
      }
    } else {
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, 50, 40, 50);
      doc.setTextColor(150, 150, 150);
      doc.text('SEM FOTO', 35, 75, { align: 'center' });
    }

    // Basic Info
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(p.name.toUpperCase(), 65, 60);
    
    doc.setFontSize(12);
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text(`MATRÍCULA: ${p.registration_number}`, 65, 70);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('STATUS ATUAL:', 65, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(p.status.toUpperCase(), 100, 80);

    doc.setFont('helvetica', 'bold');
    doc.text('CELE ATUAL:', 65, 88);
    doc.setFont('helvetica', 'normal');
    doc.text(p.cell_number || 'NÃO ALOCADO', 100, 88);

    // Details Table
    autoTable(doc, {
      startY: 110,
      head: [['INFORMAÇÕES PESSOAIS E CRIMINAIS', '']],
      body: [
        ['Idade', `${p.age || 'N/A'} anos`],
        ['Estado Civil', p.marital_status || 'Não informado'],
        ['Filiação', p.parents || 'Não informada'],
        ['Data de Entrada', p.entry_date],
        ['Crime Principal', p.crime],
        ['Reincidente', p.is_recidivist ? 'SIM' : 'NÃO'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 12 },
      bodyStyles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
      }
    });

    // Crimes Table
    if (crimes && crimes.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['HISTÓRICO DE CRIMES', '', '', '']],
        body: crimes.map((c: any) => [
          `Artigo: ${c.article}`,
          `Tipo: ${c.type}`,
          `Pena: ${c.sentence_years}a ${c.sentence_months}m`,
          `Data: ${c.crime_date}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 11 },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 50 },
          2: { cellWidth: 40 },
          3: { cellWidth: 40 },
        }
      });
      
      // Add descriptions if needed or just a summary
      const lastY = (doc as any).lastAutoTable.finalY;
      if (lastY > 250) doc.addPage();
    } else {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['HISTÓRICO DE CRIMES']],
        body: [['Nenhum registro de crime encontrado além do principal.']],
        theme: 'plain',
        headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontSize: 11 },
        bodyStyles: { fontSize: 9, fontStyle: 'italic' }
      });
    }

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setDrawColor(200, 200, 200);
    doc.line(15, finalY, pageWidth - 15, finalY);
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const date = new Date().toLocaleString('pt-BR');
    doc.text(`Documento gerado em: ${date}`, 15, finalY + 10);
    doc.text('Assinatura do Responsável: __________________________________________', 15, finalY + 25);

    doc.save(`ficha_detento_${p.registration_number}.pdf`);
    setIsGeneratingPDF(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este detento? Esta ação não pode ser desfeita e removerá todo o histórico (crimes, transferências, visitas).')) return;
    
    setIsDeleting(id);
    try {
      await prisonerService.deletePrisoner(id);
      fetchData(currentPage, searchTerm);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDischarge = async (id: number) => {
    if (!confirm('Deseja dar baixa neste detento? Ele será marcado como "Liberado" e removido da cela.')) return;
    
    setIsDischarging(id);
    try {
      await prisonerService.dischargePrisoner(id);
      fetchData(currentPage, searchTerm);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDischarging(null);
    }
  };


  const generateRegistrationNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `MAT-${year}${random}`;
  };

  const openNewModal = () => {
    setEditingPrisoner(null);
    setFormData({
      ...initialFormState,
      registration_number: generateRegistrationNumber()
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão de Detentos</h1>
          <p className="text-slate-500">Cadastro, edição e monitoramento da população carcerária.</p>
        </div>
        <button 
          onClick={openNewModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
        >
          <UserPlus className="w-5 h-5" />
          Novo Cadastro
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome, matrícula ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </form>
          <button className="px-4 py-2 border border-slate-200 rounded-lg flex items-center gap-2 text-slate-600 hover:bg-slate-50 transition-all">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">ID / Matrícula</th>
                <th className="px-6 py-4">Detento</th>
                <th className="px-6 py-4">Cela</th>
                <th className="px-6 py-4">Entrada</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                    <span className="text-slate-400">Carregando dados...</span>
                  </td>
                </tr>
              ) : prisoners.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Nenhum detento encontrado.</td></tr>
              ) : (
                prisoners.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-blue-600">#{p.id}</div>
                      <div className="font-mono text-sm text-slate-600">{p.registration_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          {p.photo ? (
                            <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                              {p.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-500">{p.crime}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">
                        {p.cell_number || 'Não alocado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{p.entry_date}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        p.status === 'Ativo' ? "bg-emerald-100 text-emerald-800" :
                        p.status === 'Isolamento' ? "bg-amber-100 text-amber-800" :
                        p.status === 'Solitária' ? "bg-red-100 text-red-800" :
                        p.status === 'Liberado' ? "bg-slate-200 text-slate-600" :
                        "bg-slate-100 text-slate-800"
                      )}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setViewingPrisoner(p)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                          title="Visualizar Detalhes"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => generatePDF(p)}
                          disabled={isGeneratingPDF === p.id}
                          className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors disabled:opacity-50"
                          title="Gerar Ficha PDF"
                        >
                          {isGeneratingPDF === p.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <FileDown className="w-5 h-5" />
                          )}
                        </button>
                        <button 
                          onClick={() => navigate(`/crimes?prisoner_id=${p.id}`)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                          title="Histórico Criminal"
                        >
                          <Gavel className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleEdit(p)}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                          title="Editar"
                        >
                          <FileEdit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDischarge(p.id)}
                          disabled={isDischarging === p.id || p.status === 'Liberado'}
                          className="p-2 hover:bg-amber-50 rounded-lg text-amber-600 transition-colors disabled:opacity-50"
                          title="Dar Baixa (Liberar)"
                        >
                          {isDischarging === p.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserMinus className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          disabled={isDeleting === p.id}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors disabled:opacity-50"
                          title="Excluir Permanentemente"
                        >
                          {isDeleting === p.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
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
              <span className="text-slate-400">Carregando dados...</span>
            </div>
          ) : prisoners.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">Nenhum detento encontrado.</div>
          ) : (
            prisoners.map((p) => (
              <div key={p.id} className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                      {p.photo ? (
                        <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                          {p.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-500">#{p.id} • {p.registration_number}</div>
                    </div>
                  </div>
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    p.status === 'Ativo' ? "bg-emerald-100 text-emerald-800" :
                    p.status === 'Isolamento' ? "bg-amber-100 text-amber-800" :
                    p.status === 'Solitária' ? "bg-red-100 text-red-800" :
                    p.status === 'Liberado' ? "bg-slate-200 text-slate-600" :
                    "bg-slate-100 text-slate-800"
                  )}>
                    {p.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Cela</div>
                    <div className="font-medium text-slate-900">{p.cell_number || 'Não alocado'}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Entrada</div>
                    <div className="font-medium text-slate-900">{p.entry_date}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Crime Principal</div>
                    <div className="font-medium text-slate-900">{p.crime}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button 
                    onClick={() => setViewingPrisoner(p)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                  <button 
                    onClick={() => navigate(`/crimes?prisoner_id=${p.id}`)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Gavel className="w-4 h-4" />
                    Crimes
                  </button>
                  <button 
                    onClick={() => handleEdit(p)}
                    className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <FileEdit className="w-4 h-4" />
                    Editar
                  </button>
                  <button 
                    onClick={() => generatePDF(p)}
                    disabled={isGeneratingPDF === p.id}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingPDF === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                  </button>
                  <button 
                    onClick={() => handleDischarge(p.id)}
                    disabled={isDischarging === p.id || p.status === 'Liberado'}
                    className="p-2 bg-amber-50 hover:bg-amber-100 rounded-lg text-amber-600 transition-colors disabled:opacity-50"
                  >
                    {isDischarging === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id)}
                    disabled={isDeleting === p.id}
                    className="p-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 transition-colors disabled:opacity-50"
                  >
                    {isDeleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <p className="text-sm text-slate-500">
              Mostrando <span className="font-medium text-slate-900">{prisoners.length}</span> de <span className="font-medium text-slate-900">{pagination.total}</span> detentos
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "w-10 h-10 rounded-lg font-bold text-sm transition-all",
                    currentPage === i + 1 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                      : "hover:bg-white border border-transparent hover:border-slate-200 text-slate-600"
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                disabled={currentPage === pagination.pages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Cadastro / Edição */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-1"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingPrisoner ? 'Editar Detento' : 'Novo Cadastro de Detento'}
                  </h3>
                  <p className="text-sm text-slate-500">Preencha todos os campos obrigatórios.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-0 flex flex-col max-h-[75vh]">
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Photo Upload Section */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="w-32 h-40 bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden relative group shadow-inner">
                        {formData.photo ? (
                          <>
                            <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button type="button" className="p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md text-white transition-all">
                                <Camera className="w-5 h-5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-2">
                            <Camera className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sem Foto</p>
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          CAPTURAR
                        </button>
                        <button type="button" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all flex items-center gap-1">
                          <Plus className="w-3 h-3" />
                          ALTERAR
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      {/* Section: Dados Pessoais */}
                      <section className="space-y-3">
                        <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                          <User className="w-4 h-4 text-blue-600" />
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dados Pessoais</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-sm font-bold text-slate-500 uppercase">Nome Completo *</label>
                            <input 
                              required
                              type="text" 
                              value={formData.name}
                              onChange={e => setFormData({...formData, name: e.target.value})}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                              placeholder="Nome completo do detento"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-500 uppercase">Data de Nascimento</label>
                            <input 
                              type="date" 
                              value={formData.birth_date}
                              onChange={e => {
                                const bDate = e.target.value;
                                setFormData({
                                  ...formData, 
                                  birth_date: bDate,
                                  age: calculateAge(bDate)
                                });
                              }}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-500 uppercase">Idade (Calculada)</label>
                            <input 
                              readOnly
                              type="text" 
                              value={formData.age}
                              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg outline-none font-bold text-slate-600 text-sm"
                              placeholder="--"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-500 uppercase">Nome do Pai</label>
                            <input 
                              type="text" 
                              value={formData.father_name}
                              onChange={e => setFormData({...formData, father_name: e.target.value})}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                              placeholder="Nome do pai"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-500 uppercase">Nome da Mãe</label>
                            <input 
                              type="text" 
                              value={formData.mother_name}
                              onChange={e => setFormData({...formData, mother_name: e.target.value})}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                              placeholder="Nome da mãe"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-500 uppercase">Estado Civil</label>
                            <select 
                              value={formData.marital_status}
                              onChange={e => setFormData({...formData, marital_status: e.target.value})}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            >
                              <option value="Solteiro(a)">Solteiro(a)</option>
                              <option value="Casado(a)">Casado(a)</option>
                              <option value="Divorciado(a)">Divorciado(a)</option>
                              <option value="Viúvo(a)">Viúvo(a)</option>
                              <option value="União Estável">União Estável</option>
                            </select>
                          </div>
                        </div>
                      </section>

                      {/* Section: Dados do Sistema */}
                      <section className="space-y-3">
                        <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dados do Sistema</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-500 uppercase">Número de Matrícula *</label>
                            <div className="relative">
                              <input 
                                required
                                type="text" 
                                value={formData.registration_number}
                                onChange={e => setFormData({...formData, registration_number: e.target.value})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-blue-700 text-sm"
                                placeholder="Gerado automaticamente"
                              />
                              {!editingPrisoner && (
                                <button 
                                  type="button"
                                  onClick={() => setFormData({...formData, registration_number: generateRegistrationNumber()})}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                >
                                  <Plus className="w-4 h-4 rotate-45" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-500 uppercase">Status *</label>
                            <select 
                              required
                              value={formData.status}
                              onChange={e => setFormData({...formData, status: e.target.value})}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            >
                              <option value="Ativo">Ativo</option>
                              <option value="Isolamento">Isolamento</option>
                              <option value="Solitária">Solitária</option>
                              <option value="Transferido">Transferido</option>
                              <option value="Liberado">Liberado (Baixa)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-500 uppercase">Data de Entrada *</label>
                            <input 
                              required
                              type="date" 
                              value={formData.entry_date}
                              onChange={e => setFormData({...formData, entry_date: e.target.value})}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            />
                          </div>
                        </div>
                      </section>

                      {/* Section: Dados da Custódia */}
                      <section className="space-y-3">
                        <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                          <Home className="w-4 h-4 text-blue-600" />
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dados da Custódia</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-500 uppercase">Cela *</label>
                            <select 
                              required
                              value={formData.cell_id}
                              onChange={e => setFormData({...formData, cell_id: e.target.value})}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            >
                              <option value="">Selecione uma cela</option>
                              {cells.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.number} (Cap: {c.capacity} | Ocup: {c.current_occupancy || 0})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-500 uppercase">Crime / Artigo *</label>
                            <input 
                              required
                              type="text" 
                              value={formData.crime}
                              onChange={e => setFormData({...formData, crime: e.target.value})}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                              placeholder="Ex: Art. 157 - Roubo"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer group hover:bg-slate-100 transition-all">
                              <div className="relative flex items-center">
                                <input 
                                  type="checkbox" 
                                  checked={formData.is_recidivist}
                                  onChange={e => setFormData({...formData, is_recidivist: e.target.checked})}
                                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all"
                                />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-slate-700">O detento possui antecedentes criminais?</p>
                                <p className="text-xs text-slate-400 font-medium">Marque se o detento for reincidente no sistema prisional.</p>
                              </div>
                              <Info className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                            </label>
                          </div>
                        </div>
                      </section>

                      {/* Section: Observações */}
                      <section className="space-y-3">
                        <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Observações / Notas</h4>
                        </div>
                        
                        <div className="space-y-1">
                          <textarea 
                            value={formData.observations}
                            onChange={e => setFormData({...formData, observations: e.target.value})}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm min-h-[80px] resize-none"
                            placeholder="Registre aqui comportamento, riscos, transferências ou outras observações relevantes..."
                          />
                        </div>
                      </section>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-600 text-sm font-bold hover:bg-slate-200 rounded-lg transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {editingPrisoner ? 'Salvar Detento' : 'Concluir Cadastro'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal Visualizar Detalhes */}
        {viewingPrisoner && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingPrisoner(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] my-1"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <h3 className="text-lg font-bold text-slate-900">Detalhes do Detento</h3>
                <button onClick={() => setViewingPrisoner(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="w-32 h-40 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shrink-0 shadow-md">
                    {viewingPrisoner.photo ? (
                      <img src={viewingPrisoner.photo} alt={viewingPrisoner.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <Camera className="w-8 h-8 mb-1" />
                        <p className="text-xs font-bold uppercase tracking-widest">Sem Foto</p>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* Section: Identificação */}
                    <section className="space-y-3">
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                        <User className="w-4 h-4 text-blue-600" />
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Identificação Civil</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2 space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome Completo</p>
                          <p className="text-base font-bold text-slate-900">{viewingPrisoner.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Data de Nascimento</p>
                          <p className="text-sm font-bold text-slate-700">{viewingPrisoner.birth_date ? new Date(viewingPrisoner.birth_date).toLocaleDateString('pt-BR') : 'Não informada'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Idade Atual</p>
                          <p className="text-sm font-bold text-slate-700">{viewingPrisoner.age} anos</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome do Pai</p>
                          <p className="text-sm font-bold text-slate-700">{viewingPrisoner.father_name || 'Não informado'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome da Mãe</p>
                          <p className="text-sm font-bold text-slate-700">{viewingPrisoner.mother_name || 'Não informada'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estado Civil</p>
                          <p className="text-sm font-bold text-slate-700">{viewingPrisoner.marital_status}</p>
                        </div>
                      </div>
                    </section>

                    {/* Section: Situação Penal */}
                    <section className="space-y-3">
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Situação Penal</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Matrícula</p>
                          <p className="text-sm font-bold text-blue-700">{viewingPrisoner.registration_number}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Data de Entrada</p>
                          <p className="text-sm font-bold text-slate-700">{new Date(viewingPrisoner.entry_date).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Crime Principal / Artigo</p>
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-sm font-bold text-slate-700">
                            {viewingPrisoner.crime}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status Atual</p>
                          <div className={cn(
                            "inline-flex px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                            viewingPrisoner.status === 'Ativo' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {viewingPrisoner.status}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Antecedentes</p>
                          <div className={cn(
                            "inline-flex px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                            viewingPrisoner.is_recidivist ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {viewingPrisoner.is_recidivist ? 'Reincidente' : 'Réu Primário'}
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Section: Custódia */}
                    <section className="space-y-3">
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                        <Home className="w-4 h-4 text-blue-600" />
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Custódia</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Localização (Cela)</p>
                          <p className="text-sm font-bold text-slate-900">CELA {viewingPrisoner.cell_number || viewingPrisoner.cell_id}</p>
                        </div>
                      </div>
                    </section>

                    {/* Section: Observações */}
                    {viewingPrisoner.observations && (
                      <section className="space-y-3">
                        <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                          <Info className="w-4 h-4 text-blue-600" />
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Observações Adicionais</h4>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-sm text-amber-900 font-medium whitespace-pre-wrap">
                          {viewingPrisoner.observations}
                        </div>
                      </section>
                    )}

                    {/* Section: Visitantes Autorizados / Histórico */}
                    <section className="space-y-3">
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                        <Users className="w-4 h-4 text-blue-600" />
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Visitantes & Histórico</h4>
                      </div>
                      
                      {loadingVisitors ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        </div>
                      ) : prisonerVisitors.length === 0 ? (
                        <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Nenhum visitante registrado</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {prisonerVisitors.map((v) => (
                            <div key={v.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-500 font-bold text-xs">
                                  {v.photo ? <img src={v.photo} alt={v.name} className="w-full h-full object-cover" /> : v.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{v.name}</p>
                                  <p className="text-xs text-slate-500 font-medium">{v.relation} • {v.document}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-bold text-slate-400 uppercase">{new Date(v.visit_date).toLocaleDateString('pt-BR')}</p>
                                <p className="text-xs font-bold text-blue-600">{v.visit_time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap justify-end gap-3 shrink-0">
                <button 
                  onClick={() => generatePDF(viewingPrisoner)}
                  disabled={isGeneratingPDF === viewingPrisoner.id}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isGeneratingPDF === viewingPrisoner.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                  {isGeneratingPDF === viewingPrisoner.id ? 'Gerando...' : 'Gerar Ficha PDF'}
                </button>
                <button 
                  onClick={() => {
                    const id = viewingPrisoner.id;
                    setViewingPrisoner(null);
                    navigate(`/crimes?prisoner_id=${id}`);
                  }}
                  className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <Gavel className="w-4 h-4" />
                  Histórico Criminal
                </button>
                <button 
                  onClick={() => setViewingPrisoner(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-8 right-8 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border",
              toast.type === 'success' ? "bg-emerald-600 border-emerald-500 text-white" : "bg-red-600 border-red-500 text-white"
            )}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
