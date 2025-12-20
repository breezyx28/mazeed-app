export type BadgeType = 'freeShipment' | 'discount' | 'winter' | 'eid' | 'new' | 'flash' | 'kids' | 'jewelry' | 'accessories';
export type OfferType = 'kids' | 'eid' | 'winter' | 'jewelry' | 'flash' | 'newTrend' | 'under5000' | 'accessories' | null;

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  images?: string[]; // Additional product images
  rating: number;
  reviews: number;
  category: string;
  colors?: string[];
  description?: string;
  badges?: BadgeType[];
  offerType?: OfferType;
  offerExpiry?: string; // ISO date string
  is_deliverable?: boolean;
}

export const products: Product[] = [
  // Electronics
  {
    id: "1",
    name: "Beats Solo Pro",
    price: 134550,
    originalPrice: 157050,
    discount: 30,
    image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1545127398-14699f92334b?w=400&h=400&fit=crop"
    ],
    rating: 4.8,
    reviews: 345,
    category: "Electronics",
    colors: ["#000000", "#FFFFFF", "#FF0000"],
    description: "High-performance wireless headphones with active noise cancelling",
    badges: ['discount', 'flash'],
    offerType: 'flash',
    offerExpiry: '2025-12-31'
  },
  {
    id: "2",
    name: "Bose Headphones",
    price: 89550,
    originalPrice: 112050,
    discount: 25,
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop"
    ],
    rating: 4.5,
    reviews: 234,
    category: "Electronics",
    colors: ["#000000", "#808080"],
    description: "Premium sound quality with superior comfort",
    badges: ['discount', 'freeShipment'],
    offerType: 'newTrend',
    offerExpiry: '2025-12-31'
  },
  {
    id: "3",
    name: "Canon EOS Camera",
    price: 404550,
    originalPrice: 449550,
    discount: 20,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1519638831568-d9897f54ed69?w=400&h=400&fit=crop"
    ],
    rating: 4.9,
    reviews: 189,
    category: "Electronics",
    colors: ["#000000"],
    description: "Professional DSLR camera with 24MP sensor",
    badges: ['discount'],
    offerType: null
  },
  {
    id: "4",
    name: "Apple Watch Series 8",
    price: 179550,
    image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400&h=400&fit=crop"
    ],
    rating: 4.8,
    reviews: 891,
    category: "Watch",
    colors: ["#C0C0C0", "#FFD700", "#000000"],
    description: "Advanced health and fitness features with always-on display",
    badges: ['new'],
    offerType: 'newTrend',
    offerExpiry: '2025-12-31'
  },
  
  // Shoes
  {
    id: "5",
    name: "Nike Air Max",
    price: 58050,
    originalPrice: 71550,
    discount: 40,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=400&h=400&fit=crop"
    ],
    rating: 4.7,
    reviews: 567,
    category: "Shoes",
    colors: ["#000000", "#FFFFFF", "#FF0000"],
    description: "Classic sneakers with iconic Air Max cushioning",
    badges: ['discount', 'flash'],
    offerType: 'flash',
    offerExpiry: '2025-12-31'
  },
  {
    id: "6",
    name: "Adidas Running Shoes",
    price: 53550,
    originalPrice: 67050,
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1587563871167-1ee9c731aef4?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop"
    ],
    rating: 4.5,
    reviews: 432,
    category: "Shoes",
    colors: ["#000000", "#FFFFFF", "#FF0000"],
    description: "Lightweight running shoes with Boost technology",
    badges: ['discount', 'freeShipment'],
    offerType: 'under5000',
    offerExpiry: '2025-12-31'
  },
  
  // Kids Wear
  {
    id: "7",
    name: "Kids Winter Jacket",
    price: 35550,
    originalPrice: 44550,
    discount: 20,
    image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1611422783457-4d9432655079?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1545593169-a841eb19e86e?w=400&h=400&fit=crop"
    ],
    rating: 4.6,
    reviews: 234,
    category: "Kids",
    colors: ["#FF69B4", "#87CEEB", "#FFD700"],
    description: "Warm and cozy winter jacket for kids",
    badges: ['discount', 'winter', 'kids'],
    offerType: 'kids',
    offerExpiry: '2025-12-31'
  },
  {
    id: "8",
    name: "Kids Sneakers Set",
    price: 28050,
    originalPrice: 35550,
    discount: 25,
    image: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=400&h=400&fit=crop"
    ],
    rating: 4.4,
    reviews: 156,
    category: "Kids",
    colors: ["#FF0000", "#0000FF", "#00FF00"],
    description: "Comfortable sneakers for active kids",
    badges: ['discount', 'kids', 'freeShipment'],
    offerType: 'kids',
    offerExpiry: '2025-12-31'
  },
  {
    id: "9",
    name: "Kids Party Dress",
    price: 42050,
    originalPrice: 56050,
    discount: 30,
    image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1621452773781-0f992ee03591?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1526495124232-a04e1849168c?w=400&h=400&fit=crop"
    ],
    rating: 4.8,
    reviews: 289,
    category: "Kids",
    colors: ["#FF69B4", "#FFFFFF", "#FFD700"],
    description: "Beautiful dress for special occasions",
    badges: ['discount', 'kids', 'eid'],
    offerType: 'eid',
    offerExpiry: '2025-12-31'
  },
  
  // Jewelry
  {
    id: "10",
    name: "Gold Necklace",
    price: 225000,
    originalPrice: 270000,
    discount: 15,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop"
    ],
    rating: 4.9,
    reviews: 445,
    category: "Jewelry",
    colors: ["#FFD700"],
    description: "Elegant 18K gold necklace",
    badges: ['discount', 'jewelry'],
    offerType: 'jewelry',
    offerExpiry: '2025-12-31'
  },
  {
    id: "11",
    name: "Diamond Ring",
    price: 337500,
    originalPrice: 450000,
    discount: 25,
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop"
    ],
    rating: 5.0,
    reviews: 678,
    category: "Jewelry",
    colors: ["#C0C0C0", "#FFD700"],
    description: "Stunning diamond engagement ring",
    badges: ['discount', 'jewelry', 'flash'],
    offerType: 'jewelry',
    offerExpiry: '2025-12-31'
  },
  {
    id: "12",
    name: "Silver Bracelet",
    price: 67500,
    originalPrice: 90000,
    discount: 25,
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1602751584552-8ba420552259?w=400&h=400&fit=crop"
    ],
    rating: 4.7,
    reviews: 234,
    category: "Jewelry",
    colors: ["#C0C0C0"],
    description: "Handcrafted sterling silver bracelet",
    badges: ['discount', 'jewelry', 'freeShipment'],
    offerType: 'jewelry',
    offerExpiry: '2025-12-31'
  },
  
  // Winter Collection
  {
    id: "13",
    name: "Wool Coat",
    price: 112500,
    originalPrice: 150000,
    discount: 25,
    image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1544923246-77307dd654cb?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400&h=400&fit=crop"
    ],
    rating: 4.8,
    reviews: 456,
    category: "Clothes",
    colors: ["#000000", "#8B4513", "#808080"],
    description: "Premium wool winter coat",
    badges: ['discount', 'winter', 'freeShipment'],
    offerType: 'winter',
    offerExpiry: '2025-12-31'
  },
  {
    id: "14",
    name: "Winter Boots",
    price: 67050,
    originalPrice: 89400,
    discount: 25,
    image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=400&h=400&fit=crop"
    ],
    rating: 4.6,
    reviews: 345,
    category: "Shoes",
    colors: ["#000000", "#8B4513"],
    description: "Waterproof winter boots",
    badges: ['discount', 'winter'],
    offerType: 'winter',
    offerExpiry: '2025-12-31'
  },
  
  // Eid Collection
  {
    id: "15",
    name: "Traditional Thobe",
    price: 89550,
    originalPrice: 112050,
    discount: 20,
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1583391733958-e0366396f006?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&h=400&fit=crop"
    ],
    rating: 4.9,
    reviews: 567,
    category: "Clothes",
    colors: ["#FFFFFF", "#000000", "#8B4513"],
    description: "Premium quality traditional thobe for Eid",
    badges: ['discount', 'eid', 'freeShipment'],
    offerType: 'eid',
    offerExpiry: '2025-12-31'
  },
  {
    id: "16",
    name: "Eid Abaya",
    price: 78750,
    originalPrice: 105000,
    discount: 25,
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1594136975364-2d2dc6dae43f?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1585036156171-384164a8c675?w=400&h=400&fit=crop"
    ],
    rating: 4.8,
    reviews: 423,
    category: "Clothes",
    colors: ["#000000", "#4B0082", "#8B4513"],
    description: "Elegant embroidered abaya for Eid celebrations",
    badges: ['discount', 'eid'],
    offerType: 'eid',
    offerExpiry: '2025-12-31'
  },
  
  // Under 5000 SDG
  {
    id: "17",
    name: "Cotton T-Shirt",
    price: 3375,
    originalPrice: 4500,
    discount: 25,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop"
    ],
    rating: 4.3,
    reviews: 234,
    category: "Clothes",
    colors: ["#FFFFFF", "#000000", "#0000FF", "#FF0000"],
    description: "Comfortable cotton t-shirt",
    badges: ['discount', 'freeShipment'],
    offerType: 'under5000',
    offerExpiry: '2025-12-31'
  },
  {
    id: "18",
    name: "Phone Case",
    price: 2250,
    originalPrice: 3375,
    discount: 33,
    image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1541877944-ac82a091518a?w=400&h=400&fit=crop"
    ],
    rating: 4.4,
    reviews: 567,
    category: "Electronics",
    colors: ["#000000", "#FFFFFF", "#FF69B4"],
    description: "Protective phone case with style",
    badges: ['discount', 'flash'],
    offerType: 'under5000',
    offerExpiry: '2025-12-31'
  },
  
  // Bags & Accessories
  {
    id: "19",
    name: "Leather Bag",
    price: 112050,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400&h=400&fit=crop"
    ],
    rating: 4.6,
    reviews: 234,
    category: "Bags",
    colors: ["#8B4513", "#000000", "#FF6347"],
    description: "Handcrafted genuine leather messenger bag",
    badges: ['new', 'freeShipment'],
    offerType: 'newTrend',
    offerExpiry: '2025-12-31'
  },
  {
    id: "20",
    name: "Designer Handbag",
    price: 168750,
    originalPrice: 225000,
    discount: 25,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?w=400&h=400&fit=crop"
    ],
    rating: 4.9,
    reviews: 789,
    category: "Bags",
    colors: ["#000000", "#8B4513", "#FF69B4"],
    description: "Luxury designer handbag",
    badges: ['discount', 'flash'],
    offerType: 'flash',
    offerExpiry: '2025-12-31'
  },
  
  // Clothes
  {
    id: "21",
    name: "Denim Jacket",
    price: 35550,
    originalPrice: 44550,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=400&h=400&fit=crop"
    ],
    rating: 4.3,
    reviews: 123,
    category: "Clothes",
    colors: ["#4169E1", "#000000"],
    description: "Classic denim jacket for everyday wear",
    badges: ['discount'],
    offerType: 'under5000',
    offerExpiry: '2025-12-31'
  }
];


