/**
 * Robust LocalStorage Utility with Quota Exceeded Protection & Memory Fallback
 */

const memoryFallback = new Map<string, string>();

export const safeStorage = {
  get<T>(key: string, fallback: T): T {
    try {
      if (typeof window === 'undefined') return fallback;
      const item = localStorage.getItem(key);
      if (item === null) {
        const memItem = memoryFallback.get(key);
        return memItem ? (JSON.parse(memItem) as T) : fallback;
      }
      return JSON.parse(item) as T;
    } catch (err) {
      console.warn(`[safeStorage] Failed to read key "${key}":`, err);
      const memItem = memoryFallback.get(key);
      return memItem ? (JSON.parse(memItem) as T) : fallback;
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      if (typeof window === 'undefined') return false;
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      memoryFallback.set(key, serialized);
      return true;
    } catch (err: any) {
      console.warn(`[safeStorage] Quota or storage error setting key "${key}":`, err);
      // QuotaExceededError handling
      try {
        memoryFallback.set(key, JSON.stringify(value));
        // Prune older non-essential keys if localStorage is full
        safeStorage.pruneOldestEntries();
        // Try one more time after pruning
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (retryErr) {
        console.error(`[safeStorage] Memory fallback active for "${key}".`);
        return false;
      }
    }
  },

  remove(key: string): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
      memoryFallback.delete(key);
    } catch (err) {
      console.warn(`[safeStorage] Failed to remove key "${key}":`, err);
    }
  },

  pruneOldestEntries(): void {
    try {
      // Keys that can be pruned or capped
      const prunableKeys = [
        'campus_foundry_snaps_v4',
        'campus_foundry_posts_v4',
        'campus_foundry_chat_messages_v4',
      ];

      for (const k of prunableKeys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 8) {
              // Keep only the 8 most recent items
              const trimmed = parsed.slice(0, 8);
              localStorage.setItem(k, JSON.stringify(trimmed));
            }
          } catch {}
        }
      }
    } catch {}
  },
};
