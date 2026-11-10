import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { AppUser } from '../types';
import { prefetchPlayerCard } from '../services/playerCardService';

interface PlayerCardContextType {
  isCardOpen: boolean;
  activeUser: AppUser | null;
  originRect: DOMRect | null;
  openPlayerCard: (userOrId: AppUser | string, originRect?: DOMRect) => void;
  closePlayerCard: () => void;
  isEditorOpen: boolean;
  openEditor: (targetUser?: AppUser) => void;
  openPlayerCardEditor: (targetUser?: AppUser) => void;
  closeEditor: () => void;
  editorUser: AppUser | null;
  handlePrefetch: (user: AppUser) => void;
}

const PlayerCardContext = createContext<PlayerCardContextType | undefined>(undefined);

export const PlayerCardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<AppUser | null>(null);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorUser, setEditorUser] = useState<AppUser | null>(null);

  const openPlayerCard = useCallback((userOrId: AppUser | string, rect?: DOMRect) => {
    if (typeof userOrId === 'string') {
      const fallbackUser: AppUser = {
        id: userOrId,
        fullName: 'Campus Student',
        email: `${userOrId}@students.unilorin.edu.ng`,
        role: 'student',
        accountType: 'BUYER',
        username: `@${userOrId}`,
        faculty: 'Communication & Information Sciences',
        department: 'Computer Science',
        level: '300L',
        hostelLocation: 'Zamfara Hostel',
        isVerified: true,
      };
      setActiveUser(fallbackUser);
    } else {
      setActiveUser(userOrId);
    }

    if (rect) {
      setOriginRect(rect);
    } else {
      setOriginRect(null);
    }
    setIsCardOpen(true);
  }, []);

  const closePlayerCard = useCallback(() => {
    setIsCardOpen(false);
  }, []);

  const openEditor = useCallback((targetUser?: AppUser) => {
    if (targetUser) {
      setEditorUser(targetUser);
    }
    setIsEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setIsEditorOpen(false);
  }, []);

  const handlePrefetch = useCallback((user: AppUser) => {
    prefetchPlayerCard(user);
  }, []);

  const value = useMemo(
    () => ({
      isCardOpen,
      activeUser,
      originRect,
      openPlayerCard,
      closePlayerCard,
      isEditorOpen,
      openEditor,
      openPlayerCardEditor: openEditor,
      closeEditor,
      editorUser,
      handlePrefetch,
    }),
    [isCardOpen, activeUser, originRect, openPlayerCard, closePlayerCard, isEditorOpen, openEditor, closeEditor, editorUser, handlePrefetch]
  );

  return (
    <PlayerCardContext.Provider value={value}>
      {children}
    </PlayerCardContext.Provider>
  );
};

export const usePlayerCard = (): PlayerCardContextType => {
  const context = useContext(PlayerCardContext);
  if (!context) {
    throw new Error('usePlayerCard must be used within a PlayerCardProvider');
  }
  return context;
};