export const categories = [
  { id: "all", name: "All", nameAr: "الكل", emoji: "🛍️" },
  { id: "Kids", name: "Kids Wear", nameAr: "ملابس الأطفال", emoji: "👶" },
  { id: "Clothes", name: "Women's Fashion", nameAr: "أزياء النساء", emoji: "👗" },
  { id: "MenClothes", name: "Men's Fashion", nameAr: "أزياء الرجال", emoji: "👔" },
  { id: "Jewelry", name: "Jewelry", nameAr: "المجوهرات", emoji: "💍" },
  { id: "Electronics", name: "Electronics", nameAr: "الإلكترونيات", emoji: "📱" },
  { id: "Home", name: "Home & Living", nameAr: "المنزل والمعيشة", emoji: "🏠" },
  { id: "Sports", name: "Sports", nameAr: "الرياضة", emoji: "⚽" },
  { id: "Bags", name: "Bags", nameAr: "الحقائب", emoji: "👜" },
  { id: "Shoes", name: "Shoes", nameAr: "الأحذية", emoji: "👟" },
  { id: "Watch", name: "Watches", nameAr: "الساعات", emoji: "⌚" },
  { id: "Beauty", name: "Beauty", nameAr: "الجمال", emoji: "💄" },
];

export interface OfferCategory {
  id: OfferType;
  name: string;
  nameAr: string;
  emoji: string;
  description: string;
  descriptionAr: string;
}

