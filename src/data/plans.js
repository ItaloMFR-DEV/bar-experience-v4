// CARDÁPIOS E PLANOS
// Para editar, altere os textos e a lista "drinks" de cada plano.
// Para trocar uma foto, substitua o endereço no campo "image" por uma URL de imagem.
// Mantenha os identificadores "id" sem repetição.
export const plans = [
  {
    id: 'basico',
    name: 'Básico',
    tier: 'Clássicos essenciais',
    description: 'Uma seleção de coquetéis conhecidos e refrescantes, ideal para celebrar com leveza e variedade.',
    drinks: ['Caipirinha', 'Caipivodka', 'Cuba Libre', 'Sex on the Beach', 'Blue Lagoon', 'Gin Tropical'],
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=85',
    featured: false
  },
  {
    id: 'intermediario',
    name: 'Intermediário',
    tier: 'Coquetelaria selecionada',
    description: 'Receitas com diferentes perfis de sabor, combinando cítricos, notas amargas, especiarias e destilados.',
    drinks: ['Moscow Mule', 'Caiperól', 'Whisky Sour', 'Negroni', 'Robusto', 'Jorge Amado', 'Flowers Citrus'],
    image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=85',
    featured: true
  },
  {
    id: 'avancado',
    name: 'Avançado',
    tier: 'Seleção premium',
    description: 'Uma carta de clássicos reconhecidos da coquetelaria, com atenção à técnica, ao equilíbrio e à apresentação.',
    drinks: ['Aperol Spritz', 'Dry Martini', 'Cosmopolitan', 'Margarita', 'Espresso Martini', 'French 75', 'Clover Club', 'Fitzgerald'],
    image: 'https://images.unsplash.com/photo-1536935338788846bb9981813?auto=format&fit=crop&w=1200&q=85',
    featured: false
  },
  {
    id: 'personalizado',
    name: 'Personalizado',
    tier: 'Carta sob medida',
    description: 'Uma seleção definida em conjunto com o contratante, considerando o perfil dos convidados e a proposta do evento.',
    drinks: ['Até 8 coquetéis escolhidos pelo contratante'],
    image: 'https://images.unsplash.com/photo-1513558161293-0b6b8e5e7c7f?auto=format&fit=crop&w=1200&q=85',
    featured: false
  },
  {
    id: 'autoral',
    name: 'Autoral',
    tier: 'Criações exclusivas',
    description: 'Coquetéis desenvolvidos para a ocasião, com combinações próprias e harmonização com o menu do evento.',
    drinks: ['4 coquetéis autorais harmonizados com os pratos', '3 opções dos planos Básico ou Intermediário'],
    image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=85',
    featured: false
  }
]
