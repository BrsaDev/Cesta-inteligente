import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Calculator, Search, X, Save } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import Fuse from 'fuse.js';
import { normalizeString } from '@/src/lib/searchUtils';

export const CreateList = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const [listName, setListName] = useState('Compra do mês');
  const [items, setItems] = useState<{ id: string; productId?: string; name: string; quantity: number }[]>([]);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (editId) {
      fetchListForEdit();
    }
  }, [editId]);

  const fetchListForEdit = async () => {
    setIsLoading(true);
    try {
      const { data: listData, error: listError } = await supabase
        .from('shopping_lists')
        .select('name')
        .eq('id', editId)
        .single();
      
      if (listError) throw listError;
      if (listData) setListName(listData.name);

      const { data: itemsData, error: itemsError } = await supabase
        .from('shopping_list_items')
        .select(`
          id,
          quantity,
          product_id,
          products (name)
        `)
        .eq('list_id', editId);
      
      if (itemsError) throw itemsError;

      if (itemsData) {
        setItems(itemsData.map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          name: item.products?.name || 'Produto',
          quantity: item.quantity
        })));
      }
    } catch (error) {
      console.error('Error fetching list for edit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (search.length < 2) {
        setSuggestions([]);
        return;
      }
      const { data } = await supabase
        .from('products')
        .select('id, name')
        .ilike('name', `%${search}%`)
        .limit(5);
      
      if (data) {
        setSuggestions(data);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const fuse = useMemo(() => new Fuse(suggestions, {
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
        .map(r => r.item)
    : [];

  const addItem = (name: string, productId?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setItems([...items, { id, productId, name, quantity: 1 }]);
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

  const handleSave = async () => {
    if (items.length === 0) return;
    
    setIsSaving(true);
    try {
      let listId = editId;

      // 1. Create or Update the list
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (editId) {
        const { error: updateError } = await supabase
          .from('shopping_lists')
          .update({ name: listName })
          .eq('id', editId);
        if (updateError) throw updateError;
      } else {
        const { data: listData, error: listError } = await supabase
          .from('shopping_lists')
          .insert([{ name: listName, user_id: user.id }])
          .select()
          .single();
        if (listError) throw listError;
        listId = listData.id;
      }

      // 2. Prepare items, ensuring all products exist in the DB
      const finalItems = [];
      
      for (const item of items) {
        let pId = item.productId;
        
        if (!pId) {
          const trimmedName = item.name.trim();
          const normalizedInput = normalizeString(trimmedName);
          
          // 1. Try exact/ilike match first
          const { data: exactMatch } = await supabase
            .from('products')
            .select('id, name')
            .ilike('name', trimmedName)
            .maybeSingle();
            
          if (exactMatch) {
            pId = exactMatch.id;
          } else {
            // 2. Try matching with normalized names
            // Fetch products that might match (this is a bit heavy but safer for small catalogs)
            const { data: allProducts } = await supabase
              .from('products')
              .select('id, name');
            
            const fuzzyMatch = allProducts?.find(p => normalizeString(p.name) === normalizedInput);
            
            if (fuzzyMatch) {
              pId = fuzzyMatch.id;
            } else {
              // 3. Create new product if no match found
              const { data: newProd, error: prodError } = await supabase
                .from('products')
                .insert([{ name: trimmedName, category: 'Geral' }])
                .select()
                .single();
              
              if (!prodError && newProd) {
                pId = newProd.id;
              }
            }
          }
        }

        if (pId) {
          finalItems.push({
            list_id: listId,
            product_id: pId,
            quantity: item.quantity
          });
        }
      }

      // 3. Update items (delete old ones if editing)
      if (editId) {
        await supabase.from('shopping_list_items').delete().eq('list_id', editId);
      }

      if (finalItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('shopping_list_items')
          .insert(finalItems);

        if (itemsError) throw itemsError;
      }

      navigate('/mylists');
    } catch (error) {
      console.error('Error saving list:', error);
      navigate('/mylists');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24 pt-6 px-4 space-y-6 max-w-lg mx-auto">
      <header className="flex items-center space-x-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
          <X size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">{editId ? 'Editar lista' : 'Nova lista'}</h1>
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
              {filteredSuggestions.map(s => (
                <button
                  key={s.id}
                  onClick={() => addItem(s.name, s.id)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center justify-between border-b border-slate-50 last:border-0"
                >
                  <div className="flex flex-col">
                    <span className="font-bold">{s.name}</span>
                    <span className="text-[10px] text-primary uppercase font-bold">Produto com preços cadastrados</span>
                  </div>
                  <Plus size={16} className="text-primary" />
                </button>
              ))}
              {!suggestions.some(s => normalizeString(s.name) === normalizeString(search)) && (
                <button
                  onClick={() => addItem(search)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-bold text-slate-400 flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span>Adicionar "{search}"</span>
                    <span className="text-[9px] uppercase font-bold">Item personalizado (sem comparação)</span>
                  </div>
                  <Plus size={16} />
                </button>
              )}
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
        <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto flex space-x-3">
          <Button 
            className="flex-1 h-14 shadow-lg shadow-primary/20"
            onClick={handleSave}
            isLoading={isSaving}
          >
            <Save size={20} className="mr-2" />
            {editId ? 'Salvar alterações' : 'Salvar lista'}
          </Button>
        </div>
      )}
    </div>
  );
};
