# GlassWare V2: Photo Lab, Type Studio, and editable reconstruction

**Status:** active implementation plan  
**Updated:** 2026-08-23  
**Primary design partner:** a frequent PicMonkey, Canva, and Adobe Express user

## Product decision

GlassWare V2 prioritizes the two mature workflows that can replace a separate
photo editor today:

1. **Photo Lab** for precise, local-first raster editing.
2. **Type Studio** for a large open-font catalog and expressive, editable text.

Flattened-design reconstruction, comparable to Canva Magic Layers, remains a
separate paid hosted feature. It requires GPU inference, model and weight
audits, reconstruction QA, and ongoing compute. It must not delay the local
editor workflows or become a surcharge on ordinary manual editing.

## Photo Lab research and scope

PicMonkey's core editing workflow combines crop and resize, exposure and color
adjustments, sharpening, masks, brushed effects, retouching, and reusable looks.
GlassWare already has precise crop, rotate/flip, masks, region-aware AI edits,
temperature, tint, sharpen, vignette, blur, grayscale, sepia, and presets.

V2 adds:

- source-resolution inspection and high-quality resampling;
- editable exposure, shadows, highlights, hue, vibrance, fade, levels, gamma,
  and tone-curve presets;
- skew and non-destructive perspective, bulge, pinch, and wave warps;
- direct access to crop, masks, and region-aware object replacement from a
  dedicated Photo Lab;
- derived-asset receipts so resampling does not overwrite the original raster;
- project-history coverage for every durable edit.

### Open-source implementation foundation

| Project | Role | License and decision |
| --- | --- | --- |
| [Konva](https://github.com/konvajs/konva) | Existing scene graph and filters | MIT; retained behind the GlassWare canvas adapter |
| [pica](https://github.com/nodeca/pica) | High-quality browser resampling | MIT; adopted as a worker/WASM-capable resizer |
| [PixiJS Filters](https://github.com/pixijs/filters) | Displacement/filter reference | MIT; reference only for now to avoid a second scene graph |
| [glfx.js](https://github.com/evanw/glfx.js) | Perspective, bulge/pinch, swirl, and curve shader reference | MIT; useful algorithms, but the old package is not adopted as a runtime foundation |

GlassWare uses an offscreen mesh renderer for warp previews and feeds the result
back into the existing Konva image node. The original image asset and editable
warp parameters remain available until export.

The browser resampling path is intentionally an 8-bit screen-image workflow.
It does not promise preservation of EXIF metadata or professional color-managed
prepress precision; those are explicit later milestones rather than hidden
claims in the current Photo Lab.

## Type Studio research and scope

Adobe Express combines a large font catalog with custom uploads, text shape and
warp controls, spacing, shadows, outlines, and color effects. GlassWare already
supports inline text editing, searchable local and Google fonts, portable font
embedding, alignment, line height, font size/style, fill, and a shadow.

V2 adds:

- a substantially expanded, categorized Google Fonts catalog loaded on demand;
- searchable installed, system, and open fonts with local font upload;
- numeric weight, letter spacing, decoration, and text-case controls;
- editable outline width and color;
- two-color linear text gradients with angle control;
- curved text on an editable arc while preserving the source string;
- reusable typography presets and clear indicators when curved text is
  single-line only.

### Open-source implementation foundation

| Project | Role | License and decision |
| --- | --- | --- |
| [Google Fonts](https://github.com/google/fonts) | Open font catalog | Mostly OFL-1.1, with Apache-2.0 and Ubuntu Font License families; load on demand and preserve family-level license metadata |
| [fontkit](https://github.com/foliojs/fontkit) | Advanced parsing, glyph layout, paths, variables, and subsetting | MIT; candidate for the later OpenType/variable-axis milestone |
| [HarfBuzz](https://github.com/harfbuzz/harfbuzz) | International and complex-script shaping | Old MIT; candidate when GlassWare exposes advanced OpenType features |
| [opentype.js](https://github.com/opentypejs/opentype.js) | Browser glyph paths and variable-font manipulation | MIT; candidate for envelope warp and per-glyph editing |

The current Type Studio milestone uses browser-native font loading and Konva
text/text-path rendering. Fontkit, HarfBuzz, or opentype.js should be adopted
only after a focused bundle, shaping, and accessibility comparison; shipping
all three would duplicate substantial functionality.

## Ideas instead of copied templates

GlassWare will not scrape or redistribute Canva templates. Canva's current
[Terms of Use](https://www.canva.com/policies/terms-of-use/) prohibit scraping
and accessing the service to build a competitive product, while its
[Content License Agreement](https://www.canva.com/policies/content-license-agreement/)
applies content-specific reuse restrictions.

The V2 direction is an **Ideas** library made from original GlassWare project
recipes: editable layout skeletons, palette/font variations, campaign format
families, personal templates, and clearly licensed community contributions.

## Paid hosted feature: Make Editable

Canva describes Magic Layers as rebuilding a flat image into live text boxes,
separate movable elements, a clean background, and preserved layout
relationships. The closest current open-source baseline is
[LayerD](https://github.com/CyberAgentAILab/LayerD), an Apache-2.0 ICCV 2025
project that iteratively extracts top layers, completes the background, and
exports SVG or PSD. Its OCR support is not yet a complete live-text solution.

A GlassWare implementation would need:

1. region and text detection;
2. alpha matting, layer ordering, and background inpainting;
3. OCR, font matching, and live text reconstruction;
4. simple-shape vectorization;
5. grouping and layout inference;
6. render-versus-original comparison and iterative correction;
7. a confidence-based human review step;
8. private GPU workers, usage accounting, retention controls, and model-weight
   license inventory.

Before production, test at least twenty representative, rights-cleared flyers
and campaign images. Measure text accuracy, useful layer recovery, composite
similarity, cleanup time, latency, failure rate, and GPU cost. The original
raster must remain as a locked fallback layer.

## License policy

- Browser editor/runtime dependencies remain MIT-first.
- Audited permissive licenses such as Apache-2.0 are acceptable for private
  hosted model services.
- Fonts retain their OFL, Apache, or Ubuntu family license and provenance.
- Model code, model weights, fonts, templates, and stock assets are inventoried
  independently; one permissive application license does not cover the rest.
- No proprietary competitor content becomes part of the GlassWare repository
  or product library.

## Delivery sequence

1. Photo Lab tone, transform, warp, crop, mask, and resample workflow.
2. Type Studio catalog, spacing, weight, outline, gradient, case, and arc text.
3. Original Ideas library and personal templates.
4. Make Editable technical spike and quality report.
5. Paid hosted reconstruction only if the quality and unit economics pass.
