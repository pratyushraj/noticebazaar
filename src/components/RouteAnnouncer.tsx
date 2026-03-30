/**
 * Announce route changes to screen readers.
 * Place once in App.tsx inside Router.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function RouteAnnouncer() {
  const location = useLocation();

  useEffect(() => {
    // Announce the new page to screen readers
    const title = document.title.split('|')[0].trim() || 'Page loaded';
    const announcer = document.getElementById('route-announcer');
    if (announcer) {
      announcer.textContent = title;
    }
  }, [location.pathname]);

  return (
    <div
      id="route-announcer"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );
}
