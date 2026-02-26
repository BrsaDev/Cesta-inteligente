import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, Info, Search, Store, Tag, AlertCircle, X } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import imageCompression from 'browser-image-compression';
import { motion, AnimatePresence } from 'motion/react';

export const Contribute = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [markets, setMarkets] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [formData, setFormData] = useState({
    productName: '',
    productId: '',
    price: '',
    marketId: '',
  });
  
  const [user, setUser] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/profile');
        return;
      }
      setUser(session.user);
    });
    fetchMarkets();
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (formData.productName.length < 2 || formData.productId) {
        setSuggestions([]);
        return;
      }
      const { data } = await supabase
        .from('products')
        .select('id, name, brand')
        .ilike('name', `%${formData.productName}%`)
        .limit(5);
      
      if (data) setSuggestions(data);
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [formData.productName, formData.productId]);

  const fetchMarkets = async () => {
    const { data } = await supabase.from('markets').select('id, name');
    if (data) setMarkets(data);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      // Compression options
      const options = {
        maxSizeMB: 0.2, // 200KB
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);
      setImageFile(compressedFile);
      setImagePreview(URL.createObjectURL(compressedFile));
    } catch (err) {
      console.error('Compression error:', err);
      setError('Erro ao processar imagem. Tente novamente.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName || !formData.price || !formData.marketId) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let pId = formData.productId;
      
      // 1. Handle Product (Create if not exists)
      if (!pId) {
        const { data: existingProd } = await supabase
          .from('products')
          .select('id')
          .ilike('name', formData.productName)
          .single();
          
        if (existingProd) {
          pId = existingProd.id;
        } else {
          const { data: newProd, error: prodError } = await supabase
            .from('products')
            .insert([{ name: formData.productName, category: 'Geral' }])
            .select()
            .single();
          
          if (prodError) throw prodError;
          pId = newProd.id;
        }
      }

      // 2. Handle Image Upload to Storage
      let proofUrl = '';
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `proofs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
          
        proofUrl = urlData.publicUrl;
      }

      // 3. Insert Price
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error: priceError } = await supabase
        .from('prices')
        .insert([{
          product_id: pId,
          market_id: formData.marketId,
          price: parseFloat(formData.price.replace(',', '.')),
          source_type: 'user',
          has_proof: !!proofUrl,
          proof_url: proofUrl || null,
          created_by: user.id,
          expires_at: expiresAt.toISOString(),
          is_active: true
        }]);

      if (priceError) throw priceError;

      // 4. Increment Reputation
      const points = proofUrl ? 50 : 10;
      const { data: profile } = await supabase
        .from('profiles')
        .select('reputation_score')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        await supabase
          .from('profiles')
          .update({ reputation_score: (profile.reputation_score || 0) + points })
          .eq('id', user.id);
      }

      navigate('/');
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.message || 'Ocorreu um erro ao enviar o preço.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 space-y-6 max-w-lg mx-auto min-h-screen bg-slate-50">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Informar preço</h1>
        <p className="text-sm text-slate-500">Ajude a comunidade e ganhe pontos de reputação.</p>
      </header>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start space-x-3 text-red-600"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="text-xs font-medium">{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4">
          <div className="relative">
            <Input 
              label="Produto" 
              placeholder="Ex: Arroz 5kg" 
              value={formData.productName}
              onChange={(e) => {
                setFormData({ ...formData, productName: e.target.value, productId: '' });
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              icon={<Search size={18} />}
              required 
            />
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 z-20 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
                >
                  {suggestions.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, productName: s.name, productId: s.id });
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center justify-between border-b border-slate-50 last:border-0"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold">{s.name}</span>
                        {s.brand && <span className="text-[10px] text-slate-400 uppercase">{s.brand}</span>}
                      </div>
                      <Tag size={14} className="text-primary" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Input 
            label="Preço (R$)" 
            placeholder="0,00" 
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required 
          />
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1 flex items-center">
              <Store size={12} className="mr-1" /> Mercado
            </label>
            <select 
              value={formData.marketId}
              onChange={(e) => setFormData({ ...formData, marketId: e.target.value })}
              className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all appearance-none"
              required
            >
              <option value="">Selecionar mercado</option>
              {markets.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">Adicionar prova (Opcional)</h2>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">+50 pts</span>
          </div>
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <Card 
            className={`border-dashed border-2 flex flex-col items-center justify-center py-8 transition-all relative overflow-hidden ${imagePreview ? 'border-primary bg-green-50' : 'border-slate-200'}`}
            onClick={() => !imagePreview && fileInputRef.current?.click()}
            hoverable={!imagePreview}
          >
            {imagePreview ? (
              <div className="w-full h-full flex flex-col items-center">
                <div className="relative h-32 w-32 rounded-2xl overflow-hidden mb-3 shadow-md">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full backdrop-blur-sm"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="text-sm font-bold text-primary flex items-center">
                  <CheckCircle2 size={16} className="mr-1" /> Imagem capturada!
                </p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Imagem otimizada para envio</p>
              </div>
            ) : (
              <>
                <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <Camera size={28} />
                </div>
                <p className="text-sm font-bold text-slate-700">Tirar foto do preço</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Garanta que o valor esteja legível</p>
              </>
            )}
          </Card>

          <div className="bg-blue-50 p-4 rounded-2xl flex items-start space-x-3">
            <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Preços com prova fotográfica têm prioridade no sistema e ajudam a evitar conflitos.
            </p>
          </div>
        </section>

        <Button type="submit" className="w-full h-14 shadow-lg shadow-primary/20" isLoading={isLoading}>
          Enviar preço
        </Button>
      </form>
    </div>
  );
};
