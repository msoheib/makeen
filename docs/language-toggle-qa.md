# Language Toggle QA Checklist

Use this checklist whenever you verify the bilingual experience after updates to the i18n or RTL stack.

1. Install dependencies and clear Metro cache if direction changes were made:
   - `npm install`
   - `expo start --clear`
2. Run localisation tooling before launching the app:
   - `npm run lint:i18n` – verifies Arabic translation files are valid UTF-8 and contain Arabic glyphs.
3. Mobile (iOS/Android):
   - Launch the app with default English; confirm layout is LTR and fonts render correctly.
   - Switch to Arabic from Settings → Language, accept the restart. Confirm app reloads into RTL with Cairo fonts.
   - Toggle back to English and confirm another restart restores LTR without lingering RTL styles.
4. Web:
   - Load the app in a fresh browser tab and repeat the language toggle. Confirm `document.dir` flips between `ltr` and `rtl` and that horizontal scrolling/margins follow the direction.
5. Smoke check high-traffic screens in both languages (Dashboard, Properties, Tenants, Reports, Settings) for:
   - Correct translations and absence of mangled characters.
   - Logical ordering of cards, icons, and navigation gestures for the active direction.
6. Capture any regressions or untranslated copy in `lib/TODO.md` and link the relevant translation key for follow-up.
