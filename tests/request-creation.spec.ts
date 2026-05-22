import { test, expect } from '@playwright/test';

test.describe('Service Request Creation', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/');
    if (page.url().includes('/login')) {
      await page.waitForSelector('input[name="username"]');
      await page.fill('input[name="username"]', 'JV');
      await page.fill('input[name="password"]', 'MotSys123@');
      await page.click('button[type="submit"]');
    }
    // Đợi trang chính load xong
    await expect(page.locator('h1')).toContainText('Dashboard Overview', { timeout: 30000 });
    await page.goto('/requests');
    await expect(page.locator('h1')).toContainText('Danh sách yêu cầu dịch vụ', { timeout: 20000 });
    await page.waitForTimeout(2000);
  });

  test('should show error when creating request with missing data (Zod Validation)', async ({ page }) => {
    await page.click('text=Tạo yêu cầu mới');
    await expect(page.locator('text=Tiếp nhận yêu cầu mới')).toBeVisible({ timeout: 10000 });
    
    await page.fill('input[placeholder="Tên yêu cầu ngắn gọn..."]', 'Test Zod Validation');
    await page.click('button:has-text("Tạo yêu cầu")');

    // Chờ Toast xuất hiện
    const toast = page.locator('.react-hot-toast');
    await expect(toast).toBeVisible({ timeout: 10000 });
    await expect(toast).toContainText('Vui lòng nhập chi tiết mô tả kỹ thuật');
  });

  test('should successfully create a request and show toast', async ({ page }) => {
    await page.click('text=Tạo yêu cầu mới');
    await expect(page.locator('text=Tiếp nhận yêu cầu mới')).toBeVisible();
    
    // Chọn khách hàng bằng tên chính xác để hợp lệ với TypeScript type
    const clientSelect = page.locator('select').first();
    await clientSelect.selectOption({ label: 'BIDV-SuMi TRUST Leasing Company (BSL)' });
    
    await page.fill('input[placeholder="Tên yêu cầu ngắn gọn..."]', 'E2E Automated Test Request');
    await page.fill('textarea[placeholder="Mô tả kỹ thuật chi tiết..."]', 'This is a description from Playwright E2E test.');
    
    await page.click('button:has-text("Tạo yêu cầu")');

    const toast = page.locator('.react-hot-toast');
    await expect(toast).toBeVisible({ timeout: 15000 });
    await expect(toast).toContainText('Đã tạo yêu cầu mới');
  });
});
