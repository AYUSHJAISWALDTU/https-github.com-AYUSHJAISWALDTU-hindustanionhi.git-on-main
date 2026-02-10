const Product = require('../models/Product');
const Category = require('../models/Category');

/**
 * HindustanOnhi AI Chatbot
 * 
 * Uses OpenAI if API key is available, otherwise falls back to
 * a sophisticated rule-based system.
 */

// ===========================
// Rule-Based Responses
// ===========================
const RULES = {
  greeting: {
    patterns: [/^(hi|hello|hey|namaste|namaskar|good morning|good evening)/i],
    responses: [
      "Namaste! 🙏 Welcome to HindustanOnhi. I'm here to help you find the perfect ethnic outfit. What are you looking for today?",
      "Hello! 🪷 Welcome to HindustanOnhi. Looking for sarees, kurtis, lehengas, or something special? I'd love to help!",
    ],
  },
  size: {
    patterns: [/size (guide|chart|help)|what size|which size|sizing/i],
    responses: [
      `📏 **HindustanOnhi Size Guide:**\n\n| Size | Bust | Waist | Hip |\n|------|------|-------|-----|\n| XS | 32" | 26" | 35" |\n| S | 34" | 28" | 37" |\n| M | 36" | 30" | 39" |\n| L | 38" | 32" | 41" |\n| XL | 40" | 34" | 43" |\n| XXL | 42" | 36" | 45" |\n\nFor the best fit, measure yourself and compare. If you're between sizes, we recommend going one size up for comfort. Need help with a specific product?`,
    ],
  },
  delivery: {
    patterns: [/deliver|shipping|dispatch|when will.*arrive|how long|tracking/i],
    responses: [
      "🚚 **Delivery Info:**\n\n• Standard delivery: 5-7 business days\n• Express delivery: 2-3 business days\n• Free shipping on orders above ₹999\n• We deliver across India via trusted partners\n• You'll receive tracking details via email & SMS once shipped\n\nNeed help with anything else?",
    ],
  },
  returns: {
    patterns: [/return|exchange|refund|cancel|replace/i],
    responses: [
      "🔄 **Returns & Exchange Policy:**\n\n• Easy 7-day return/exchange from delivery date\n• Product must be unused with original tags\n• Refund processed within 5-7 business days\n• Exchange available for size/color changes\n• Contact us for any issues — we're happy to help!\n\nWant to initiate a return?",
    ],
  },
  offers: {
    patterns: [/offer|discount|coupon|sale|deal|promo|code/i],
    responses: [
      "🎉 **Current Offers at HindustanOnhi:**\n\n• 🪷 Flat 20% off on first order — use code: **NAMASTE20**\n• 🎊 Festive Collection: Up to 40% off\n• 🚚 Free shipping on orders above ₹999\n• 💝 Buy 2 Get 10% extra off\n\nBrowse our latest collection to grab these deals!",
    ],
  },
  saree: {
    patterns: [/saree|sari|silk saree|cotton saree/i],
    responses: [
      "🪷 We have a beautiful collection of sarees! Our range includes:\n\n• **Silk Sarees** — Perfect for weddings & festivals\n• **Cotton Sarees** — Ideal for daily & office wear\n• **Georgette Sarees** — Light & elegant for parties\n• **Banarasi Sarees** — Luxurious traditional weaves\n\nWould you like me to help you find sarees for a specific occasion?",
    ],
  },
  kurti: {
    patterns: [/kurti|kurta|tunic/i],
    responses: [
      "✨ Our kurti collection is loved by thousands! Choose from:\n\n• **Anarkali Kurtis** — Graceful festive wear\n• **Straight Kurtis** — Crisp office & daily wear\n• **A-Line Kurtis** — Flattering on all body types\n• **Printed Kurtis** — Vibrant & trendy\n\nAvailable in sizes XS to XXL. Shall I help you find the perfect one?",
    ],
  },
  lehenga: {
    patterns: [/lehenga|ghagra|chaniya choli/i],
    responses: [
      "💃 Our lehenga collection is designed for your special moments:\n\n• **Bridal Lehengas** — Handcrafted luxury\n• **Party Wear Lehengas** — Stand out at every event\n• **Festive Lehengas** — Perfect for Navratri, Diwali & more\n• **Indo-Western Lehengas** — Modern meets tradition\n\nLooking for something specific? Tell me the occasion!",
    ],
  },
  occasion: {
    patterns: [/wedding|shaadi|festive|festival|diwali|navratri|eid|party|office|casual|daily/i],
    responses: [
      "Let me help you find the perfect outfit for your occasion! Here are my suggestions:",
    ],
  },
  payment: {
    patterns: [/payment|pay|razorpay|upi|card|net banking|cod|cash on delivery/i],
    responses: [
      "💳 **Payment Options:**\n\n• Credit/Debit Cards (Visa, Mastercard, RuPay)\n• UPI (GPay, PhonePe, Paytm)\n• Net Banking\n• Wallets\n• Cash on Delivery (COD)\n\nAll payments are 100% secure via Razorpay. Any other questions?",
    ],
  },
  fabric: {
    patterns: [/fabric|material|cotton|silk|georgette|chiffon|linen|rayon/i],
    responses: [
      "🧵 **Fabric Guide:**\n\n• **Cotton** — Breathable, perfect for summer & daily wear\n• **Silk** — Luxurious, ideal for weddings & festive events\n• **Georgette** — Lightweight, drapes beautifully\n• **Chiffon** — Sheer elegance for parties\n• **Linen** — Sophisticated & comfortable\n• **Rayon** — Soft, great for printed designs\n\nNeed fabric advice for a specific occasion?",
    ],
  },
  thanks: {
    patterns: [/thank|thanks|dhanyavad|shukriya/i],
    responses: [
      "You're welcome! 🙏 Happy shopping at HindustanOnhi. Feel free to ask anytime!",
      "Glad I could help! 🪷 Enjoy your shopping experience. Namaste!",
    ],
  },
  bye: {
    patterns: [/bye|goodbye|see you|tata|alvida/i],
    responses: [
      "Goodbye! 🙏 Thank you for visiting HindustanOnhi. Come back soon for more ethnic fashion! Namaste! 🪷",
    ],
  },
};

