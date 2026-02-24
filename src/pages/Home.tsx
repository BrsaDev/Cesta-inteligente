import { useState } from 'react';
import { Search, MapPin, Plus, ArrowRight, TrendingDown, List, Zap } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { formatCurrency } from '@/src/lib/utils';
import { motion } from 'motion/react';

import { useNavigate } from 'react-router-dom';

export const Home = () => {
  const navigate = useNavigate();
  const [userName] = useState('Bruno');
  const [location] = useState('Cabo Frio, RJ');

  const offers = [
    { id: '1', name: 'Arroz 5kg', price: 22.90, market: 'Mercado X', time: '2h atrás', type: 'promo', flashSale: { endsIn: '05:20:00' } },
    { id: '2', name: 'Leite Integral', price: 4.99, market: 'Mercado Y', time: '1h atrás', type: 'promo' },
    { id: '3', name: 'Café 500g', price: 15.50, market: 'Mercado Z', time: '30min atrás', type: 'promo', flashSale: { endsIn: '00:45:00' } },
  ];

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
          <Button variant="ghost" size="sm" className="text-primary">Ver todas</Button>
        </div>
        <div className="space-y-3">
          {offers.map((offer, idx) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="flex items-center justify-between p-4" hoverable>
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    🛒
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{offer.name}</p>
                    <p className="text-xs text-slate-500">{offer.market} • {offer.time}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end space-y-1">
                  <p className="font-bold text-primary">{formatCurrency(offer.price)}</p>
                  {offer.flashSale ? (
                    <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold uppercase animate-pulse flex items-center">
                      <Zap size={8} className="mr-1 fill-current" />
                      {offer.flashSale.endsIn}
                    </span>
                  ) : (
                    <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold uppercase">Promoção</span>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
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
