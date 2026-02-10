const mongoose = require('mongoose');

/**
 * ChatbotConversation Schema
 * Stores chatbot interaction history per user/session
 */
const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'bot'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatbotConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for guest users
    },
    sessionId: {
      type: String,
      required: true,
    },
    messages: [messageSchema],
    context: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true }
);

// Auto-expire conversations after 30 days
chatbotConversationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('ChatbotConversation', chatbotConversationSchema);
