// Analytics tracking for Vercel deployment
export const trackPageView = (page) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: page,
      page_location: window.location.href
    });
  }
};

export const trackEvent = (action, category = 'engagement', label = '', value = 0) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
};

// Track user interactions for Vercel Analytics
export const trackUserInteraction = (element, action) => {
  trackEvent(action, 'user_interaction', element);
  
  // Also track for Vercel Analytics if available
  if (typeof window !== 'undefined' && window.va) {
    window.va('track', action, { element });
  }
};

// Initialize analytics
export const initAnalytics = () => {
  // Track initial page load
  trackPageView('Home');
  
  // Set up performance tracking
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      // Track load time
      const loadTime = performance.now();
      trackEvent('page_load_time', 'performance', 'load_complete', Math.round(loadTime));
    });
  }
};