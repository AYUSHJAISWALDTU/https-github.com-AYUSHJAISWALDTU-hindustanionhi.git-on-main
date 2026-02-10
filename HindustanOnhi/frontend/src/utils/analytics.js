/**
 * Analytics utility — Google Analytics 4 + Facebook Pixel
 *
 * Replace G-XXXXXXXXXX and PIXEL_ID in index.html & .env
 * with your real tracking IDs before going to production.
 */

/* ─── helpers ─── */
const gtag = (...args) => {
  if (typeof window.gtag === 'function') window.gtag(...args);
};

const fbq = (...args) => {
  if (typeof window.fbq === 'function') window.fbq(...args);
};

/* ─── Page View ─── */
export const trackPageView = (path, title) => {
  gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
  });
  fbq('track', 'PageView');
};

/* ─── Product View ─── */
export const trackViewProduct = (product) => {
  if (!product) return;

  gtag('event', 'view_item', {
    currency: 'INR',
    value: product.price,
    items: [
      {
        item_id: product._id,
        item_name: product.name,
        item_category: product.category?.name || '',
        price: product.price,
        discount: product.comparePrice ? product.comparePrice - product.price : 0,
      },
    ],
  });

  fbq('track', 'ViewContent', {
    content_ids: [product._id],
    content_name: product.name,
    content_category: product.category?.name || '',
    content_type: 'product',
    value: product.price,
    currency: 'INR',
  });
};

/* ─── Add to Cart ─── */
export const trackAddToCart = (product, size, color, quantity = 1) => {
  if (!product) return;

  gtag('event', 'add_to_cart', {
    currency: 'INR',
    value: product.price * quantity,
    items: [
      {
        item_id: product._id,
        item_name: product.name,
        item_category: product.category?.name || '',
        item_variant: [size, color].filter(Boolean).join(' / '),
        price: product.price,
        quantity,
      },
    ],
  });

  fbq('track', 'AddToCart', {
    content_ids: [product._id],
    content_name: product.name,
    content_type: 'product',
    value: product.price * quantity,
    currency: 'INR',
    num_items: quantity,
  });
};

/* ─── Remove from Cart ─── */
export const trackRemoveFromCart = (product, quantity = 1) => {
  if (!product) return;

  gtag('event', 'remove_from_cart', {
    currency: 'INR',
    value: product.price * quantity,
    items: [
      {
        item_id: product._id || product.product,
        item_name: product.name,
        price: product.price,
        quantity,
      },
    ],
  });
};

/* ─── Begin Checkout ─── */
export const trackBeginCheckout = (items, totalValue) => {
  gtag('event', 'begin_checkout', {
    currency: 'INR',
    value: totalValue,
    items: items.map((item) => ({
      item_id: item.product?._id || item.product,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  });

  fbq('track', 'InitiateCheckout', {
    content_ids: items.map((i) => i.product?._id || i.product),
    content_type: 'product',
    num_items: items.reduce((sum, i) => sum + i.quantity, 0),
    value: totalValue,
    currency: 'INR',
  });
};

/* ─── Purchase ─── */
export const trackPurchase = (order) => {
  if (!order) return;

  gtag('event', 'purchase', {
    transaction_id: order._id || order.razorpayOrderId,
    value: order.totalAmount || order.total,
    currency: 'INR',
    shipping: order.shippingCharge || 0,
    tax: order.tax || 0,
    items: (order.orderItems || []).map((item) => ({
      item_id: item.product?._id || item.product,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  });

  fbq('track', 'Purchase', {
    content_ids: (order.orderItems || []).map((i) => i.product?._id || i.product),
    content_type: 'product',
    num_items: (order.orderItems || []).reduce((sum, i) => sum + i.quantity, 0),
    value: order.totalAmount || order.total,
    currency: 'INR',
  });
};

/* ─── Search ─── */
export const trackSearch = (searchTerm) => {
  gtag('event', 'search', { search_term: searchTerm });
  fbq('track', 'Search', { search_string: searchTerm });
};

/* ─── Wishlist ─── */
export const trackAddToWishlist = (product) => {
  if (!product) return;

  gtag('event', 'add_to_wishlist', {
    currency: 'INR',
    value: product.price,
    items: [
      {
        item_id: product._id,
        item_name: product.name,
        price: product.price,
      },
    ],
  });

  fbq('track', 'AddToWishlist', {
    content_ids: [product._id],
    content_name: product.name,
    content_type: 'product',
    value: product.price,
    currency: 'INR',
  });
};

/* ─── Sign Up ─── */
export const trackSignUp = (method = 'email') => {
  gtag('event', 'sign_up', { method });
  fbq('track', 'CompleteRegistration', { status: true });
};

/* ─── Login ─── */
export const trackLogin = (method = 'email') => {
  gtag('event', 'login', { method });
};

/* ─── View Category / Product List ─── */
export const trackViewProductList = (listName, products = []) => {
  gtag('event', 'view_item_list', {
    item_list_name: listName,
    items: products.slice(0, 10).map((p, i) => ({
      item_id: p._id,
      item_name: p.name,
      item_category: p.category?.name || '',
      price: p.price,
      index: i,
    })),
  });
};

/* ─── Select Product from list ─── */
export const trackSelectProduct = (product, listName) => {
  if (!product) return;

  gtag('event', 'select_item', {
    item_list_name: listName,
    items: [
      {
        item_id: product._id,
        item_name: product.name,
        item_category: product.category?.name || '',
        price: product.price,
      },
    ],
  });
};

export default {
  trackPageView,
  trackViewProduct,
  trackAddToCart,
  trackRemoveFromCart,
  trackBeginCheckout,
  trackPurchase,
  trackSearch,
  trackAddToWishlist,
  trackSignUp,
  trackLogin,
  trackViewProductList,
  trackSelectProduct,
};
