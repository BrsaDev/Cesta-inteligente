import { useState } from 'react';
import { Upload, FileText, CheckCircle2, BarChart3, Package, Settings, LogOut, Store } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { formatCurrency } from '@/src/lib/utils';
import { motion } from 'motion/react';

export const MarketPanel = () => {
  const [market] = useState({
    name: 'Mercado X',
    products: 1240,
    views: 120,
    lists: 34,
  });

  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 2000);
  };

  return (
    <div className="pb-24 pt-6 px-4 space-y-8 max-w-lg mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{market.name}</h1>
          <p className="text-sm text-slate-500">Painel do Lojista</p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white">
          <Store size={24} />
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-blue-50 border-none">
          <BarChart3 size={20} className="text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{market.views}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Visualizações</p>
        </Card>
        <Card className="p-4 bg-green-50 border-none">
          <CheckCircle2 size={20} className="text-green-500 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{market.lists}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Listas geradas</p>
        </Card>
      </section>

      {/* Upload CSV */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Atualizar Preços</h2>
        <Card 
          className={`border-dashed border-2 flex flex-col items-center justify-center py-12 transition-all ${success ? 'border-primary bg-green-50' : 'border-slate-200'}`}
          onClick={handleUpload}
          hoverable
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
              <p className="text-sm font-bold text-slate-700">Processando planilha...</p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center">
              <CheckCircle2 size={48} className="text-primary mb-4" />
              <p className="text-sm font-bold text-primary">Preços atualizados com sucesso!</p>
            </div>
          ) : (
            <>
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                <Upload size={32} />
              </div>
              <p className="text-sm font-bold text-slate-700">Enviar planilha (CSV)</p>
              <p className="text-xs text-slate-400 mt-1">Formato: produto, marca, preco</p>
            </>
          )}
        </Card>
      </section>

      {/* Product List */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Produtos ({market.products})</h2>
          <Button variant="ghost" size="sm" className="text-primary">Ver todos</Button>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Arroz 5kg', brand: 'Tio João', price: 22.90 },
            { name: 'Leite Integral 1L', brand: 'Parmalat', price: 4.99 },
          ].map((p, i) => (
            <Card key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <Package size={20} className="text-slate-400" />
                <div>
                  <p className="font-bold text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.brand}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{formatCurrency(p.price)}</p>
                <button className="text-[10px] text-slate-400 font-bold uppercase hover:text-primary">Editar</button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-2 pt-4">
        <Button variant="outline" className="w-full justify-start px-4">
          <Settings size={18} className="mr-3" />
          Configurações da Loja
        </Button>
        <Button variant="ghost" className="w-full justify-start px-4 text-red-500 hover:bg-red-50">
          <LogOut size={18} className="mr-3" />
          Sair do Painel
        </Button>
      </section>
    </div>
  );
};
