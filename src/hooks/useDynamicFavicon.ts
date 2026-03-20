import { useEffect } from 'react';
import { BrandDeal } from '@/types';

/**
 * Hook to dynamically change favicon based on payment status
 */
export const useDynamicFavicon = (brandDeals?: BrandDeal[]) => {
  useEffect(() => {
    if (!brandDeals || brandDeals.length === 0) {
      // Reset to default favicon
      updateFavicon('/favicon.ico');
      return;
    }

    const now = new Date();
    const overduePayments = brandDeals.filter(deal => {
      if (deal.status !== 'Payment Pending' || deal.payment_received_date) return false;
      const dueDate = new Date(deal.payment_expected_date);
      return dueDate < now;
    });

    const upcomingPayments = brandDeals.filter(deal => {
      if (deal.status !== 'Payment Pending' || deal.payment_received_date) return false;
      const dueDate = new Date(deal.payment_expected_date);
      const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 7;
    });

    // Create dynamic favicon based on status
    if (overduePayments.length > 0) {
      // Red dot for overdue
      createFaviconWithDot('#ef4444');
    } else if (upcomingPayments.length > 0) {
      // Yellow dot for upcoming
      createFaviconWithDot('#fbbf24');
    } else {
      // Green dot for clean
      createFaviconWithDot('#22c55e');
    }
  }, [brandDeals]);
};

const updateFavicon = (href: string) => {
  const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
  link.type = 'image/x-icon';
  link.rel = 'shortcut icon';
  link.href = href;
  document.getElementsByTagName('head')[0].appendChild(link);
};

const createFaviconWithDot = (color: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  if (!ctx) return;

  // Draw white background circle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(16, 16, 15, 0, 2 * Math.PI);
  ctx.fill();

  // Draw colored dot
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(16, 16, 8, 0, 2 * Math.PI);
  ctx.fill();

  // Convert to data URL and update favicon
  const dataUrl = canvas.toDataURL('image/png');
  updateFavicon(dataUrl);
};

