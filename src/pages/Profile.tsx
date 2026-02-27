import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Award, Settings, LogOut, ChevronRight, History, Store, BarChart3, Package, PlusCircle } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { supabase, Profile as UserProfile } from '@/src/lib/supabase';
import { Login } from '@/src/components/auth/Login';
import { motion } from 'motion/react';

export const Profile = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      // 1. Try to fetch existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && (error.code === 'PGRST116' || error.message.includes('No rows found'))) {
        // 2. Recovery: If profile doesn't exist, try to create it from Auth metadata
        console.log('Profile not found, attempting recovery from metadata...');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const newProfile = {
            id: user.id,
            name: user.user_metadata.name || 'Usuário',
            email: user.email!,
            role: user.user_metadata.role || 'user',
            reputation_score: 0,
          };
          
          const { data: created, error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();
          
          if (!insertError && created) {
            setProfile(created);
            return;
          } else {
            console.error('Failed to recover profile:', insertError);
          }
        }
      }

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isMarket = profile?.role === 'market';

  useEffect(() => {
    if (isMarket && profile?.id) {
      ensureMarketExists(profile.id, profile.name);
    }
  }, [isMarket, profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 pt-12">
        <Login onSuccess={() => {}} />
      </div>
    );
  }

  const ensureMarketExists = async (userId: string, name: string) => {
    try {
      const { data: markets } = await supabase
        .from('markets')
        .select('id')
        .eq('owner_id', userId);
      
      if (!markets || markets.length === 0) {
        console.log('Creating default market for owner...');
        await supabase.from('markets').insert({
          name: `Mercado de ${name}`,
          owner_id: userId,
          address: 'Endereço não configurado',
          lat: -22.88, // Default coord
          lng: -42.02
        });
      }
    } catch (err) {
      console.error('Error ensuring market exists:', err);
    }
  };

  const userMenuItems = [
    { icon: History, label: 'Histórico de contribuições', count: 23 },
    { icon: Award, label: 'Conquistas e Medalhas', count: 4 },
    { icon: Shield, label: 'Segurança e Privacidade', count: null },
    { icon: Settings, label: 'Configurações', count: null },
  ];

  const marketMenuItems = [
    { icon: Package, label: 'Gerenciar Produtos', path: '/market' },
    { icon: PlusCircle, label: 'Adicionar Preços', path: '/contribute' },
    { icon: BarChart3, label: 'Analytics do Mercado', count: 'Novo' },
    { icon: Settings, label: 'Configurações da Loja', count: null },
  ];

  const menuItems = isMarket ? marketMenuItems : userMenuItems;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-24 pt-6 px-4 space-y-8 max-w-lg mx-auto"
    >
      <header className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-4xl font-bold border-4 border-white shadow-lg overflow-hidden">
            {profile?.name ? profile.name[0] : <User size={40} />}
          </div>
          <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full border-2 border-white shadow-sm ${isMarket ? 'bg-blue-500' : 'bg-yellow-400'} text-white`}>
            {isMarket ? <Store size={16} /> : <Award size={16} />}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900">{profile?.name || 'Usuário'}</h1>
            {isMarket && (
              <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Mercado
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">{session.user.email}</p>
        </div>
        
        {!isMarket && (
          <div className="flex flex-col space-y-2 w-full">
            <div className="flex space-x-2 justify-center">
              <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reputação</p>
                <p className="text-lg font-bold text-primary">{profile?.reputation_score || 0} pts</p>
              </div>
              <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nível</p>
                <p className="text-lg font-bold text-secondary">Bronze</p>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mt-4">
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-2">Acesso para Lojistas</p>
              <p className="text-xs text-slate-600 mb-3">Se você é dono de um mercado e sua conta não foi identificada corretamente:</p>
              <Button 
                variant="outline"
                size="sm"
                className="w-full border-blue-200 text-blue-600 hover:bg-blue-100 font-bold"
                onClick={async () => {
                  if (!profile?.id) return;
                  const { error } = await supabase
                    .from('profiles')
                    .update({ role: 'market' })
                    .eq('id', profile.id);
                  if (!error) {
                    alert('Perfil atualizado para Mercado com sucesso!');
                    fetchProfile(profile.id);
                  }
                }}
              >
                Ativar Perfil de Mercado
              </Button>
            </div>
          </div>
        )}
      </header>

      <section className="space-y-4">
        {isMarket ? (
          <Card className="bg-blue-600 text-white p-6">
            <h3 className="font-bold text-lg mb-2">Painel do Parceiro</h3>
            <p className="text-sm text-white/70 mb-4">Mantenha seus preços atualizados para atrair mais clientes para sua loja.</p>
            <Button 
              className="w-full bg-white text-blue-600 hover:bg-white/90 font-bold"
              onClick={() => navigate('/market')}
            >
              Acessar Painel
            </Button>
          </Card>
        ) : (
          <Card className="bg-slate-900 text-white p-6">
            <h3 className="font-bold text-lg mb-2">Benefícios Premium</h3>
            <p className="text-sm text-white/70 mb-4">Como colaborador ativo, você tem acesso a alertas de preço em tempo real.</p>
            <Button className="w-full bg-white text-slate-900 hover:bg-white/90 font-bold">Ver benefícios</Button>
          </Card>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-3">
          {isMarket ? 'Gerenciamento' : 'Minha Conta'}
        </h2>
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => item.path && navigate(item.path)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors active:scale-[0.98]"
          >
            <div className="flex items-center space-x-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isMarket ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-500'}`}>
                <item.icon size={20} />
              </div>
              <span className="font-medium text-slate-700">{item.label}</span>
            </div>
            <div className="flex items-center space-x-2">
              {item.count !== null && item.count !== undefined && (
                <span className={`${isMarket ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'} text-xs font-bold px-2 py-1 rounded-lg`}>
                  {item.count}
                </span>
              )}
              <ChevronRight size={18} className="text-slate-300" />
            </div>
          </button>
        ))}
      </section>

      <Button 
        variant="ghost" 
        className="w-full text-red-500 hover:bg-red-50 hover:text-red-600 font-bold"
        onClick={handleLogout}
      >
        <LogOut size={20} className="mr-2" />
        Sair da conta
      </Button>
    </motion.div>
  );
};
