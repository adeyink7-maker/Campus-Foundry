import { useEffect } from 'react';

export interface ScreenSecurityOptions {
  enabled: boolean;
  onScreenshotTaken?: () => void;
}

export const useScreenSecurity = ({ enabled, onScreenshotTaken }: ScreenSecurityOptions) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5'))
      ) {
        onScreenshotTaken?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onScreenshotTaken]);
};

export default useScreenSecurity;
