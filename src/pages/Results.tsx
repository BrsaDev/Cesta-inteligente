import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Trophy, Store, Zap, CheckCircle2 } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { formatCurrency } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

export const Results = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listId = searchParams.get('listId');
  const [listName, setListName] = useState('Resultado da compra');

  useEffect(() => {
    if (listId) {
      fetchListDetails();
    }
  }, [listId]);

  const fetchListDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('name')
        .eq('id', listId)
        .single();
      
      if (error) throw error;
      if (data) setListName(data.name);
    } catch (error) {
      console.error('Error fetching list details:', error);
    }
  };

  const [showDetails, setShowDetails] = useState(false);

  const multiMarket = {
    total: 167.50,
    savings: 32.40,
    markets: [
      { name: 'Mercado A', items: ['Arroz 5kg', 'Feijão Preto', 'Açúcar 1kg', 'Sal Refinado', 'Macarrão Espaguete'], subtotal: 45.20 },
      { name: 'Mercado B', items: ['Leite Integral (12x)', 'Café 500g', 'Óleo de Soja', 'Detergente Líquido'], subtotal: 122.30 },
    ]
  };

  const singleMarket = {
    name: 'Mercado X',
    total: 175.90,
    savings: 24.00,
    score: 98,
    items: [
      { name: 'Arroz 5kg', price: 23.90 },
      { name: 'Feijão Preto', price: 8.50 },
      { name: 'Leite Integral (12x)', price: 59.88 },
      { name: 'Café 500g', price: 16.50 },
      { name: 'Açúcar 1kg', price: 4.20 },
      { name: 'Óleo de Soja', price: 6.90 },
    ]
  };

  const truncateItems = (items: string[]) => {
    const text = items.join(', ');
    return text.length > 40 ? text.substring(0, 40) + '...' : text;
  };

  return (
    <div className="pb-24 pt-6 px-4 space-y-6 max-w-lg mx-auto">
      <header className="flex items-center space-x-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">{listName}</h1>
      </header>

      {/* Multi-Market Option */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <Trophy className="text-yellow-500" size={20} />
          <h2 className="text-lg font-bold text-slate-900">Economia máxima</h2>
        </div>
        
        <Card className="bg-primary text-white border-none p-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/70 text-sm font-medium">Total estimado</p>
                <h3 className="text-4xl font-bold">{formatCurrency(multiMarket.total)}</h3>
              </div>
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 text-center">
                <p className="text-[10px] uppercase font-bold tracking-wider">Economia</p>
                <p className="text-xl font-bold">{formatCurrency(multiMarket.savings)}</p>
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              {multiMarket.markets.map((m, idx) => (
                <div key={idx} className="bg-black/10 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <Store size={16} />
                      <span className="font-bold">{m.name}</span>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(m.subtotal)}</span>
                  </div>
                  <p className="text-xs text-white/70">{truncateItems(m.items)}</p>
                </div>
              ))}
            </div>

            <Button className="w-full mt-6 bg-white text-primary hover:bg-white/90">
              Ver rota otimizada
            </Button>
          </div>
          <div className="absolute -right-8 -top-8 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
        </Card>
      </section>

      {/* Single Market Option */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <Zap className="text-secondary" size={20} />
          <h2 className="text-lg font-bold text-slate-900">Mais prático</h2>
        </div>

        <Card className="p-6" hoverable>
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-xl font-bold text-slate-900">{singleMarket.name}</h3>
                <CheckCircle2 size={16} className="text-primary" />
              </div>
              <p className="text-xs text-slate-500">Melhor mercado único</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(singleMarket.total)}</p>
              <p className="text-xs text-green-600 font-bold">Economia: {formatCurrency(singleMarket.savings)}</p>
            </div>
          </div>
          
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full" style={{ width: `${singleMarket.score}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Disponibilidade</span>
            <span className="text-[10px] text-primary font-bold">{singleMarket.score}% dos itens</span>
          </div>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Itens nesta loja</h4>
                  {singleMarket.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1">
                      <span className="text-sm text-slate-600">{item.name}</span>
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(item.price)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button 
            variant="outline" 
            className="w-full mt-6"
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
          >
            {showDetails ? 'Ocultar detalhes' : 'Ver detalhes'}
          </Button>
        </Card>
      </section>
    </div>
  );
};
