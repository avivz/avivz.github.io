# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Personal academic website for Prof. Aviv Zohar (www.avivz.net). Static HTML site hosted on GitHub Pages, deployed from the `master` branch.

## Design: Annotated Preprint

The site is a LaTeX-style academic preprint marked up by hand — as if the author printed it out and scribbled over it with colored pens. Two layers coexist:

1. **Typeset layer** — Computer Modern Serif font, justified text, numbered sections (§1, §2...), small-caps paper titles (`font-variant: small-caps`), faint header/footer rules, gray paper boxes. Single centered column (~650px).

2. **Annotation layer** — Handwritten notes in Caveat font in the margins and between lines. Red ink (primary), blue ink (TODOs, second thoughts, editorial), purple ink (Reviewer 2). Slightly rotated, varied in size. Margin notes are JS-positioned to align with their target content via `data-align="#id"` attributes.

### Key design rules

- **Ink never goes inline.** Handwritten annotations belong in the margins or between lines — never inline with the typeset text, unless it's at the end of a line. Caret insertions (`.caret-mark` + `.insert-text`) float above via absolute positioning. Handwritten corrections (`.handwritten-fix`) may appear inline only at the end of a phrase. The typeset flow must not be broken.
- **Pen strokes look natural.** All ink marks — strikethroughs, underlines, circles — use hand-drawn SVG paths, never clean CSS lines. Strikethroughs (`.struck`) use a wavy SVG background. Pen underlines (`.pen-underline`) use an irregular SVG stroke as a background image. Nothing should look machine-generated.
- **Struck-out text keeps its original style.** Text that was "printed" and then crossed out with a pen should look identical to the surrounding typeset text (same font, weight, color) — only the hand-drawn strikethrough line is added on top. The struck text was part of the original document; it shouldn't be grayed out or styled differently.
- **Original text is continuous.** The caret mark (`.caret-mark`) takes zero width so the typeset text reads uninterrupted. Inserted text floats between lines above the caret.
- **Margin notes are dynamically positioned.** JS reads `data-align` and `data-offset` attributes to place notes next to their target content. Collision avoidance pushes overlapping notes apart. Left notes are right-aligned to hug the center column.
- **Date is dynamic.** JS computes current month and previous month — previous is struck out, current is the handwritten correction.
- **Small caps (\textsc) on all paper titles.** Both `.paper-title` and `.pub-title` use `font-variant: small-caps` globally via CSS.
- **Responsive degrades gracefully.** On mobile (<900px), margin columns hide and annotations appear inline with a colored left-border. Typeset body takes full width.

### Typography
- Body: Computer Modern Serif (CDN: cm-web-fonts via jsdelivr)
- Annotations: Caveat (Google Fonts)
- Code/email: Computer Modern Typewriter (CDN), fallback Courier New
- LaTeX features: `\textsc` via `.textsc` class, `\mathbb` via Unicode double-struck characters

### Colors
- Background: #fefefe — Body text: #1a1a1a
- Red ink: #c0392b — Blue ink (royal blue): #4169E1 — Purple ink: #6a3580
- Paper boxes: #f5f5f5 bg, #ccc border

### Layout
- **Page grid**: 5-column CSS Grid (`1fr 200px 650px 200px 1fr`) — outer `1fr` columns center the content
- **Section row**: 3-column inner grid (`200px 650px 200px`) for `.ml` / `.mc` / `.mr` columns
- Running header with small-caps and faint rules
- Footer: "1 of 1" right-aligned

### Camera-Ready Toggle
A floating button (`.version-toggle`) lets visitors switch between the annotated "draft" and a clean "camera-ready" view. State is persisted via `localStorage('camera-ready')`. In camera-ready mode (`body.camera-ready`), all ink — margin notes, strikethroughs, carets, circles, highlighters, SVG doodles — is hidden, struck text is restored to normal, and the page looks like a clean typeset document.

