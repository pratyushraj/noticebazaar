import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

import { trackEvent } from './analytics';

function sendMetric(metric: Metric) {
  // Log to console in dev
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value.toFixed(2), metric.rating);
  }

  // Send to our unified analytics engine (Mixpanel + Supabase DB)
  if (import.meta.env.PROD) {
    const eventName = `web_vitals_${metric.name.toLowerCase()}` as any;
    trackEvent(eventName, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_rating: metric.rating,
      metric_delta: metric.delta,
    });
  }

  // Fallback to Google Analytics if loaded
  if (import.meta.env.PROD && typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_rating: metric.rating,
      metric_delta: metric.delta,
    });
  }
}

export function initWebVitals() {
  onCLS(sendMetric);
  onFCP(sendMetric);
  onINP(sendMetric);
  onLCP(sendMetric);
  onTTFB(sendMetric);
}
