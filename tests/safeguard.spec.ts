import { test, expect } from '@playwright/test';

test.describe('Profitability Safeguard', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/');
    if (page.url().includes('/login')) {
      await page.waitForSelector('input[name="username"]');
      await page.fill('input[name="username"]', 'JV');
      await page.fill('input[name="password"]', 'MotSys123@');
      await page.click('button[type="submit"]');
    }
    await expect(page.locator('h1')).toContainText('Dashboard Overview', { timeout: 30000 });
    await page.goto('/requests');
    await expect(page.locator('h1')).toContainText('Danh sách yêu cầu dịch vụ', { timeout: 20000 });
    await page.waitForTimeout(2000);
  });

  test('should show quota warning when estimate exceeds monthly limit', async ({ page }) => {
    await page.click('text=Tạo yêu cầu mới');
    await expect(page.locator('text=Tiếp nhận yêu cầu mới')).toBeVisible();
    
    // Chọn SMC bằng tên chính xác để hợp lệ với TypeScript type
    await page.locator('select').first().selectOption({ label: 'SMC Manufacturing (Vietnam) Co., Ltd' });
    
    // Đợi 1 chút để logic tính toán quota chạy ngầm (nếu có)
    await page.waitForTimeout(2000);

    // Thêm 6 SRO items để vượt quota (SMC 2025 có 100h)
    const addButton = page.locator('button:has-text("Thêm công việc")');
    for (let i = 0; i < 6; i++) {
        await addButton.click();
    }

    // Chờ cảnh báo Profitability xuất hiện
    const safeguard = page.locator('text=Kiểm soát lợi nhuận');
    await expect(safeguard).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Quota')).toBeVisible();
  });
});
