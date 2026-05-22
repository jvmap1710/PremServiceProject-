import { test, expect } from '@playwright/test';

test.describe('Premium Service Dashboard', () => {
  test('should login and display dashboard stats', async ({ page }) => {
    // Tăng timeout cho toàn bộ test này
    test.setTimeout(60000);

    await page.goto('/');
    
    // Đợi ô nhập liệu xuất hiện thay vì đợi network
    if (page.url().includes('/login')) {
      await page.waitForSelector('input[name="username"]');
      await page.fill('input[name="username"]', 'JV');
      await page.fill('input[name="password"]', 'MotSys123@');
      await page.click('button[type="submit"]');
    }

    // Đợi đúng cái tiêu đề Dashboard hiện ra
    await expect(page.locator('h1')).toContainText('Dashboard Overview', { timeout: 30000 });
    
    // Đợi các thẻ thống kê hiện ra
    await expect(page.locator('text=Tổng Ticket')).toBeVisible({ timeout: 15000 });
    
    // Kiểm tra biểu đồ
    const charts = page.locator('.recharts-responsive-container');
    await expect(charts).toHaveCount(2);
  });

  test('should navigate to Kanban board', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/');
    
    if (page.url().includes('/login')) {
      await page.fill('input[name="username"]', 'JV');
      await page.fill('input[name="password"]', 'MotSys123@');
      await page.click('button[type="submit"]');
    }

    // Đợi Dashboard load xong
    await expect(page.locator('h1')).toContainText('Dashboard Overview', { timeout: 30000 });
    
    await page.locator('text=Task Management').scrollIntoViewIfNeeded();
    
    // Đợi cột Kanban xuất hiện (lọc theo cột hiển thị trên Desktop)
    await expect(page.locator('.md\\:flex [data-testid="kanban-column"]').first()).toBeVisible({ timeout: 20000 });
  });
});
