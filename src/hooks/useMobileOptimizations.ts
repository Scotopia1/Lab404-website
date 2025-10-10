import { useEffect, useState } from 'react';

interface TouchInfo {
  startX: number;
  startY: number;
  startTime: number;
  element: HTMLElement;
}

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  duration: number;
  element: HTMLElement;
}

interface MobileOptimizations {
  isMobile: boolean;
  isTouch: boolean;
  orientation: 'portrait' | 'landscape';
  viewport: {
    width: number;
    height: number;
  };
  // Navigation helpers
  canGoBack: boolean;
  goBack: () => void;
  // Touch interactions
  enableSwipeGestures: (
    element: HTMLElement, 
    onSwipe: (gesture: SwipeGesture) => void,
    options?: SwipeOptions
  ) => () => void;
  // Performance helpers
  optimizeForMobile: () => void;
  // Visual enhancements
  addHapticFeedback: (type?: 'light' | 'medium' | 'heavy') => void;
}

interface SwipeOptions {
  threshold?: number; // Minimum distance for swipe
  timeout?: number;   // Maximum time for swipe gesture
  preventScroll?: boolean; // Prevent default scroll
  direction?: 'horizontal' | 'vertical' | 'both';
}

export const useMobileOptimizations = (): MobileOptimizations => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768;
      
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setIsMobile(mobile);
      setIsTouch(touch);
    };

    // Update orientation
    const updateOrientation = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };

    // Update viewport
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Check navigation history
    const updateBackButton = () => {
      setCanGoBack(window.history.length > 1);
    };

    // Initial setup
    checkMobile();
    updateOrientation();
    updateViewport();
    updateBackButton();

    // Event listeners
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateOrientation);
    window.addEventListener('popstate', updateBackButton);

    // Mobile-specific optimizations
    if (isMobile) {
      // Prevent zoom on input focus (iOS)
      const viewportMeta = document.querySelector('meta[name=viewport]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        );
      }

      // Improve touch scrolling performance
      document.body.style.webkitOverflowScrolling = 'touch';
      
      // Disable text selection on UI elements (better for app-like feel)
      document.body.style.webkitUserSelect = 'none';
      document.body.style.userSelect = 'none';
      
      // Allow text selection in content areas
      const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div[contenteditable]');
      textElements.forEach(el => {
        (el as HTMLElement).style.webkitUserSelect = 'text';
        (el as HTMLElement).style.userSelect = 'text';
      });
    }

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateOrientation);
      window.removeEventListener('popstate', updateBackButton);
    };
  }, [isMobile]);

  const goBack = () => {
    if (canGoBack) {
      window.history.back();
    }
  };

  const enableSwipeGestures = (
    element: HTMLElement,
    onSwipe: (gesture: SwipeGesture) => void,
    options: SwipeOptions = {}
  ) => {
    const {
      threshold = 50,
      timeout = 300,
      preventScroll = false,
      direction = 'both'
    } = options;

    let touchInfo: TouchInfo | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      if (!isTouch) return;
      
      const touch = e.touches[0];
      touchInfo = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        element
      };

      if (preventScroll) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchInfo || !isTouch) return;

      if (preventScroll) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchInfo || !isTouch) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchInfo.startX;
      const deltaY = touch.clientY - touchInfo.startY;
      const deltaTime = Date.now() - touchInfo.startTime;

      // Check if gesture meets requirements
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance >= threshold && deltaTime <= timeout) {
        let swipeDirection: 'left' | 'right' | 'up' | 'down';
        
        // Determine direction based on largest delta
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (direction === 'vertical') return;
          swipeDirection = deltaX > 0 ? 'right' : 'left';
        } else {
          // Vertical swipe
          if (direction === 'horizontal') return;
          swipeDirection = deltaY > 0 ? 'down' : 'up';
        }

        onSwipe({
          direction: swipeDirection,
          distance,
          duration: deltaTime,
          element: touchInfo.element
        });
      }

      touchInfo = null;
    };

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Return cleanup function
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  };

  const optimizeForMobile = () => {
    if (!isMobile) return;

    // Add mobile-specific CSS classes
    document.body.classList.add('mobile-optimized');
    
    // Optimize font sizes for mobile
    const root = document.documentElement;
    if (viewport.width < 375) {
      root.style.fontSize = '14px';
    } else if (viewport.width < 414) {
      root.style.fontSize = '15px';
    } else {
      root.style.fontSize = '16px';
    }

    // Add safe area insets for devices with notches
    if (CSS.supports('padding: env(safe-area-inset-top)')) {
      root.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
      root.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
      root.style.setProperty('--safe-area-left', 'env(safe-area-inset-left)');
      root.style.setProperty('--safe-area-right', 'env(safe-area-inset-right)');
    }

    // Improve button touch targets
    const buttons = document.querySelectorAll('button, a[role="button"]');
    buttons.forEach(button => {
      const btn = button as HTMLElement;
      const computedStyle = window.getComputedStyle(btn);
      const height = parseInt(computedStyle.height);
      
      // Ensure minimum 44px touch target (iOS accessibility guideline)
      if (height < 44) {
        btn.style.minHeight = '44px';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
      }
    });
  };

  const addHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    // Haptic feedback for supported devices
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50]
      };
      navigator.vibrate(patterns[type]);
    }

    // iOS Taptic Engine (if available)
    if ('TapticEngine' in window) {
      const taptic = (window as any).TapticEngine;
      if (type === 'light' && taptic.selection) {
        taptic.selection();
      } else if (type === 'medium' && taptic.impact) {
        taptic.impact({ style: 'medium' });
      } else if (type === 'heavy' && taptic.impact) {
        taptic.impact({ style: 'heavy' });
      }
    }
  };

  return {
    isMobile,
    isTouch,
    orientation,
    viewport,
    canGoBack,
    goBack,
    enableSwipeGestures,
    optimizeForMobile,
    addHapticFeedback
  };
};

export default useMobileOptimizations;