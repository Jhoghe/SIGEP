import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft,
  ChevronRight,
  LayoutDashboard, 
  Users, 
  Box, 
  LogOut, 
  Shield, 
  Menu,
  X,
  Bell,
  ArrowLeftRight,
  UserCheck,
  Briefcase,
  BarChart3,
  Gavel,
  Sun,
  Moon,
  Search,
  AlertCircle,
  Settings,
  User as UserIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';

interface LayoutProps {
  onLogout: () => void;
}

export default function Layout({ onLogout }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [alerts, setAlerts] = React.useState<any[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchAlerts = async () => {
    try {
      const res = await apiFetch('/api/alerts', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setAlerts(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const markAlertsRead = async () => {
    try {
      await apiFetch('/api/alerts/read', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Cadastro de Detentos', path: '/prisoners' },
    { icon: Box, label: 'Cadastro de Celas', path: '/cells' },
    { icon: Gavel, label: 'Registro de Crimes', path: '/crimes' },
    { icon: ArrowLeftRight, label: 'Transferências', path: '/transfers' },
    { icon: UserCheck, label: 'Visitas', path: '/visits' },
    { icon: Briefcase, label: 'Advogados', path: '/lawyers' },
    { icon: BarChart3, label: 'Relatórios', path: '/reports' },
  ];

  if (user.role === 'admin') {
    navItems.push({ icon: Shield, label: 'Gestão de Usuários', path: '/inspectors' });
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/prisoners?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex transition-colors duration-200">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-[70] bg-white border-r border-slate-200 transition-all duration-300 ease-in-out lg:static lg:translate-x-0",
          isSidebarOpen ? "w-64 translate-x-0" : "w-20 -translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-600/20 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-bold text-xl tracking-tight text-slate-900 whitespace-nowrap"
                >
                  SIGEP
                </motion.span>
              )}
            </div>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-all duration-200"
              title={isSidebarOpen ? "Recolher menu" : "Expandir menu"}
            >
              <div className="hidden lg:block">
                {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </div>
              <div className="lg:hidden">
                <X className="w-6 h-6" />
              </div>
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "text-slate-500 hover:bg-slate-100 hover:text-blue-600",
                  !isSidebarOpen && "justify-center px-0"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", !isSidebarOpen && "w-6 h-6")} />
                {isSidebarOpen ? (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                ) : (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <button
              onClick={onLogout}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group relative",
                !isSidebarOpen && "justify-center px-0"
              )}
            >
              <LogOut className={cn("w-5 h-5 shrink-0", !isSidebarOpen && "w-6 h-6")} />
              {isSidebarOpen ? (
                <span className="font-medium">Sair</span>
              ) : (
                <div className="absolute left-full ml-4 px-2 py-1 bg-red-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  Sair
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40 transition-colors duration-200">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg lg:hidden"
            >
              <Menu className="w-6 h-6 text-slate-600" />
            </button>

            <form onSubmit={handleSearch} className="hidden md:flex items-center relative max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3" />
              <input 
                type="text"
                placeholder="Buscar detento por nome ou matrícula..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </form>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => {
                  setIsAlertsOpen(!isAlertsOpen);
                  if (!isAlertsOpen) markAlertsRead();
                }}
                className="p-2 hover:bg-slate-100 rounded-full relative transition-colors"
              >
                <Bell className="w-5 h-5 text-slate-600" />
                {alerts.some(a => !a.is_read) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              <AnimatePresence>
                {isAlertsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsAlertsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-20 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">Notificações</h3>
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase">
                          Sistema
                        </span>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {alerts.length > 0 ? (
                          alerts.map((alert) => (
                            <div 
                              key={alert.id} 
                              className={cn(
                                "p-4 border-b border-slate-100 last:border-0 transition-colors",
                                !alert.is_read ? "bg-blue-50/50" : "hover:bg-slate-50"
                              )}
                            >
                              <div className="flex gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                  alert.type === 'capacity' ? "bg-amber-100 text-amber-600" : 
                                  alert.type === 'incident' ? "bg-red-100 text-red-600" : 
                                  "bg-blue-100 text-blue-600"
                                )}>
                                  {alert.type === 'capacity' ? <Box className="w-4 h-4" /> : 
                                   alert.type === 'incident' ? <AlertCircle className="w-4 h-4" /> : 
                                   <Bell className="w-4 h-4" />}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900 leading-tight mb-1">{alert.title}</p>
                                  <p className="text-xs text-slate-500 leading-normal">{alert.message}</p>
                                  <p className="text-[10px] text-slate-400 mt-2">{new Date(alert.created_at).toLocaleString('pt-BR')}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">Nenhuma notificação.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 p-1.5 hover:bg-slate-100 rounded-xl transition-all group"
              >
                <div className="hidden lg:block text-right">
                  <p className="text-slate-900 font-bold text-sm leading-tight">{user.name}</p>
                  <p className="text-slate-500 text-xs capitalize">{user.role === 'admin' ? 'Administrador Geral' : 'Inspetor'}</p>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
                  {user.name?.charAt(0)}
                </div>
                <ChevronLeft className={cn("w-4 h-4 text-slate-400 transition-transform hidden lg:block", isUserMenuOpen ? "rotate-90" : "-rotate-90")} />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 z-20 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Conta</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                      </div>
                      <div className="p-2">
                        <button 
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            navigate('/profile');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors"
                        >
                          <UserIcon className="w-4 h-4" />
                          Meu Perfil
                        </button>
                        <button 
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            navigate('/settings');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Configurações
                        </button>
                      </div>
                      <div className="p-2 border-t border-slate-100">
                        <button 
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sair do Sistema
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
