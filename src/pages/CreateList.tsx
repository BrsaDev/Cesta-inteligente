import { useState, useMemo } from 'react';
import { Plus, Trash2, Calculator, Search, X } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import Fuse from 'fuse.js';
import { normalizeString } from '@/src/lib/searchUtils';
import { PRODUCTS } from '../data/mockData';

export const CreateList = () => {
  const navigate = useNavigate();
  const [listName, setListName] = useState('Compra do mês');
  const [items, setItems] = useState<{ id: string; name: string; quantity: number }[]>([]);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const suggestions = useMemo(() => PRODUCTS.map(p => p.name), []);

  const fuse = useMemo(() => new Fuse(suggestions.map(s => ({ name: s })), {
    keys: ['name'],
    threshold: 0.2,
    distance: 100,
    minMatchCharLength: 3,
    includeScore: true,
    ignoreLocation: true,
    getFn: (obj, path) => {
      const value = (obj as any)[path as string];
      return typeof value === 'string' ? normalizeString(value) : value;
    }
  }), [suggestions]);

  const filteredSuggestions = search 
    ? fuse.search(normalizeString(search))
        .filter(r => {
          if (r.score && r.score > 0.1) {
            const name = normalizeString(r.item.name);
            const query = normalizeString(search);
            return name.split(/\s+/).some(word => word.startsWith(query));
          }
          return true;
        })
        .map(r => r.item.name)
    : [];

  const addItem = (name: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setItems([...items, { id, name, quantity: 1 }]);
    setSearch('');
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const handleCalculate = async () => {
    if (items.length === 0) return;
    
    setIsSaving(true);
    try {
      // 1. Create the list
      const { data: listData, error: listError } = await supabase
        .from('shopping_lists')
        .insert([{ name: listName, user_id: 'temp-user-id' }]) // In a real app, use auth user id
        .select()
        .single();

      if (listError) throw listError;

      // 2. Add items (mocking product_id for now as we don't have a full product DB yet)
      const listItems = items.map(item => ({
        list_id: listData.id,
        product_id: 'temp-product-id', // This would be a real ID from search
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('shopping_list_items')
        .insert(listItems);

      if (itemsError) throw itemsError;

      navigate(`/results?listId=${listData.id}`);
    } catch (error) {
      console.error('Error saving list:', error);
      // Still navigate for demo purposes if Supabase fails
      navigate('/results');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 space-y-6 max-w-lg mx-auto">
      <header className="flex items-center space-x-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
          <X size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Nova lista</h1>
      </header>

      <section className="space-y-4">
        <Input 
          label="Nome da lista"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          placeholder="Ex: Compra do mês"
        />

        <div className="relative">
          <Input 
            placeholder="Adicionar produto..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && search.trim()) {
                addItem(search.trim());
              }
            }}
            icon={<Search size={18} />}
          />
          {search && (
            <div className="absolute top-full left-0 right-0 z-20 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
              {!suggestions.some(s => normalizeString(s) === normalizeString(search)) && (
                <button
                  onClick={() => addItem(search)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-bold text-primary flex items-center justify-between border-b border-slate-50"
                >
                  <span>Adicionar "{search}"</span>
                  <Plus size={16} />
                </button>
              )}
              {filteredSuggestions.map(s => (
                <button
                  key={s}
                  onClick={() => addItem(s)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center justify-between"
                >
                  {s}
                  <Plus size={16} className="text-primary" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">Itens adicionados</h2>
        <AnimatePresence initial={false}>
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">Sua lista está vazia.</p>
              <p className="text-xs mt-1">Adicione produtos acima para começar.</p>
            </div>
          ) : (
            items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="flex items-center justify-between p-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center text-primary">
                      ✔
                    </div>
                    <span className="font-medium text-slate-900">{item.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center bg-slate-100 rounded-xl px-2 py-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-500 hover:text-slate-900">-</button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-slate-500 hover:text-slate-900">+</button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </section>

      {items.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto">
          <Button 
            className="w-full h-14 shadow-lg shadow-primary/20"
            onClick={handleCalculate}
            isLoading={isSaving}
          >
            <Calculator size={20} className="mr-2" />
            Calcular melhor compra
          </Button>
        </div>
      )}
    </div>
  );
};
