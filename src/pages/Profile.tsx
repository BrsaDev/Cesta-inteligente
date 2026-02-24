import { useState } from 'react';
import { User, Shield, Award, Settings, LogOut, ChevronRight, History } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';

export const Profile = () => {
  const [user] = useState({
    name: 'Bruno',
    email: 'bruno@exemplo.com',
    reputation: 120,
    contributions: 23,
    proofs: 12,
  });

  const menuItems = [
    { icon: History, label: 'Histórico de contribuições', count: user.contributions },
    { icon: Award, label: 'Conquistas e Medalhas', count: 4 },
    { icon: Shield, label: 'Segurança e Privacidade', count: null },
    { icon: Settings, label: 'Configurações', count: null },
  ];

  return (
    <div className="pb-24 pt-6 px-4 space-y-8 max-w-lg mx-auto">
      <header className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-4xl font-bold border-4 border-white shadow-lg">
            {user.name[0]}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white p-1.5 rounded-full border-2 border-white shadow-sm">
            <Award size={16} />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        <div className="flex space-x-2">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reputação</p>
            <p className="text-lg font-bold text-primary">{user.reputation} pts</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Provas</p>
            <p className="text-lg font-bold text-secondary">{user.proofs}</p>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <Card className="bg-slate-900 text-white p-6">
          <h3 className="font-bold text-lg mb-2">Benefícios Premium</h3>
          <p className="text-sm text-white/70 mb-4">Como colaborador ativo, você tem acesso a alertas de preço em tempo real.</p>
          <Button className="w-full bg-white text-slate-900 hover:bg-white/90">Ver benefícios</Button>
        </Card>
      </section>

      <section className="space-y-2">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors active:scale-[0.98]"
          >
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <item.icon size={20} />
              </div>
              <span className="font-medium text-slate-700">{item.label}</span>
            </div>
            <div className="flex items-center space-x-2">
              {item.count !== null && (
                <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded-lg">
                  {item.count}
                </span>
              )}
              <ChevronRight size={18} className="text-slate-300" />
            </div>
          </button>
        ))}
      </section>

      <Button variant="ghost" className="w-full text-red-500 hover:bg-red-50 hover:text-red-600">
        <LogOut size={20} className="mr-2" />
        Sair da conta
      </Button>
    </div>
  );
};
