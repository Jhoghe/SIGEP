import React from 'react';
import { Settings as SettingsIcon, Bell, Shield, Eye, Globe, Database, Save } from 'lucide-react';

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 text-sm">Gerencie as preferências globais do sistema e segurança.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900">Geral</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Idioma do Sistema</label>
              <select className="w-full bg-slate-50 border-slate-200 rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all">
                <option>Português (Brasil)</option>
                <option>English</option>
                <option>Español</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Fuso Horário</label>
              <select className="w-full bg-slate-50 border-slate-200 rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all">
                <option>Brasília (GMT-3)</option>
                <option>UTC</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900">Notificações</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Alertas de Capacidade</p>
                <p className="text-xs text-slate-500">Notificar quando celas atingirem 90%</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Relatórios Diários</p>
                <p className="text-xs text-slate-500">Enviar resumo por e-mail</p>
              </div>
              <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900">Segurança</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Autenticação em Duas Etapas</p>
                <p className="text-xs text-slate-500">Aumentar segurança da conta</p>
              </div>
              <button className="text-xs font-bold text-blue-600 hover:underline">Configurar</button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Sessões Ativas</p>
                <p className="text-xs text-slate-500">Gerenciar dispositivos conectados</p>
              </div>
              <button className="text-xs font-bold text-blue-600 hover:underline">Ver todas</button>
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900">Banco de Dados</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Backup Automático</p>
                <p className="text-xs text-slate-500">Realizar backup todas as noites</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            </div>
            <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-sm transition-colors">
              Exportar Base de Dados (SQL)
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-8 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2">
          <Save className="w-5 h-5" />
          Salvar Todas as Configurações
        </button>
      </div>
    </div>
  );
}
