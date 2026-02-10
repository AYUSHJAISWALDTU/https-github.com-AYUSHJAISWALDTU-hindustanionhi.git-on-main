const Product = require('../models/Product');
const Category = require('../models/Category');

const BASE_URL = 'https://www.hindustanionhi.com';

/**
 * @desc    Generate sitemap.xml
 * @route   GET /api/sitemap.xml
 * @access  Public
 */
exports.getSitemap = async (req, res) => {
  try {
    const [products, categories] = await Promise.all([
      Product.find({ isActive: true }).select('slug updatedAt images').lean(),
      Category.find().select('slug updatedAt').lean(),
    ]);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- Static Pages -->
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/shop</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;

    // Category pages
    for (const cat of categories) {
      xml += `  <url>
    <loc>${BASE_URL}/shop?category=${cat.slug}</loc>
    <lastmod>${new Date(cat.updatedAt).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    // Product pages with image sitemap
    for (const product of products) {
      const lastmod = new Date(product.updatedAt).toISOString().split('T')[0];
      xml += `  <url>
    <loc>${BASE_URL}/product/${product.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
`;
      // Add product images for Google Images indexing
      if (product.images?.length) {
        for (const img of product.images) {
          if (img.url) {
            xml += `    <image:image>
      <image:loc>${img.url}</image:loc>
      <image:title>${img.alt || product.slug.replace(/-/g, ' ')}</image:title>
    </image:image>
`;
          }
        }
      }
      xml += `  </url>
`;
    }

    xml += `</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600'); // cache 1 hour
    res.send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
};

/**
 * @desc    Generate robots.txt
 * @route   GET /api/robots.txt
 * @access  Public
 */
exports.getRobots = (req, res) => {
  const robots = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /checkout
Disallow: /cart
Disallow: /login
Disallow: /register

Sitemap: ${BASE_URL}/api/sitemap.xml

Crawl-delay: 1
`;
  res.set('Content-Type', 'text/plain');
  res.send(robots);
};
