import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

function sendMetric(metric: Metric) {
  // Log to console in dev
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value.toFixed(2), metric.rating);
  }

  // Send to analytics in production
  if (import.meta.env.PROD && window.gtag) {
    window.gtag('event', metric.name, {
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
