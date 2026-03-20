import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, Search, Filter, Clock, ShieldAlert, X, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api';

interface Incident {
  id: number;
  title: string;
  description: string;
  severity: string;
  date: string;
  inspector_name: string;
}

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', severity: 'medium' });

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/incidents', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setIncidents(await response.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiFetch('/api/incidents', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          date: new Date().toISOString()
        }),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setFormData({ title: '', description: '', severity: 'medium' });
        fetchIncidents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir este registro de ocorrência?')) return;
    try {
      const response = await apiFetch(`/api/incidents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        fetchIncidents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registro de Ocorrências</h1>
          <p className="text-slate-500">Log de eventos e incidentes de segurança.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
        >
          <ShieldAlert className="w-5 h-5" />
          Nova Ocorrência
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
            <span className="text-slate-400">Carregando ocorrências...</span>
          </div>
        ) : incidents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            Nenhuma ocorrência registrada.
          </div>
        ) : (
          incidents.map((incident, idx) => (
            <motion.div
              key={incident.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-6"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                incident.severity === 'high' ? 'bg-red-50 text-red-600' : 
                incident.severity === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
              }`}>
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-slate-900 text-lg">{incident.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    incident.severity === 'high' ? 'bg-red-100 text-red-700' : 
                    incident.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    Prioridade {incident.severity === 'high' ? 'Alta' : incident.severity === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">{incident.description}</p>
                <div className="mt-2 text-xs text-slate-400 uppercase font-bold">
                  Registrado por: {incident.inspector_name || 'Sistema'}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <Clock className="w-4 h-4" />
                  {new Date(incident.date).toLocaleString()}
                </div>
                <button 
                  onClick={() => handleDelete(incident.id)}
                  className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Excluir Ocorrência"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal Nova Ocorrência */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-red-50">
                <h3 className="text-lg font-bold text-red-900">Registrar Ocorrência</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-red-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-red-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Título da Ocorrência *</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Ex: Tentativa de Fuga, Briga, etc."
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Gravidade *</label>
                  <select 
                    value={formData.severity}
                    onChange={e => setFormData({...formData, severity: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Descrição Detalhada *</label>
                  <textarea 
                    required
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none min-h-[100px] text-sm"
                    placeholder="Descreva o que aconteceu..."
                  />
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
                    className="px-6 py-2 bg-red-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all"
                  >
                    Registrar
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
