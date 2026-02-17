import dotenv from 'dotenv';
import path from 'path';

import { sendBrandContractReadyEmail } from '../src/services/brandContractReadyEmailService.js';
import {
  sendBrandSigningReminderEmail,
  sendDealPendingReminderToBrand,
  sendDealPendingReminderToCreator,
} from '../src/services/dealReminderEmailService.js';
import { sendBrandFormSubmissionEmail } from '../src/services/brandFormSubmissionEmailService.js';
import { sendOTPEmail } from '../src/services/otpEmailService.js';

const root = path.resolve(process.cwd());
dotenv.config({ path: path.join(root, '.env') });

const to = process.argv[2];
if (!to) {
  console.error('Usage: tsx scripts/send_demo_emails.ts <email>');
  process.exit(1);
}

async function run() {
  console.log('Sending demo emails to:', to);

  const brandContract = await sendBrandContractReadyEmail(to, 'Demo Brand', {
    brandName: 'Demo Brand',
    creatorName: 'Pratyush Raj',
    dealType: 'paid',
    dealAmount: 45000,
    deliverables: ['1 Instagram Reel', '2 Stories', 'Usage rights 90 days'],
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    contractReadyToken: 'demo-contract-ready-token',
    contractUrl: 'https://creatorarmour.com/contracts/demo.pdf',
  });
  console.log('Brand contract ready:', brandContract);

  const brandSignReminder = await sendBrandSigningReminderEmail(to, {
    creatorName: 'Pratyush Raj',
    brandName: 'Demo Brand',
    contractReadyUrl: 'https://creatorarmour.com/contract-ready/demo-contract-ready-token',
  });
  console.log('Brand signing reminder:', brandSignReminder);

  const brandPending = await sendDealPendingReminderToBrand(to, {
    creatorName: 'Pratyush Raj',
    brandName: 'Demo Brand',
    contractReadyUrl: 'https://creatorarmour.com/contract-ready/demo-contract-ready-token',
  });
  console.log('Brand pending reminder:', brandPending);

  const creatorPending = await sendDealPendingReminderToCreator(to, {
    creatorName: 'Pratyush Raj',
    brandName: 'Demo Brand',
    dashboardUrl: 'https://creatorarmour.com/deals',
  });
  console.log('Creator pending reminder:', creatorPending);

  const brandForm = await sendBrandFormSubmissionEmail(
    to,
    'Pratyush Raj',
    {
      brandName: 'Demo Brand',
      campaignName: 'Spring Launch',
      dealType: 'paid',
      paymentAmount: 30000,
      deliverables: ['1 Instagram Reel', '1 Story set', '1 YouTube Short'],
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    },
    null
  );
  console.log('Brand form submission:', brandForm);

  await sendOTPEmail(to, '482913');
  console.log('OTP email: sent');
}

run().catch((err) => {
  console.error('Demo email script failed:', err);
  process.exit(1);
});
