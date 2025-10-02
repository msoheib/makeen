import { expect, test } from 'playwright/test';

test.describe('Authentication flows', () => {
  test('sign-in screen renders core elements and validates required fields', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Sign in to your account').first()).toBeVisible();
    await expect(page.getByText('Makeen')).toBeVisible();

    const emailInput = page.getByRole('textbox', { name: /email/i });
    const passwordInput = page.getByRole('textbox', { name: /password/i });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await page.getByRole('button', { name: /login/i }).click();
    await expect(page.getByText(/all.*required|email.*password/i)).toBeVisible();

    await emailInput.fill('qa@example.com');
    await passwordInput.fill('super-secret');

    const rememberMe = page.getByRole('checkbox', { name: /remember me/i });
    await rememberMe.click();
    await expect(rememberMe).toBeChecked();
  });

  test('sign-up screen enforces validation and role selection', async ({ page }) => {
    await page.goto('/(auth)/signup');

    await expect(page.getByText('Create Your Account').first()).toBeVisible();

    const createAccountButton = page.getByRole('button', { name: /create account/i });
    await createAccountButton.click();
    await expect(page.getByText(/all.*required|signup\.allfieldsrequired/i)).toBeVisible();

    await page.getByRole('button', { name: /Property Owner/i }).click();
    await page.getByRole('textbox', { name: /first name/i }).fill('Taylor');
    await page.getByRole('textbox', { name: /last name/i }).fill('Tester');
    await page.getByRole('textbox', { name: /^email$/i }).fill('taylor@example.com');
    await page.getByRole('textbox', { name: /^password$/i }).fill('secret1');
    await page.getByRole('textbox', { name: /confirm password/i }).fill('secret2');

    await createAccountButton.click();
    await expect(page.getByText(/password/i)).toBeVisible();
  });
});
