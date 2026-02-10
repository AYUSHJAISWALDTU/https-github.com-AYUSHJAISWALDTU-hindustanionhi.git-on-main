import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Hindustani Odhni';
const BASE_URL = 'https://www.hindustanionhi.com';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1200&h=630&fit=crop';
const DEFAULT_DESCRIPTION =
  'Shop premium handcrafted Indian ethnic fashion at Hindustani Odhni. Handloom cotton odhnis, silk dupattas, sarees, kurtis, lehengas & festive wear. Free delivery across India.';

/**
 * SEO — reusable meta & structured data component
 *
 * @param {string}  title         – Page title (appended with brand)
 * @param {string}  description   – Meta description (max 160 chars)
 * @param {string}  keywords      – Comma-separated keywords
 * @param {string}  canonical     – Canonical URL path (e.g. /shop)
 * @param {string}  image         – Open Graph image URL
 * @param {string}  type          – og:type (website | product | article)
 * @param {object}  product       – Product data for Product schema
 * @param {array}   breadcrumbs   – [{name, url}] for BreadcrumbList schema
 * @param {string}  noIndex       – Add noindex if true
 */
export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = '',
  canonical = '',
  image = DEFAULT_IMAGE,
  type = 'website',
  product = null,
  breadcrumbs = null,
  noIndex = false,
}) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Premium Indian Ethnic Fashion`;
  const pageUrl = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
  const pageDescription = description.length > 160 ? description.substring(0, 157) + '...' : description;

  /* ─── JSON-LD: Organization ─── */
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'Premium Indian ethnic fashion brand. Handcrafted sarees, kurtis, lehengas, odhnis & festive wear.',
    sameAs: [
      'https://www.instagram.com/hindustanionhi',
      'https://www.facebook.com/hindustanionhi',
      'https://twitter.com/hindustanionhi',
      'https://www.pinterest.com/hindustanionhi',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-XXXXXXXXXX',
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['English', 'Hindi'],
    },
  };

  /* ─── JSON-LD: WebSite (sitelinks search box) ─── */
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/shop?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  /* ─── JSON-LD: Product ─── */
  const productSchema = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.images?.map((img) => img.url) || [],
        brand: {
          '@type': 'Brand',
          name: SITE_NAME,
        },
        sku: product.slug,
        category: product.category?.name || 'Indian Ethnic Wear',
        material: product.fabric || undefined,
        offers: {
          '@type': 'Offer',
          url: pageUrl,
          priceCurrency: 'INR',
          price: product.price,
          priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          itemCondition: 'https://schema.org/NewCondition',
          availability:
            product.totalStock > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: SITE_NAME,
          },
        },
        ...(product.ratingsCount > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: product.ratingsAverage,
                reviewCount: product.ratingsCount,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      }
    : null;

  /* ─── JSON-LD: BreadcrumbList ─── */
  const breadcrumbSchema = breadcrumbs
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: crumb.name,
          item: crumb.url ? `${BASE_URL}${crumb.url}` : undefined,
        })),
      }
    : null;

  return (
    <Helmet>
      {/* ─── Basic Meta ─── */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={pageUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* ─── Open Graph ─── */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_IN" />

      {/* ─── Twitter Card ─── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@hindustanionhi" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={image} />

      {/* ─── Structured Data ─── */}
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      {productSchema && (
        <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
      )}
      {breadcrumbSchema && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      )}
    </Helmet>
  );
}
