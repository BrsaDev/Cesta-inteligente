import { formatCurrency } from '../lib/utils';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl?: string;
}

export interface MarketPrice {
  marketId: string;
  marketName: string;
  price: number;
  updatedAt: string;
  hasProof?: boolean;
}

export interface Market {
  id: string;
  name: string;
  address: string;
  reputation: number;
}

const PRODUCT_NAMES = [
  "Arroz Branco 5kg", "Feijão Carioca 1kg", "Açúcar Refinado 1kg", "Café Torrado 500g", "Óleo de Soja 900ml",
  "Leite Integral 1L", "Macarrão Espaguete 500g", "Farinha de Trigo 1kg", "Sal Refinado 1kg", "Manteiga com Sal 200g",
  "Ovos Brancos 12un", "Pão de Forma 500g", "Queijo Muçarela 200g", "Presunto Cozido 200g", "Iogurte Natural 170g",
  "Sabão em Pó 1kg", "Detergente Líquido 500ml", "Desinfetante 1L", "Papel Higiênico 12un", "Creme Dental 90g",
  "Shampoo 400ml", "Sabonete Barra 90g", "Amaciante 2L", "Esponja de Aço 3un", "Saco de Lixo 50L 10un",
  "Biscoito Recheado 130g", "Chocolate em Barra 90g", "Refrigerante Cola 2L", "Suco de Caixa 1L", "Cerveja Lata 350ml",
  "Batata Inglesa 1kg", "Cebola 1kg", "Tomate 1kg", "Alho 100g", "Banana Prata 1kg",
  "Maçã Gala 1kg", "Laranja Pera 1kg", "Frango Inteiro 1kg", "Carne Moída 500g", "Bife de Alcatra 1kg",
  "Peito de Frango 1kg", "Salsicha Hot Dog 500g", "Mortadela 200g", "Maionese 500g", "Ketchup 400g",
  "Mostarda 200g", "Extrato de Tomate 300g", "Milho Verde Lata 170g", "Ervilha Lata 170g", "Sardinha em Lata 125g",
  "Atum em Pedaços 170g", "Azeite de Oliva 500ml", "Vinagre de Álcool 500ml", "Tempero Completo 300g", "Gelatina em Pó 25g",
  "Achocolatado em Pó 400g", "Leite Condensado 395g", "Creme de Leite 200g", "Farinha de Mandioca 500g", "Pipoca 500g",
  "Lasanha Congelada 600g", "Pizza Congelada 400g", "Hambúrguer de Carne 672g", "Nuggets de Frango 300g", "Batata Palito Congelada 400g",
  "Sorvete 1.5L", "Margarina 500g", "Requeijão Cremoso 200g", "Geleia de Frutas 300g", "Mel de Abelha 250g",
  "Granola 500g", "Aveia em Flocos 200g", "Cereal Matinal 300g", "Chá em Saquinhos 15un", "Água Mineral 1.5L",
  "Vinho Tinto 750ml", "Vodka 1L", "Whisky 750ml", "Energético 250ml", "Água de Coco 1L",
  "Ração para Cães 1kg", "Ração para Gatos 1kg", "Areia Sanitária 4kg", "Petisco para Cães 100g", "Shampoo para Pets 500ml",
  "Escova de Dente 1un", "Fio Dental 50m", "Enxaguante Bucal 500ml", "Desodorante Aerosol 150ml", "Carga de Barbear 2un",
  "Absorvente 8un", "Fralda Descartável P 30un", "Lenço Umedecido 50un", "Talco para Bebê 200g", "Sabonete Líquido Infantil 200ml",
  "Lustra Móveis 200ml", "Água Sanitária 1L", "Limpador Multiuso 500ml", "Inseticida Aerosol 300ml", "Vela de Aniversário 10un"
];

const BRANDS = ["Qualitá", "Nestlé", "Sadia", "Perdigão", "Omo", "Colgate", "Coca-Cola", "Ambev", "Seara", "Pilão"];
const CATEGORIES = ["Mercearia", "Laticínios", "Limpeza", "Higiene", "Bebidas", "Hortifruti", "Carnes", "Pet Shop", "Bebê"];

export const MARKETS: Market[] = [
  { id: 'm1', name: 'Barcelos', address: 'Rua das Flores, 123 - Centro', reputation: 4.5 },
  { id: 'm2', name: 'Lufelana', address: 'Av. Brasil, 456 - São Cristóvão', reputation: 4.2 },
  { id: 'm3', name: 'Bons Frutos', address: 'Rua do Sol, 789 - Braga', reputation: 4.8 },
];

export const PRODUCTS: Product[] = PRODUCT_NAMES.map((name, index) => ({
  id: `p${index + 1}`,
  name,
  brand: BRANDS[index % BRANDS.length],
  category: CATEGORIES[index % CATEGORIES.length],
  imageUrl: `https://images.unsplash.com/photo-${1560000000000 + index}?w=400&h=400&fit=crop`
}));

// Generate random prices for each product in each market
export const PRICES: MarketPrice[] = PRODUCTS.flatMap(product => {
  const basePrice = 5 + Math.random() * 45; // Random base price between 5 and 50
  
  return MARKETS.map(market => {
    // Variation of +/- 15%
    const variation = 0.85 + Math.random() * 0.3;
    const price = Number((basePrice * variation).toFixed(2));
    
    return {
      marketId: market.id,
      marketName: market.name,
      price,
      updatedAt: new Date(Date.now() - Math.random() * 172800000).toISOString(), // Updated in the last 48h
      hasProof: Math.random() > 0.3
    };
  });
});

export const getPricesForProduct = (productId: string) => {
  const productIndex = parseInt(productId.replace('p', '')) - 1;
  const basePrice = 5 + (productIndex % 50) + (productIndex / 50) * 10; // Semi-deterministic base price
  
  return MARKETS.map(market => {
    // Variation based on market ID to make it consistent for tests
    const marketSeed = market.id === 'm1' ? 0.9 : market.id === 'm2' ? 1.0 : 1.1;
    const price = Number((basePrice * marketSeed).toFixed(2));
    
    return {
      marketId: market.id,
      marketName: market.name,
      price,
      updatedAt: new Date().toISOString(),
      hasProof: true
    };
  });
};
