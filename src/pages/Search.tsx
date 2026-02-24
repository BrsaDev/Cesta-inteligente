import { useState } from 'react';
import { Search, Filter, SlidersHorizontal, TrendingUp, TrendingDown, Clock, MapPin, Zap } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { formatCurrency } from '@/src/lib/utils';
import { motion } from 'motion/react';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { X, UserCheck, Camera } from 'lucide-react';
import Fuse from 'fuse.js';
import { normalizeString } from '@/src/lib/searchUtils';

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  
  const allProducts = [
    { id: '1', name: 'Leite Integral 1L', brand: 'Parmalat', price: 4.50, market: 'Mercado A', proof: true, proofUrl: 'https://picsum.photos/seed/leite/600/800', time: '1h atrás', distance: '0.8km', icon: '🥛', flashSale: { endsIn: '02:45:12' }, tags: ['leite', 'laticinio', 'bebida'] },
    { id: '2', name: 'Leite Integral 1L', brand: 'Itambé', price: 4.79, market: 'Mercado B', proof: false, time: '3h atrás', distance: '1.2km', icon: '🥛', tags: ['leite', 'laticinio', 'bebida'] },
    { id: '3', name: 'Leite Integral 1L', brand: 'Piracanjuba', price: 5.10, market: 'Mercado C', proof: false, time: '12h atrás', distance: '2.5km', icon: '🥛', tags: ['leite', 'laticinio', 'bebida'] },
    { id: '4', name: 'Feijão Carioca 1kg', brand: 'Kicaldo', price: 8.90, market: 'Mercado A', proof: true, proofUrl: 'https://picsum.photos/seed/feijao1/600/800', time: '2h atrás', distance: '0.8km', icon: '🥘', flashSale: { endsIn: '00:15:45' }, tags: ['feijao', 'grao', 'alimento'] },
    { id: '5', name: 'Feijão Preto 1kg', brand: 'Camil', price: 7.50, market: 'Mercado B', proof: true, proofUrl: 'https://picsum.photos/seed/feijao2/600/800', time: '30min atrás', distance: '1.2km', icon: '🥘', tags: ['feijao', 'grao', 'alimento'] },
    { id: '6', name: 'Arroz Branco 5kg', brand: 'Tio João', price: 22.90, market: 'Mercado X', proof: true, proofUrl: 'https://picsum.photos/seed/arroz/600/800', time: '5h atrás', distance: '3.0km', icon: '🍚', tags: ['arroz', 'grao', 'alimento'] },
    { id: '7', name: 'Café Torrado 500g', brand: 'Pilão', price: 15.50, market: 'Mercado Z', proof: false, time: '1h atrás', distance: '1.5km', icon: '☕', tags: ['cafe', 'bebida', 'matinal'] },
    { id: '8', name: 'Alcatra Bovina kg', brand: 'Friboi', price: 38.90, market: 'Mercado A', proof: true, proofUrl: 'https://picsum.photos/seed/carne1/600/800', time: '45min atrás', distance: '0.8km', icon: '🥩', tags: ['carne', 'bovino', 'churrasco', 'proteina'] },
    { id: '9', name: 'Peito de Frango 1kg', brand: 'Seara', price: 18.50, market: 'Mercado B', proof: false, time: '2h atrás', distance: '1.2km', icon: '🍗', tags: ['carne', 'frango', 'ave', 'proteina'] },
    { id: '10', name: 'Contra Filé kg', brand: 'Swift', price: 42.00, market: 'Mercado C', proof: true, proofUrl: 'https://picsum.photos/seed/carne2/600/800', time: '1h atrás', distance: '2.5km', icon: '🥩', tags: ['carne', 'bovino', 'churrasco', 'proteina'] },
    { id: '11', name: 'Biscoito Trakinas 126g', brand: 'Mondelēz', price: 3.20, market: 'Mercado B', proof: true, proofUrl: 'https://picsum.photos/seed/trakinas/600/800', time: '10min atrás', distance: '1.2km', icon: '🍪', tags: ['biscoito', 'bolacha', 'doce', 'recheado', 'lanche'] },
    { id: '12', name: 'Bolacha Passatempo 130g', brand: 'Nestlé', price: 3.50, market: 'Mercado A', proof: false, time: '4h atrás', distance: '0.8km', icon: '🍪', tags: ['biscoito', 'bolacha', 'doce', 'recheado', 'lanche'] },
    { id: '13', name: 'Macarrão Espaguete 500g', brand: 'Adria', price: 5.90, market: 'Mercado C', proof: true, proofUrl: 'https://picsum.photos/seed/massa/600/800', time: '1h atrás', distance: '2.5km', icon: '🍝', tags: ['massa', 'macarrao', 'pasta', 'alimento'] },
  ];

  const fuse = new Fuse(allProducts, {
    keys: [
      { name: 'name', weight: 0.6 },
      { name: 'tags', weight: 0.3 },
      { name: 'brand', weight: 0.1 }
    ],
    threshold: 0.2,
    distance: 100,
    minMatchCharLength: 3,
    includeScore: true,
    ignoreLocation: false, // Changed to false to respect word boundaries better
    location: 0,
    getFn: (obj, path) => {
      const value = (obj as any)[path as string];
      return typeof value === 'string' ? normalizeString(value) : value;
    }
  });

  const results = search 
    ? fuse.search(normalizeString(search))
        .filter(r => {
          // Additional filter: if the match is in the name, it should ideally 
          // start at a word boundary or be a very high quality match.
          // This prevents "pasta" matching "Passatempo" just because it's a substring.
          if (r.score && r.score > 0.1) {
            const name = normalizeString(r.item.name);
            const query = normalizeString(search);
            const isAtWordBoundary = name.split(/\s+/).some(word => word.startsWith(query));
            const isTagMatch = r.item.tags?.some(tag => normalizeString(tag) === query);
            return isAtWordBoundary || isTagMatch;
          }
          return true;
        })
        .map(r => r.item)
    : [];

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
            {results.length > 0 ? (
              results.map((item, idx) => (
                <motion.div
                  key={item.id}
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

          {/* Price History Placeholder */}
          <Card className="p-6 bg-slate-50 border-none">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-slate-900">Histórico de preço</h4>
              <div className="flex items-center text-green-600 text-xs font-bold">
                <TrendingDown size={14} className="mr-1" />
                -12% este mês
              </div>
            </div>
            <div className="h-32 w-full flex items-end justify-between px-2">
              {[40, 60, 45, 70, 55, 80, 65].map((h, i) => (
                <div key={i} className="w-6 bg-primary/20 rounded-t-lg transition-all hover:bg-primary" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-bold uppercase">
              <span>Semana 1</span>
              <span>Hoje</span>
            </div>
          </Card>
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
