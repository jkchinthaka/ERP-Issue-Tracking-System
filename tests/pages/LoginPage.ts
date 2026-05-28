import { expect, type Page } from "@playwright/test";

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/");
  }

  async expectVisible() {
    await expect(this.page.getByTestId("login-email")).toBeVisible();
    await expect(this.page.getByTestId("login-password")).toBeVisible();
    await expect(this.page.getByTestId("login-submit")).toBeVisible();
  }

  async login(email: string, password: string) {
    await this.goto();
    await this.expectVisible();
    await this.page.getByTestId("login-email").fill(email);
    await this.page.getByTestId("login-password").fill(password);
    await this.page.getByTestId("login-submit").click();
    await expect(this.page.getByTestId("logout-button")).toBeVisible({ timeout: 20_000 });
  }

  async submitInvalid(email: string, password: string) {
    await this.goto();
    await this.expectVisible();
    await this.page.getByTestId("login-email").fill(email);
    await this.page.getByTestId("login-password").fill(password);
    await this.page.getByTestId("login-submit").click();
  }

  async expectLoginError() {
    await expect(this.page.getByText(/invalid|failed|login|password|try again/i)).toBeVisible();
  }
}
