import posthog from 'posthog-js';

if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  // Suppress web vitals errors before PostHog initialization
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('web vitals callbacks not loaded')) {
      return; // Suppress this specific error
    }
    originalError.apply(console, args);
  };

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    ui_host: 'https://us.posthog.com',
    capture_exceptions: true, // This enables capturing exceptions using Error Tracking, set to false if you don't want this
    debug: process.env.NODE_ENV === 'development',
    // Disable automatic web vitals collection to prevent the error
    autocapture: false,
  });
}
