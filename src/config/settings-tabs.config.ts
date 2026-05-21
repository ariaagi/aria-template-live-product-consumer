/**
 * Extension point: extra tabs in the Settings page.
 *
 * Generated MVPs SHOULD add tabs here for capabilities they enable: e.g. "API Keys" (BYOK
 * providers), "Notifications" (email/push opt-ins), "Integrations" (OAuth-connected providers),
 * "Team" (collaborators), etc.
 *
 * Each tab corresponds to a real route at `/settings/<slug>`. The template's `SettingsShell`
 * renders the tab strip and links to those routes. Generated MVPs are responsible for creating
 * the `src/app/(app)/settings/<slug>/page.tsx` file for each extra tab.
 *
 * The "Profile" tab is built into the shell and always displayed first — do not duplicate it
 * here.
 *
 * Conventions:
 *   - `slug` MUST match the URL segment (e.g. `"api-keys"` for `/settings/api-keys`).
 *   - `label` is the visible tab text.
 *   - 0–6 extra tabs recommended for IA clarity.
 *
 * Example:
 *   export const extraSettingsTabs: SettingsTab[] = [
 *     { slug: "api-keys", label: "API Keys" },
 *     { slug: "notifications", label: "Notifications" },
 *   ];
 */

export type SettingsTab = {
  slug: string;
  label: string;
};

export const extraSettingsTabs: SettingsTab[] = [];