export const offerCategories: OfferCategory[] = [
  {
    id: 'kids',
    name: "Kids clothes offer",
    nameAr: "عروض ملابس الأطفال",
    emoji: "👶",
    description: "Special deals on kids clothing and accessories",
    descriptionAr: "عروض خاصة على ملابس وإكسسوارات الأطفال"
  },
  {
    id: 'eid',
    name: "Eid Offers",
    nameAr: "عروض العيد",
    emoji: "🌙",
    description: "Exclusive Eid collection with amazing discounts",
    descriptionAr: "مجموعة العيد الحصرية مع خصومات مذهلة"
  },
  {
    id: 'under5000',
    name: "less than 5000 SDG offers",
    nameAr: "أقل من 5000 جنيه",
    emoji: "💰",
    description: "Great products under 5000 SDG",
    descriptionAr: "منتجات رائعة بأقل من 5000 جنيه"
  },
  {
    id: 'winter',
    name: "winter Offers",
    nameAr: "عروض الشتاء",
    emoji: "❄️",
    description: "Stay warm with our winter collection",
    descriptionAr: "ابق دافئًا مع مجموعة الشتاء لدينا"
  },
  {
    id: 'accessories',
    name: "accessories Offers",
    nameAr: "عروض الإكسسوارات",
    emoji: "👜",
    description: "Stylish accessories for your outfit",
    descriptionAr: "إكسسوارات أنيقة لمظهرك"
  },
  {
    id: 'flash',
    name: "Flash Sales",
    nameAr: "صفقات سريعة",
    emoji: "⚡",
    description: "Limited time flash deals - grab them fast!",
    descriptionAr: "صفقات سريعة لفترة محدودة - احصل عليها بسرعة!"
  },
  {
    id: 'newTrend',
    name: "Latest Trends",
    nameAr: "أحدث الصيحات",
    emoji: "✨",
    description: "Discover the latest trending products",
    descriptionAr: "اكتشف أحدث المنتجات الرائجة"
  },
  {
    id: 'jewelry',
    name: "Jewelry Offers",
    nameAr: "عروض المجوهرات",
    emoji: "💎",
    description: "Shine bright with our jewelry deals",
    descriptionAr: "تألق مع عروض المجوهرات لدينا"
  }
];

