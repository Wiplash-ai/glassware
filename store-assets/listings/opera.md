# Opera Add-ons draft

Status: package 306241 is saved in the Opera developer portal with **changes not
submitted for the moderators review**. Never click **Submit changes** without
publication authorization.

- Name: Glassware Image Editor
- Summary: Capture, crop, resize, retouch, layer, and export images in a private, local-first editor.
- Category: Appearance
- License: MIT
- Service website: https://labs.wiplash.ai/glassware/
- Support page: https://github.com/Wiplash-ai/glassware/issues
- Public source: https://github.com/Wiplash-ai/glassware
- Privacy policy: https://labs.wiplash.ai/glassware/privacy.html
- Package: `artifacts/store/opera/glassware-1.0.1-opera.zip`
- Icon: `store-assets/opera-icon-64.png`
- Promotional image: `store-assets/opera-promo-300x188.png`
- Screenshots: all five 612x408 PNG files in
  `store-assets/opera-screenshots/`, in numeric order

Opera's live portal requires screenshots captured in Opera itself. The current
612x408 files were captured with Opera 135.0.5973.41 and visually checked at
full size and 50% on August 24, 2026. They are ready for a later authorized
dashboard upload; no screenshot was uploaded in this pass.

## Description

Use the detailed description from `store-assets/LISTING.md` without changes.

## Reviewer note

Use `store-assets/REVIEWER_NOTES.md`. Glassware's single purpose is browser-
integrated image editing: its toolbar opens the real editor and its context menu
imports a visible-page capture, so it is not a launcher-only extension.

Local editing is free. Signed-in users may optionally buy Designer or Director
cloud subscriptions, ranging from $7.99 monthly to $143.99 per seat billed
annually. Checkout opens in a separate Stripe-hosted browser tab. Stripe handles
payment credentials; Glassware receives only the account's subscription,
invoice, transaction, renewal, and payment status needed to provide access.

Before moderation, replace the generic source repository URL with the exact
public release tag that reproduces version 1.0.1.
