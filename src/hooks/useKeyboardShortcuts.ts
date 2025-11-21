import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Common keyboard shortcuts for dashboard
export function useDashboardShortcuts() {
  const navigate = useNavigate();

  useKeyboardShortcuts([
    {
      key: 'k',
      metaKey: true,
      action: () => {
        // Open search - you can add a search modal here
        // TODO: Implement search modal
      },
      description: 'Open search',
    },
    {
      key: '1',
      metaKey: true,
      action: () => navigate('/creator-dashboard'),
      description: 'Go to Dashboard',
    },
    {
      key: '2',
      metaKey: true,
      action: () => navigate('/creator-contracts'),
      description: 'Go to Deals',
    },
    {
      key: '3',
      metaKey: true,
      action: () => navigate('/creator-payments'),
      description: 'Go to Payments',
    },
    {
      key: '4',
      metaKey: true,
      action: () => navigate('/creator-content-protection'),
      description: 'Go to Protection',
    },
  ]);
}

