require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

/**
 * Seed script — populates database with sample data
 * Run: npm run seed
 */

// Sample Categories
const categories = [
  { name: 'Sarees', slug: 'sarees', description: 'Elegant sarees for every occasion', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600' },
  { name: 'Kurtis', slug: 'kurtis', description: 'Trendy kurtis for modern women', image: 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=600' },
  { name: 'Lehengas', slug: 'lehengas', description: 'Stunning lehengas for special moments', image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600' },
  { name: 'Dupattas', slug: 'dupattas', description: 'Beautiful dupattas to complete your look', image: 'https://images.unsplash.com/photo-1617627143233-46b828b857e0?w=600' },
  { name: 'Festive Wear', slug: 'festive-wear', description: 'Celebrate in style with our festive collection', image: 'https://images.unsplash.com/photo-1583391733975-b0e3fd6b8cb4?w=600' },
  { name: 'Palazzo Sets', slug: 'palazzo-sets', description: 'Comfortable and chic palazzo sets', image: 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=600' },
];

// Sample Products generator
const generateProducts = (categoryMap) => [
  // ===== SAREES =====
  {
    name: 'Royal Banarasi Silk Saree',
    slug: 'royal-banarasi-silk-saree',
    description: 'Luxurious Banarasi silk saree with intricate gold zari weaving. Perfect for weddings and grand celebrations. Features traditional motifs and a rich pallu that makes a statement.',
    price: 4999,
    comparePrice: 7999,
    category: categoryMap['Sarees'],
    images: [
      { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800', alt: 'Banarasi Silk Saree Front' },
      { url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800', alt: 'Banarasi Silk Saree Detail' },
    ],
    sizes: [{ size: 'Free Size', stock: 25 }],
    colors: [{ name: 'Red', hex: '#DC143C' }, { name: 'Maroon', hex: '#800000' }],
    fabric: 'Banarasi Silk',
    occasion: 'wedding',
    tags: ['silk', 'banarasi', 'wedding', 'bridal', 'traditional', 'zari'],
    isFeatured: true,
    ratingsAverage: 4.8,
    ratingsCount: 124,
    sold: 350,
  },
  {
    name: 'Pastel Georgette Saree',
    slug: 'pastel-georgette-saree',
    description: 'Elegant pastel georgette saree with delicate sequin border. Lightweight and drapes beautifully. Ideal for evening parties and receptions.',
    price: 2499,
    comparePrice: 3999,
    category: categoryMap['Sarees'],
    images: [
      { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800', alt: 'Georgette Saree' },
    ],
    sizes: [{ size: 'Free Size', stock: 40 }],
    colors: [{ name: 'Lavender', hex: '#E6E6FA' }, { name: 'Peach', hex: '#FFDAB9' }],
    fabric: 'Georgette',
    occasion: 'party',
    tags: ['georgette', 'party', 'sequin', 'pastel', 'elegant'],
    isFeatured: true,
    ratingsAverage: 4.5,
    ratingsCount: 89,
    sold: 210,
  },
  {
    name: 'Cotton Handloom Saree',
    slug: 'cotton-handloom-saree',
    description: 'Comfortable and breathable cotton handloom saree. Perfect for office wear and daily use. Features subtle block-print patterns inspired by traditional Indian art.',
    price: 1299,
    comparePrice: 1999,
    category: categoryMap['Sarees'],
    images: [
      { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800', alt: 'Cotton Saree' },
    ],
    sizes: [{ size: 'Free Size', stock: 60 }],
    colors: [{ name: 'Blue', hex: '#4169E1' }, { name: 'Green', hex: '#228B22' }],
    fabric: 'Cotton',
    occasion: 'daily',
    tags: ['cotton', 'handloom', 'office', 'daily', 'comfortable'],
    isFeatured: false,
    ratingsAverage: 4.3,
    ratingsCount: 56,
    sold: 180,
  },
  // ===== KURTIS =====
  {
    name: 'Embroidered Anarkali Kurti',
    slug: 'embroidered-anarkali-kurti',
    description: 'Graceful Anarkali kurti with intricate chikankari embroidery. Floor-length silhouette creates a regal look. Paired with matching dupatta for a complete festive ensemble.',
    price: 1899,
    comparePrice: 2999,
    category: categoryMap['Kurtis'],
    images: [
      { url: 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=800', alt: 'Anarkali Kurti' },
    ],
    sizes: [
      { size: 'S', stock: 15 }, { size: 'M', stock: 20 },
      { size: 'L', stock: 20 }, { size: 'XL', stock: 15 },
      { size: 'XXL', stock: 10 },
    ],
    colors: [{ name: 'White', hex: '#FFFFFF' }, { name: 'Pink', hex: '#FF69B4' }],
    fabric: 'Cotton',
    occasion: 'festive',
    tags: ['anarkali', 'chikankari', 'embroidered', 'festive', 'kurti'],
    isFeatured: true,
    ratingsAverage: 4.7,
    ratingsCount: 203,
    sold: 520,
  },
  {
    name: 'Printed A-Line Kurti',
    slug: 'printed-a-line-kurti',
    description: 'Trendy A-line kurti with vibrant Rajasthani block print. Flattering cut suits all body types. Perfect for casual outings and office wear.',
    price: 899,
    comparePrice: 1499,
    category: categoryMap['Kurtis'],
    images: [
      { url: 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=800', alt: 'A-Line Kurti' },
    ],
    sizes: [
      { size: 'S', stock: 25 }, { size: 'M', stock: 30 },
      { size: 'L', stock: 30 }, { size: 'XL', stock: 20 },
      { size: 'XXL', stock: 15 },
    ],
    colors: [{ name: 'Yellow', hex: '#FFD700' }, { name: 'Orange', hex: '#FF8C00' }],
    fabric: 'Rayon',
    occasion: 'casual',
    tags: ['a-line', 'printed', 'casual', 'office', 'block-print'],
    isFeatured: true,
    ratingsAverage: 4.4,
    ratingsCount: 167,
    sold: 890,
  },
  {
    name: 'Silk Straight Kurti',
    slug: 'silk-straight-kurti',
    description: 'Sophisticated straight-cut silk kurti with mirror work detailing. Elegant neckline with tassel ties. Perfect for formal gatherings and festive events.',
    price: 1599,
    comparePrice: 2499,
    category: categoryMap['Kurtis'],
    images: [
      { url: 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=800', alt: 'Silk Kurti' },
    ],
    sizes: [
      { size: 'S', stock: 10 }, { size: 'M', stock: 18 },
      { size: 'L', stock: 18 }, { size: 'XL', stock: 12 },
    ],
    colors: [{ name: 'Navy', hex: '#000080' }, { name: 'Teal', hex: '#008080' }],
    fabric: 'Silk',
    occasion: 'festive',
    tags: ['silk', 'straight', 'mirror-work', 'formal', 'festive'],
    isFeatured: false,
    ratingsAverage: 4.6,
    ratingsCount: 92,
    sold: 310,
  },
  // ===== LEHENGAS =====
  {
    name: 'Bridal Red Lehenga Choli',
    slug: 'bridal-red-lehenga-choli',
    description: 'Show-stopping bridal lehenga in rich red with heavy gold embroidery. Comes with a matching choli and net dupatta with sequin border. Handcrafted for your special day.',
    price: 12999,
    comparePrice: 19999,
    category: categoryMap['Lehengas'],
    images: [
      { url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800', alt: 'Bridal Lehenga' },
    ],
    sizes: [
      { size: 'S', stock: 5 }, { size: 'M', stock: 8 },
      { size: 'L', stock: 8 }, { size: 'XL', stock: 5 },
    ],
    colors: [{ name: 'Red', hex: '#DC143C' }],
    fabric: 'Velvet',
    occasion: 'wedding',
    tags: ['bridal', 'lehenga', 'wedding', 'embroidery', 'red', 'luxury'],
    isFeatured: true,
    ratingsAverage: 4.9,
    ratingsCount: 78,
    sold: 150,
  },
  {
    name: 'Pastel Floral Lehenga',
    slug: 'pastel-floral-lehenga',
    description: 'Dreamy pastel lehenga with delicate floral embroidery. Perfect for engagement, sangeet, or cocktail parties. Lightweight organza fabric for effortless movement.',
    price: 6999,
    comparePrice: 9999,
    category: categoryMap['Lehengas'],
    images: [
      { url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800', alt: 'Pastel Lehenga' },
    ],
    sizes: [
      { size: 'S', stock: 10 }, { size: 'M', stock: 12 },
      { size: 'L', stock: 12 }, { size: 'XL', stock: 8 },
    ],
    colors: [{ name: 'Mint', hex: '#98FF98' }, { name: 'Blush', hex: '#FFB6C1' }],
    fabric: 'Organza',
    occasion: 'party',
    tags: ['lehenga', 'pastel', 'floral', 'engagement', 'sangeet'],
    isFeatured: true,
    ratingsAverage: 4.7,
    ratingsCount: 65,
    sold: 120,
  },
  // ===== DUPATTAS =====
  {
    name: 'Phulkari Embroidered Dupatta',
    slug: 'phulkari-embroidered-dupatta',
    description: 'Vibrant Phulkari dupatta handcrafted by artisans from Punjab. Colorful thread embroidery on rich fabric. A statement piece that elevates any outfit.',
    price: 799,
    comparePrice: 1299,
    category: categoryMap['Dupattas'],
    images: [
      { url: 'https://images.unsplash.com/photo-1617627143233-46b828b857e0?w=800', alt: 'Phulkari Dupatta' },
    ],
    sizes: [{ size: 'Free Size', stock: 50 }],
    colors: [{ name: 'Multi', hex: '#FF6347' }, { name: 'Yellow', hex: '#FFD700' }],
    fabric: 'Cotton',
    occasion: 'festive',
    tags: ['phulkari', 'dupatta', 'embroidered', 'punjabi', 'handcrafted'],
    isFeatured: false,
    ratingsAverage: 4.5,
    ratingsCount: 134,
    sold: 670,
  },
  {
    name: 'Bandhani Silk Dupatta',
    slug: 'bandhani-silk-dupatta',
    description: 'Traditional Bandhani tie-dye dupatta in pure silk. Vibrant patterns created through centuries-old tie-dye technique from Gujarat. Lightweight and versatile.',
    price: 999,
    comparePrice: 1599,
    category: categoryMap['Dupattas'],
    images: [
      { url: 'https://images.unsplash.com/photo-1617627143233-46b828b857e0?w=800', alt: 'Bandhani Dupatta' },
    ],
    sizes: [{ size: 'Free Size', stock: 35 }],
    colors: [{ name: 'Red', hex: '#DC143C' }, { name: 'Orange', hex: '#FF8C00' }],
    fabric: 'Silk',
    occasion: 'festive',
    tags: ['bandhani', 'silk', 'dupatta', 'tie-dye', 'gujarati', 'traditional'],
    isFeatured: true,
    ratingsAverage: 4.6,
    ratingsCount: 98,
    sold: 445,
  },
  // ===== FESTIVE WEAR =====
  {
    name: 'Gold Tissue Anarkali Set',
    slug: 'gold-tissue-anarkali-set',
    description: 'Stunning gold tissue Anarkali suit set with palazzo pants and embroidered dupatta. Radiant for Diwali celebrations and festive gatherings. Premium finish with gota patti work.',
    price: 3499,
    comparePrice: 5499,
    category: categoryMap['Festive Wear'],
    images: [
      { url: 'https://images.unsplash.com/photo-1583391733975-b0e3fd6b8cb4?w=800', alt: 'Festive Anarkali' },
    ],
    sizes: [
      { size: 'S', stock: 12 }, { size: 'M', stock: 18 },
      { size: 'L', stock: 18 }, { size: 'XL', stock: 12 },
    ],
    colors: [{ name: 'Gold', hex: '#FFD700' }],
    fabric: 'Tissue',
    occasion: 'festive',
    tags: ['anarkali', 'festive', 'gold', 'diwali', 'gota-patti', 'set'],
    isFeatured: true,
    ratingsAverage: 4.8,
    ratingsCount: 145,
    sold: 380,
  },
  {
    name: 'Velvet Embroidered Suit Set',
    slug: 'velvet-embroidered-suit-set',
    description: 'Rich velvet suit set with zardozi embroidery. Includes kurta, pants, and matching dupatta. Ideal for winter weddings and grand celebrations.',
    price: 4299,
    comparePrice: 6999,
    category: categoryMap['Festive Wear'],
    images: [
      { url: 'https://images.unsplash.com/photo-1583391733975-b0e3fd6b8cb4?w=800', alt: 'Velvet Suit' },
    ],
    sizes: [
      { size: 'S', stock: 8 }, { size: 'M', stock: 12 },
      { size: 'L', stock: 12 }, { size: 'XL', stock: 8 },
      { size: 'XXL', stock: 5 },
    ],
    colors: [{ name: 'Emerald', hex: '#50C878' }, { name: 'Wine', hex: '#722F37' }],
    fabric: 'Velvet',
    occasion: 'wedding',
    tags: ['velvet', 'zardozi', 'winter', 'wedding', 'embroidered', 'suit'],
    isFeatured: false,
    ratingsAverage: 4.6,
    ratingsCount: 67,
    sold: 190,
  },
  // ===== PALAZZO SETS =====
  {
    name: 'Floral Print Palazzo Set',
    slug: 'floral-print-palazzo-set',
    description: 'Breezy floral print kurti with matching palazzo pants. Comfortable rayon fabric perfect for summer. Vibrant prints inspired by Indian garden motifs.',
    price: 1099,
    comparePrice: 1799,
    category: categoryMap['Palazzo Sets'],
    images: [
      { url: 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=800', alt: 'Palazzo Set' },
    ],
    sizes: [
      { size: 'S', stock: 20 }, { size: 'M', stock: 25 },
      { size: 'L', stock: 25 }, { size: 'XL', stock: 18 },
      { size: 'XXL', stock: 12 },
    ],
    colors: [{ name: 'Pink', hex: '#FF69B4' }, { name: 'Blue', hex: '#87CEEB' }],
    fabric: 'Rayon',
    occasion: 'casual',
    tags: ['palazzo', 'set', 'floral', 'casual', 'summer', 'comfortable'],
    isFeatured: true,
    ratingsAverage: 4.3,
    ratingsCount: 234,
    sold: 1100,
  },
  {
    name: 'Mirror Work Palazzo Set',
    slug: 'mirror-work-palazzo-set',
    description: 'Eye-catching mirror work palazzo set with vibrant Rajasthani embroidery. Statement outfit for festive occasions. Comfortable cotton base with artistic detailing.',
    price: 1499,
    comparePrice: 2299,
    category: categoryMap['Palazzo Sets'],
    images: [
      { url: 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=800', alt: 'Mirror Work Set' },
    ],
    sizes: [
      { size: 'S', stock: 14 }, { size: 'M', stock: 20 },
      { size: 'L', stock: 20 }, { size: 'XL', stock: 14 },
    ],
    colors: [{ name: 'Red', hex: '#DC143C' }, { name: 'Green', hex: '#228B22' }],
    fabric: 'Cotton',
    occasion: 'festive',
    tags: ['mirror-work', 'palazzo', 'rajasthani', 'festive', 'embroidered'],
    isFeatured: false,
    ratingsAverage: 4.5,
    ratingsCount: 156,
    sold: 560,
  },
];

// ===== SEED FUNCTION =====
const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seed...\n');

    // Clear existing data
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@hindustanonhi.com',
      password: 'admin123',
      role: 'admin',
      phone: '9876543210',
    });
    console.log('👤 Admin user created: admin@hindustanonhi.com / admin123');

    // Create sample user
    const user = await User.create({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: 'user123',
      role: 'user',
      phone: '9876543211',
      addresses: [
        {
          fullName: 'Priya Sharma',
          phone: '9876543211',
          addressLine1: '42, MG Road',
          addressLine2: 'Near City Mall',
          city: 'Jaipur',
          state: 'Rajasthan',
          pincode: '302001',
          isDefault: true,
        },
      ],
    });
    console.log('👤 Sample user created: priya@example.com / user123');

    // Create categories
    const createdCategories = await Category.insertMany(categories);
    const categoryMap = {};
    createdCategories.forEach((cat) => {
      categoryMap[cat.name] = cat._id;
    });
    console.log(`📁 ${createdCategories.length} categories created`);

    // Create products
    const products = generateProducts(categoryMap);
    await Product.insertMany(products);
    console.log(`🛍️  ${products.length} products created`);

    console.log('\n✅ Database seeded successfully!');
    console.log('🚀 You can now start the server with: npm run dev\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
