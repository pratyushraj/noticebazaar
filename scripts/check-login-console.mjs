import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const EMAIL = process.env.LOGIN_EMAIL || 'notice104@yopmail.com';
const PASSWORD = process.env.LOGIN_PASSWORD || 'kickurass';

function redact(value) {
  if (!value) return value;
  // Keep it simple: avoid echoing credentials if they appear in messages.
  return String(value)
    .replaceAll(EMAIL, '[REDACTED_EMAIL]')
    .replaceAll(PASSWORD, '[REDACTED_PASSWORD]');
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleEvents = [];
  const pageErrors = [];
  const requestFailures = [];

  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      consoleEvents.push({
        type,
        text: redact(msg.text()),
        location: msg.location(),
      });
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(redact(err?.stack || err?.message || String(err)));
  });

  page.on('requestfailed', (req) => {
    const failure = req.failure();
    requestFailures.push({
      url: redact(req.url()),
      method: req.method(),
      errorText: redact(failure?.errorText || 'unknown'),
    });
  });

  const loginUrl = new URL('/login', BASE_URL).toString();
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

  await page.fill('#email', EMAIL);
  await page.fill('#password', PASSWORD);

  await Promise.allSettled([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);

  // Let any post-login async errors surface.
  await page.waitForTimeout(5000);

  const finalUrl = page.url();

  await browser.close();

  const summary = {
    baseUrl: BASE_URL,
    loginUrl,
    finalUrl,
    counts: {
      console: consoleEvents.length,
      pageErrors: pageErrors.length,
      requestFailures: requestFailures.length,
    },
    console: consoleEvents,
    pageErrors,
    requestFailures,
  };

  // Structured output so it’s easy to scan/grep.
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
}

main().catch((err) => {
  process.stderr.write(String(err?.stack || err) + '\n');
  process.exit(1);
});

