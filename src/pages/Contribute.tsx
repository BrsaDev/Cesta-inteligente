import React, { useState } from 'react';
import { Camera, Upload, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { useNavigate } from 'react-router-dom';

export const Contribute = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [hasImage, setHasImage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/');
    }, 1500);
  };

  return (
    <div className="pb-24 pt-6 px-4 space-y-6 max-w-lg mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Informar preço</h1>
        <p className="text-sm text-slate-500 mt-1">Ajude a comunidade e ganhe pontos de reputação.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4">
          <Input label="Produto" placeholder="Ex: Arroz 5kg" required />
          <Input label="Preço (R$)" type="number" step="0.01" placeholder="0,00" required />
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Mercado</label>
            <select className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all appearance-none">
              <option value="">Selecionar mercado</option>
              <option value="1">Mercado X</option>
              <option value="2">Mercado Y</option>
              <option value="3">Mercado Z</option>
            </select>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">Adicionar prova (Opcional)</h2>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">+50 pts</span>
          </div>
          
          <Card 
            className={`border-dashed border-2 flex flex-col items-center justify-center py-10 transition-all ${hasImage ? 'border-primary bg-green-50' : 'border-slate-200'}`}
            onClick={() => setHasImage(!hasImage)}
            hoverable
          >
            {hasImage ? (
              <>
                <CheckCircle2 size={40} className="text-primary mb-2" />
                <p className="text-sm font-bold text-primary">Imagem capturada!</p>
                <button type="button" className="text-xs text-slate-400 mt-2 underline">Remover</button>
              </>
            ) : (
              <>
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                  <Camera size={32} />
                </div>
                <p className="text-sm font-bold text-slate-700">Tirar foto do preço</p>
                <p className="text-xs text-slate-400 mt-1">Garanta que o valor esteja legível</p>
              </>
            )}
          </Card>

          <div className="bg-blue-50 p-4 rounded-2xl flex items-start space-x-3">
            <Info size={18} className="text-blue-500 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Preços com prova fotográfica têm prioridade no sistema e ajudam a evitar conflitos.
            </p>
          </div>
        </section>

        <Button type="submit" className="w-full h-14" isLoading={isLoading}>
          Enviar preço
        </Button>
      </form>
    </div>
  );
};
