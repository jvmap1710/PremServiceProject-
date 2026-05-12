# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Premium Service Dashboard >> should navigate to Kanban board
- Location: tests\dashboard.spec.ts:29:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.fill: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('input[name="username"]')
    - waiting for" http://127.0.0.1:9999/login?callbackUrl=http%3A%2F%2Flocalhost%3A9999%2F" navigation to finish...
    - navigated to "http://127.0.0.1:9999/login?callbackUrl=http%3A%2F%2Flocalhost%3A9999%2F"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Premium Service Dashboard', () => {
  4  |   test('should login and display dashboard stats', async ({ page }) => {
  5  |     // Tăng timeout cho toàn bộ test này
  6  |     test.setTimeout(60000);
  7  | 
  8  |     await page.goto('/');
  9  |     
  10 |     // Đợi ô nhập liệu xuất hiện thay vì đợi network
  11 |     if (page.url().includes('/login')) {
  12 |       await page.waitForSelector('input[name="username"]');
  13 |       await page.fill('input[name="username"]', 'JV');
  14 |       await page.fill('input[name="password"]', 'MotSys123@');
  15 |       await page.click('button[type="submit"]');
  16 |     }
  17 | 
  18 |     // Đợi đúng cái tiêu đề Dashboard hiện ra
  19 |     await expect(page.locator('h1')).toContainText('Dashboard Overview', { timeout: 30000 });
  20 |     
  21 |     // Đợi các thẻ thống kê hiện ra
  22 |     await expect(page.locator('text=Tổng Ticket')).toBeVisible({ timeout: 15000 });
  23 |     
  24 |     // Kiểm tra biểu đồ
  25 |     const charts = page.locator('.recharts-responsive-container');
  26 |     await expect(charts).toHaveCount(2);
  27 |   });
  28 | 
  29 |   test('should navigate to Kanban board', async ({ page }) => {
  30 |     test.setTimeout(60000);
  31 |     await page.goto('/');
  32 |     
  33 |     if (page.url().includes('/login')) {
> 34 |       await page.fill('input[name="username"]', 'JV');
     |                  ^ Error: page.fill: Test timeout of 60000ms exceeded.
  35 |       await page.fill('input[name="password"]', 'MotSys123@');
  36 |       await page.click('button[type="submit"]');
  37 |     }
  38 | 
  39 |     // Đợi Dashboard load xong
  40 |     await expect(page.locator('h1')).toContainText('Dashboard Overview', { timeout: 30000 });
  41 |     
  42 |     await page.locator('text=Task Management').scrollIntoViewIfNeeded();
  43 |     
  44 |     // Đợi cột Kanban xuất hiện
  45 |     await expect(page.locator('.w-80').first()).toBeVisible({ timeout: 20000 });
  46 |   });
  47 | });
  48 | 
```