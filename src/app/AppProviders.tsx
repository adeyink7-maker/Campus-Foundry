import React, { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import { MarketplaceChatProvider } from '@/context/MarketplaceChatContext';
import { CartProvider } from '@/context/CartContext';
import { PlayerCardProvider } from '@/context/PlayerCardContext';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { OfflineIndicator } from '@/shared/ui/OfflineIndicator';

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ChatProvider>
            <MarketplaceChatProvider>
              <CartProvider>
                <PlayerCardProvider>
                  {children}
                  <OfflineIndicator />
                </PlayerCardProvider>
              </CartProvider>
            </MarketplaceChatProvider>
          </ChatProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default AppProviders;
