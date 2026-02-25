import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Trophy, Store, Zap, CheckCircle2, ChevronDown, ChevronUp, Info, Medal } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { formatCurrency } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/src/lib/supabase';

export const Results = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listId = searchParams.get('listId');
  const [listName, setListName] = useState('Resultado da compra');
  const [expandedMultiMarket, setExpandedMultiMarket] = useState<string | null>(null);
  const [expandedSingleMarket, setExpandedSingleMarket] = useState<string | null>(null);
  const [listItems, setListItems] = useState<any[]>([]);
  const [multiMarket, setMultiMarket] = useState<any>(null);
  const [singleMarketRanking, setSingleMarketRanking] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (listId) {
      fetchListDetails();
    } else {
      // Fallback for demo if no listId
      calculateResults([
        { name: 'Arroz Branco 5kg' },
        { name: 'Feijão Carioca 1kg' },
        { name: 'Leite Integral 1L' }
      ]);
    }
  }, [listId]);

  const fetchListDetails = async () => {
    setIsLoading(true);
    try {
      const { data: listData, error: listError } = await supabase
        .from('shopping_lists')
        .select('name')
        .eq('id', listId)
        .single();
      
      if (listError) throw listError;
      if (listData) setListName(listData.name);

      const { data: itemsData, error: itemsError } = await supabase
        .from('shopping_list_items')
        .select(`
          quantity,
          products (id, name)
        `)
        .eq('list_id', listId);
      
      if (itemsError) throw itemsError;

      if (itemsData) {
        const items = itemsData.map((item: any) => ({
          id: item.products.id,
          name: item.products.name,
          quantity: item.quantity
        }));
        setListItems(items);
        calculateResults(items);
      }
    } catch (error) {
      console.error('Error fetching list details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateResults = async (items: any[]) => {
    try {
      if (!items || items.length === 0) return;

      // 1. Get all product IDs from the items
      const productIds = items.map(i => i.id).filter(Boolean);
      
      if (productIds.length === 0) {
        // If we don't have IDs (fallback case), we need to fetch them by name
        const productNames = items.map(i => i.name);
        const { data: pData } = await supabase
          .from('products')
          .select('id, name')
          .in('name', productNames);
        
        if (pData) {
          items.forEach(item => {
            const found = pData.find(p => p.name === item.name);
            if (found) item.id = found.id;
          });
          productIds.push(...pData.map(p => p.id));
        }
      }

      if (productIds.length === 0) return;

      // 2. Fetch all active prices for these products
      const { data: pricesData, error: pricesError } = await supabase
        .from('prices')
        .select(`
          price,
          product_id,
          market_id,
          markets (id, name)
        `)
        .in('product_id', productIds)
        .eq('is_active', true);
      
      if (pricesError) throw pricesError;

      if (pricesData && pricesData.length > 0) {
        // Multi-market calculation
        let multiTotal = 0;
        let averageTotal = 0;
        const marketGroups: Record<string, any> = {};

        items.forEach(item => {
          const itemPrices = pricesData.filter(p => p.product_id === item.id);
          if (itemPrices.length === 0) return;

          // Best price for multi-market
          const bestPriceObj = itemPrices.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
          const itemTotal = bestPriceObj.price * item.quantity;
          
          // Average price for savings calculation
          const avgPrice = itemPrices.reduce((sum, p) => sum + Number(p.price), 0) / itemPrices.length;
          averageTotal += avgPrice * item.quantity;

          multiTotal += itemTotal;
          if (!marketGroups[bestPriceObj.market_id]) {
            const marketData = Array.isArray(bestPriceObj.markets) ? bestPriceObj.markets[0] : bestPriceObj.markets;
            marketGroups[bestPriceObj.market_id] = { 
              id: bestPriceObj.market_id, 
              name: marketData?.name || 'Mercado', 
              items: [], 
              subtotal: 0 
            };
          }
          marketGroups[bestPriceObj.market_id].items.push({ name: item.name, price: bestPriceObj.price, quantity: item.quantity });
          marketGroups[bestPriceObj.market_id].subtotal += itemTotal;
        });

        if (multiTotal > 0) {
          setMultiMarket({
            total: multiTotal,
            savings: Math.max(0, averageTotal - multiTotal),
            markets: Object.values(marketGroups),
            itemCount: items.length,
            foundCount: items.filter(item => pricesData.some(p => p.product_id === item.id)).length
          });
        }

        // Single market ranking
        const { data: allMarkets } = await supabase.from('markets').select('id, name');
        if (allMarkets) {
          const rankings = allMarkets.map(m => {
            let marketTotal = 0;
            let availableItems = 0;
            const mItems: any[] = [];

            items.forEach(item => {
              const priceObj = pricesData.find(p => p.product_id === item.id && p.market_id === m.id);
              if (priceObj) {
                const itemTotal = priceObj.price * item.quantity;
                marketTotal += itemTotal;
                availableItems++;
                mItems.push({ name: item.name, price: priceObj.price });
              }
            });

            return {
              id: m.id,
              name: m.name,
              total: marketTotal,
              savings: Math.max(0, averageTotal - marketTotal),
              score: Math.round((availableItems / items.length) * 100),
              items: mItems
            };
          })
          .filter(m => m.total > 0)
          .sort((a, b) => b.score - a.score || a.total - b.total)
          .slice(0, 3);

          setSingleMarketRanking(rankings);
        }
      }
    } catch (error) {
      console.error('Calculation error:', error);
    }
  };

  const truncateItems = (items: { name: string }[]) => {
    const text = items.map(i => i.name).join(', ');
    return text.length > 40 ? text.substring(0, 40) + '...' : text;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-medium">Calculando melhor compra...</p>
          <p className="text-[10px] text-slate-400 uppercase font-bold">Comparando preços em tempo real</p>
        </div>
      </div>
    );
  }

  const noResults = !multiMarket && singleMarketRanking.length === 0;

  return (
    <div className="pb-24 pt-6 px-4 space-y-6 max-w-lg mx-auto">
      <header className="flex items-center space-x-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">{listName}</h1>
      </header>

      {noResults ? (
        <div className="py-20 text-center space-y-4">
          <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <Zap size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">Nenhum preço encontrado</h2>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Não encontramos preços cadastrados para os itens da sua lista nos mercados locais.
            </p>
          </div>
          <Button onClick={() => navigate('/search')} variant="outline" className="mt-4">
            Buscar produtos manualmente
          </Button>
        </div>
      ) : (
        <>
          {/* Multi-Market Option */}
          {multiMarket && multiMarket.total > 0 && (
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
                  <p className="text-[10px] text-white/60 mt-1 font-bold uppercase">
                    {multiMarket.foundCount} de {multiMarket.itemCount} itens encontrados
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 text-center">
                  <p className="text-[10px] uppercase font-bold tracking-wider">Economia</p>
                  <p className="text-xl font-bold">{formatCurrency(multiMarket.savings)}</p>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                {multiMarket.markets.map((m: any, idx: number) => (
                  <div 
                    key={`${m.id}-${idx}`} 
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
                            {m.items.map((item: any, i: number) => (
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
      )}

          {/* Single Market Option */}
          {singleMarketRanking.length > 0 && (
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
                    key={`${market.id}-${idx}`} 
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
                            {market.items.map((item: any, i: number) => (
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
          )}
        </>
      )}
    </div>
  );
};
