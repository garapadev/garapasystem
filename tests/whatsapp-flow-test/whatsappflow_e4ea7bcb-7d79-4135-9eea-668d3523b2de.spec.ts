
import { test } from '@playwright/test';
import { expect } from '@playwright/test';

test('WhatsAppFlow_2025-09-16', async ({ page, context }) => {
  
    // Navigate to URL
    await page.goto('http://localhost:3000');

    // Take screenshot
    await page.screenshot({ path: 'login-page.png', { fullPage: true } });

    // Fill input field
    await page.fill('#email', 'admin@garapasystem.com');

    // Fill input field
    await page.fill('#password', 'password');

    // Click element
    await page.click('button[type="submit"]');

    // Take screenshot
    await page.screenshot({ path: 'dashboard-after-login.png', { fullPage: true } });

    // Click element
    await page.click('a[href="/whatsapp"]');

    // Take screenshot
    await page.screenshot({ path: 'whatsapp-module-page.png', { fullPage: true } });

    // Navigate to URL
    await page.goto('http://localhost:3000/whatsapp/client');

    // Take screenshot
    await page.screenshot({ path: 'whatsapp-client-page.png', { fullPage: true } });

    // Click element
    await page.click('button:has-text("Conectar WhatsApp")');

    // Take screenshot
    await page.screenshot({ path: 'whatsapp-connection-screen.png', { fullPage: true } });
});