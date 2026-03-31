/**
 * Email Worker
 * 
 * Handles email sending jobs.
 * 
 * @module shared/workers/emailWorker
 */

import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';

/**
 * Email options
 */
interface EmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  data: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Email result
 */
interface EmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

/**
 * Email transporter (lazy initialized)
 */
let transporter: nodemailer.Transporter | null = null;

/**
 * Get or create email transporter
 */
async function getTransporter(): Promise<nodemailer.Transporter> {
  if (!transporter) {
    // Use different configurations based on environment
    if (process.env.NODE_ENV === 'production') {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } else {
      // Use Ethereal for development
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }
  }
  return transporter;
}

/**
 * Template cache
 */
const templateCache: Map<string, handlebars.TemplateDelegate> = new Map();

/**
 * Load and compile email template
 */
async function loadTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName)!;
  }

  const templatePath = path.join(
    process.cwd(),
    'server',
    'src',
    'shared',
    'email-templates',
    `${templateName}.html`
  );

  try {
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const compiledTemplate = handlebars.compile(templateContent);
    templateCache.set(templateName, compiledTemplate);
    return compiledTemplate;
  } catch (error) {
    console.error(`Failed to load template: ${templateName}`, error);
    throw new Error(`Email template not found: ${templateName}`);
  }
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const { to, subject, template, data, attachments } = options;

  // Load and render template
  const compiledTemplate = await loadTemplate(template);
  const html = compiledTemplate(data);

  // Get transporter
  const transport = await getTransporter();

  // Send email
  const result = await transport.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@creatorarmour.com',
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
    attachments: attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType,
    })),
  });

  // Log preview URL in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Preview URL:', nodemailer.getTestMessageUrl(result));
  }

  return {
    messageId: result.messageId,
    accepted: result.accepted,
    rejected: result.rejected,
  };
}

/**
 * Send a plain text email (for simple notifications)
 */
export async function sendPlainTextEmail(
  to: string | string[],
  subject: string,
  text: string
): Promise<EmailResult> {
  const transport = await getTransporter();

  const result = await transport.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@creatorarmour.com',
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    text,
  });

  return {
    messageId: result.messageId,
    accepted: result.accepted,
    rejected: result.rejected,
  };
}

/**
 * Register Handlebars helpers
 */
function registerHandlebarsHelpers(): void {
  // Format date helper
  handlebars.registerHelper('formatDate', (date: string | Date, format?: string) => {
    const d = new Date(date);
    if (format === 'short') {
      return d.toLocaleDateString('en-IN');
    }
    return d.toLocaleString('en-IN');
  });

  // Format currency helper
  handlebars.registerHelper('formatCurrency', (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
    }).format(amount);
  });

  // Capitalize helper
  handlebars.registerHelper('capitalize', (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  });

  // Equality helper
  handlebars.registerHelper('eq', (a: any, b: any) => a === b);

  // Not equal helper
  handlebars.registerHelper('neq', (a: any, b: any) => a !== b);
}

// Register helpers on module load
registerHandlebarsHelpers();

export default {
  sendEmail,
  sendPlainTextEmail,
};
