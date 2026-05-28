import { expect, type Locator, type Page } from "@playwright/test";

export class IssuePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private async selectFirstAvailable(locator: Locator) {
    await expect(locator).toBeVisible();
    const optionValues = await locator.locator("option").evaluateAll((options) =>
      options.map((option) => (option as HTMLOptionElement).value).filter(Boolean),
    );
    expect(optionValues.length).toBeGreaterThan(0);
    await locator.selectOption(optionValues[0]);
  }

  async fillRequiredIssue(title: string, description: string) {
    await this.selectFirstAvailable(this.page.getByTestId("issue-request-type-select"));
    await this.selectFirstAvailable(this.page.getByTestId("issue-department-select"));
    await this.selectFirstAvailable(this.page.getByTestId("issue-module-select"));
    await this.selectFirstAvailable(this.page.getByTestId("issue-impact-select"));
    await this.page.getByTestId("issue-title-input").fill(title);
    await this.page.getByTestId("issue-description-input").fill(description);
  }

  async submit() {
    await this.page.getByTestId("issue-submit-button").click();
  }

  async expectSuccess() {
    await expect(this.page.getByTestId("issue-success-message")).toBeVisible({ timeout: 20_000 });
    await expect(this.page.getByTestId("issue-id")).toBeVisible();
  }

  async getSubmittedIssueId() {
    await this.expectSuccess();
    return (await this.page.getByTestId("issue-id").innerText()).trim();
  }
}
