import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Trophy, Store, Zap, CheckCircle2, ChevronDown, ChevronUp, Info, Medal } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { formatCurrency } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/src/lib/supabase';
import { MARKETS, PRICES, PRODUCTS } from '../data/mockData';

export const Results = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listId = searchParams.get('listId');
  const [listName, setListName] = useState('Resultado da compra');
  const [expandedMultiMarket, setExpandedMultiMarket] = useState<string | null>(null);
  const [expandedSingleMarket, setExpandedSingleMarket] = useState<string | null>(null);

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

  // Mock items if no listId is provided (for demo)
  const listItems = useMemo(() => [
    'Arroz Branco 5kg', 'Feijão Carioca 1kg', 'Leite Integral 1L', 'Café Torrado 500g', 'Açúcar Refinado 1kg', 'Óleo de Soja 900ml'
  ], []);

  const multiMarket = useMemo(() => {
    let total = 0;
    const marketGroups: Record<string, { id: string; name: string; items: { name: string; price: number }[]; subtotal: number }> = {};

    listItems.forEach(itemName => {
      // Find best price for this item across all markets
      const itemPrices = PRICES.filter(p => p.marketName === 'Barcelos' || p.marketName === 'Lufelana' || p.marketName === 'Bons Frutos')
        .filter(p => {
          // In a real app we'd match by product ID, here we match by name for the mock
          return true;
        });
      
      // Pick the best market for each item (mock logic)
      const bestPrice = 5 + Math.random() * 20;
      const bestMarket = MARKETS[Math.floor(Math.random() * MARKETS.length)];
      
      total += bestPrice;
      if (!marketGroups[bestMarket.id]) {
        marketGroups[bestMarket.id] = { id: bestMarket.id, name: bestMarket.name, items: [], subtotal: 0 };
      }
      marketGroups[bestMarket.id].items.push({ name: itemName, price: bestPrice });
      marketGroups[bestMarket.id].subtotal += bestPrice;
    });

    return {
      total,
      savings: total * 0.18,
      markets: Object.values(marketGroups)
    };
  }, [listItems]);

  const singleMarketRanking = useMemo(() => {
    return MARKETS.map(market => {
      let total = 0;
      const items = listItems.map(name => {
        const price = 6 + Math.random() * 22;
        total += price;
        return { name, price };
      });

      return {
        id: market.id,
        name: market.name,
        total,
        savings: total * 0.1,
        score: 100,
        items
      };
    }).sort((a, b) => a.total - b.total).slice(0, 3);
  }, [listItems]);

  const truncateItems = (items: { name: string }[]) => {
    const text = items.map(i => i.name).join(', ');
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="text-yellow-500" size={20} />
            <h2 className="text-lg font-bold text-slate-900">Economia máxima</h2>
          </div>
          <div className="flex items-center text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
            <Info size={12} className="mr-1" />
            Multi-mercado
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-2">
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Como funciona:</strong> Compramos cada item onde ele está mais barato. 
            Você economiza mais, mas precisa visitar mais de um mercado.
          </p>
        </div>
        
        <Card className="bg-emerald-500 text-white border-none p-6 relative overflow-hidden">
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
            
            <div className="mt-6 space-y-3">
              {multiMarket.markets.map((m, idx) => (
                <div 
                  key={idx} 
                  className="bg-black/10 rounded-2xl overflow-hidden transition-all cursor-pointer hover:bg-black/20"
                  onClick={() => setExpandedMultiMarket(expandedMultiMarket === m.id ? null : m.id)}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center space-x-2">
                        <Store size={16} />
                        <span className="font-bold">{m.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold">{formatCurrency(m.subtotal)}</span>
                        {expandedMultiMarket === m.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                    {!expandedMultiMarket || expandedMultiMarket !== m.id ? (
                      <p className="text-[11px] text-white/70">{truncateItems(m.items)}</p>
                    ) : null}
                  </div>
                  
                  <AnimatePresence>
                    {expandedMultiMarket === m.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-black/5 border-t border-white/10"
                      >
                        <div className="p-4 pt-2 space-y-2">
                          {m.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                              <span className="text-white/80">{item.name}</span>
                              <span className="font-bold">{formatCurrency(item.price)}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <Button className="w-full mt-6 bg-white text-emerald-600 hover:bg-white/90 font-bold">
              Ver rota otimizada
            </Button>
          </div>
          <div className="absolute -right-8 -top-8 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
        </Card>
      </section>

      {/* Single Market Option */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="text-secondary" size={20} />
            <h2 className="text-lg font-bold text-slate-900">Mais prático</h2>
          </div>
          <div className="flex items-center text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
            <Info size={12} className="mr-1" />
            Mercado único
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-2">
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Como funciona:</strong> Mostramos os melhores mercados para você fazer a compra completa 
            em um só lugar. Mais rápido e conveniente.
          </p>
        </div>

        <div className="space-y-3">
          {singleMarketRanking.map((market, idx) => (
            <Card 
              key={market.id} 
              className={`p-5 transition-all cursor-pointer ${idx === 0 ? 'ring-2 ring-primary ring-offset-2' : ''}`} 
              hoverable
              onClick={() => setExpandedSingleMarket(expandedSingleMarket === market.id ? null : market.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex space-x-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    idx === 0 ? 'bg-primary/10 text-primary' : 
                    idx === 1 ? 'bg-slate-100 text-slate-500' : 
                    'bg-orange-50 text-orange-500'
                  }`}>
                    {idx === 0 ? <Medal size={20} /> : <span className="font-bold">{idx + 1}º</span>}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-slate-900">{market.name}</h3>
                      {idx === 0 && <CheckCircle2 size={14} className="text-primary" />}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {idx === 0 ? 'Melhor preço único' : `${idx + 1}ª melhor opção`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(market.total)}</p>
                  <p className="text-[10px] text-green-600 font-bold">Economia: {formatCurrency(market.savings)}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: `${market.score}%` }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Disponibilidade</span>
                  <span className="text-[9px] text-primary font-bold">{market.score}% dos itens</span>
                </div>
              </div>

              <AnimatePresence>
                {expandedSingleMarket === market.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 pt-5 border-t border-slate-100 space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lista de preços</h4>
                      {market.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center py-0.5">
                          <span className="text-xs text-slate-600">{item.name}</span>
                          <span className="text-xs font-bold text-slate-900">{formatCurrency(item.price)}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-4 flex justify-center">
                <button className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center">
                  {expandedSingleMarket === market.id ? 'Ocultar detalhes' : 'Ver detalhes'}
                  {expandedSingleMarket === market.id ? <ChevronUp size={12} className="ml-1" /> : <ChevronDown size={12} className="ml-1" />}
                </button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};
