import { useState, useEffect } from 'react';
import { ArrowLeft, Filter, X, Check, Store, Tag, Zap, Search } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { formatCurrency } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';

export const AllOffers = () => {
  const navigate = useNavigate();
  const [groupedOffers, setGroupedOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [comparisonCount, setComparisonCount] = useState(3);

  // Metadata for filters
  const [availableMarkets, setAvailableMarkets] = useState<any[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [selectedMarkets, selectedCategories, onlyVerified, search, comparisonCount]);

  const fetchInitialData = async () => {
    const { data: markets } = await supabase.from('markets').select('id, name');
    const { data: categories } = await supabase.from('products').select('category');
    
    if (markets) setAvailableMarkets(markets);
    if (categories) {
      const uniqueCats = Array.from(new Set(categories.map(c => c.category).filter(Boolean)));
      setAvailableCategories(uniqueCats as string[]);
    }
  };

  const fetchOffers = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('prices')
        .select(`
          id,
          price,
          has_proof,
          created_at,
          products!inner (id, name, brand, category, image_url),
          markets (id, name)
        `)
        .eq('is_active', true);

      if (search) {
        query = query.ilike('products.name', `%${search}%`);
      }

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

      if (error) throw error;

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
            flashSale: Math.random() > 0.9 ? { endsIn: '02:15:00' } : null
          });
        });

        // Convert to array and sort by best price
        const sortedGroups = Object.values(groups).sort((a: any, b: any) => a.prices[0].price - b.prices[0].price);
        setGroupedOffers(sortedGroups);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    setSearch('');
    setComparisonCount(3);
  };

  const activeFilterCount = selectedMarkets.length + selectedCategories.length + (onlyVerified ? 1 : 0) + (comparisonCount !== 3 ? 1 : 0);

  return (
    <div className="pb-24 pt-6 px-4 space-y-6 max-w-lg mx-auto min-h-screen bg-slate-50">
      <header className="flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-md z-30 py-2">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Todas as Ofertas</h1>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowFilters(!showFilters)}
          className={`relative ${activeFilterCount > 0 ? 'text-primary' : 'text-slate-500'}`}
        >
          <Filter size={20} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] h-4 w-4 rounded-full flex items-center justify-center border-2 border-slate-50">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </header>

      <div className="space-y-4">
        <Input 
          placeholder="Filtrar por nome..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={18} />}
          className="bg-white shadow-sm border-none"
        />

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
      </div>

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

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${onlyVerified ? 'bg-primary border-primary' : 'border-slate-300'}`}
                    onClick={() => setOnlyVerified(!onlyVerified)}
                  >
                    {onlyVerified && <Check size={14} className="text-white" />}
                  </div>
                  <span className="text-sm font-medium text-slate-700">Apenas preços verificados</span>
                </div>
                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <CheckCircle size={14} />
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Resultados</h2>
          <span className="text-[10px] font-bold text-slate-400">{groupedOffers.length} produtos encontrados</span>
        </div>

        <div className="space-y-8">
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400 text-sm font-medium">Buscando as melhores ofertas...</p>
            </div>
          ) : groupedOffers.length > 0 ? (
            groupedOffers.map((group, idx) => {
              const bestPrice = group.prices[0];
              const comparisons = group.prices.slice(1, comparisonCount);

              return (
                <motion.div
                  key={group.productId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="space-y-2"
                >
                  {/* Main Product Card (Best Price) */}
                  <Card className="p-3 sm:p-4 bg-white border-none shadow-sm relative overflow-hidden" hoverable>
                    <div className="flex items-center justify-between relative z-10 gap-2">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 relative shrink-0 overflow-hidden">
                          {group.imageUrl ? (
                            <img src={group.imageUrl} alt={group.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : '🛒'}
                          {bestPrice.hasProof && (
                            <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                              <Check size={8} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm sm:text-base truncate leading-tight">{group.name}</p>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="text-[9px] sm:text-[10px] font-bold text-primary uppercase truncate">{bestPrice.market}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate">{group.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end space-y-1 shrink-0">
                        <p className="font-bold text-primary text-base sm:text-xl leading-none">{formatCurrency(bestPrice.price)}</p>
                        {bestPrice.flashSale ? (
                          <span className="text-[8px] sm:text-[9px] bg-red-500 text-white px-1.5 sm:px-2 py-0.5 rounded-full font-bold uppercase animate-pulse flex items-center">
                            <Zap size={8} className="mr-1 fill-current" />
                            {bestPrice.flashSale.endsIn}
                          </span>
                        ) : (
                          <span className="text-[8px] sm:text-[10px] bg-green-50 text-green-600 px-1.5 sm:px-2 py-0.5 rounded-full font-bold uppercase">Melhor Preço</span>
                        )}
                      </div>
                    </div>
                    {/* Subtle background decoration for the "winner" */}
                    <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-primary/5 rounded-full blur-2xl" />
                  </Card>

                  {/* Comparison List */}
                  {comparisons.length > 0 && (
                    <div className="ml-4 space-y-1">
                      {comparisons.map((comp: any, cIdx: number) => {
                        const diff = comp.price - bestPrice.price;
                        // Alternate subtle backgrounds for visual distinction
                        const bgClass = cIdx % 2 === 0 ? 'bg-slate-50' : 'bg-white';
                        
                        return (
                          <motion.div
                            key={comp.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: (idx * 0.05) + (cIdx * 0.05) }}
                            className={`flex items-center justify-between p-3 rounded-xl border border-slate-100 ${bgClass}`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="h-6 w-6 rounded-lg bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                {cIdx + 2}º
                              </div>
                              <span className="text-xs font-semibold text-slate-600">{comp.market}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-[10px] font-bold text-slate-400">+{formatCurrency(diff)}</span>
                              <span className="text-sm font-bold text-slate-700">{formatCurrency(comp.price)}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              );
            })
          ) : (
            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Search size={32} />
              </div>
              <p className="text-slate-500 font-bold">Nenhuma oferta encontrada</p>
              <p className="text-xs text-slate-400 mt-1">Tente ajustar seus filtros ou buscar outro produto.</p>
              <Button variant="ghost" className="mt-4 text-primary" onClick={clearFilters}>Limpar todos os filtros</Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const CheckCircle = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
