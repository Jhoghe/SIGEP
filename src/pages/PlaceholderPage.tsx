import React from 'react';
export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="text-slate-500 mt-2">Esta funcionalidade está em desenvolvimento.</p>
    </div>
  );
}
