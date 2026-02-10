const ChatbotConversation = require('../models/ChatbotConversation');
const { getChatbotResponse } = require('../utils/chatbot');

/**
 * @desc    Send message to chatbot
 * @route   POST /api/chatbot/message
 * @access  Public
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Message and sessionId are required',
      });
    }

    // Find or create conversation
    let conversation = await ChatbotConversation.findOne({ sessionId });
    if (!conversation) {
      conversation = new ChatbotConversation({
        sessionId,
        user: req.user?._id || null,
        messages: [],
      });
    }

    // Add user message
    conversation.messages.push({ role: 'user', content: message });

    // Get bot response
    const botResponse = await getChatbotResponse(message, conversation.messages);

    // Add bot response
    conversation.messages.push({ role: 'bot', content: botResponse });

    await conversation.save();

    res.status(200).json({
      success: true,
      response: botResponse,
      conversationId: conversation._id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get conversation history
 * @route   GET /api/chatbot/history/:sessionId
 * @access  Public
 */
exports.getHistory = async (req, res, next) => {
  try {
    const conversation = await ChatbotConversation.findOne({
      sessionId: req.params.sessionId,
    });

    res.status(200).json({
      success: true,
      messages: conversation ? conversation.messages : [],
    });
  } catch (error) {
    next(error);
  }
};
