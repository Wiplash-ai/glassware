# Browser-store review status

Checked August 25, 2026. Glassware Image Editor 1.0.1 has been submitted to
all four target browser stores.

## Chrome Web Store

- Publisher: WiplashAI
- Name: Glassware Image Editor
- Item ID: `lmnefkhhhedffbfbbchkgkgopeanoicg`
- Status shown by the developer dashboard: **Pending review**
- Submitted: August 25, 2026
- Automatic publishing after approval: disabled
- Saved and submitted: version 1.0.1 package, Art & Design category, English
  (United States) listing, homepage and support URLs, icon, five 1280x800
  screenshots, 440x280 tile, 1400x560 marquee, permission and data-use
  disclosures, privacy policy, public/all-region distribution,
  financial/payment and in-app-purchase disclosures, and account-free reviewer
  instructions
- The retired Volume Silencer - Nullify Loud Sounds item was unpublished first
  and is now a dashboard **Draft**. Glassware occupies the available eighth
  extension slot.

## Microsoft Edge Add-ons

- Name: Glassware Image Editor
- Product ID: `79bad74e-4689-46da-973a-bf38df6f2947`
- Store ID: `0RDCKC2PNF4P`
- CRX ID: `gddagamcmfnoeppfonecapgpdjejjojj`
- Status shown by Partner Center: **In review**
- Submitted: August 25, 2026
- Submitted: version 1.0.1 package, public availability, Photos category,
  support details, permission and data disclosures, privacy policy, full English
  listing with Stripe pricing/payment disclosures, six search terms, logo, five
  screenshots, both promotional tiles, and account-free certification notes

## Firefox Add-ons

- Name: Glassware Image Editor
- Slug: `glassware-image-editor`
- Add-on ID: `glassware-image-editor@wiplash.ai`
- Status shown by AMO: **Awaiting Review**
- Submitted: August 25, 2026
- Submitted: Firefox 1.0.1 package, separate reproducible reviewer-source
  archive, MIT license, paid-service disclosure, Photos, Music & Videos
  category, privacy policy, reviewer notes, stained-glass icon, and five
  captioned screenshots
- Automated validation completed with no errors and three warnings. The full
  reviewer source archive includes `SOURCE_BUILD.md` with the exact build and
  verification steps.

## Opera Add-ons

- Name: Glassware Image Editor
- Package: `306241`
- Extension ID: `ecoedhbkaohgcebjjjhijcdkkgadohnp`
- Status shown by Opera: **Awaiting moderation**
- Submitted: August 25, 2026
- Submitted: version 1.0.1 package; Appearance category; English summary, full
  Stripe-aware description and changelog; service/support/source links;
  reproducible build instructions; exact public 1.0.1 source tag in both source
  fields; tagged MIT license URL; privacy-policy URL; 64x64 icon; and the
  lowercase-Glassware 300x188 promotional image
- Opera permits three screenshots. The submitted set is Photo Lab tonal
  editing, Type Studio, and the editable layer stack, captured natively in
  Opera 135.0.5973.41.
- Auto-publishing remains disabled.

## Production verification

- `https://labs.wiplash.ai/glassware/`, the editor, pricing page, and privacy
  page returned HTTP 200 on August 25, 2026.
- The Glassware account service reports healthy with billing configured.
- The Glassware AI runner and shared Wiplash Keycloak/OIDC discovery endpoint
  are healthy.
- Production extension authentication accepts the assigned Chrome, Edge,
  Opera, and Firefox store identities while continuing to reject unconfigured
  origins.