export interface BadgeConfig {
  type: BadgeType;
  label: string;
  labelAr: string;
  emoji: string;
  colorClass: string;
}

export const badgeConfigs: BadgeConfig[] = [
  {
    type: 'freeShipment',
    label: 'Free Shipping',
    labelAr: 'شحن مجاني',
    emoji: '🚚',
    colorClass: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
  },
  {
    type: 'discount',
    label: 'Discount',
    labelAr: 'خصم',
    emoji: '🏷️',
    colorClass: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
  },
  {
    type: 'winter',
    label: 'Winter',
    labelAr: 'شتاء',
    emoji: '❄️',
    colorClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
  },
  {
    type: 'eid',
    label: 'Eid',
    labelAr: 'عيد',
    emoji: '🌙',
    colorClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20'
  },
  {
    type: 'new',
    label: 'New',
    labelAr: 'جديد',
    emoji: '✨',
    colorClass: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20'
  },
  {
    type: 'flash',
    label: 'Flash',
    labelAr: 'سريع',
    emoji: '⚡',
    colorClass: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20'
  },
  {
    type: 'kids',
    label: 'Kids',
    labelAr: 'أطفال',
    emoji: '👶',
    colorClass: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20'
  },
  {
    type: 'jewelry',
    label: 'Jewelry',
    labelAr: 'مجوهرات',
    emoji: '💎',
    colorClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20'
  },
  {
    type: 'accessories',
    label: 'Accessories',
    labelAr: 'إكسسوارات',
    emoji: '👜',
    colorClass: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20'
  }
];

