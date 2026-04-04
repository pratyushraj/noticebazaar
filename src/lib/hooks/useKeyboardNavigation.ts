import { useEffect, useCallback } from 'react';

// Enhanced keyboard navigation hook for better accessibility
export const useKeyboardNavigation = () => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip navigation for input fields, textareas, and contenteditable elements
    const target = event.target as HTMLElement;
    const isFormElement = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
                         target.contentEditable === 'true' ||
                         target.closest('[contenteditable="true"]');

    if (isFormElement) return;

    // Enhanced keyboard shortcuts
    switch (event.key) {
      case 'Escape':
        // Close modals, dropdowns, or go back
        const modal = document.querySelector('[role="dialog"], .modal, [data-state="open"]');
        const backdrop = document.querySelector('[data-radix-portal]');
        if (modal && backdrop) {
          const closeBtn = modal.querySelector('[aria-label*="close"], [data-radix-collection-item]');
          if (closeBtn) {
            (closeBtn as HTMLElement).click();
            event.preventDefault();
          }
        }
        break;

      case 'Enter':
        // Activate focused element
        if (document.activeElement?.tagName === 'BUTTON' ||
            document.activeElement?.getAttribute('role') === 'button') {
          (document.activeElement as HTMLElement).click();
          event.preventDefault();
        }
        break;

      case 'ArrowUp':
      case 'ArrowDown':
        // Navigate through lists and menus
        const focusableElements = Array.from(
          document.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0; // Only visible elements
        });

        if (focusableElements.length > 0) {
          const currentIndex = focusableElements.indexOf(document.activeElement as Element);
          let nextIndex;

          if (event.key === 'ArrowDown') {
            nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
          } else {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
          }

          (focusableElements[nextIndex] as HTMLElement).focus();
          event.preventDefault();
        }
        break;

      case '?':
        // Show keyboard shortcuts help (if Shift is also pressed)
        if (event.shiftKey) {
          // Could show a modal with keyboard shortcuts
          console.log('Keyboard shortcuts: Escape (close), Enter (activate), ↑↓ (navigate)');
          event.preventDefault();
        }
        break;
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Hook for managing focus traps in modals
export const useFocusTrap = (isActive: boolean, containerRef: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Close modal or dialog
        const closeBtn = container.querySelector('[aria-label*="close"], .close-btn');
        if (closeBtn) {
          (closeBtn as HTMLElement).click();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isActive, containerRef]);
};