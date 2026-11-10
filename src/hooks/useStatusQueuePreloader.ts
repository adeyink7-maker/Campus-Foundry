import { useEffect } from 'react';

export interface StatusItem {
  id: string;
  url: string;
  type: 'image' | 'video';
}

export interface UserStoryStack {
  userId: string;
  statuses: StatusItem[];
}

export interface StatusQueuePreloaderProps {
  storyStacks: UserStoryStack[];
  currentStackIndex: number;
  currentStatusIndex: number;
}

export const useStatusQueuePreloader = ({
  storyStacks,
  currentStackIndex,
  currentStatusIndex,
}: StatusQueuePreloaderProps): void => {
  useEffect(() => {
    if (!storyStacks || storyStacks.length === 0) return;

    const currentStack = storyStacks[currentStackIndex];
    if (currentStack?.statuses) {
      const nextStatus = currentStack.statuses[currentStatusIndex + 1];
      if (nextStatus?.url && nextStatus.type === 'image') {
        const img = new Image();
        img.src = nextStatus.url;
      }
    }
  }, [storyStacks, currentStackIndex, currentStatusIndex]);
};

export default useStatusQueuePreloader;
