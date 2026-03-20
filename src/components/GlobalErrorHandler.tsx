import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class GlobalErrorHandler extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('GlobalErrorHandler caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">Ops! Algo deu errado</h2>
              <p className="text-slate-500 font-medium">
                Ocorreu um erro inesperado no sistema.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Detalhes do Erro</p>
                <p className="text-xs font-mono text-red-600 break-all">{this.state.error.message}</p>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-5 h-5" />
              Recarregar Sistema
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
