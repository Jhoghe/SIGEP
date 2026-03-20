import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Gavel, 
  Plus, 
  Trash2, 
  X, 
  Loader2, 
  Search,
  Calendar,
  User,
  Scale,
  ChevronLeft,
  Filter,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Edit2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';

interface Crime {
  id: number;
  prisoner_id: number;
  prisoner_name: string;
  article: string;
  description: string;
  crime_date: string;
  sentence_years: number;
  sentence_months: number;
  type: string;
  severity: string;
}

interface Prisoner {
  id: number;
  name: string;
  registration_number: string;
  is_recidivist: number;
}

const COMMON_CRIMES = [
  { article: "Art. 121", type: "Homicídio", description: "Matar alguém", severity: "Grave" },
  { article: "Art. 129", type: "Lesão Corporal", description: "Ofender a integridade corporal ou a saúde de outrem", severity: "Médio" },
  { article: "Art. 147", type: "Ameaça", description: "Ameaçar alguém, por palavra, escrito ou gesto", severity: "Leve" },
  { article: "Art. 155", type: "Furto", description: "Subtrair, para si ou para outrem, coisa alheia móvel", severity: "Médio" },
  { article: "Art. 157", type: "Roubo", description: "Subtrair coisa móvel alheia, mediante grave ameaça ou violência", severity: "Grave" },
  { article: "Art. 158", type: "Extorsão", description: "Constranger alguém, mediante violência ou grave ameaça, com o intuito de obter vantagem econômica", severity: "Grave" },
  { article: "Art. 163", type: "Dano", description: "Destruir, inutilizar ou deteriorar coisa alheia", severity: "Leve" },
  { article: "Art. 171", type: "Estelionato", description: "Obter, para si ou para outrem, vantagem ilícita, em prejuízo alheio, induzindo ou mantendo alguém em erro", severity: "Médio" },
  { article: "Art. 180", type: "Receptação", description: "Adquirir, receber, transportar, conduzir ou ocultar, em proveito próprio ou alheio, coisa que sabe ser produto de crime", severity: "Médio" },
  { article: "Art. 33 (Lei 11.343/06)", type: "Tráfico de Drogas", description: "Importar, exportar, remeter, preparar, produzir, fabricar, adquirir, vender, expor à venda, oferecer, ter em depósito, transportar, trazer consigo, guardar, prescrever, ministrar, entregar a consumo ou fornecer drogas", severity: "Grave" },
  { article: "Art. 35 (Lei 11.343/06)", type: "Associação para o Tráfico", description: "Associarem-se duas ou mais pessoas para o fim de praticar, reiteradamente ou não, qualquer dos crimes previstos nos arts. 33", severity: "Grave" },
  { article: "Art. 14 (Lei 10.826/03)", type: "Porte Ilegal de Arma", description: "Portar, deter, adquirir, fornecer, receber, ter em depósito, transportar, ceder, ainda que gratuitamente, emprestar, remeter, empregar, manter sob guarda ou ocultar arma de fogo, acessório ou munição, de uso permitido", severity: "Grave" }
];

