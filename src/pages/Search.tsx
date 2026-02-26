import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, TrendingUp, TrendingDown, Clock, MapPin, Zap } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { formatCurrency } from '@/src/lib/utils';
import { motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { X, UserCheck, Camera, Check, CheckCircle, Store, Tag } from 'lucide-react';
import { normalizeString } from '@/src/lib/searchUtils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { supabase } from '@/src/lib/supabase';

interface ProductItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  market: string;
  proof: boolean;
  proofUrl?: string;
  time: string;
  distance: string;
  icon: string;
  flashSale: { endsIn: string } | null;
  tags: string[];
}

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [groupedResults, setGroupedResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonCount, setComparisonCount] = useState(3);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [onlyVerified, setOnlyVerified] = useState(false);

  // Metadata for filters
  const [availableMarkets, setAvailableMarkets] = useState<any[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const { data: markets } = await supabase.from('markets').select('id, name');
    const { data: categories } = await supabase.from('products').select('category');
    
    if (markets) setAvailableMarkets(markets);
    if (categories) {
      const uniqueCats = Array.from(new Set(categories.map(c => c.category).filter(Boolean)));
      setAvailableCategories(uniqueCats as string[]);
    }
  };

  useEffect(() => {
    const performSearch = async () => {
      if (!search.trim()) {
        setGroupedResults([]);
        return;
      }

      setIsLoading(true);
      try {
        let query = supabase
          .from('prices')
          .select(`
            id,
            price,
            has_proof,
            proof_url,
            created_at,
            source_type,
            products!inner (id, name, brand, category, image_url),
            markets (id, name),
            profiles:created_by (name)
          `)
          .ilike('products.name', `%${search}%`)
          .eq('is_active', true);

        if (selectedMarkets.length > 0) {
          query = query.in('market_id', selectedMarkets);
        }

        if (selectedCategories.length > 0) {
          query = query.in('products.category', selectedCategories);
        }

        if (onlyVerified) {
          query = query.eq('has_proof', true);
        }

        const { data, error } = await query.order('price', { ascending: true });

        if (error) {
          console.error('Search error:', error);
          setGroupedResults([]);
          return;
        }

        if (data) {
          // Group by product
          const groups: Record<string, any> = {};
          data.forEach((item: any) => {
            const pId = item.products.id;
            if (!groups[pId]) {
              groups[pId] = {
                productId: pId,
                name: item.products.name,
                brand: item.products.brand,
                category: item.products.category,
                imageUrl: item.products.image_url,
                prices: []
              };
            }
            groups[pId].prices.push({
              id: item.id,
              price: item.price,
              market: item.markets.name,
              marketId: item.markets.id,
              hasProof: item.has_proof,
              proofUrl: item.proof_url,
              sourceType: item.source_type,
              contributor: item.profiles?.name || (item.source_type === 'market' ? 'Mercado' : 'Usuário'),
              time: 'Recente',
              distance: '1.0km',
              flashSale: null
            });
          });

          setGroupedResults(Object.values(groups));
        }
      } catch (error) {
        console.error('Search catch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [search, selectedMarkets, selectedCategories, onlyVerified]);

  const toggleMarket = (id: string) => {
    setSelectedMarkets(prev => {
      const next = prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id];
      // Sync comparison count with number of selected markets if any are selected
      if (next.length > 0) {
        setComparisonCount(next.length);
      } else {
        setComparisonCount(3); // Reset to default if none selected
      }
      return next;
    });
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const clearFilters = () => {
    setSelectedMarkets([]);
    setSelectedCategories([]);
    setOnlyVerified(false);
    setComparisonCount(3);
  };

  const activeFilterCount = selectedMarkets.length + selectedCategories.length + (onlyVerified ? 1 : 0) + (comparisonCount !== 3 ? 1 : 0);

  return (
    <div className="pb-24 pt-6 px-4 space-y-6 max-w-lg mx-auto">
      <header className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Buscar produto</h1>
        <div className="flex space-x-2">
          <Input 
            placeholder="O que você procura?" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={18} />}
            className="flex-1"
          />
          <Button 
            variant="outline" 
            size="md" 
            className={`px-3 relative ${showFilters || activeFilterCount > 0 ? 'bg-primary/10 border-primary text-primary' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={20} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] h-4 w-4 rounded-full flex items-center justify-center border-2 border-slate-50">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Active Tags Display */}
        {(selectedMarkets.length > 0 || selectedCategories.length > 0 || comparisonCount !== 3) && (
          <div className="flex flex-wrap gap-2">
            {selectedMarkets.map(id => {
              const market = availableMarkets.find(m => m.id === id);
              return (
                <span key={id} className="inline-flex items-center px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase">
                  {market?.name}
                  <button onClick={() => toggleMarket(id)} className="ml-1 hover:text-primary/70">
                    <X size={10} />
                  </button>
                </span>
              );
            })}
            {selectedCategories.map(cat => (
              <span key={cat} className="inline-flex items-center px-2 py-1 rounded-lg bg-blue-100 text-blue-600 text-[10px] font-bold uppercase">
                {cat}
                <button onClick={() => toggleCategory(cat)} className="ml-1 hover:text-blue-400">
                  <X size={10} />
                </button>
              </span>
            ))}
            {comparisonCount !== 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-orange-100 text-orange-600 text-[10px] font-bold uppercase">
                {comparisonCount} Mercados
                <button onClick={() => setComparisonCount(3)} className="ml-1 hover:text-orange-400">
                  <X size={10} />
                </button>
              </span>
            )}
          </div>
        )}
      </header>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-4 space-y-6 border-none shadow-md bg-white">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Filtros Avançados</h3>
                <button onClick={clearFilters} className="text-xs text-primary font-bold uppercase tracking-wider">Limpar</button>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                  <Zap size={12} className="mr-1" /> Comparação de Mercados
                </p>
                <div className="flex items-center space-x-4">
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    value={comparisonCount} 
                    onChange={(e) => setComparisonCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-sm font-bold text-primary w-8">{comparisonCount}</span>
                </div>
                <p className="text-[10px] text-slate-400">Mostrar até {comparisonCount} mercados por produto para comparação.</p>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                  <Store size={12} className="mr-1" /> Mercados
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableMarkets.map(market => (
                    <button
                      key={market.id}
                      onClick={() => toggleMarket(market.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        selectedMarkets.includes(market.id)
                          ? 'bg-primary text-white shadow-md shadow-primary/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {market.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                  <Tag size={12} className="mr-1" /> Categorias
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        selectedCategories.includes(cat)
                          ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${onlyVerified ? 'bg-primary border-primary' : 'border-slate-300'}`}
                    onClick={() => setOnlyVerified(!onlyVerified)}
                  >
                    {onlyVerified && <Check size={14} className="text-white" />}
                  </div>
                  <span className="text-sm font-medium text-slate-700">Apenas preços verificados</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {search ? (
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500 font-medium">{groupedResults.length} produtos encontrados para "{search}"</p>
          </div>

          <div className="space-y-8">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium">Buscando produtos...</p>
              </div>
            ) : groupedResults.length > 0 ? (
              groupedResults.map((group, idx) => {
                const bestPrice = group.prices[0];
                const comparisons = group.prices.slice(1, comparisonCount);

                return (
                  <motion.div
                    key={`${group.productId}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="space-y-2"
                  >
                    <Card className="p-3 sm:p-4 bg-white border-none shadow-sm relative overflow-hidden" hoverable>
                      <div className="flex justify-between items-start relative z-10 gap-2">
                        <div className="flex space-x-2 sm:space-x-3 min-w-0 flex-1">
                          <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-slate-100 flex items-center justify-center text-lg sm:text-xl shrink-0 overflow-hidden">
                            {group.imageUrl ? (
                              <img src={group.imageUrl} alt={group.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : '🛒'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-slate-900 text-xs sm:text-base truncate leading-tight">{group.name}</h3>
                            <p className="text-[9px] sm:text-xs text-slate-500 truncate mt-0.5">{group.brand}</p>
                            <div className="flex items-center mt-1 sm:mt-1.5 space-x-2 sm:space-x-3">
                              <div className="flex items-center text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase">
                                <MapPin size={10} className="mr-0.5 sm:mr-1" />
                                {bestPrice.distance}
                              </div>
                              <div className="flex items-center text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase">
                                <Clock size={10} className="mr-0.5 sm:mr-1" />
                                {bestPrice.time}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end ml-2">
                          <p className="text-sm sm:text-xl font-bold text-primary leading-none">{formatCurrency(bestPrice.price)}</p>
                          <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase mt-1 truncate max-w-[60px] sm:max-w-none">
                            {bestPrice.market}
                          </p>
                          <p className="text-[7px] text-slate-300 font-bold uppercase truncate">
                            Por: {bestPrice.contributor}
                          </p>
                          <div className="flex flex-col items-end space-y-1 mt-1.5 sm:mt-2">
                            {bestPrice.flashSale && (
                              <div className="flex items-center bg-red-500 text-white text-[7px] sm:text-[9px] font-bold px-1 sm:px-2 py-0.5 rounded-md animate-pulse">
                                <Zap size={8} className="mr-1 fill-current" />
                                {bestPrice.flashSale.endsIn}
                              </div>
                            )}
                            {bestPrice.hasProof && (
                              <button 
                                onClick={() => setSelectedProof(bestPrice.proofUrl || null)}
                                className="inline-flex items-center text-[7px] sm:text-[9px] bg-green-100 text-green-600 px-1 sm:px-2 py-0.5 rounded-md font-bold uppercase hover:bg-green-200 transition-colors whitespace-nowrap"
                              >
                                <Camera size={10} className="mr-1" />
                                <span className="hidden xs:inline">Verificado • </span>Foto
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-primary/5 rounded-full blur-2xl" />
                    </Card>

                    {/* Comparisons */}
                    {comparisons.length > 0 && (
                      <div className="ml-4 space-y-1">
                        {comparisons.map((comp: any, cIdx: number) => (
                          <div 
                            key={comp.id} 
                            className={`flex items-center justify-between p-2.5 rounded-xl border border-slate-100 text-xs ${cIdx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold text-slate-400">{cIdx + 2}º</span>
                              <span className="font-semibold text-slate-600">{comp.market}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-[9px] font-bold text-slate-400">+{formatCurrency(comp.price - bestPrice.price)}</span>
                              <span className="font-bold text-slate-700">{formatCurrency(comp.price)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p className="text-sm font-medium">Nenhum produto encontrado para "{search}"</p>
                <p className="text-xs mt-1">Tente buscar por outro termo ou marca.</p>
              </div>
            )}
          </div>

          {/* Price History Chart (Placeholder for now) */}
          {groupedResults.length > 0 && (
            <Card className="p-6 bg-slate-50 border-none overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="font-bold text-slate-900">Histórico de preço</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                    {groupedResults[0].name} • {groupedResults[0].brand}
                  </p>
                </div>
                <div className="flex items-center text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded-lg">
                  <TrendingDown size={14} className="mr-1" />
                  -12% este mês
                </div>
              </div>
              
              <div className="h-40 w-full -ml-4 flex items-center justify-center text-slate-300 text-xs font-bold uppercase">
                Gráfico de histórico em breve
              </div>
              
              <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Início do mês</span>
                <span>Hoje</span>
              </div>
            </Card>
          )}
        </section>
      ) : (
        <section className="py-12 text-center space-y-4">
          <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <Search size={40} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">O que vamos comprar hoje?</h3>
            <p className="text-sm text-slate-500 mt-1">Busque por produtos ou marcas para ver os melhores preços.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-4">
            {['Arroz', 'Feijão', 'Carne', 'Leite', 'Café'].map(tag => (
              <button key={tag} onClick={() => setSearch(tag)} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:border-primary hover:text-primary transition-all">
                {tag}
              </button>
            ))}
          </div>
        </section>
      )}
      {/* Proof Modal */}
      <AnimatePresence>
        {selectedProof && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm md:p-4"
            onClick={() => setSelectedProof(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full md:max-w-sm bg-white rounded-t-[32px] md:rounded-[32px] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 md:hidden shrink-0" />
              <button 
                onClick={() => setSelectedProof(null)}
                className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all z-10"
              >
                <X size={20} />
              </button>
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 flex items-center">
                  <Camera size={18} className="mr-2 text-primary" />
                  Comprovante do Usuário
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Foto tirada no estabelecimento</p>
              </div>
              <div className="aspect-[3/4] w-full bg-slate-100">
                <img 
                  src={selectedProof} 
                  alt="Comprovante de preço" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-6 bg-slate-50 pb-20 sm:pb-6">
                <Button className="w-full" onClick={() => setSelectedProof(null)}>
                  Fechar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
