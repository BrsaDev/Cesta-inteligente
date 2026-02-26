import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Trophy, Store, Zap, CheckCircle2, ChevronDown, ChevronUp, Info, Medal, AlertCircle } from 'lucide-react';
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
        const items = itemsData.map((item: any) => {
          const productData = Array.isArray(item.products) ? item.products[0] : item.products;
          return {
            id: productData?.id,
            name: productData?.name || 'Produto',
            quantity: item.quantity
          };
        }).filter(item => !!item.id);
        
        console.log('List items loaded:', items);
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

      console.log('Step 1: Calculating results for items:', items);

      // 1. Get all product names from the list to find all related product IDs
      // This handles cases where there might be duplicate products with the same name
      const productNames = items.map(i => i.name.trim());
      
      const { data: relatedProducts, error: prodError } = await supabase
        .from('products')
        .select('id, name')
        .in('name', productNames);

      if (prodError) throw prodError;

      const productIds = (relatedProducts || []).map(p => p.id);
      
      if (productIds.length === 0) {
        console.warn('No products found in DB for these names:', productNames);
        return;
      }

      // 2. Fetch all active prices for these products
      console.log('Step 2: Fetching prices for related product IDs:', productIds);
      
      const { data: pricesData, error: pricesError } = await supabase
        .from('prices')
        .select(`
          price,
          product_id,
          market_id,
          is_active,
          expires_at,
          markets (
            id,
            name
          )
        `)
        .in('product_id', productIds);
      
      if (pricesError) {
        console.error('Error fetching prices:', pricesError);
        throw pricesError;
      }

      console.log('Total prices found in DB for these IDs:', pricesData?.length || 0, pricesData);
      
      // Filter active prices in memory
      const now = new Date();
      const activePrices = (pricesData || []).filter(p => {
        // Treat null as active for backward compatibility with old data
        const isActive = p.is_active === true || p.is_active === null;
        // If expires_at exists, check if it's in the future. If null, consider not expired.
        const isNotExpired = !p.expires_at || new Date(p.expires_at) > now;
        
        return isActive && isNotExpired;
      });
      
      console.log('Active & Not Expired prices:', activePrices.length, activePrices);

      if (activePrices.length > 0) {
        // Multi-market calculation
        let multiTotal = 0;
        let averageTotal = 0;
        const marketGroups: Record<string, any> = {};
        const foundItemNames: string[] = [];

        items.forEach(item => {
          // Find all IDs associated with this item name
          const itemProductIds = (relatedProducts || [])
            .filter(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase())
            .map(p => p.id);

          const itemPrices = activePrices.filter(p => itemProductIds.includes(p.product_id));
          
          if (itemPrices.length === 0) {
            console.log(`No active prices found for item: ${item.name}`);
            return;
          }

          foundItemNames.push(item.name);

          // Best price for multi-market
          const bestPriceObj = itemPrices.reduce((prev, curr) => Number(prev.price) < Number(curr.price) ? prev : curr);
          const itemTotal = Number(bestPriceObj.price) * item.quantity;
          
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
          marketGroups[bestPriceObj.market_id].items.push({ name: item.name, price: Number(bestPriceObj.price), quantity: item.quantity });
          marketGroups[bestPriceObj.market_id].subtotal += itemTotal;
        });

        console.log('Multi-market calculation complete. Total:', multiTotal);

        const missingItems = items.filter(item => !foundItemNames.includes(item.name)).map(item => item.name);

        if (multiTotal > 0) {
          setMultiMarket({
            total: multiTotal,
            savings: Math.max(0, averageTotal - multiTotal),
            markets: Object.values(marketGroups),
            itemCount: items.length,
            foundCount: foundItemNames.length,
            missingItems: missingItems,
            isPartial: foundItemNames.length < items.length
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
              const itemProductIds = (relatedProducts || [])
                .filter(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase())
                .map(p => p.id);

              const priceObj = activePrices.find(p => itemProductIds.includes(p.product_id) && p.market_id === m.id);
              
              if (priceObj) {
                const itemTotal = Number(priceObj.price) * item.quantity;
                marketTotal += itemTotal;
                availableItems++;
                mItems.push({ name: item.name, price: Number(priceObj.price) });
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

          console.log('Single market rankings complete:', rankings);
          setSingleMarketRanking(rankings);
        }
      } else {
        console.warn('No active prices found for the products in this list.');
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

      {/* List Items Summary */}
      <section>
        <Card className="p-4 bg-slate-50 border-slate-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Itens da sua lista</h3>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
              {listItems.length} {listItems.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {listItems.map((item, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-600">
                {item.quantity}x {item.name}
              </div>
            ))}
          </div>
        </Card>
      </section>

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
          
          <Card className={`${multiMarket.isPartial ? 'bg-amber-500' : 'bg-emerald-500'} text-white border-none p-6 relative overflow-hidden`}>
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/70 text-sm font-medium">
                    {multiMarket.isPartial ? 'Estimativa parcial' : 'Total estimado'}
                  </p>
                  <h3 className="text-4xl font-bold">{formatCurrency(multiMarket.total)}</h3>
                  <div className={`inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${multiMarket.isPartial ? 'bg-black/20 text-white' : 'bg-white/20 text-white'}`}>
                    {multiMarket.isPartial ? (
                      <>
                        <AlertCircle size={10} className="mr-1" />
                        Resultado parcial ({multiMarket.foundCount}/{multiMarket.itemCount} itens)
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={10} className="mr-1" />
                        Resultado completo ({multiMarket.foundCount}/{multiMarket.itemCount} itens)
                      </>
                    )}
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 text-center">
                  <p className="text-[10px] uppercase font-bold tracking-wider">Economia</p>
                  <p className="text-xl font-bold">{formatCurrency(multiMarket.savings)}</p>
                </div>
              </div>

              {multiMarket.isPartial && multiMarket.missingItems.length > 0 && (
                <div className="mt-6 p-3 bg-black/10 rounded-2xl border border-white/10">
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2">Itens não encontrados:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {multiMarket.missingItems.map((item: string, i: number) => (
                      <span key={i} className="text-[10px] bg-white/10 px-2 py-0.5 rounded-lg text-white/90">
                        • {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
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

              <Button className={`w-full mt-6 bg-white hover:bg-white/90 font-bold ${multiMarket.isPartial ? 'text-amber-600' : 'text-emerald-600'}`}>
                {multiMarket.isPartial ? 'Ver rota (itens disponíveis)' : 'Ver rota otimizada'}
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
                    className={`p-4 sm:p-5 transition-all cursor-pointer ${idx === 0 ? 'ring-2 ring-primary ring-offset-2' : ''}`} 
                    hoverable
                    onClick={() => setExpandedSingleMarket(expandedSingleMarket === market.id ? null : market.id)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0 ${
                          idx === 0 ? 'bg-primary/10 text-primary' : 
                          idx === 1 ? 'bg-slate-100 text-slate-500' : 
                          'bg-orange-50 text-orange-500'
                        }`}>
                          {idx === 0 ? <Medal size={18} className="sm:w-5 sm:h-5" /> : <span className="font-bold text-sm sm:text-base">{idx + 1}º</span>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{market.name}</h3>
                            {idx === 0 && <CheckCircle2 size={12} className="text-primary shrink-0" />}
                          </div>
                          <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">
                            {idx === 0 ? 'Melhor preço único' : `${idx + 1}ª melhor opção`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base sm:text-lg font-bold text-slate-900 leading-none">{formatCurrency(market.total)}</p>
                        <p className="text-[9px] sm:text-[10px] text-green-600 font-bold mt-1">Economia: {formatCurrency(market.savings)}</p>
                      </div>
                    </div>
                    
                      <div className="mt-4">
                        <div className="flex justify-between mb-1.5">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Cobertura da lista</span>
                          <span className={`text-[9px] font-bold ${market.score === 100 ? 'text-primary' : 'text-amber-500'}`}>
                            {market.score}% ({market.items.length}/{listItems.length} itens)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className={`${market.score === 100 ? 'bg-primary' : 'bg-amber-500'} h-full`} style={{ width: `${market.score}%` }} />
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
