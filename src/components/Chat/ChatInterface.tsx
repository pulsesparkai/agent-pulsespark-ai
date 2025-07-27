import React, { useState, useRef, useEffect } from 'react';
import { Send, User } from 'lucide-react';

// Type definitions for chat data
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
  senderName?: string;
}

interface ChatThread {
  id: string;
  name: string;
  lastMessage: string;
  avatar?: string;
  initials: string;
  isActive?: boolean;
}

/**
 * ChatInterface Component
 * 
 * A full-featured chat interface with PulseSpark branding featuring:
 * - Left sidebar with chat thread list
 * - Main chat panel with message bubbles
 * - Real-time message input and sending
 * - Consistent green and white branding
 */
export const ChatInterface: React.FC = () => {
  // State management for chat functionality
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! How can I help you today?',
      sender: 'other',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      senderName: 'AI Assistant'
    },
    {
      id: '2',
      text: 'I need help with my React project',
      sender: 'user',
      timestamp: new Date(Date.now() - 240000), // 4 minutes ago
    },
    {
      id: '3',
      text: 'I\'d be happy to help! What specific issue are you facing with your React project?',
      sender: 'other',
      timestamp: new Date(Date.now() - 180000), // 3 minutes ago
      senderName: 'AI Assistant'
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [activeChat, setActiveChat] = useState('1');
  
  // Ref for auto-scrolling to bottom of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sample chat threads for sidebar
  const [chatThreads] = useState<ChatThread[]>([
    {
      id: '1',
      name: 'AI Assistant',
      lastMessage: 'I\'d be happy to help! What specific...',
      initials: 'AI',
      isActive: true
    },
    {
      id: '2',
      name: 'Project Discussion',
      lastMessage: 'Let\'s review the requirements...',
      initials: 'PD'
    },
    {
      id: '3',
      name: 'Code Review',
      lastMessage: 'The implementation looks good...',
      initials: 'CR'
    },
    {
      id: '4',
      name: 'Bug Reports',
      lastMessage: 'Found an issue with the login...',
      initials: 'BR'
    }
  ]);

  /**
   * Auto-scroll to bottom when new messages are added
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Scroll to the bottom of the messages container
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Handle sending a new message
   * Adds user message to the chat and clears input
   */
  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Simulate AI response after a short delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Thanks for your message! I\'m processing your request...',
        sender: 'other',
        timestamp: new Date(),
        senderName: 'AI Assistant'
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  /**
   * Handle Enter key press in input field
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Handle chat thread selection
   */
  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId);
    // In a real app, you would load messages for the selected chat
  };

  /**
   * Format timestamp for display
   */
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Sidebar - Chat List */}
      <div className="w-80 bg-gray-100 border-r border-gray-300 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-300 bg-white">
          <h2 className="text-gray-900 font-semibold text-lg">Chats</h2>
        </div>

        {/* Chat Threads List */}
        <div className="flex-1 overflow-y-auto">
          {chatThreads.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleChatSelect(chat.id)}
              className={`
                flex items-center p-4 cursor-pointer transition-colors duration-200
                hover:bg-green-50 border-b border-gray-200
                ${activeChat === chat.id ? 'bg-green-50 border-l-4 border-l-green-600' : ''}
              `}
            >
              {/* Chat Avatar */}
              <div className="rounded-full bg-green-600 text-white flex items-center justify-center w-10 h-10 mr-3 font-semibold">
                {chat.avatar ? (
                  <img src={chat.avatar} alt={chat.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-sm">{chat.initials}</span>
                )}
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-800 font-medium text-sm truncate">
                  {chat.name}
                </h3>
                <p className="text-gray-600 text-xs truncate mt-1">
                  {chat.lastMessage}
                </p>
              </div>

              {/* Active Indicator */}
              {activeChat === chat.id && (
                <div className="w-2 h-2 bg-green-600 rounded-full ml-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-300 bg-white">
          <div className="flex items-center">
            <div className="rounded-full bg-green-600 text-white flex items-center justify-center w-8 h-8 mr-3">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-gray-900 font-bold text-lg">
                {chatThreads.find(chat => chat.id === activeChat)?.name || 'Chat'}
              </h1>
              <p className="text-gray-600 text-sm">Online</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex flex-col max-w-xs lg:max-w-md">
                {/* Message Bubble */}
                <div
                  className={`
                    rounded-lg p-3 shadow-sm
                    ${message.sender === 'user'
                      ? 'bg-green-600 text-white ml-auto'
                      : 'bg-gray-200 text-gray-900'
                    }
                  `}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>

                {/* Message Metadata */}
                <div
                  className={`
                    text-xs text-gray-500 mt-1
                    ${message.sender === 'user' ? 'text-right' : 'text-left'}
                  `}
                >
                  {message.senderName && message.sender !== 'user' && (
                    <span className="font-medium">{message.senderName} • </span>
                  )}
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Area */}
        <div className="p-4 border-t border-gray-300 bg-white">
          <div className="flex items-end space-x-2">
            {/* Text Input */}
            <div className="flex-1">
              <label htmlFor="messageInput" className="sr-only">
                Type your message
              </label>
              <textarea
                id="messageInput"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="
                  w-full rounded-md border border-gray-300 p-3 text-gray-900 
                  placeholder-gray-400 resize-none focus:outline-none 
                  focus:ring-2 focus:ring-green-600 focus:border-transparent
                  transition-colors duration-200
                "
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="
                bg-green-600 hover:bg-green-700 disabled:bg-gray-400 
                text-white font-bold py-3 px-6 rounded-md ml-2 
                transition-colors duration-200 flex items-center justify-center
                focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2
                disabled:cursor-not-allowed
              "
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Input Helper Text */}
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;