import { test, expect } from '@playwright/test';
import { join } from 'path';
import { writeFileSync } from 'fs';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:8080';

test.describe('Add Hinglish Demo Patient', () => {
  let beforePhotoPath: string;
  let afterPhotoPath: string;

  test.beforeAll(() => {
    const dummyImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    beforePhotoPath = join(process.cwd(), 'tests', 'before-dummy.png');
    afterPhotoPath = join(process.cwd(), 'tests', 'after-dummy.png');
    writeFileSync(beforePhotoPath, dummyImage);
    writeFileSync(afterPhotoPath, dummyImage);
  });

  test('Create patient with before photo, consult with Hinglish scribe, and save without deleting', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });

    // Add console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

    // 1. Login
    await page.goto(`${BASE_URL}/login`);
    const emailInput = page.locator('input#identifier, input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();
    
    await emailInput.fill('reception@yourdentist.in');
    await passwordInput.fill('Password123!');
    await submitButton.click();
    
    await page.waitForURL(/\/.*(creator-dashboard|reactivation).*/, { timeout: 15000 });

    // 2. Navigate to Reactivation Customers list
    await page.goto(`${BASE_URL}/reactivation/customers`);
    await page.waitForSelector('text=Patients', { timeout: 10000 });
    
    // Wait for context / session to load fully so clinicId is populated
    await page.waitForTimeout(3000);

    // 3. Open Add Patient Modal
    const addPatientBtn = page.locator('button:has-text("Add Patient")').first();
    await addPatientBtn.click();
    await page.waitForSelector('text=Full Name', { timeout: 5000 });

    // 4. Fill Intake Form details
    const nameInput = page.locator('[placeholder="e.g. Rahul Sharma"]').first();
    const phoneInput = page.locator('[placeholder="+91 98765 43210"]').first();
    const serviceInput = page.locator('[placeholder="e.g. Tooth pain, cleaning, RCT consultation"]').first();
    const notesInput = page.locator('[placeholder="Any complaint, pain, or front-desk note..."]').first();
    
    const uniqueName = `Rohan Hinglish Demo ${Date.now()}`;
    await nameInput.fill(uniqueName);
    await phoneInput.fill('+91 99999 99999');
    await serviceInput.fill('Dental Crown Restoration');
    await notesInput.fill('Pre-op consultation for ceramic crown.');

    // 5. Upload Before Photo in General Tab
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('text=Upload Before Photo').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(beforePhotoPath);

    // 6. Submit Add Patient Form
    const saveButton = page.locator('button:has-text("Add Patient")').last();
    await saveButton.click();
    
    // Wait for the modal to close and new row to appear
    const patientRow = page.locator(`tr:has-text("${uniqueName}")`).first();
    await patientRow.waitFor({ state: 'visible', timeout: 8000 });

    // 7. Click on the Patient row to edit/view
    await patientRow.click();
    await page.waitForSelector('text=Patient Record', { timeout: 5000 });
    
    // 8. Go to After Consultation (Medical) Tab
    await page.locator('button:has-text("After Consultation")').first().click();

    // 9. Input Hinglish dictation text in AI Scribe text area manually or simulate typing
    await page.locator('button:has-text("Tooth 14 Filling")').first().click();

    // 10. Click Analyze & Tag Chart
    await page.locator('button:has-text("Analyze & Tag Chart")').first().click();

    // Handle dialog alert when applying
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    const applyAiBtn = page.locator('button:has-text("Apply to Patient File")').first();
    await applyAiBtn.waitFor({ state: 'visible', timeout: 8000 });
    await applyAiBtn.click();

    // Switch to Estimates tab
    await page.locator('button:has-text("Estimates")').first().click();
    await page.locator('button:has-text("Show Summary")').first().click();

    // Select Tooth 14 PFM Crown in the Estimate Builder
    await page.locator('select').first().selectOption('14');
    await page.locator('button:has-text("Add to Estimate")').first().click();

    // Switch back to After Consultation tab
    await page.locator('button:has-text("After Consultation")').first().click();

    // Upload After Photo
    const afterFileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('text=Upload After Photo').click();
    const afterFileChooser = await afterFileChooserPromise;
    await afterFileChooser.setFiles(afterPhotoPath);

    // Fill follow-up and doctor details
    await page.locator('input[type="date"]').fill('2026-06-25');
    const doctorInput = page.locator('[placeholder="Dr. Amit Verma, B.D.S., M.D.S."]').first();
    await doctorInput.fill('Dr. Rohan Sharma, B.D.S.');

    // Expand clinic customization details
    await page.locator('text=Customize Clinic Details').click();
    const clinicDetailsContainer = page.locator('details');
    const clinicNameInput = clinicDetailsContainer.locator('input[type="text"]').first();
    await clinicNameInput.fill('Rohan Dental Hub & Clinic');
    const clinicPhoneInput = clinicDetailsContainer.locator('input[type="text"]').nth(1);
    await clinicPhoneInput.fill('+91 98765 43210');
    const clinicAddressTextarea = clinicDetailsContainer.locator('textarea').first();
    await clinicAddressTextarea.fill('456, Health Sector, Indiranagar, Bengaluru, Karnataka');

    // Move slider pos to verify comparison
    const sliderPosInput = page.locator('input[type="range"]').last();
    await expect(sliderPosInput).toBeVisible();
    await sliderPosInput.fill('40');

    // Trigger PDF download
    const downloadPromise = page.waitForEvent('download');
    await page.locator('text=Download Indian prescription PDF').click();
    const download = await downloadPromise;
    console.log('✅ Triggered PDF download:', download.suggestedFilename());

    // Verify WhatsApp button is visible
    const waButton = page.locator('text=Send on WhatsApp (Without API)');
    await expect(waButton).toBeVisible();

    // Save changes
    const updateSaveButton = page.locator('button:has-text("Save Changes")').last();
    await updateSaveButton.click();
    await page.waitForSelector('text=Patients', { timeout: 8000 });

    // Click on the patient row again to show the complete populated record
    await page.locator(`tr:has-text("${uniqueName}")`).first().click();
    await page.waitForSelector('text=Patient Record', { timeout: 5000 });
    await page.locator('button:has-text("After Consultation")').first().click();
    await page.locator('text=Customize Clinic Details').click(); // Re-expand for screenshot
    
    // Take screenshot of the result
    await page.screenshot({ path: '/Users/pratyushraj/.gemini/antigravity/brain/c05c4f4c-3852-4ef4-b881-8ccb1f3970cc/added_patient_record.png' });
    console.log('✅ Screenshot saved.');
  });
});
