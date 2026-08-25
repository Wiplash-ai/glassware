# Glassware Image Editor — shared browser-store listing

## Name

Glassware Image Editor

## Short description

Capture, crop, resize, retouch, layer, and export images in a private, local-first editor.

## Detailed description

Glassware Image Editor turns the page in front of you—or an image from your
computer—into editable artwork without forcing you into an account.

Open the complete editor from the toolbar, or use the explicit **Capture page
with Glassware** context-menu command to bring the visible browser page into a
new local project.

Inside Glassware you can:

- crop, resize, rotate, flip, skew, warp, mask, and retouch images in Photo Lab;
- adjust exposure, contrast, color, tone curves, levels, sharpness, blur, and vignette without flattening the artwork;
- add editable text, free fonts, gradients, outlines, spacing, decoration, and curved type in Type Studio;
- combine images, text, shapes, annotations, blur regions, and secure redactions in a reorderable layer stack;
- frame a selected image or the whole artwork with presentation, backdrop, corner, and shadow controls;
- save locally and export PNG, JPEG, WebP, PDF, or a portable Glassware project.

Local capture, editing, saving, and export work without an account. Captured
content and artwork stay in browser storage unless you deliberately choose an
online feature. Optional Wiplash.ai sign-in unlocks cloud sync, billing, and AI
connections. AI features run only after the user connects ChatGPT/Codex or
separately billed OpenAI API access.

Optional cloud subscriptions are available through Stripe-hosted checkout.
Designer is $7.99 monthly or $71.99 annually and includes 100 GB of private
cloud storage. Director is $14.99 monthly per seat or $143.99 annually per seat
and includes unlimited team storage. Stripe collects payment credentials on its
hosted page; Glassware receives subscription, invoice, renewal, and payment
status needed to provide the purchased plan. Glassware never receives or stores
the full card number or card security code.

Glassware does not sell user data, inject advertisements, monitor browsing in
the background, or upload captures by default.

## Shared metadata

- Language: English (United States)
- Homepage: https://labs.wiplash.ai/glassware/
- Privacy policy: https://labs.wiplash.ai/glassware/privacy.html
- Support: support@wiplash.ai
- License: MIT

## Single purpose

Capture user-requested visible pages and local images into a full image editor
for non-destructive photo adjustment, layered composition, and export.

## Permission explanations

- `activeTab`: captures only the visible page after the user chooses the
  Glassware context-menu command. It does not monitor browsing in the background.
- `contextMenus`: adds the user-invoked **Capture page with Glassware** command.
- `identity`: opens the browser-owned Wiplash.ai sign-in window and returns only
  a one-time callback to Glassware.
- `storage`: holds one pending capture until import, local extension preferences,
  and—after sign-in—one revocable opaque Glassware session token. It never stores
  an identity-provider or ChatGPT token.
- Optional `auth.wiplash.ai`: requested only when the user chooses sign-in so the
  packaged editor can exchange its one-time PKCE code and use account features.
- `api.openverse.org`: searches and imports user-selected openly licensed images
  with attribution details.
- `fonts.googleapis.com` and `fonts.gstatic.com`: lets the user browse, download,
  and use a selected Google Font in an artwork.

## Data-use summary

Glassware handles captured website content, the source page URL, user-created
artwork, and editing choices locally for its disclosed image-editing purpose. It
does not sell user data, use it for advertising, or transmit captures by
default. When a user explicitly signs in, the packaged editor contacts the
HTTPS Glassware account service for the account, cloud, billing, and AI features
described in the privacy notice. Those features can be disconnected, and the
stored Glassware session can be removed whenever the user wants. If the user
upgrades, Wiplash shares account and selected-plan details with Stripe and
receives the resulting subscription and payment-status records. Stripe handles
the payment credentials on its own hosted checkout and billing pages.
