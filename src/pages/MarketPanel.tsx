import React, { useState, useRef } from 'react';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { 
  Plus, 
  Upload, 
  Download,
  Edit2, 
  Zap, 
  Trash2, 
  Save, 
  X, 
  ChevronLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Camera
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { formatCurrency } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface MarketProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  category: string;
  imageUrl?: string;
  flashSaleEndsAt?: string;
}

const PRODUCT_IMAGES: Record<string, string[]> = {
  'leite': ['🥛', 'https://images.unsplash.com/photo-1563636619-e9107da5a1bb?w=400&h=400&fit=crop'],
  'arroz': ['🍚', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop'],
  'feijao': ['🥘', 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&h=400&fit=crop'],
  'cafe': ['☕', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop'],
  'carne': ['🥩', 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop'],
  'pao': ['🍞', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop'],
  'massa': ['🍝', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=400&fit=crop'],
  'biscoito': ['🍪', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop'],
  'frango': ['🍗', 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&h=400&fit=crop'],
  'fruta': ['🍎', 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=400&fit=crop'],
  'limpeza': ['🧼', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=400&fit=crop'],
  'cerveja': ['🍺', 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop'],
  'refrigerante': ['🥤', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop'],
  'suco': ['🧃', 'https://images.unsplash.com/photo-1600271886399-0a452b3b4603?w=400&h=400&fit=crop'],
  'vinho': ['🍷', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop'],
  'queijo': ['🧀', 'https://images.unsplash.com/photo-1486297678162-ad2a19b05840?w=400&h=400&fit=crop'],
  'ovo': ['🥚', 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&h=400&fit=crop'],
  'manteiga': ['🧈', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=400&fit=crop'],
  'iogurte': ['🍦', 'https://images.unsplash.com/photo-1564049489314-60d154ff107d?w=400&h=400&fit=crop'],
  'oleo': ['🧴', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop'],
  'açucar': ['🍬', 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=400&h=400&fit=crop'],
  'sal': ['🧂', 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400&h=400&fit=crop'],
  'macarrao': ['🍝', 'https://images.unsplash.com/photo-1551462147-3ed3077555d1?w=400&h=400&fit=crop'],
  'molho': ['🥫', 'https://images.unsplash.com/photo-1590779033100-9f60705a2f3b?w=400&h=400&fit=crop'],
  'shampoo': ['🧴', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop'],
  'sabonete': ['🧼', 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=400&h=400&fit=crop'],
  'papel': ['🧻', 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=400&h=400&fit=crop'],
  'detergente': ['🧼', 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=400&h=400&fit=crop'],
  'peixe': ['🐟', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=400&fit=crop'],
  'sorvete': ['🍦', 'https://images.unsplash.com/photo-1501443762994-82bd5dabb892?w=400&h=400&fit=crop'],
  'chocolate': ['🍫', 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=400&fit=crop'],
  'snack': ['🍿', 'https://images.unsplash.com/photo-1599490659213-e2b9527bb087?w=400&h=400&fit=crop'],
  'vegetal': ['🥦', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop'],
  'batata': ['🥔', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=400&fit=crop'],
  'tomate': ['🍅', 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=400&h=400&fit=crop'],
  'cebola': ['🧅', 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400&h=400&fit=crop'],
  'alho': ['🧄', 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400&h=400&fit=crop'],
  'amaciante': ['🧴', 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400&h=400&fit=crop'],
  'fralda': ['👶', 'https://images.unsplash.com/photo-1544126592-807daa2b565b?w=400&h=400&fit=crop'],
  'higiene': ['🪥', 'https://images.unsplash.com/photo-1559594882-7b551c32c1e6?w=400&h=400&fit=crop'],
  'pet': ['🐶', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop'],
  'azeite': ['🫒', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop'],
  'farinha': ['🌾', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop'],
  'pipoca': ['🍿', 'https://images.unsplash.com/photo-1578912914358-012376742a81?w=400&h=400&fit=crop'],
  'presunto': ['🥓', 'https://images.unsplash.com/photo-1524438418049-ab2acb7aa48f?w=400&h=400&fit=crop'],
  'salame': ['🍕', 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=400&h=400&fit=crop'],
  'requeijao': ['🧀', 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=400&h=400&fit=crop'],
  'geleia': ['🍯', 'https://images.unsplash.com/photo-1584586129857-31f183ad9157?w=400&h=400&fit=crop'],
  'mel': ['🍯', 'https://images.unsplash.com/photo-1584586129857-31f183ad9157?w=400&h=400&fit=crop'],
  'granola': ['🥣', 'https://images.unsplash.com/photo-1517093157656-b99917c6471c?w=400&h=400&fit=crop'],
  'aveia': ['🥣', 'https://images.unsplash.com/photo-1517093157656-b99917c6471c?w=400&h=400&fit=crop'],
  'milho': ['🌽', 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=400&fit=crop'],
  'ervilha': ['🟢', 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&h=400&fit=crop'],
  'sardinha': ['🐟', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=400&fit=crop'],
  'atum': ['🐟', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=400&fit=crop'],
  'maionese': ['🧴', 'https://images.unsplash.com/photo-1563636619-e9107da5a1bb?w=400&h=400&fit=crop'],
  'ketchup': ['🍅', 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=400&h=400&fit=crop'],
  'mostarda': ['🌭', 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=400&h=400&fit=crop'],
  'leite condensado': ['🥛', 'https://images.unsplash.com/photo-1563636619-e9107da5a1bb?w=400&h=400&fit=crop'],
  'creme de leite': ['🥛', 'https://images.unsplash.com/photo-1563636619-e9107da5a1bb?w=400&h=400&fit=crop'],
  'achocolatado': ['🍫', 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=400&fit=crop'],
  'fermento': ['🍞', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop'],
  'gelatina': ['🍧', 'https://images.unsplash.com/photo-1501443762994-82bd5dabb892?w=400&h=400&fit=crop'],
  'tempero': ['🧂', 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400&h=400&fit=crop'],
  'vinagre': ['🧴', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop'],
  'azeitona': ['🫒', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop'],
  'palmito': ['🎋', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop'],
  'cogumelo': ['🍄', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop'],
};

const getSuggestedImage = (name: string): string => {
  const lowerName = name.toLowerCase();
  for (const [key, values] of Object.entries(PRODUCT_IMAGES)) {
    if (lowerName.includes(key)) return values[1];
  }
  return `https://picsum.photos/seed/${encodeURIComponent(name)}/400/400`;
};

export const MarketPanel = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [flashSaleModalId, setFlashSaleModalId] = useState<string | null>(null);
  const [flashSaleDuration, setFlashSaleDuration] = useState('2'); // Default 2 hours
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Produtos');

    // Define columns
    worksheet.columns = [
      { header: 'nome do produto', key: 'name', width: 35 },
      { header: 'marca', key: 'brand', width: 20 },
      { header: 'preco', key: 'price', width: 15 },
      { header: 'categoria', key: 'category', width: 20 },
    ];

    // Style the header
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF22C55E' }, // System Green
      };
      cell.font = {
        name: 'Roboto',
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 12,
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    headerRow.height = 25;

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'modelo_produtos_compra_inteligente.xlsx';
    anchor.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('success', 'Modelo Excel baixado com sucesso!');
  };

  // Mock data for the market
  const [products, setProducts] = useState<MarketProduct[]>([
    { id: '1', name: 'Leite Integral 1L', brand: 'Parmalat', price: 4.50, category: 'Laticínios', imageUrl: getSuggestedImage('Leite') },
    { id: '2', name: 'Feijão Carioca 1kg', brand: 'Kicaldo', price: 8.90, category: 'Grãos', imageUrl: getSuggestedImage('Feijão'), flashSaleEndsAt: new Date(Date.now() + 3600000).toISOString() },
    { id: '3', name: 'Arroz Branco 5kg', brand: 'Tio João', price: 22.90, category: 'Grãos', imageUrl: getSuggestedImage('Arroz') },
  ]);

  const [formData, setFormData] = useState<Partial<MarketProduct>>({
    name: '',
    brand: '',
    price: 0,
    category: '',
    imageUrl: ''
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = () => {
    if (!formData.name || formData.price === undefined) return;

    const finalImageUrl = formData.imageUrl || getSuggestedImage(formData.name);

    if (editingId) {
      setProducts(products.map(p => p.id === editingId ? { ...p, ...formData, imageUrl: finalImageUrl } as MarketProduct : p));
      showNotification('success', 'Produto atualizado com sucesso!');
    } else {
      const newProduct: MarketProduct = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name!,
        brand: formData.brand || '',
        price: formData.price!,
        category: formData.category || 'Geral',
        imageUrl: finalImageUrl
      };
      setProducts([newProduct, ...products]);
      showNotification('success', 'Produto adicionado com sucesso!');
    }
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', brand: '', price: 0, category: '', imageUrl: '' });
  };

  const parsePrice = (value: any): number => {
    if (typeof value === 'number') return value;
    if (value === null || value === undefined) return 0;
    
    let str = value.toString().trim();
    if (!str) return 0;

    // Remove currency symbols and spaces
    str = str.replace(/[R$\s]/g, '');
    
    // Brazilian format check: 1.234,56
    // If it has both, we assume . is thousand and , is decimal
    if (str.includes('.') && str.includes(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } 
    // Simple decimal comma: 4,99
    else if (str.includes(',') && !str.includes('.')) {
      str = str.replace(',', '.');
    }
    // If it only has a dot, we assume it's already a decimal point (e.g., 4.99)
    
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Read as array to better handle encoding and binary data
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // raw: true ensures we get the original values without XLSX's locale-based number parsing
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true });
      
      const imported: MarketProduct[] = [];
      jsonData.slice(1).forEach((row: any) => {
        const name = row[0]?.toString().trim();
        const brand = row[1]?.toString().trim();
        const priceVal = row[2];
        const category = row[3]?.toString().trim();

        if (name && (priceVal !== null && priceVal !== undefined)) {
          imported.push({
            id: Math.random().toString(36).substr(2, 9),
            name,
            brand: brand || '',
            price: parsePrice(priceVal),
            category: category || 'Geral',
            imageUrl: getSuggestedImage(name)
          });
        }
      });

      if (imported.length > 0) {
        setProducts(prev => [...imported, ...prev]);
        showNotification('success', `${imported.length} produtos importados!`);
      } else {
        showNotification('error', 'Nenhum produto válido encontrado no arquivo.');
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      showNotification('error', 'Erro ao processar o arquivo. Verifique o formato e a codificação (UTF-8).');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleFlashSale = (id: string, durationHours?: number) => {
    setProducts(products.map(p => {
      if (p.id === id) {
        if (p.flashSaleEndsAt) return { ...p, flashSaleEndsAt: undefined };
        const endsAt = new Date(Date.now() + (durationHours || 2) * 3600000).toISOString();
        return { ...p, flashSaleEndsAt: endsAt };
      }
      return p;
    }));
    setFlashSaleModalId(null);
    showNotification('success', 'Status da promoção alterado!');
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-24 pt-6 px-4 space-y-6 max-w-2xl mx-auto">
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Painel do Mercado</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Mercado Central • Cabo Frio</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".csv, .xlsx" 
            className="hidden" 
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadTemplate}
            className="border-slate-200 text-slate-600 px-2 sm:px-4"
            title="Baixar Modelo Excel"
          >
            <Download size={16} className="sm:mr-2" />
            <span className="hidden sm:inline">Modelo</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            className="border-slate-200 text-slate-600 px-2 sm:px-4"
          >
            <Upload size={16} className="sm:mr-2" />
            <span className="hidden sm:inline">Importar</span>
          </Button>
          <Button size="sm" onClick={() => setIsAdding(true)} className="px-2 sm:px-4">
            <Plus size={16} className="sm:mr-2" />
            <span className="hidden sm:inline">Novo</span>
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-green-50 border-none">
          <p className="text-[10px] font-bold text-green-600 uppercase">Total Produtos</p>
          <p className="text-2xl font-bold text-green-700">{products.length}</p>
        </Card>
        <Card className="p-4 bg-blue-50 border-none">
          <p className="text-[10px] font-bold text-blue-600 uppercase">Promoções Ativas</p>
          <p className="text-2xl font-bold text-blue-700">{products.filter(p => p.flashSaleEndsAt).length}</p>
        </Card>
        <Card className="p-4 bg-orange-50 border-none">
          <p className="text-[10px] font-bold text-orange-600 uppercase">Visualizações</p>
          <p className="text-2xl font-bold text-orange-700">1.2k</p>
        </Card>
      </section>

      <div className="relative">
        <Input 
          placeholder="Buscar nos seus produtos..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={18} />}
        />
      </div>

      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Seus Produtos</h2>
          <span className="text-[10px] font-bold text-slate-400">{filteredProducts.length} itens</span>
        </div>

        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-100 cursor-pointer hover:ring-2 hover:ring-primary transition-all ${product.flashSaleEndsAt ? 'ring-2 ring-orange-500 ring-offset-2' : ''}`}
                    onClick={() => {
                      setEditingId(product.id);
                      setFormData(product);
                      setIsAdding(true);
                    }}
                  >
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="bg-slate-100 text-slate-500 text-xl font-bold w-full h-full flex items-center justify-center">
                        {product.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{product.name}</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 truncate">{product.brand} • {product.category}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end sm:space-x-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                  <div className="sm:text-right">
                    <p className="text-base sm:text-lg font-bold text-primary">{formatCurrency(product.price)}</p>
                    {product.flashSaleEndsAt && (
                      <span className="text-[8px] sm:text-[9px] font-bold text-orange-500 uppercase animate-pulse">Relâmpago Ativo</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <button 
                      onClick={() => {
                        if (product.flashSaleEndsAt) {
                          toggleFlashSale(product.id);
                        } else {
                          setFlashSaleModalId(product.id);
                        }
                      }}
                      className={`p-2 rounded-lg transition-colors ${product.flashSaleEndsAt ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-orange-100 hover:text-orange-500'}`}
                      title="Promoção Relâmpago"
                    >
                      <Zap size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        setEditingId(product.id);
                        setFormData(product);
                        setIsAdding(true);
                      }}
                      className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-blue-100 hover:text-blue-500 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => setProducts(products.filter(p => p.id !== product.id))}
                      className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-red-100 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Flash Sale Duration Modal */}
      <AnimatePresence>
        {flashSaleModalId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Zap size={24} fill="currentColor" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Duração da Promoção</h3>
                <p className="text-xs text-slate-500">Por quanto tempo o preço relâmpago ficará ativo?</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '4', '8', '12', '24'].map(h => (
                  <button
                    key={h}
                    onClick={() => setFlashSaleDuration(h)}
                    className={`py-3 rounded-xl text-sm font-bold transition-all ${
                      flashSaleDuration === h 
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>

              <div className="flex space-x-3">
                <Button variant="outline" className="flex-1" onClick={() => setFlashSaleModalId(null)}>
                  Cancelar
                </Button>
                <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={() => toggleFlashSale(flashSaleModalId, parseInt(flashSaleDuration))}>
                  Ativar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-900">
                    {editingId ? 'Editar Produto' : 'Novo Produto'}
                  </h3>
                  <button onClick={() => setIsAdding(false)} className="p-2 text-slate-400 hover:text-slate-900">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="h-20 w-20 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 cursor-pointer hover:border-primary transition-colors relative group"
                      onClick={() => setIsImageGalleryOpen(true)}
                    >
                      {formData.imageUrl ? (
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <ImageIcon className="text-slate-400" size={24} />
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" size={20} />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-bold text-slate-900">Imagem do Produto</p>
                      <p className="text-xs text-slate-500">Clique para selecionar da galeria ou sugerir automaticamente.</p>
                      <Button variant="ghost" size="sm" className="text-primary h-8 p-0" onClick={() => setFormData({...formData, imageUrl: getSuggestedImage(formData.name || '')})}>
                        Sugerir Automático
                      </Button>
                    </div>
                  </div>

                  <Input 
                    label="Nome do Produto" 
                    placeholder="Ex: Arroz Branco 5kg" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="Marca" 
                      placeholder="Ex: Tio João" 
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    />
                    <Input 
                      label="Preço (R$)" 
                      placeholder="0,00" 
                      value={formData.price !== undefined ? formData.price.toString().replace('.', ',') : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Allow typing commas and dots
                        if (val === '' || /^[0-9R$\s,.]*$/.test(val)) {
                          setFormData({ ...formData, price: parsePrice(val) });
                        }
                      }}
                    />
                  </div>
                  <Input 
                    label="Categoria" 
                    placeholder="Ex: Grãos" 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setIsAdding(false)}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={handleSave}>
                    <Save size={18} className="mr-2" />
                    Salvar
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Gallery Modal */}
      <AnimatePresence>
        {isImageGalleryOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">Galeria de Imagens</h3>
                <button onClick={() => setIsImageGalleryOpen(false)} className="p-2 text-slate-400 hover:text-slate-900">
                  <X size={24} />
                </button>
              </div>
                            <div className="p-6 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-3">
                {Object.entries(PRODUCT_IMAGES).map(([key, img], idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, imageUrl: img[1] }));
                      setIsImageGalleryOpen(false);
                      // If we were editing from the list, make sure the modal is open
                      setIsAdding(true);
                    }}
                    className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center p-1 bg-slate-50 ${
                      formData.imageUrl === img[1] ? 'border-primary ring-2 ring-primary/20' : 'border-slate-100'
                    }`}
                  >
                    <img src={img[1]} alt={key} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                    <span className="text-[8px] font-bold uppercase mt-1 text-slate-400 truncate w-full text-center">{key}</span>
                  </button>
                ))}
                {/* Random placeholders for variety */}
                {[...Array(12)].map((_, i) => {
                  const url = `https://picsum.photos/seed/item-${i + 20}/400/400`;
                  return (
                    <button
                      key={`random-${i}`}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, imageUrl: url }));
                        setIsImageGalleryOpen(false);
                      }}
                      className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${
                        formData.imageUrl === url ? 'border-primary ring-2 ring-primary/20' : 'border-slate-100'
                      }`}
                    >
                      <img src={url} alt="Random item" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  );
                })}
              </div>
              
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <Input 
                  placeholder="URL da imagem personalizada..." 
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="bg-white"
                />
                <div className="flex space-x-3 mt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setIsImageGalleryOpen(false)}>
                    Fechar
                  </Button>
                  <Button className="flex-1" onClick={() => setIsImageGalleryOpen(false)}>
                    Confirmar
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-24 left-4 right-4 max-w-sm mx-auto p-4 rounded-2xl shadow-xl flex items-center space-x-3 z-50 ${
              notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <p className="text-sm font-bold">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
