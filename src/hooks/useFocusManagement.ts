import { useEffect, useRef, useCallback } from 'react';

// Hook for managing focus in modals and dialogs
export const useFocusManagement = (isOpen: boolean) => {
  const focusableRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the modal content
      if (focusableRef.current) {
        focusableRef.current.focus();
      }

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          // Let the parent component handle escape - don't close here
          // This allows for proper cleanup and state management
        }
      };

      // Trap focus within the modal
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab' && focusableRef.current) {
          const focusableElements = focusableRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
              lastElement?.focus();
              e.preventDefault();
            }
          } else {
            // Tab
            if (document.activeElement === lastElement) {
              firstElement?.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleTabKey);

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('keydown', handleTabKey);
      };
    } else {
      // Return focus to previously focused element when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }
  }, [isOpen]);

  return focusableRef;
};

// Hook for keyboard navigation in grids and lists
export const useKeyboardNavigation = (
  itemCount: number,
  columns: number = 1,
  onSelect?: (index: number) => void
) => {
  const containerRef = useRef<HTMLElement>(null);
  const activeIndexRef = useRef<number>(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!containerRef.current) return;

    const currentIndex = activeIndexRef.current;
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
        newIndex = Math.min(currentIndex + columns, itemCount - 1);
        e.preventDefault();
        break;
      case 'ArrowUp':
        newIndex = Math.max(currentIndex - columns, 0);
        e.preventDefault();
        break;
      case 'ArrowLeft':
        if (columns > 1) {
          newIndex = Math.max(currentIndex - 1, 0);
          e.preventDefault();
        }
        break;
      case 'ArrowRight':
        if (columns > 1) {
          newIndex = Math.min(currentIndex + 1, itemCount - 1);
          e.preventDefault();
        }
        break;
      case 'Home':
        newIndex = 0;
        e.preventDefault();
        break;
      case 'End':
        newIndex = itemCount - 1;
        e.preventDefault();
        break;
      case 'Enter':
      case ' ':
        if (onSelect) {
          onSelect(currentIndex);
          e.preventDefault();
        }
        break;
    }

    if (newIndex !== currentIndex) {
      activeIndexRef.current = newIndex;
      
      // Focus the new item
      const items = containerRef.current.querySelectorAll('[data-keyboard-nav]');
      const newItem = items[newIndex] as HTMLElement;
      if (newItem) {
        newItem.focus();
      }
    }
  }, [itemCount, columns, onSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const setActiveIndex = useCallback((index: number) => {
    activeIndexRef.current = Math.max(0, Math.min(index, itemCount - 1));
  }, [itemCount]);

  return {
    containerRef,
    setActiveIndex,
    activeIndex: activeIndexRef.current
  };
};

// Hook for accessible announcements
export const useAccessibleAnnouncement = () => {
  const announcementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create live region for announcements if it doesn't exist
    if (!announcementRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.id = 'live-announcements';
      document.body.appendChild(liveRegion);
      announcementRef.current = liveRegion;
    }

    return () => {
      // Cleanup on unmount
      if (announcementRef.current && document.body.contains(announcementRef.current)) {
        document.body.removeChild(announcementRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcementRef.current) {
      announcementRef.current.setAttribute('aria-live', priority);
      announcementRef.current.textContent = message;
      
      // Clear the announcement after a short delay
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  return { announce };
};

// Hook for managing skip links
export const useSkipLinks = () => {
  const skipLinksRef = useRef<{ [key: string]: HTMLElement | null }>({});

  const registerSkipTarget = useCallback((id: string, element: HTMLElement | null) => {
    skipLinksRef.current[id] = element;
  }, []);

  const skipTo = useCallback((targetId: string) => {
    const target = skipLinksRef.current[targetId];
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return { registerSkipTarget, skipTo };
};

// Hook for reduced motion preferences
export const useReducedMotion = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return { prefersReducedMotion };
};