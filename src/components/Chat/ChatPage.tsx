import React from 'react';
import { ChatWindow } from './ChatWindow';
import { ChatInput } from './ChatInput';

export const ChatPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <ChatWindow />
      <ChatInput />
    </div>
  );
};