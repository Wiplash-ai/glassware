# Glassware Image Editor store assets

This directory is the canonical, reviewable source for browser-store listings.
No file here authorizes submission or publication.

- `LISTING.md`: shared product copy, permission explanations, and data-use disclosure.
- `listings/`: field-by-field drafts for Chrome, Edge, Firefox, and Opera.
- `REVIEWER_NOTES.md`: exact account-free certification path.
- `source/`: original generated demo photograph, abstract promo backdrop, and provenance.
- `screenshots/`: five actual 1280x800 Glassware UI screenshots made from one edited campaign project.
- `opera-screenshots/`: 612x408 layout references for later recapture in Opera.
- `promo/small-440x280.png`: required Chrome and optional Edge small tile.
- `promo/marquee-1400x560.png`: optional Chrome and Edge marquee tile.
- `promo/*.svg`: deterministic, editable tile layouts with exact first-party typography.
- `opera-icon-64.png`: Opera's required store icon.
- `opera-promo-300x188.png`: Opera's optional featured promotional image.

## Screenshot order

1. Photo Lab tonal and color adjustment
2. Precision, non-destructive crop
3. Type Studio with editable campaign text
4. Presentation Studio for the selected image
5. Reorderable editable layer stack

The screenshot generator imports `source/florist-worktable-demo.png`, builds a
layered campaign inside the real app database, reloads it through normal project
bootstrapping, and captures the actual production UI. It does not composite a
mock editor around the artwork.

## Regenerate

```bash
npm run store:assets
```

This runs a production build, generates all five 1280x800 screenshots, renders
the exact 440x280 and 1400x560 promotional PNGs, creates Opera's 64x64 icon and
300x188 promotional image, and creates 612x408 Opera screenshot references.

Opera requires final screenshots to be captured in Opera itself. Treat the
612x408 derivatives as shot-list references, not upload-ready Opera evidence.

Before a dashboard upload, verify dimensions with `identify`, visually inspect
the PNGs at original resolution and at 50%, then run `npm run verify`. Upload the
exact package named in the matching file under `listings/`.
