# Firefox Add-ons submission

Status: version 1.0.1 was submitted on August 25, 2026 and is **Awaiting Review**.
The reviewer-source archive and product-page media were submitted with it.

- Name: Glassware Image Editor
- Add-on URL slug: glassware-image-editor
- Summary: Capture, crop, resize, retouch, layer, and export images in a private, local-first editor.
- Category: Photos, Music & Videos
- Experimental: No
- Requires payment or non-free services: Yes, optional Designer and Director cloud subscriptions and optional user-connected AI services; local editing remains free
- Support email: support@wiplash.ai
- Support website: https://labs.wiplash.ai/glassware/
- License: MIT
- Privacy policy: https://labs.wiplash.ai/glassware/privacy.html
- Package: `artifacts/store/firefox/glassware-1.0.1-firefox.zip`
- Reviewer source: `artifacts/store/firefox/glassware-1.0.1-firefox-source.zip`
- Screenshots: all five PNG files in `store-assets/screenshots/`, in numeric order
- Authentication callback: `https://glassware-image-editor.extensions.allizom.org/`
- Add-on ID: `glassware-image-editor@wiplash.ai`
- Automated validation: no errors and three warnings

## Description

Use the detailed description from `store-assets/LISTING.md` without changes.

## Firefox data declaration

The Firefox package requires no data transmission for local editing. It declares
authentication information, identifying account information, financial and
payment information, personal communications, browsing activity, and website
content as optional because the user may opt into Wiplash.ai sign-in, Stripe
billing, cloud storage, and AI features. The app requests that optional consent
only from a user-invoked account or billing action. Stripe collects payment
credentials on its hosted page; Glassware receives subscription, transaction,
invoice, renewal, and payment status, but no full card number or CVC.
The account service accepts Firefox's browser-assigned UUID origin only when
this exact AMO-owned callback is configured; arbitrary web and malformed
`moz-extension://` origins remain denied.

## Notes for reviewers

Use `store-assets/REVIEWER_NOTES.md`. Build instructions are included as
`SOURCE_BUILD.md` at the root of the matching reviewer-source archive.
