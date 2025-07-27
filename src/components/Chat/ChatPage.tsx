import React from 'react';
import { ChatWindow } from './ChatWindow';
import { ChatInput } from './ChatInput';

/**
 * ChatPage Component
 * 
 * Main chat interface combining the chat window and input components.
 * Provides a full-height layout for the chat experience.
 */
export const ChatPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <ChatWindow />
      <ChatInput />
    </div>
  );
};