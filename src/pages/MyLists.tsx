import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, ShoppingBag, Calendar, Trash2 } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { supabase, ShoppingList } from '@/src/lib/supabase';
import { motion } from 'motion/react';

export const MyLists = () => {
  const navigate = useNavigate();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLists(data || []);
    } catch (error) {
      console.error('Error fetching lists:', error);
      // Fallback mock data if Supabase is not configured
      setLists([
        { id: '1', name: 'Compra do mês', user_id: '1', created_at: new Date().toISOString() },
        { id: '2', name: 'Churrasco FDS', user_id: '1', created_at: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const deleteList = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setLists(lists.filter(l => l.id !== id));
    } catch (error) {
      console.error('Error deleting list:', error);
      setLists(lists.filter(l => l.id !== id)); // Optimistic delete for demo
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 space-y-6 max-w-lg mx-auto">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Minhas listas</h1>
        <Button size="sm" onClick={() => navigate('/lists/new')}>
          <Plus size={18} className="mr-1" /> Novo
        </Button>
      </header>

      <section className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">Nenhuma lista encontrada</p>
            <p className="text-xs mt-1">Crie sua primeira lista para economizar.</p>
            <Button variant="outline" className="mt-6" onClick={() => navigate('/lists/new')}>
              Criar lista agora
            </Button>
          </div>
        ) : (
          lists.map((list, idx) => (
            <motion.div
              key={list.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="p-4 flex items-center justify-between" hoverable onClick={() => navigate(`/results?listId=${list.id}`)}>
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{list.name}</h3>
                    <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase mt-1">
                      <Calendar size={10} className="mr-1" />
                      {new Date(list.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteList(list.id);
                    }}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                  <ChevronRight size={20} className="text-slate-300" />
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </section>
    </div>
  );
};
