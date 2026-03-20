import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Key, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { apiFetch } from '../lib/api';

export default function Profile() {
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || '{}'));
  const [formData, setFormData] = useState({
    name: user.name || '',
    username: user.username || '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await apiFetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setFormData(prev => ({
          ...prev,
          name: data.name,
          username: data.username
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          password: formData.password || undefined
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      } else {
        setMessage({ type: 'error', text: data.message || 'Erro ao atualizar perfil.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro de conexão com o servidor.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meu Perfil</h1>
          <p className="text-slate-500 text-sm">Gerencie suas informações pessoais e segurança da conta.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
            <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white text-3xl shadow-lg shadow-blue-600/20 mx-auto mb-4">
              {user.name?.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-slate-500 text-sm capitalize mb-4">
              {user.role === 'admin' ? 'Administrador Geral' : 'Inspetor'}
            </p>
            <div className="flex items-center justify-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider mx-auto w-fit">
              <Shield className="w-3 h-3" />
              {user.role}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Informações da Conta</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl flex items-center gap-3 ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                  }`}
                >
                  {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <span className="text-sm font-medium">{message.text}</span>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <User className="w-4 h-4" /> Nome Completo
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border-slate-200 rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Nome de Usuário
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-slate-50 border-slate-200 rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Key className="w-4 h-4" /> Alterar Senha
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Nova Senha</label>
                    <input
                      type="password"
                      placeholder="Deixe em branco para manter"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-slate-50 border-slate-200 rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      placeholder="Confirme a nova senha"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full bg-slate-50 border-slate-200 rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
