# Browser-store release

Glassware Image Editor 1.0.1 is packaged for Chrome, Microsoft Edge, Opera, and
Firefox. This is the reproducible release and draft checklist; it does not
authorize store submission or publication.

## Build and verify

Use Node.js 20 or newer from a clean checkout:

```bash
npm ci
npm run store:assets
npm run verify
npm run smoke:extension
```

`npm run verify` runs unit tests, the production web build, browser-specific
extension packaging, static package validation, and the full browser smoke.
`npm run smoke:extension` separately launches an isolated Chromium profile and
tests the packaged extension's toolbar, capture, native account/AI surfaces,
local restore, and PNG export.

For an Opera-native release check, run both packaged smokes against the Opera
executable:

```bash
GLASSWARE_EXTENSION_CHROME=/path/to/opera npm run smoke:extension
GLASSWARE_EXTENSION_CHROME=/path/to/opera npm run smoke:extension:auth
```

The OAuth handoff smoke pre-grants the optional Wiplash account origin only in
its disposable profile because headless browsers cannot answer browser-chrome
permission prompts. It verifies Opera's browser-owned authorization target and
does not complete or retain a user session.

## Release outputs

- `artifacts/glassware-extension/` — unpacked Chromium package for local testing.
- `artifacts/glassware-extension-firefox/` — unpacked Firefox package.
- `artifacts/store/chrome/glassware-1.0.1-chrome.zip`
- `artifacts/store/edge/glassware-1.0.1-edge.zip`
- `artifacts/store/opera/glassware-1.0.1-opera.zip`
- `artifacts/store/firefox/glassware-1.0.1-firefox.zip`
- `artifacts/store/firefox/glassware-1.0.1-firefox-source.zip`

Each store directory contains a SHA-256 receipt and `release.json`. Chrome,
Edge, and Opera use byte-identical reviewed Chromium packages. Firefox uses the
same app with a stable add-on ID, event-page background fallback, Firefox 142
minimum, and built-in optional data declarations.

Do not rebuild between final approval and dashboard upload. Upload the exact
reviewed ZIP and compare its SHA-256 digest with the release receipt.

## Manual BrowserOS checklist

1. Confirm Glassware Image Editor is enabled at `chrome://extensions` and the version is 1.0.1.
2. Click the toolbar icon and confirm the packaged editor opens or focuses directly, with no popup.
3. Open an ordinary HTTPS page, right-click, choose **Capture page with GlassWare**, and confirm the packaged editor focuses with the screenshot selected.
4. In Photo Lab, adjust tonal controls, apply a crop, and export the edited image.
5. In Type Studio, edit text and confirm the layer remains editable.
6. Save, rename, reload, and reopen the project from **Files**.
7. Click **Ask AI** and confirm the movable native chat opens without navigating away from `app/app.html`.
8. Click **Sign in** and confirm the browser-owned Wiplash.ai window starts only after the user action.
9. Open **Pricing**, choose a signed-in upgrade, and confirm Stripe Checkout opens in a separate tab while the editor stays open. Verify the resulting entitlement in both the extension and web app.
10. Inspect the extension background and editor consoles for errors.

## Draft-only store handling

- Chrome: package upload creates an editable item draft. Fill Store listing,
  Privacy, Distribution, and Test instructions; do not click **Submit for review**.
  The WiplashAI publisher's 8/8 extension limit does not prevent creating or
  editing drafts. Request a limit increase before submitting another extension
  for review; do not alter another item to free a slot implicitly.
- Edge: create the extension, upload the package, use **Save draft** on each
  section; do not click **Publish**.
- Firefox: do not start the AMO new-listing flow because **Submit Version** makes
  the add-on available. Keep the package and local listing draft ready.
- Opera: version 1.0.1 supports a pre-moderation state labeled **changes not
  submitted for the moderators review**. Never click **Submit changes**. The
  final 612x408 screenshots were captured with Opera 135.0.5973.41 and visually
  checked at full size and 50% on August 24, 2026.

Listing copy, reviewer notes, screenshots, promo assets, and current dashboard
status live in `store-assets/`.