/**
 * Get a rule-based response
 */
function getRuleBasedResponse(message) {
  const lowerMsg = message.toLowerCase().trim();

  for (const [key, rule] of Object.entries(RULES)) {
    for (const pattern of rule.patterns) {
      if (pattern.test(lowerMsg)) {
        const responses = rule.responses;
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
  }

  return null;
}

/**
 * Search products based on user message
 */
async function searchProducts(message) {
  try {
    const keywords = message
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['the', 'for', 'and', 'show', 'find', 'want', 'need', 'looking', 'have', 'any'].includes(w));

    if (keywords.length === 0) return [];

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: keywords.join('|'), $options: 'i' } },
        { tags: { $in: keywords } },
        { fabric: { $regex: keywords.join('|'), $options: 'i' } },
      ],
    })
      .limit(4)
      .select('name slug price comparePrice images');

    return products;
  } catch (error) {
    console.error('Chatbot product search error:', error);
    return [];
  }
}

/**
 * Get occasion-based suggestions
 */
function getOccasionSuggestions(message) {
  const lower = message.toLowerCase();

  if (/wedding|shaadi|bridal/.test(lower)) {
    return "For a wedding, I'd recommend:\n• **Banarasi Silk Saree** — timeless elegance\n• **Bridal Lehenga** — stunning and regal\n• **Heavy Embroidered Kurti Set** — for pre-wedding events\n\nWould you like to browse our wedding collection?";
  }
  if (/diwali|festive|festival|navratri/.test(lower)) {
    return "For festive celebrations:\n• **Silk Kurtis with Gold Prints** — festive & vibrant\n• **Mirror Work Lehenga** — perfect for garba nights\n• **Embroidered Dupatta Sets** — easy festive styling\n\nCheck out our Festive Collection for more!";
  }
  if (/party/.test(lower)) {
    return "For a party look:\n• **Georgette Saree** — drapes beautifully\n• **Indo-Western Kurti** — trendy & chic\n• **Sequin Lehenga Choli** — dazzle the crowd\n\nShall I show you our party wear collection?";
  }
  if (/office|work|formal/.test(lower)) {
    return "For office wear:\n• **Cotton Straight Kurtis** — professional & comfy\n• **Linen Kurta Sets** — sophisticated look\n• **Printed A-Line Kurtis** — smart casual\n\nOur daily wear collection has great options!";
  }
  return null;
}

/**
 * Main chatbot handler
 */
async function getChatbotResponse(message, conversationHistory = []) {
  // 1. Try rule-based first
  const ruleResponse = getRuleBasedResponse(message);
  if (ruleResponse) {
    // For occasion queries, add specific suggestions
    if (RULES.occasion.patterns.some((p) => p.test(message))) {
      const occasionTip = getOccasionSuggestions(message);
      if (occasionTip) {
        return ruleResponse + '\n\n' + occasionTip;
      }
    }
    return ruleResponse;
  }

  // 2. Try product search
  const products = await searchProducts(message);
  if (products.length > 0) {
    let response = "🛍 Here's what I found for you:\n\n";
    products.forEach((p, i) => {
      const discount = p.comparePrice > p.price
        ? ` ~~₹${p.comparePrice}~~ (${Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)}% off)`
        : '';
      response += `${i + 1}. **${p.name}** — ₹${p.price}${discount}\n`;
    });
    response += "\nWould you like more details on any of these?";
    return response;
  }

  // 3. Try OpenAI if available
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-key-here') {
    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const systemPrompt = `You are a friendly and helpful shopping assistant for HindustanOnhi, a premium Indian ethnic fashion brand. You help customers find sarees, kurtis, lehengas, dupattas, and festive wear. Be warm, use Indian greetings, and provide helpful fashion advice. Keep responses concise and engaging. Always encourage browsing the collection.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-6).map((m) => ({
          role: m.role === 'bot' ? 'assistant' : 'user',
          content: m.content,
        })),
        { role: 'user', content: message },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 300,
        temperature: 0.7,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI error, falling back:', error.message);
    }
  }

  // 4. Default fallback
  const fallbacks = [
    "I'd love to help you find the perfect ethnic outfit! 🪷 You can ask me about:\n\n• **Products** — sarees, kurtis, lehengas\n• **Sizes** — our size guide\n• **Delivery** — shipping info\n• **Returns** — our return policy\n• **Offers** — current deals\n• **Occasions** — outfit suggestions for events\n\nWhat would you like to know?",
    "I'm your HindustanOnhi fashion assistant! 🙏 Try asking me things like:\n\n• 'Show me silk sarees'\n• 'What size should I pick?'\n• 'Any offers today?'\n• 'Outfit for a wedding'\n\nHow can I help you today?",
  ];

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

module.exports = { getChatbotResponse };
