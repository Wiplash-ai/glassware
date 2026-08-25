# Chrome Web Store submission

Status: version 1.0.1 for item `lmnefkhhhedffbfbbchkgkgopeanoicg`
was submitted on August 25, 2026 and is **Pending review**. Automatic publishing
after approval is disabled.

- Name: Glassware Image Editor
- Manifest short description: Capture, crop, resize, retouch, layer, and export images in a private, local-first editor.
- Category: Art & Design
- Language: English (United States)
- Homepage: https://labs.wiplash.ai/glassware/
- Privacy policy: https://labs.wiplash.ai/glassware/privacy.html
- Support URL: https://github.com/Wiplash-ai/glassware/issues
- Package: `artifacts/store/chrome/glassware-1.0.1-chrome.zip`
- Store icon: `extension/icons/icon-128.png`
- Small promo tile: `store-assets/promo/small-440x280.png`
- Marquee promo tile: `store-assets/promo/marquee-1400x560.png`
- Screenshots: all five PNG files in `store-assets/screenshots/`, in numeric order

## Detailed description

Use the detailed description from `store-assets/LISTING.md` without changes.

## Privacy tab

- Single purpose: Capture user-requested visible pages and local images into a
  full image editor for non-destructive photo adjustment, layered composition,
  and export.
- Remote code: No. All executable JavaScript is bundled in the extension.
- Data handling: Website content and browsing activity are handled locally for
  user-invoked capture. Authentication information and personally identifying
  account details are handled only after opt-in sign-in. Artwork and AI chat
  content are transmitted only when the user explicitly chooses cloud or AI.
  Financial and payment information is handled only if a signed-in user chooses
  a paid plan: Stripe collects the payment credentials on a Stripe-hosted page,
  while Glassware receives plan, transaction, invoice, renewal, and payment
  status. Glassware does not receive or store the full card number or CVC.
- Financial and payment information: **Yes**.
- Contains in-app purchases: **Yes**. Optional subscriptions range from $7.99
  per month to $143.99 per seat billed annually; the complete editor remains
  usable for $0.00 without an account.
- Certifications: no sale of user data; no advertising use; no creditworthiness
  use; no use unrelated to the disclosed single purpose; data is not transferred
  except to provide user-selected account, cloud, billing, or AI functionality.

## Test instructions

Use `store-assets/REVIEWER_NOTES.md`. No account is required for the primary
capture, edit, save, and export review path.
