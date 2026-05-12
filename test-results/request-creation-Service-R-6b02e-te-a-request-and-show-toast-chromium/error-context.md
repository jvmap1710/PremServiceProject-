# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: request-creation.spec.ts >> Service Request Creation >> should successfully create a request and show toast
- Location: tests\request-creation.spec.ts:30:7

# Error details

```
Test timeout of 60000ms exceeded while running "beforeEach" hook.
```

```
Error: page.waitForSelector: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('input[name="username"]') to be visible
    - waiting for" http://127.0.0.1:9999/login?callbackUrl=http%3A%2F%2Flocalhost%3A9999%2F" navigation to finish...
    - navigated to "http://127.0.0.1:9999/login?callbackUrl=http%3A%2F%2Flocalhost%3A9999%2F"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Service Request Creation', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     test.setTimeout(60000);
  6  |     await page.goto('/');
  7  |     if (page.url().includes('/login')) {
> 8  |       await page.waitForSelector('input[name="username"]');
     |                  ^ Error: page.waitForSelector: Test timeout of 60000ms exceeded.
  9  |       await page.fill('input[name="username"]', 'JV');
  10 |       await page.fill('input[name="password"]', 'MotSys123@');
  11 |       await page.click('button[type="submit"]');
  12 |     }
  13 |     // Đợi trang chính load xong
  14 |     await expect(page.locator('h1')).toContainText('Dashboard Overview', { timeout: 30000 });
  15 |   });
  16 | 
  17 |   test('should show error when creating request with missing data (Zod Validation)', async ({ page }) => {
  18 |     await page.click('text=Tạo yêu cầu mới');
  19 |     await expect(page.locator('text=Tiếp nhận yêu cầu mới')).toBeVisible({ timeout: 10000 });
  20 |     
  21 |     await page.fill('input[placeholder="Tên yêu cầu ngắn gọn..."]', 'Test Zod Validation');
  22 |     await page.click('button:has-text("Tạo yêu cầu")');
  23 | 
  24 |     // Chờ Toast xuất hiện
  25 |     const toast = page.locator('.react-hot-toast');
  26 |     await expect(toast).toBeVisible({ timeout: 10000 });
  27 |     await expect(toast).toContainText('Vui lòng nhập chi tiết mô tả kỹ thuật');
  28 |   });
  29 | 
  30 |   test('should successfully create a request and show toast', async ({ page }) => {
  31 |     await page.click('text=Tạo yêu cầu mới');
  32 |     await expect(page.locator('text=Tiếp nhận yêu cầu mới')).toBeVisible();
  33 |     
  34 |     // Chọn khách hàng bằng Regex cho linh hoạt
  35 |     const clientSelect = page.locator('select').first();
  36 |     await clientSelect.selectOption({ label: /BIDV-SuMi/ });
  37 |     
  38 |     await page.fill('input[placeholder="Tên yêu cầu ngắn gọn..."]', 'E2E Automated Test Request');
  39 |     await page.fill('textarea[placeholder="Mô tả kỹ thuật chi tiết..."]', 'This is a description from Playwright E2E test.');
  40 |     
  41 |     await page.click('button:has-text("Tạo yêu cầu")');
  42 | 
  43 |     const toast = page.locator('.react-hot-toast');
  44 |     await expect(toast).toBeVisible({ timeout: 15000 });
  45 |     await expect(toast).toContainText('Đã tạo yêu cầu mới');
  46 |   });
  47 | });
  48 | 
```