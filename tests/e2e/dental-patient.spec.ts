import { test, expect } from '@playwright/test';
import { join } from 'path';
import { writeFileSync } from 'fs';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:8080';

test.describe('Dentist CRM Reactivation Before/After Photos E2E Test', () => {
  let beforePhotoPath: string;
  let afterPhotoPath: string;

  test.beforeAll(() => {
    // Create temporary dummy image assets for upload
    const dummyImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    beforePhotoPath = join(process.cwd(), 'tests', 'before-dummy.png');
    afterPhotoPath = join(process.cwd(), 'tests', 'after-dummy.png');
    writeFileSync(beforePhotoPath, dummyImage);
    writeFileSync(afterPhotoPath, dummyImage);
  });

  test('Create patient with before photo, consult to add after photo, and compare', async ({ page }) => {
    // Ensure we are using a desktop layout so the table rows are visible
    await page.setViewportSize({ width: 1280, height: 800 });

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
    
    // Wait for redirect to dashboard or reactivation page
    await page.waitForURL(/\/.*(creator-dashboard|reactivation).*/, { timeout: 15000 });
    console.log('✅ Logged in successfully.');

    // 2. Navigate to Reactivation Customers list
    await page.goto(`${BASE_URL}/reactivation/customers`);
    await page.waitForSelector('text=Patients', { timeout: 10000 });
    console.log('✅ Navigated to Patients page.');
    await page.screenshot({ path: 'test-results/01_patients_list.png' });

    // 3. Open Add Patient Modal
    const addPatientBtn = page.locator('button:has-text("Add Patient")').first();
    await addPatientBtn.click();
    await page.waitForSelector('text=Full Name', { timeout: 5000 });
    console.log('✅ Opened Add Patient Modal.');
    await page.screenshot({ path: 'test-results/02_add_patient_modal.png' });

    // 4. Fill Intake Form details
    const nameInput = page.locator('[placeholder="e.g. Rahul Sharma"]').first();
    const phoneInput = page.locator('[placeholder="+91 98765 43210"]').first();
    const serviceInput = page.locator('[placeholder="e.g. Tooth pain, cleaning, RCT consultation"]').first();
    const notesInput = page.locator('[placeholder="Any complaint, pain, or front-desk note..."]').first();
    
    const uniqueName = `Demo Patient ${Date.now()}`;
    await nameInput.fill(uniqueName);
    await phoneInput.fill('+91 99999 99999');
    await serviceInput.fill('Dental Crown Restoration');
    await notesInput.fill('Pre-op consultation for ceramic crown.');

    // 5. Upload Before Photo in General Tab
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('text=Upload Before Photo').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(beforePhotoPath);
    console.log('✅ Uploaded Before Photo.');
    await page.screenshot({ path: 'test-results/03_before_photo_uploaded.png' });

    // 6. Submit Add Patient Form
    const saveButton = page.locator('button:has-text("Add Patient")').last();
    await saveButton.click();
    
    // Wait for the modal to close and new row to appear in the desktop table
    const patientRow = page.locator(`tr:has-text("${uniqueName}")`).first();
    await patientRow.waitFor({ state: 'visible', timeout: 8000 });
    console.log('✅ Patient added successfully.');
    await page.screenshot({ path: 'test-results/04_patient_added_list.png' });

    // Verify row displays the Before Photo indicator
    const rowIndicator = page.locator(`tr:has-text("${uniqueName}")`).locator('text=Before Photo');
    await expect(rowIndicator).toBeVisible();
    console.log('✅ Found Before Photo indicator in table row.');

    // 7. Click on the Patient row to edit/view
    await page.locator(`tr:has-text("${uniqueName}")`).first().click();
    await page.waitForSelector('text=Patient Record', { timeout: 5000 });
    console.log('✅ Opened Patient Record.');
    
    // 8. Go to After Consultation (Medical) Tab
    await page.locator('button:has-text("After Consultation")').first().click();
    console.log('✅ Switched to After Consultation tab.');
    await page.screenshot({ path: 'test-results/05_after_consultation_tab.png' });

    // 9. Test AI Scribe Voice Presets & Transcription Analysis
    await page.locator('button:has-text("Tooth 14 Filling")').first().click();
    console.log('✅ Clicked voice preset for Tooth 14 filling.');
    
    await page.locator('button:has-text("Analyze & Tag Chart")').first().click();
    console.log('✅ Clicked Analyze & Tag Chart.');

    // Handle dialog alert that pops up after applying suggestions
    page.once('dialog', async (dialog) => {
      console.log('✅ AI Scribe Apply Dialog popped up:', dialog.message());
      await dialog.accept();
    });

    const applyAiBtn = page.locator('button:has-text("Apply to Patient File")').first();
    await applyAiBtn.waitFor({ state: 'visible', timeout: 5000 });
    await applyAiBtn.click();
    console.log('✅ Clicked Apply to Patient File.');
    await page.screenshot({ path: 'test-results/05a_ai_scribe_analyzed.png' });

    // 10. Test Treatment Estimate Builder
    await page.locator('button:has-text("Estimates")').first().click();
    console.log('✅ Switched to Estimates tab.');
    await page.screenshot({ path: 'test-results/05b_estimates_tab_initial.png' });

    await page.locator('button:has-text("Show Summary")').first().click();
    console.log('✅ Opened Treatment Summary Builder.');

    // Select Tooth 14 in the Estimate Builder
    await page.locator('select').first().selectOption('14');
    // Click Add to Estimate
    await page.locator('button:has-text("Add to Estimate")').first().click();
    console.log('✅ Added Tooth 14 composite filling to estimate.');
    await page.screenshot({ path: 'test-results/05c_estimate_added.png' });

    // Switch back to After Consultation tab to upload after photo
    await page.locator('button:has-text("After Consultation")').first().click();
    console.log('✅ Switched back to After Consultation tab.');

    // Verify Prescription text area has been filled by AI Scribe
    const prescriptionTextarea = page.locator('textarea[placeholder*="Amoxicillin"]').first();
    await expect(prescriptionTextarea).toBeVisible();
    const rxText = await prescriptionTextarea.inputValue();
    expect(rxText).toContain('Amoxicillin');
    console.log('✅ Verified AI Scribe successfully populated Prescription.');

    // Edit prescription manually
    await prescriptionTextarea.fill(rxText + '\n• Warm saline rinses after 24 hours');
    console.log('✅ Edited Prescription manually.');

    // 11. Upload After Photo
    const afterFileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('text=Upload After Photo').click();
    const afterFileChooser = await afterFileChooserPromise;
    await afterFileChooser.setFiles(afterPhotoPath);
    console.log('✅ Uploaded After Photo.');
    await page.screenshot({ path: 'test-results/06_after_photo_uploaded.png' });

    // 12. Verify Slider is Visible
    const sliderPosInput = page.locator('input[type="range"]').last(); // Range input for before/after comparison
    await expect(sliderPosInput).toBeVisible();
    console.log('✅ Verified Interactive Comparison Slider is active.');

    // Move the slider pos to verify interaction
    await sliderPosInput.fill('35');
    await page.screenshot({ path: 'test-results/07_slider_interacted.png' });

    // 13. Save Changes
    const updateSaveButton = page.locator('button:has-text("Save Changes")').last();
    await updateSaveButton.click();
    await page.waitForSelector('text=Patients', { timeout: 8000 });
    console.log('✅ Saved changes successfully.');
    
    // Verify row displays the Before & After indicator
    const rowBothIndicator = page.locator(`tr:has-text("${uniqueName}")`).locator('text=Before & After');
    await expect(rowBothIndicator).toBeVisible();
    console.log('✅ Found Before & After indicator in table row.');
    await page.screenshot({ path: 'test-results/08_final_patients_list.png' });

    // 14. Test Deletion Flow
    console.log('🗑️ Starting deletion flow...');
    // Click checkbox to select row
    await page.locator(`tr:has-text("${uniqueName}")`).locator('button').first().click();
    console.log('✅ Selected patient checkbox.');
    await page.screenshot({ path: 'test-results/09_patient_row_selected.png' });

    // Click Delete in bulk actions bar
    await page.locator('button:has-text("Delete")').first().click();
    console.log('✅ Clicked bulk action Delete button.');
    
    // Verify the row is no longer in the list
    await expect(page.locator(`tr:has-text("${uniqueName}")`)).toHaveCount(0);
    console.log('✅ Verified patient was successfully deleted.');
    await page.screenshot({ path: 'test-results/10_after_deletion_list.png' });
  });
});