### Ink Annotations Vocabulary
Beyond margin notes, the annotation layer uses these inline elements:
- **`.struck`** — Hand-drawn wavy strikethrough (SVG background). Tilt randomized by JS.
- **`.pen-underline`** — Irregular SVG underline stroke.
- **`.caret-mark` + `.insert-text`** — Zero-width caret with text floating above between lines.
- **`.handwritten-fix`** — Inline correction at end of phrase, Caveat font. Tilt randomized by JS.
- **`.circle-text`** — Text with a hand-drawn circle around it (SVG `::after`). `.blue-circle` variant.
- **`.highlighter`** / **`.highlighter-green`** / **`.highlighter-pink`** — Translucent marker highlight backgrounds (yellow, green, pink).
- **`.bracket-note`** — Margin-style annotation placed inline with bracket styling.
- **`.ink-only`** — Elements visible only in draft mode, hidden in camera-ready.
- **`.filename-line`** — Faux filename annotation (e.g., "FINAL_revised_FINAL_v2.tex").

### Scroll Animations
Ink elements inside `.fade-in` containers animate on scroll via IntersectionObserver:
- Margin notes: fade + slide-in from the side
- Strikethroughs, pen-underlines: CSS wipe-in (`clip-path` / `background-size` transition)
- Highlighters: width grows from 0
- Carets, circles: opacity fade-in
- All ink animations are disabled in camera-ready mode

## Validation

Run HTML validation locally before committing:

```sh
html5validator --root . --match "*.html"
```

This is also enforced in CI via `.github/workflows/validate.yml`.

## CSS

CSS is plain (no SCSS build step). Edit `assets/css/main.css` directly.

## Key Files

- **`index.html`** — Homepage: bio, selected papers (newest-first), margin annotations
- **`publications.html`** — All publications (~2100 lines); each entry uses `pub-entry` structure
- **`talks.html`** — Embedded talk videos in a responsive grid
- **`counseling.html`** — Sabbatical/reception hours notice
- **`assets/css/main.css`** — All styles (single file, no preprocessor)
- **`c.html`** — Redirect to `counseling.html`
- **`assets/js/main.js`** — Dynamic date, scroll fade-in (IntersectionObserver), active nav link, margin note positioning, random ink tilts, camera-ready toggle (localStorage), BibTeX toggle

## Publication Entry Structure

Each publication in `publications.html` follows this pattern:

```html
<div class="pub-entry">
  <div class="pub-title">Paper Title</div>
  <div class="pub-meta">
    Authors. Venue Year.
    <button class="bibtex-toggle" onclick="toggleBibtex(this)" title="Show BibTeX">
      [<i class="fa-solid fa-book"></i> bib]
    </button>
  </div>
  <div class="pub-links">
    <a href="pubs/YEAR/file.pdf" class="pub-link">PDF</a>
  </div>
  <div class="pub-talks">
    <!-- optional YouTube talk links -->
  </div>
  <pre class="pub-bibtex" hidden>@inproceedings{...}</pre>
</div>
```

## Margin Note Structure

Margin notes live in `.ml` (left) or `.mr` (right) columns within a `.section-row`. Use `data-align` to target a content element:

```html
<div class="margin-note fade-in" data-align="#paper-ghost" aria-hidden="true">
  Annotation text here
</div>
```

- Rotation is randomized by JS at runtime (±8°). Static classes `rotate-n1` through `rotate-p3` exist in CSS but are overridden.
- `fade-in` + `delay-1`/`delay-2`/`delay-3` — staggered scroll-triggered animation
- `blue-ink`, `purple-ink` — ink color variants
- `data-offset="90"` — optional pixel offset from target top

## Conventions

- FontAwesome 6.7.2 loaded via CDN — use `fa-solid`, `fa-brands` class prefixes
- Computer Modern fonts loaded via jsdelivr CDN (cm-web-fonts)
- PDFs stored in `pubs/YEAR/` directories
- Images in `images/`
- The `iframe` `width` attribute only accepts pixel values per HTML spec — use `style="width:100%"` instead of `width="100%"`
