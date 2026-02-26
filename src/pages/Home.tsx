import { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Plus, ArrowRight, TrendingDown, List, Zap } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { formatCurrency } from '@/src/lib/utils';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';

export const Home = () => {
  const navigate = useNavigate();
  const [userName] = useState('Bruno');
  const [location] = useState('Cabo Frio, RJ');
  const [groupedOffers, setGroupedOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [comparisonCount] = useState(3); // Default for home

  useEffect(() => {
    const fetchOffers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('prices')
          .select(`
            id,
            price,
            has_proof,
            created_at,
            products (id, name, brand, category, image_url),
            markets (id, name)
          `)
          .eq('is_active', true)
          .order('price', { ascending: true });

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
              flashSale: Math.random() > 0.8 ? { endsIn: '05:20:00' } : null
            });
          });

          // Take top 5 products with their comparisons
          const sortedGroups = Object.values(groups)
            .sort((a: any, b: any) => a.prices[0].price - b.prices[0].price)
            .slice(0, 5);
          
          setGroupedOffers(sortedGroups);
        }
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffers();
  }, []);

  return (
    <div className="pb-24 pt-6 px-4 space-y-8 max-w-lg mx-auto">
      {/* Header */}
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Olá, {userName} 👋</h1>
          <div className="flex items-center text-slate-500 text-sm mt-1">
            <MapPin size={14} className="mr-1" />
            <span>{location}</span>
            <button className="ml-2 text-primary font-semibold text-xs">Alterar</button>
          </div>
        </div>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
          {userName[0]}
        </div>
      </header>

      {/* Search */}
      <section>
        <Input 
          placeholder="Buscar produto..." 
          icon={<Search size={18} />}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const query = (e.target as HTMLInputElement).value;
              if (query) navigate(`/search?q=${encodeURIComponent(query)}`);
            }
          }}
        />
      </section>

      {/* Main Actions */}
      <section className="grid grid-cols-2 gap-4">
        <Card 
          className="bg-primary text-white border-none flex flex-col justify-between h-32" 
          hoverable
          onClick={() => navigate('/lists/new')}
        >
          <Plus size={24} />
          <div>
            <p className="font-bold text-lg">Criar lista</p>
            <p className="text-white/80 text-xs">Economize agora</p>
          </div>
        </Card>
        <Card 
          className="bg-white flex flex-col justify-between h-32" 
          hoverable
          onClick={() => navigate('/lists')}
        >
          <List size={24} className="text-primary" />
          <div>
            <p className="font-bold text-lg text-slate-900">Minhas listas</p>
            <p className="text-slate-500 text-xs">Ver listas salvas</p>
          </div>
        </Card>
      </section>

      {/* Offers */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Ofertas próximas 🔥</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary"
            onClick={() => navigate('/offers')}
          >
            Ver todas
          </Button>
        </div>
        <div className="space-y-6">
          {isLoading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Carregando ofertas...</div>
          ) : groupedOffers.length > 0 ? (
            groupedOffers.map((group, idx) => {
              const bestPrice = group.prices[0];
              const comparisons = group.prices.slice(1, comparisonCount);

              return (
                <motion.div
                  key={group.productId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="space-y-2"
                >
                  <Card className="flex items-center justify-between p-3 sm:p-4 bg-white border-none shadow-sm relative overflow-hidden" hoverable>
                    <div className="flex items-center space-x-3 sm:space-x-4 relative z-10 min-w-0 flex-1">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                        {group.imageUrl ? (
                          <img src={group.imageUrl} alt={group.name} className="w-full h-full object-cover rounded-xl sm:rounded-2xl" referrerPolicy="no-referrer" />
                        ) : '🛒'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 text-sm sm:text-base truncate leading-tight">{group.name}</p>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 truncate">{bestPrice.market} • Recente</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end space-y-1 relative z-10 shrink-0 ml-2">
                      <p className="font-bold text-primary text-sm sm:text-lg leading-none">{formatCurrency(bestPrice.price)}</p>
                      {bestPrice.flashSale ? (
                        <span className="text-[8px] sm:text-[9px] bg-red-500 text-white px-1.5 sm:px-2 py-0.5 rounded-full font-bold uppercase animate-pulse flex items-center">
                          <Zap size={8} className="mr-1 fill-current" />
                          {bestPrice.flashSale.endsIn}
                        </span>
                      ) : (
                        <span className="text-[8px] sm:text-[10px] bg-green-100 text-green-600 px-1.5 sm:px-2 py-0.5 rounded-full font-bold uppercase">Melhor Preço</span>
                      )}
                    </div>
                    <div className="absolute -right-4 -bottom-4 h-20 w-20 bg-primary/5 rounded-full blur-2xl" />
                  </Card>

                  {/* Comparison rows */}
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
            <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-400 text-sm">Nenhuma oferta encontrada.</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Verifique se o banco de dados foi populado</p>
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section>
        <Card className="bg-slate-900 text-white p-6 overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingDown size={20} className="text-primary" />
              <span className="text-sm font-medium text-white/70">Economia recente</span>
            </div>
            <h3 className="text-3xl font-bold">Você economizou <span className="text-primary">R$ 48</span> este mês</h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 border-white/20 text-white hover:bg-white/10"
              onClick={() => navigate('/economy-details')}
            >
              Ver detalhes <ArrowRight size={14} className="ml-2" />
            </Button>
          </div>
          <div className="absolute -right-4 -bottom-4 h-32 w-32 bg-primary/20 rounded-full blur-3xl" />
        </Card>
      </section>
    </div>
  );
};
