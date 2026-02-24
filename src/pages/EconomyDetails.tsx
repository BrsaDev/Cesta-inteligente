import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingDown, Calendar, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { formatCurrency } from '@/src/lib/utils';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const EconomyDetails = () => {
  const navigate = useNavigate();

  const data = [
    { name: 'Sem 1', value: 12 },
    { name: 'Sem 2', value: 18 },
    { name: 'Sem 3', value: 8 },
    { name: 'Sem 4', value: 10 },
  ];

  const history = [
    { id: '1', date: '22 Fev', list: 'Compra Semanal', savings: 12.40, total: 145.20 },
    { id: '2', date: '15 Fev', list: 'Churrasco FDS', savings: 18.20, total: 89.50 },
    { id: '3', date: '08 Fev', list: 'Higiene e Limpeza', savings: 8.50, total: 67.80 },
    { id: '4', date: '01 Fev', list: 'Frutas e Verduras', savings: 10.10, total: 42.30 },
  ];

  return (
    <div className="pb-24 pt-6 px-4 space-y-6 max-w-lg mx-auto">
      <header className="flex items-center space-x-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Detalhes da Economia</h1>
      </header>

      {/* Summary Card */}
      <section>
        <Card className="bg-slate-900 text-white p-6 border-none">
          <div className="flex items-center space-x-2 mb-4">
            <div className="p-2 bg-primary/20 rounded-lg">
              <TrendingDown size={20} className="text-primary" />
            </div>
            <span className="text-sm font-medium text-white/70">Economia Total (Fevereiro)</span>
          </div>
          <h2 className="text-4xl font-bold">R$ 48,20</h2>
          <p className="text-xs text-white/50 mt-2 flex items-center">
            <ArrowUpRight size={12} className="mr-1 text-primary" />
            <span className="text-primary font-bold">15% mais</span> que no mês passado
          </p>
        </Card>
      </section>

      {/* Chart Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">Economia por semana</h3>
        <Card className="p-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xl">
                        {formatCurrency(payload[0].value as number)}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 1 ? '#22c55e' : '#e2e8f0'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      {/* History List */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">Histórico de Listas</h3>
        <div className="space-y-3">
          {history.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-4 flex items-center justify-between" hoverable>
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{item.list}</h4>
                    <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase mt-1">
                      <Calendar size={10} className="mr-1" />
                      {item.date}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">-{formatCurrency(item.savings)}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Total: {formatCurrency(item.total)}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <Button variant="outline" className="w-full">
        Exportar relatório (PDF)
      </Button>
    </div>
  );
};
