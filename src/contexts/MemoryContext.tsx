import React, { createContext, useContext, ReactNode } from 'react';
import { useMemory, UseMemoryReturn } from '../hooks/useMemory';

/**
 * Memory Context Type
 * Provides memory system functionality through React Context
 */
type MemoryContextType = UseMemoryReturn;

/**
 * Memory Context
 * React context for sharing memory system functionality across components
 */
const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

/**
 * Custom hook to access Memory context
 * Throws error if used outside of MemoryProvider
 * 
 * @returns Memory context value with all memory operations
 */
export const useMemoryContext = (): MemoryContextType => {
  const context = useContext(MemoryContext);
  if (context === undefined) {
    throw new Error('useMemoryContext must be used within a MemoryProvider');
  }
  return context;
};

/**
 * Memory Provider Props
 * Props interface for MemoryProvider component
 */
interface MemoryProviderProps {
  children: ReactNode;
}

/**
 * Memory Provider Component
 * 
 * Provides memory system functionality to child components through React Context.
 * Wraps the useMemory hook and makes it available throughout the component tree.
 * 
 * Features:
 * - Vector-based semantic search
 * - User and project isolation
 * - Automatic embedding generation
 * - Secure API key handling
 * - Error and loading state management
 */
export const MemoryProvider: React.FC<MemoryProviderProps> = ({ children }) => {
  // Initialize memory hook with all functionality
  const memoryHook = useMemory();

  return (
    <MemoryContext.Provider value={memoryHook}>
      {children}
    </MemoryContext.Provider>
  );
};