export default function Crimes() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prisonerIdParam = searchParams.get('prisoner_id');
  
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [prisoners, setPrisoners] = useState<Prisoner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCrime, setSelectedCrime] = useState<Crime | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedCommonCrime, setSelectedCommonCrime] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    prisoner_id: '',
    article: '',
    description: '',
    crime_date: new Date().toISOString().split('T')[0],
    sentence_years: 0,
    sentence_months: 0,
    type: '',
    severity: 'Médio',
    is_recidivist: false
  });

  const handleCommonCrimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedCommonCrime(val);
    if (val) {
      const crime = COMMON_CRIMES.find(c => c.type === val);
      if (crime) {
        setFormData(prev => ({
          ...prev,
          type: crime.type,
          article: crime.article,
          description: crime.description,
          severity: crime.severity
        }));
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const crimesUrl = prisonerIdParam ? `/api/crimes?prisoner_id=${prisonerIdParam}` : '/api/crimes';
      
      const [cRes, pRes] = await Promise.all([
        apiFetch(crimesUrl, { headers: { 'Authorization': `Bearer ${token}` } }),
        apiFetch('/api/prisoners?limit=1000', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (cRes.ok && pRes.ok) {
        setCrimes(await cRes.json());
        const pData = await pRes.json();
        const prisonersList = pData.data;
        setPrisoners(prisonersList);
        
        if (prisonerIdParam) {
          const prisoner = prisonersList.find((p: Prisoner) => p.id.toString() === prisonerIdParam);
          if (prisoner) {
            setFormData(prev => ({ 
              ...prev, 
              prisoner_id: prisonerIdParam,
              is_recidivist: !!prisoner.is_recidivist 
            }));
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [prisonerIdParam]);

  const handlePrisonerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    const prisoner = prisoners.find(p => p.id.toString() === pId);
    setFormData(prev => ({ 
      ...prev, 
      prisoner_id: pId,
      is_recidivist: prisoner ? !!prisoner.is_recidivist : false
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Update prisoner recidivist status if changed
      const selectedPrisoner = prisoners.find(p => p.id.toString() === formData.prisoner_id);
      if (selectedPrisoner && !!selectedPrisoner.is_recidivist !== formData.is_recidivist) {
        await apiFetch(`/api/prisoners/${formData.prisoner_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ is_recidivist: formData.is_recidivist ? 1 : 0 })
        });
      }

      const response = await apiFetch('/api/crimes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setSelectedCommonCrime('');
        setFormData({
          prisoner_id: '',
          article: '',
          description: '',
          crime_date: new Date().toISOString().split('T')[0],
          sentence_years: 0,
          sentence_months: 0,
          type: '',
          severity: 'Médio',
          is_recidivist: false
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir este registro de crime?')) return;
    try {
      const response = await apiFetch(`/api/crimes/${id}`, {
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

  const filteredCrimes = crimes.filter(c => {
    const matchesSearch = c.prisoner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.article.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = !filterSeverity || c.severity === filterSeverity;
    const matchesType = !filterType || c.type === filterType;
    return matchesSearch && matchesSeverity && matchesType;
  });

  const stats = {
    total: crimes.length,
    grave: crimes.filter(c => c.severity === 'Grave').length,
    medio: crimes.filter(c => c.severity === 'Médio').length,
    leve: crimes.filter(c => c.severity === 'Leve').length
  };

  const totalPages = Math.ceil(filteredCrimes.length / itemsPerPage);
  const paginatedCrimes = filteredCrimes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openViewModal = (crime: Crime) => {
    setSelectedCrime(crime);
    setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {prisonerIdParam && (
              <button 
                onClick={() => navigate('/prisoners')}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                title="Voltar para Detentos"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-7 h-7 text-blue-600" />
              Registro de Crimes
            </h1>
          </div>
          <p className="text-slate-500">
            {prisonerIdParam 
              ? `Exibindo histórico criminal do detento #${prisonerIdParam}`
              : "Consulte e gerencie o histórico criminal dos detentos registrados."}
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
        >
          <Gavel className="w-5 h-5" />
          Registrar Novo Crime
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none mb-1">{stats.total}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total de Crimes</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-red-600 leading-none mb-1">{stats.grave}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Graves</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600 leading-none mb-1">{stats.medio}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Médios</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600 leading-none mb-1">{stats.leve}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leves</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px] flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por detento, matrícula ou artigo..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={filterSeverity}
                  onChange={(e) => {
                    setFilterSeverity(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium appearance-none"
                >
                  <option value="">Todos os Graus</option>
                  <option value="Leve">Leve</option>
                  <option value="Médio">Médio</option>
                  <option value="Grave">Grave</option>
                </select>
              </div>
              <div className="relative">
                <Gavel className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium appearance-none"
                >
                  <option value="">Todos os Tipos</option>
                  {Array.from(new Set(crimes.map(c => c.type))).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              {searchTerm || filterSeverity || filterType || prisonerIdParam ? (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterSeverity('');
                    setFilterType('');
                    navigate('/crimes');
                  }}
                  className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm"
                >
                  Limpar
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto hidden md:block flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-black">
                <th className="px-6 py-4">Detento</th>
                <th className="px-6 py-4">Tipo / Artigo</th>
                <th className="px-6 py-4">Grau</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Pena</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600 mb-4" />
                    <span className="text-slate-400 font-medium">Carregando registros criminais...</span>
                  </td>
                </tr>
              ) : paginatedCrimes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="max-w-xs mx-auto">
                      <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8" />
                      </div>
                      <h3 className="text-slate-900 font-bold mb-1">Nenhum crime registrado ainda</h3>
                      <p className="text-slate-500 text-sm mb-6">Registre o primeiro crime associado a um detento para começar a acompanhar o histórico criminal.</p>
                      <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all inline-flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Registrar Crime
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCrimes.map((crime) => (
                  <tr 
                    key={crime.id} 
                    onClick={() => openViewModal(crime)}
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                          {crime.prisoner_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{crime.prisoner_name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Matrícula: #{crime.prisoner_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[10px] font-bold text-blue-600 uppercase mb-0.5">{crime.type}</div>
                      <div className="font-bold text-slate-700">{crime.article}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 w-fit",
                        crime.severity === 'Grave' ? "bg-red-100 text-red-700" :
                        crime.severity === 'Médio' ? "bg-amber-100 text-amber-700" :
                        "bg-emerald-100 text-emerald-700"
                      )}>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          crime.severity === 'Grave' ? "bg-red-500" :
                          crime.severity === 'Médio' ? "bg-amber-500" :
                          "bg-emerald-500"
                        )} />
                        {crime.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(crime.crime_date).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Scale className="w-4 h-4 text-slate-400" />
                        {crime.sentence_years}a {crime.sentence_months}m
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openViewModal(crime);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Ver Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            // Edit logic could go here
                          }}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(crime.id);
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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
        <div className="md:hidden divide-y divide-slate-100 flex-1">
          {loading ? (
            <div className="px-6 py-20 text-center">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600 mb-4" />
              <span className="text-slate-400 font-medium">Carregando registros...</span>
            </div>
          ) : paginatedCrimes.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Nenhum crime encontrado.</p>
            </div>
          ) : (
            paginatedCrimes.map((crime) => (
              <div 
                key={crime.id} 
                onClick={() => openViewModal(crime)}
                className="p-4 space-y-3 active:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                      {crime.prisoner_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{crime.prisoner_name}</div>
                      <div className="text-[10px] font-bold uppercase text-blue-600">{crime.type}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openViewModal(crime);
                      }}
                      className="p-2 text-blue-600 bg-blue-50 rounded-lg"
                      title="Ver Detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(crime.id);
                      }}
                      className="p-2 text-red-600 bg-red-50 rounded-lg"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Artigo</div>
                    <div className="font-bold text-slate-700">{crime.article}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Gravidade</div>
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase",
                      crime.severity === 'Grave' ? "bg-red-100 text-red-700" :
                      crime.severity === 'Médio' ? "bg-amber-100 text-amber-700" :
                      "bg-emerald-100 text-emerald-700"
                    )}>
                      <div className={cn(
                        "w-1 h-1 rounded-full",
                        crime.severity === 'Grave' ? "bg-red-500" :
                        crime.severity === 'Médio' ? "bg-amber-500" :
                        "bg-emerald-500"
                      )} />
                      {crime.severity}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="text-xs text-slate-500 font-medium">
              Mostrando <span className="font-bold text-slate-900">{paginatedCrimes.length}</span> de <span className="font-bold text-slate-900">{filteredCrimes.length}</span> crimes
            </div>
            <div className="flex items-center gap-1">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-50 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                    currentPage === page 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                      : "text-slate-500 hover:bg-white border border-transparent hover:border-slate-200"
                  )}
                >
                  {page}
                </button>
              ))}
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-50 disabled:hover:bg-transparent transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Visualização */}
      <AnimatePresence>
        {isViewModalOpen && selectedCrime && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsViewModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                    <Gavel className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase">Detalhes do Crime</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registro #{selectedCrime.id}</p>
                  </div>
                </div>
                <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg shadow-sm">
                    {selectedCrime.prisoner_name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-lg leading-tight">{selectedCrime.prisoner_name}</div>
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Matrícula: #{selectedCrime.prisoner_id}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Artigo / Tipo</div>
                    <div className="font-bold text-slate-900">{selectedCrime.article}</div>
                    <div className="text-xs font-bold text-blue-600 uppercase">{selectedCrime.type}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gravidade</div>
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase",
                      selectedCrime.severity === 'Grave' ? "bg-red-100 text-red-700" :
                      selectedCrime.severity === 'Médio' ? "bg-amber-100 text-amber-700" :
                      "bg-emerald-100 text-emerald-700"
                    )}>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        selectedCrime.severity === 'Grave' ? "bg-red-500" :
                        selectedCrime.severity === 'Médio' ? "bg-amber-500" :
                        "bg-emerald-500"
                      )} />
                      {selectedCrime.severity}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data da Ocorrência</div>
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(selectedCrime.crime_date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pena Aplicada</div>
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                      <Scale className="w-4 h-4 text-slate-400" />
                      {selectedCrime.sentence_years}a {selectedCrime.sentence_months}m
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição / Observações</div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed italic">
                    {selectedCrime.description || "Nenhuma descrição detalhada fornecida para este registro."}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                  >
                    Fechar Detalhes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Registro de Crime */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsModalOpen(false);
                setSelectedCommonCrime('');
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-xl font-bold text-slate-900">Registrar Novo Crime</h3>
                <button onClick={() => {
                  setIsModalOpen(false);
                  setSelectedCommonCrime('');
                }} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Detento *</label>
                  <select 
                    required
                    value={formData.prisoner_id}
                    onChange={handlePrisonerChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Selecione um detento</option>
                    {prisoners.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.registration_number})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Sugestões de Crimes Comuns</label>
                  <select 
                    value={selectedCommonCrime}
                    onChange={handleCommonCrimeChange}
                    className="w-full px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-blue-700 font-medium"
                  >
                    <option value="">Selecione para preencher automaticamente</option>
                    {COMMON_CRIMES.map(c => (
                      <option key={c.type} value={c.type}>{c.type} ({c.article})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Tipo do Crime *</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Ex: Roubo, Homicídio, Tráfico"
                    value={formData.type}
                    onChange={e => {
                      setFormData({...formData, type: e.target.value});
                      setSelectedCommonCrime('');
                    }}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Artigo Penal *</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: Art. 157"
                      value={formData.article}
                      onChange={e => setFormData({...formData, article: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Grau / Gravidade *</label>
                    <select 
                      required
                      value={formData.severity}
                      onChange={e => setFormData({...formData, severity: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Leve">Leve</option>
                      <option value="Médio">Médio</option>
                      <option value="Grave">Grave</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Data do Crime *</label>
                  <input 
                    required
                    type="date" 
                    value={formData.crime_date}
                    onChange={e => setFormData({...formData, crime_date: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Descrição do Crime</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                    placeholder="Detalhes da ocorrência criminal..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Anos de Pena</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.sentence_years}
                      onChange={e => setFormData({...formData, sentence_years: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Meses de Pena</label>
                    <input 
                      type="number" 
                      min="0"
                      max="11"
                      value={formData.sentence_months}
                      onChange={e => setFormData({...formData, sentence_months: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <input 
                    type="checkbox" 
                    id="recidivist"
                    checked={formData.is_recidivist}
                    onChange={e => setFormData({...formData, is_recidivist: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="recidivist" className="text-sm font-bold text-slate-700 cursor-pointer">
                    O detento é reincidente?
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedCommonCrime('');
                    }}
                    className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                  >
                    Salvar Registro
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
