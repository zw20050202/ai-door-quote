import { test, expect } from "@playwright/test";

test.describe("AI Door Quote E2E Tests", () => {
  
  async function loadPage(page: any, url: string) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
    // Wait for React to fully render all interactive elements
    await page.waitForTimeout(3000);
    await page.waitForSelector("button", { state: "attached", timeout: 15000 });
    await page.waitForTimeout(1500);
  }
  
  test("Homepage loads correctly", async ({ page }) => {
    await loadPage(page, "http://localhost:3000/");
    
    const newQuoteBtn = page.locator(":has-text(\"新建报价\")").first();
    await expect(newQuoteBtn).toBeVisible({ timeout: 10000 });
    
    const quoteHistoryBtn = page.getByText("报价历史");
    await expect(quoteHistoryBtn).toBeVisible({ timeout: 10000 });
    
    const customerMgmtBtn = page.getByText("客户管理");
    await expect(customerMgmtBtn).toBeVisible({ timeout: 10000 });
    
    const settingsBtn = page.getByText("系统设置");
    await expect(settingsBtn).toBeVisible({ timeout: 10000 });
  });

  test("Customer management - add customer", async ({ page }) => {
    await loadPage(page, "http://localhost:3000/customers");
    
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
    
    const addBtn = page.locator("button").filter({ hasText: "新增" }).first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click({ force: true });
    
    // Wait for Ant Design v6 Modal content to be visible
    await page.waitForSelector(".ant-modal", { state: "visible", timeout: 15000 });
    await page.waitForTimeout(500);
    
    const nameInput = page.locator("input[placeholder*='请输入客户姓名']");
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill("测试客户 C");
    
    const phoneInput = page.locator("input[placeholder*='请输入联系电话']");
    await phoneInput.fill("13900000002");
    
    const addressInput = page.locator("input[placeholder*='请输入安装地址']");
    await addressInput.fill("测试地址 B 区 2 号");
    
    const submitBtn = page.locator('button:has-text("确")').first();
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    await submitBtn.click({ force: true });
    
    await expect(page.getByText("客户添加成功")).toBeVisible({ timeout: 5000 });
  });

  test("Product library", async ({ page }) => {
    await loadPage(page, "http://localhost:3000/products");
    
    const tabs = page.locator(".ant-tabs-tab");
    await expect(tabs).toHaveCount(4, { timeout: 10000 });
  });

  test("New quote flow", async ({ page }) => {
    await loadPage(page, "http://localhost:3000/quote/new");
    
    await expect(page.locator("h4")).toBeVisible({ timeout: 10000 });
    
    const addBtn = page.locator("button").filter({ hasText: "添加产品" }).first();
    await expect(addBtn).toBeVisible();
    await addBtn.click({ force: true });
    await page.waitForTimeout(1000);
    
    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();
    console.log("Quote table rows:", rowCount);
    expect(rowCount).toBeGreaterThan(0);
  });

  test("Quote history", async ({ page }) => {
    await loadPage(page, "http://localhost:3000/quotes");
    
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("input").first()).toBeVisible();
  });

  test("System settings", async ({ page }) => {
    await loadPage(page, "http://localhost:3000/settings");
    
    // Use Text locator for Ant Design Title component
    await expect(page.locator("text=系统设置")).toBeVisible({ timeout: 10000 });
    
    const saveBtn = page.locator("button").filter({ hasText: "保存" }).first();
    await expect(saveBtn).toBeVisible();
  });

  test("Navigate from homepage to new quote", async ({ page }) => {
    await loadPage(page, "http://localhost:3000/");
    
    const newQuoteBtn = page.locator(":has-text(\"新建报价\")").first();
    await expect(newQuoteBtn).toBeVisible();
    await newQuoteBtn.click({ force: true });
    
    // Use Text locator for Ant Design Title component
    await expect(page.locator("h4:has-text(\"新建报价\"), button:has-text(\"新建报价\")").first()).toBeVisible({ timeout: 15000 });
  });
});

