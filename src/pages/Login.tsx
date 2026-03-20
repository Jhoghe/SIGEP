import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface LoginProps {
  onLogin: (token: string, user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const isExpired = new URLSearchParams(window.location.search).get('expired') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.token, data.user);
        navigate('/');
      } else {
        setError(data.message || 'Erro ao realizar login');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
      >
        <div className="bg-blue-700 p-8 text-center">
          <div className="flex justify-center mb-4">
            <Shield size={48} className="text-white drop-shadow-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-white">SIGEP</h1>
          <p className="text-blue-100 text-sm mt-1">Sistema de Gestão Penitenciária</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {isExpired && !error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border-l-4 border-amber-500 p-4 flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <p className="text-sm text-amber-700">Sua sessão expirou. Por favor, faça login novamente.</p>
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">Usuário</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Seu usuário"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Sua senha"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </form>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
            Acesso Restrito a Inspetores
          </p>
        </div>
      </motion.div>
    </div>
  );
}
