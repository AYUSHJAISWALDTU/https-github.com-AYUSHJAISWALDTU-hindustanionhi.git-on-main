import { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi';
import API from '../../utils/api';
import { generateSessionId } from '../../utils/helpers';

/**
 * Chatbot — floating AI chatbot widget
 * Appears on all pages, helps users find products, sizes, delivery info, etc.
 */
export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: 'Namaste! 🙏 Welcome to HindustanOnhi. I can help you find the perfect ethnic outfit, answer questions about sizes, delivery, offers & more. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [sessionId] = useState(() => {
    const saved = sessionStorage.getItem('chatbot_session');
    if (saved) return saved;
    const id = generateSessionId();
    sessionStorage.setItem('chatbot_session', id);
    return id;
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg) return;

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setTyping(true);

    try {
      const { data } = await API.post('/chatbot/message', {
        message: msg,
        sessionId,
      });

      setMessages((prev) => [...prev, { role: 'bot', content: data.response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: "I'm sorry, I'm having trouble right now. Please try again or browse our collections directly!",
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick suggestion chips
  const suggestions = [
    'Show me sarees',
    'Size guide',
    'Current offers',
    'Delivery info',
    'Wedding outfits',
  ];

  return (
    <>
      {/* Toggle Button */}
      <button
        className="chatbot-toggle"
        onClick={() => setOpen(!open)}
        aria-label="Chat with us"
      >
        {open ? <FiX /> : <FiMessageCircle />}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div>
              <h3>🪷 HindustanOnhi Assistant</h3>
              <div className="subtitle">We typically reply instantly</div>
            </div>
            <button className="chatbot-close" onClick={() => setOpen(false)}>
              <FiX />
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                {msg.content}
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="chat-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}

            {/* Quick suggestions (only show after first bot message) */}
            {messages.length === 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setInput(s);
                      setTimeout(() => {
                        setMessages((prev) => [...prev, { role: 'user', content: s }]);
                        setInput('');
                        setTyping(true);
                        API.post('/chatbot/message', { message: s, sessionId })
                          .then(({ data }) => {
                            setMessages((prev) => [...prev, { role: 'bot', content: data.response }]);
                          })
                          .catch(() => {
                            setMessages((prev) => [
                              ...prev,
                              { role: 'bot', content: "Sorry, please try again!" },
                            ]);
                          })
                          .finally(() => setTyping(false));
                      }, 100);
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      borderRadius: '20px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={typing}
            />
            <button onClick={sendMessage} disabled={typing || !input.trim()}>
              <FiSend />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
