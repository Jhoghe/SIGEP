import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Trash2, 
  X, 
  Loader2, 
  Shield,
  User,
  Lock,
  Search,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';

interface Inspector {
  id: number;
  username: string;
  name: string;
  role: string;
}

export default function Inspectors() {
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'inspector'
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    fetchInspectors();
  }, []);

  const fetchInspectors = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/inspectors', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setInspectors(await response.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiFetch('/api/inspectors', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setFormData({ username: '', password: '', name: '', role: 'inspector' });
        fetchInspectors();
      } else {
        const data = await response.json();
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      const response = await apiFetch(`/api/inspectors/${userToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        fetchInspectors();
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      } else {
        const data = await response.json();
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = (id: number) => {
    setUserToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const filteredInspectors = inspectors.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Acesso Restrito</h2>
        <p className="text-slate-500 max-w-md mt-2">
          Apenas administradores gerais podem gerenciar as contas de usuários do sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão de Usuários</h1>
          <p className="text-slate-500">Controle de acesso para inspetores e administradores.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
        >
          <UserPlus className="w-5 h-5" />
          Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Nível de Acesso</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400 mb-2" />
                    <span className="text-slate-400">Carregando usuários...</span>
                  </td>
                </tr>
              ) : filteredInspectors.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Nenhum usuário encontrado.</td></tr>
              ) : (
                filteredInspectors.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white",
                          i.role === 'admin' ? "bg-red-600" : "bg-blue-600"
                        )}>
                          {i.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">{i.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      @{i.username}
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit",
                        i.role === 'admin' ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                      )}>
                        {i.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                        {i.role === 'admin' ? 'Administrador Geral' : 'Inspetor'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {i.id !== currentUser?.id ? (
                        <button 
                          onClick={() => confirmDelete(i.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir Usuário"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 bg-slate-100 rounded-lg">
                          Você
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Usuário */}
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
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">Novo Usuário</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: João Silva"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nome de Usuário (Login)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">@</span>
                    <input 
                      required
                      type="text" 
                      placeholder="joao.silva"
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      required
                      type="password" 
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nível de Acesso</label>
                  <select 
                    required
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-sm"
                  >
                    <option value="inspector">Inspetor (Padrão)</option>
                    <option value="admin">Administrador Geral</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 text-slate-600 text-sm font-bold hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                  >
                    Criar Usuário
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Confirmação de Exclusão */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Excluir Usuário?</h3>
              <p className="text-slate-500 text-sm mb-6">
                Esta ação não pode ser desfeita. O usuário perderá acesso imediato ao sistema.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
