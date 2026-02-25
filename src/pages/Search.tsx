import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, TrendingUp, TrendingDown, Clock, MapPin, Zap } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { formatCurrency } from '@/src/lib/utils';
import { motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { X, UserCheck, Camera } from 'lucide-react';
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
  const [results, setResults] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const performSearch = async () => {
      if (!search.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        // Use !inner to filter by joined table column
        const { data, error } = await supabase
          .from('prices')
          .select(`
            id,
            price,
            has_proof,
            proof_url,
            created_at,
            products!inner (id, name, brand, category, image_url),
            markets (name)
          `)
          .ilike('products.name', `%${search}%`)
          .eq('is_active', true)
          .order('price', { ascending: true });

        if (error) {
          console.error('Search error:', error);
          setResults([]);
          return;
        }

        if (data) {
          setResults(data.map((item: any) => ({
            id: item.id,
            name: item.products.name,
            brand: item.products.brand,
            price: item.price,
            market: item.markets.name,
            proof: item.has_proof,
            proofUrl: item.proof_url,
            time: 'Recente',
            distance: '1.0km',
            icon: '🛒',
            flashSale: null,
            tags: [item.products.category]
          })));
        }
      } catch (error) {
        console.error('Search catch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

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
          <Button variant="outline" size="md" className="px-3">
            <SlidersHorizontal size={20} />
          </Button>
        </div>
      </header>

      {search ? (
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500 font-medium">{results.length} resultados para "{search}"</p>
            <div className="flex items-center text-xs font-bold text-primary">
              <Filter size={14} className="mr-1" />
              Filtrar
            </div>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium">Buscando produtos...</p>
              </div>
            ) : results.length > 0 ? (
              results.map((item, idx) => (
                <motion.div
                  key={`${item.id}-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="p-4" hoverable>
                    <div className="flex justify-between items-start">
                      <div className="flex space-x-3">
                        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-xl">
                          {item.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{item.name}</h3>
                          <p className="text-xs text-slate-500">{item.brand}</p>
                          <div className="flex items-center mt-2 space-x-3">
                            <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase">
                              <MapPin size={10} className="mr-1" />
                              {item.distance}
                            </div>
                            <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase">
                              <Clock size={10} className="mr-1" />
                              {item.time}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">{formatCurrency(item.price)}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{item.market}</p>
                        <div className="flex flex-col items-end space-y-1 mt-2">
                          {item.flashSale && (
                            <div className="flex items-center bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-md animate-pulse">
                              <Zap size={10} className="mr-1 fill-current" />
                              RELÂMPAGO • {item.flashSale.endsIn}
                            </div>
                          )}
                          {item.proof && (
                            <button 
                              onClick={() => setSelectedProof(item.proofUrl || null)}
                              className="inline-flex items-center text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-md font-bold uppercase hover:bg-green-200 transition-colors"
                            >
                              <Camera size={10} className="mr-1" />
                              Verificado • Ver Foto
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p className="text-sm font-medium">Nenhum produto encontrado para "{search}"</p>
                <p className="text-xs mt-1">Tente buscar por outro termo ou marca.</p>
              </div>
            )}
          </div>

          {/* Price History Chart (Placeholder for now) */}
          {results.length > 0 && (
            <Card className="p-6 bg-slate-50 border-none overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="font-bold text-slate-900">Histórico de preço</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                    {results[0].name} • {results[0].brand}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedProof(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-sm w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedProof(null)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all z-10"
              >
                <X size={20} />
              </button>
              <div className="p-4 border-b border-slate-100">
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
              <div className="p-4 bg-slate-50">
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
