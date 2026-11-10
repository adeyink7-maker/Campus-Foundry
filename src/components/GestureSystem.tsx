import React, { ReactNode } from 'react';

export interface GestureSystemProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export const GestureSystem: React.FC<GestureSystemProps> = ({ children }) => {
  return <div className="w-full h-full">{children}</div>;
};

export default GestureSystem;
