import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Plus, 
  Trash2, 
  X, 
  Loader2, 
  Building2,
  Users,
  AlertCircle,
  LayoutGrid,
  Search,
  Filter,
  Eye,
  ArrowRightLeft,
  Edit2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Stethoscope,
  Lock,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';

interface Pavilion {
  id: number;
  name: string;
  description: string;
  cell_count: number;
  prisoner_count: number;
}

interface Cell {
  id: number;
  number: string;
  capacity: number;
  pavilion_id: number;
  pavilion_name: string;
  block: string;
  type: string;
  status: string;
  current_occupancy: number;
  prisoners_info?: string;
}

export default function Cells() {
  const [pavilions, setPavilions] = useState<Pavilion[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCellModalOpen, setIsCellModalOpen] = useState(false);
  const [isPavilionModalOpen, setIsPavilionModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [editingCell, setEditingCell] = useState<Cell | null>(null);
  const [editingPavilion, setEditingPavilion] = useState<Pavilion | null>(null);
  const [activeTab, setActiveTab] = useState<'cells' | 'pavilions'>('cells');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPavilion, setFilterPavilion] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [cellFormData, setCellFormData] = useState({
    number: '',
    capacity: 4,
    pavilion_id: '',
    block: '',
    type: 'Normal',
    status: 'Disponível'
  });

  const [pavilionFormData, setPavilionFormData] = useState({
    name: '',
    description: ''
  });

  const [transferData, setTransferData] = useState({
    prisoner_id: 0,
    prisoner_name: '',
    origin: '',
    destination_cell_id: '',
    reason: 'Transferência interna entre celas',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [pRes, cRes] = await Promise.all([
        apiFetch('/api/pavilions', { headers: { 'Authorization': `Bearer ${token}` } }),
        apiFetch('/api/cells', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (pRes.ok && cRes.ok) {
        setPavilions(await pRes.json());
        setCells(await cRes.json());
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

  const handleCellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingCell ? 'PUT' : 'POST';
      const url = editingCell ? `/api/cells/${editingCell.id}` : '/api/cells';
      
      const response = await apiFetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(cellFormData),
      });

      if (response.ok) {
        setIsCellModalOpen(false);
        setEditingCell(null);
        setCellFormData({ 
          number: '', 
          capacity: 4, 
          pavilion_id: '', 
          block: '', 
          type: 'Normal',
          status: 'Disponível'
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

  const handlePavilionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingPavilion ? 'PUT' : 'POST';
      const url = editingPavilion ? `/api/pavilions/${editingPavilion.id}` : '/api/pavilions';
      
      const response = await apiFetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(pavilionFormData),
      });

      if (response.ok) {
        setIsPavilionModalOpen(false);
        setEditingPavilion(null);
        setPavilionFormData({ name: '', description: '' });
        fetchData();
      } else {
        const data = await response.json();
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const destCell = cells.find(c => c.id === parseInt(transferData.destination_cell_id));
      
      const res = await apiFetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prisoner_id: transferData.prisoner_id,
          origin: transferData.origin,
          destination: `Cela ${destCell?.number}`,
          date: transferData.date,
          reason: transferData.reason,
          new_cell_id: parseInt(transferData.destination_cell_id),
          new_status: 'Ativo',
          is_external: false
        })
      });

      if (res.ok) {
        setIsTransferModalOpen(false);
        setIsDetailsModalOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCell = async (id: number) => {
    if (!confirm('Deseja excluir esta cela?')) return;
    try {
      const response = await apiFetch(`/api/cells/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        fetchData();
      } else {
        const data = await response.json();
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePavilion = async (id: number) => {
    if (!confirm('Deseja excluir este pavilhão?')) return;
    try {
      const response = await apiFetch(`/api/pavilions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        fetchData();
      } else {
        const data = await response.json();
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditCell = (cell: Cell) => {
    setEditingCell(cell);
    setCellFormData({
      number: cell.number,
      capacity: cell.capacity,
      pavilion_id: cell.pavilion_id.toString(),
      block: cell.block,
      type: cell.type,
      status: cell.status || 'Disponível'
    });
    setIsCellModalOpen(true);
  };

  const openNewCell = () => {
    setEditingCell(null);
    setCellFormData({ 
      number: '', 
      capacity: 4, 
      pavilion_id: '', 
      block: '', 
      type: 'Normal',
      status: 'Disponível'
    });
    setIsCellModalOpen(true);
  };

  const openNewPavilion = () => {
    setEditingPavilion(null);
    setPavilionFormData({ name: '', description: '' });
    setIsPavilionModalOpen(true);
  };

  const openEditPavilion = (pavilion: Pavilion) => {
    setEditingPavilion(pavilion);
    setPavilionFormData({
      name: pavilion.name,
      description: pavilion.description
    });
    setIsPavilionModalOpen(true);
  };

  const openCellDetails = (cell: Cell) => {
    setSelectedCell(cell);
    setIsDetailsModalOpen(true);
  };

  const filteredCells = cells.filter(cell => {
    const matchesSearch = cell.number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPavilion = !filterPavilion || cell.pavilion_id.toString() === filterPavilion;
    const matchesType = !filterType || cell.type === filterType;
    const matchesStatus = !filterStatus || cell.status === filterStatus;
    return matchesSearch && matchesPavilion && matchesType && matchesStatus;
  });

  const stats = {
    total: cells.length,
    available: cells.filter(c => c.current_occupancy < c.capacity && c.status === 'Disponível').length,
    full: cells.filter(c => c.current_occupancy >= c.capacity).length,
    totalPrisoners: cells.reduce((acc, c) => acc + c.current_occupancy, 0)
  };

  const getOccupancyColor = (current: number, capacity: number) => {
    const ratio = current / capacity;
    if (ratio >= 0.8) return 'bg-red-500';
    if (ratio >= 0.5) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getOccupancyTextColor = (current: number, capacity: number) => {
    const ratio = current / capacity;
    if (ratio >= 0.8) return 'text-red-600';
    if (ratio >= 0.5) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getOccupancyLabel = (current: number, capacity: number) => {
    const ratio = current / capacity;
    if (ratio >= 0.8) return 'Lotada';
    if (ratio >= 0.5) return 'Atenção';
    return 'Normal';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão de Celas e Pavilhões</h1>
          <p className="text-slate-500">Controle de infraestrutura e ocupação da unidade.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={openNewPavilion}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all"
          >
            <Building2 className="w-5 h-5 text-slate-400" />
            🏢 Novo Pavilhão
          </button>
          <button 
            onClick={openNewCell}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus className="w-5 h-5" />
            ➕ Nova Cela
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-slate-500 text-xs font-bold uppercase mb-1">Total de Celas</div>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-emerald-500 text-xs font-bold uppercase mb-1">Celas Disponíveis</div>
          <div className="text-2xl font-black text-emerald-600">{stats.available}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-red-500 text-xs font-bold uppercase mb-1">Celas Lotadas</div>
          <div className="text-2xl font-black text-red-600">{stats.full}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-blue-500 text-xs font-bold uppercase mb-1">Total de Detentos</div>
          <div className="text-2xl font-black text-blue-600">{stats.totalPrisoners}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar cela pelo número..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select 
              value={filterPavilion}
              onChange={e => setFilterPavilion(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
            >
              <option value="">Todos Pavilhões</option>
              {pavilions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select 
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
            >
              <option value="">Todos Tipos</option>
              <option value="Normal">Normal</option>
              <option value="Isolamento">Isolamento</option>
              <option value="Solitária">Solitária</option>
              <option value="Provisória">Provisória</option>
              <option value="Segurança Máxima">Segurança Máxima</option>
              <option value="Observação Médica">Observação Médica</option>
            </select>
            <select 
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
            >
              <option value="">Todos Status</option>
              <option value="Disponível">Disponível</option>
              <option value="Em manutenção">Em manutenção</option>
              <option value="Interditada">Interditada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('cells')}
          className={cn(
            "px-6 py-3 font-bold text-sm transition-all border-b-2",
            activeTab === 'cells' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Celas
        </button>
        <button
          onClick={() => setActiveTab('pavilions')}
          className={cn(
            "px-6 py-3 font-bold text-sm transition-all border-b-2",
            activeTab === 'pavilions' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Pavilhões
        </button>
      </div>

      {activeTab === 'cells' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
              <span className="text-slate-400">Carregando celas...</span>
            </div>
          ) : filteredCells.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              Nenhuma cela encontrada com os filtros aplicados.
            </div>
          ) : (
            filteredCells.map((cell) => {
              const occupancyPercent = Math.round((cell.current_occupancy / cell.capacity) * 100);
              const getPrisonersList = (info?: string) => {
                if (!info) return [];
                return info.split('|').map(p => {
                  const [id, name] = p.split(':');
                  return { id: parseInt(id), name };
                });
              };
              const prisoners = getPrisonersList(cell.prisoners_info);
              
              return (
                <motion.div
                  key={cell.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => openCellDetails(cell)}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group relative cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                      <LayoutGrid className="w-8 h-8" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEditCell(cell); }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); openCellDetails(cell); }}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Ver Detentos"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); /* Transfer logic */ }}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                        title="Transferir"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-2xl font-black text-slate-900 leading-none">CELA {cell.number}</h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-bold uppercase">
                        {cell.pavilion_name}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-bold uppercase">
                        Bloco {cell.block}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-6">
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded-lg uppercase flex items-center gap-1",
                      cell.type === 'Isolamento' ? "bg-amber-100 text-amber-700" : 
                      cell.type === 'Solitária' ? "bg-red-100 text-red-700" : 
                      cell.type === 'Segurança Máxima' ? "bg-purple-100 text-purple-700" :
                      cell.type === 'Observação Médica' ? "bg-blue-100 text-blue-700" :
                      "bg-emerald-100 text-emerald-700"
                    )}>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        cell.type === 'Isolamento' ? "bg-amber-500" : 
                        cell.type === 'Solitária' ? "bg-red-500" : 
                        cell.type === 'Segurança Máxima' ? "bg-purple-500" :
                        cell.type === 'Observação Médica' ? "bg-blue-500" :
                        "bg-emerald-500"
                      )} />
                      {cell.type}
                    </span>
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded-lg uppercase flex items-center gap-1",
                      cell.status === 'Interditada' ? "bg-red-100 text-red-700" :
                      cell.status === 'Em manutenção' ? "bg-amber-100 text-amber-700" :
                      cell.current_occupancy >= cell.capacity ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                    )}>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        cell.status === 'Interditada' ? "bg-red-500" :
                        cell.status === 'Em manutenção' ? "bg-amber-500" :
                        cell.current_occupancy >= cell.capacity ? "bg-red-500" : "bg-emerald-500"
                      )} />
                      {cell.status === 'Interditada' ? 'Interditada' : 
                       cell.status === 'Em manutenção' ? 'Manutenção' :
                       cell.current_occupancy >= cell.capacity ? "Lotada" : "Disponível"}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                        <Users className="w-3 h-3" />
                        Detentos ({cell.current_occupancy})
                      </div>
                      {prisoners.length > 0 ? (
                        <ul className="space-y-1">
                          {prisoners.slice(0, 2).map((p, idx) => (
                            <li key={idx} className="text-xs text-slate-700 font-medium flex items-center gap-2">
                              <div className="w-1 h-1 bg-slate-300 rounded-full" />
                              {p.name}
                            </li>
                          ))}
                          {prisoners.length > 2 && (
                            <li className="text-xs text-slate-400 font-bold uppercase pl-3">
                              + {prisoners.length - 2} detentos
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Cela vazia</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-bold uppercase">Ocupação</span>
                        <div className="text-right">
                          <span className={cn("font-black", getOccupancyTextColor(cell.current_occupancy, cell.capacity))}>
                            {occupancyPercent}%
                          </span>
                          <span className="text-slate-400 ml-1">({cell.current_occupancy}/{cell.capacity})</span>
                        </div>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-500",
                            getOccupancyColor(cell.current_occupancy, cell.capacity)
                          )}
                          style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
              <span className="text-slate-400">Carregando pavilhões...</span>
            </div>
          ) : pavilions.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              Nenhum pavilhão cadastrado.
            </div>
          ) : (
            pavilions.map((pav) => (
              <motion.div
                key={pav.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-600 text-white p-3 rounded-xl shadow-lg shadow-blue-600/20">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{pav.name}</h3>
                      <p className="text-sm text-slate-500">{pav.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openEditPavilion(pav)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Plus className="w-4 h-4 rotate-45" />
                    </button>
                    <button 
                      onClick={() => handleDeletePavilion(pav.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-1">
                      <LayoutGrid className="w-3 h-3" />
                      Celas
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{pav.cell_count}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-1">
                      <Users className="w-3 h-3" />
                      Detentos
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{pav.prisoner_count}</div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Modal Nova Cela */}
      <AnimatePresence>
        {isCellModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCellModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingCell ? 'Editar Cela' : 'Cadastrar Nova Cela'}
                </h3>
                <button onClick={() => setIsCellModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleCellSubmit} className="p-5 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Número da Cela</label>
                    {editingCell && editingCell.current_occupancy > 0 && (
                      <span className="text-[9px] font-bold text-amber-600 flex items-center gap-1 uppercase">
                        <Lock className="w-2.5 h-2.5" /> Bloqueado (Ocupada)
                      </span>
                    )}
                  </div>
                  <input 
                    required
                    type="text" 
                    placeholder="Ex: A-101"
                    value={cellFormData.number}
                    onChange={e => setCellFormData({...cellFormData, number: e.target.value})}
                    disabled={!!(editingCell && editingCell.current_occupancy > 0)}
                    className={cn(
                      "w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm",
                      editingCell && editingCell.current_occupancy > 0 && "opacity-60 cursor-not-allowed"
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Pavilhão</label>
                  <select 
                    required
                    value={cellFormData.pavilion_id}
                    onChange={e => setCellFormData({...cellFormData, pavilion_id: e.target.value})}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="">Selecione um pavilhão</option>
                    {pavilions.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Bloco</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: A"
                      value={cellFormData.block}
                      onChange={e => setCellFormData({...cellFormData, block: e.target.value})}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Capacidade</label>
                    <input 
                      required
                      type="number" 
                      min={editingCell ? editingCell.current_occupancy : 1}
                      value={cellFormData.capacity}
                      onChange={e => setCellFormData({...cellFormData, capacity: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                    {editingCell && (
                      <p className="text-[9px] text-slate-400 font-medium">Mínimo: {editingCell.current_occupancy} (ocupação atual)</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Tipo de Cela</label>
                    <select 
                      required
                      value={cellFormData.type}
                      onChange={e => setCellFormData({...cellFormData, type: e.target.value})}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Isolamento">Isolamento</option>
                      <option value="Solitária">Solitária</option>
                      <option value="Provisória">Provisória</option>
                      <option value="Segurança Máxima">Segurança Máxima</option>
                      <option value="Observação Médica">Observação Médica</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Status</label>
                    <select 
                      required
                      value={cellFormData.status}
                      onChange={e => setCellFormData({...cellFormData, status: e.target.value})}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    >
                      <option value="Disponível">Disponível</option>
                      <option value="Em manutenção">Em manutenção</option>
                      <option value="Interditada">Interditada</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsCellModalOpen(false)}
                    className="px-4 py-2 text-slate-600 text-sm font-bold hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                  >
                    Salvar Cela
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Detalhes da Cela */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedCell && (
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
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-600/20">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">CELA {selectedCell.number}</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                      {selectedCell.pavilion_name} • Bloco {selectedCell.block}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="p-5 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Capacidade</div>
                    <div className="text-lg font-black text-slate-900">{selectedCell.capacity}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Ocupação</div>
                    <div className="text-lg font-black text-blue-600">{selectedCell.current_occupancy}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Disponível</div>
                    <div className="text-lg font-black text-emerald-600">{selectedCell.capacity - selectedCell.current_occupancy}</div>
                  </div>
                </div>

                {/* Prisoners List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      Lista de Detentos
                    </h4>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                      {selectedCell.current_occupancy} de {selectedCell.capacity}
                    </span>
                  </div>
                  
                  <div className="grid gap-2">
                    {selectedCell.prisoners_info ? selectedCell.prisoners_info.split('|').map((info, idx) => {
                      const [id, name] = info.split(':');
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs">
                              {name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{name}</p>
                              <p className="text-xs text-slate-400 font-bold uppercase">Matrícula: #{id}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setTransferData({
                                ...transferData,
                                prisoner_id: parseInt(id),
                                prisoner_name: name,
                                origin: `Cela ${selectedCell.number}`
                              });
                              setIsTransferModalOpen(true);
                            }}
                            className="p-1.5 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    }) : (
                      <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-medium">Nenhum detento nesta cela.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Ações Adicionais</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 text-left transition-all group">
                      <Clock className="w-5 h-5 text-slate-400 mb-1 group-hover:text-blue-600 transition-colors" />
                      <p className="font-bold text-slate-900 text-xs">Histórico</p>
                      <p className="text-xs text-slate-500">Ver movimentações</p>
                    </button>
                    <button className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 text-left transition-all group">
                      <ShieldAlert className="w-5 h-5 text-slate-400 mb-1 group-hover:text-red-600 transition-colors" />
                      <p className="font-bold text-slate-900 text-xs">Ocorrências</p>
                      <p className="text-xs text-slate-500">Registrar incidente</p>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all"
                >
                  Fechar Detalhes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Novo Pavilhão */}
      <AnimatePresence>
        {isPavilionModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPavilionModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingPavilion ? 'Editar Pavilhão' : 'Cadastrar Novo Pavilhão'}
                </h3>
                <button onClick={() => setIsPavilionModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handlePavilionSubmit} className="p-5 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Nome do Pavilhão</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Ex: Pavilhão C"
                    value={pavilionFormData.name}
                    onChange={e => setPavilionFormData({...pavilionFormData, name: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Descrição / Finalidade</label>
                  <textarea 
                    value={pavilionFormData.description}
                    onChange={e => setPavilionFormData({...pavilionFormData, description: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] text-sm"
                    placeholder="Descreva o uso deste pavilhão..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsPavilionModalOpen(false)}
                    className="px-4 py-2 text-slate-600 text-sm font-bold hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                  >
                    Salvar Pavilhão
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal Transferência */}
        {isTransferModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTransferModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 text-amber-600 p-1.5 rounded-xl">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase">Transferir Detento</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase">{transferData.prisoner_name}</p>
                  </div>
                </div>
                <button onClick={() => setIsTransferModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleTransfer} className="p-5 space-y-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Origem</label>
                      <div className="p-2 bg-slate-100 rounded-xl font-bold text-slate-600 text-sm">
                        {transferData.origin}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Data</label>
                      <input 
                        type="date"
                        value={transferData.date}
                        onChange={e => setTransferData({...transferData, date: e.target.value})}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Cela de Destino *</label>
                    <select 
                      required
                      value={transferData.destination_cell_id}
                      onChange={e => setTransferData({...transferData, destination_cell_id: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Selecione a cela de destino</option>
                      {cells
                        .filter(c => c.id !== selectedCell?.id && c.current_occupancy < c.capacity && c.status === 'Disponível')
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            Cela {c.number} ({c.current_occupancy}/{c.capacity}) - {c.pavilion_name}
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Motivo da Transferência</label>
                    <textarea 
                      value={transferData.reason}
                      onChange={e => setTransferData({...transferData, reason: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] resize-none"
                      placeholder="Descreva o motivo da transferência interna..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button 
                    type="button"
                    onClick={() => setIsTransferModalOpen(false)}
                    className="px-4 py-2 text-slate-600 text-sm font-bold hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                  >
                    Confirmar Transferência
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
