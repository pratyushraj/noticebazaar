/**
 * Startup environment validation.
 * Fails fast with clear messages instead of cryptic runtime errors.
 */

const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    if (!import.meta.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const msg = [
      '❌ Missing required environment variables:',
      ...missing.map(k => `   • ${k}`),
      '',
      'Create a .env file in the project root with these variables.',
      'See .env.example for reference.',
    ].join('\n');

    // In dev, show a visible overlay. In prod, log and throw.
    if (import.meta.env.DEV) {
      console.error(msg);
      // Show error in the DOM so devs see it immediately
      const root = document.getElementById('root');
      if (root) {
        root.innerHTML = `
          <div style="font-family:system-ui;padding:2rem;max-width:600px;margin:2rem auto;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;color:#991b1b">
            <h2 style="margin:0 0 1rem;font-size:1.25rem">⚠️ Missing Environment Variables</h2>
            <pre style="background:#fff;padding:1rem;border-radius:8px;font-size:0.875rem;overflow:auto">${missing.join('\n')}</pre>
            <p style="margin-top:1rem;color:#7f1d1d;font-size:0.875rem">Create a <code>.env</code> file in the project root. See <code>.env.example</code>.</p>
          </div>
        `;
      }
    }

    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
}
