# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Personal academic website for Prof. Aviv Zohar (www.avivz.net). Static HTML site hosted on GitHub Pages, deployed from the `master` branch. Based on the "Editorial" template by HTML5 UP.

## Validation

Run HTML validation locally before committing:

```sh
html5validator --root . --match "*.html"
```

This is also enforced in CI via `.github/workflows/validate.yml`.

## Building CSS

SCSS source files are in `assets/sass/`. The compiled CSS is committed as `assets/css/main.css`. After editing any `.scss` file, recompile:

```sh
npx sass assets/sass/main.scss assets/css/main.css --no-source-map
```

There is no build system (no package.json, Makefile, or Gemfile) — just run the sass command directly.

## Key Files

- **`index.html`** — Homepage with bio, research interests, sidebar navigation
- **`publications.html`** — All publications (~2100 lines); each entry uses the `pub-entry` structure (see below)
- **`talks.html`** — Embedded talk videos in a responsive grid
- **`assets/sass/main.scss`** — SCSS entry point, imports all partials
- **`assets/sass/components/_publications.scss`** — Publication list styling
- **`assets/sass/components/_talks.scss`** — Talks grid styling

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
    <a href="pubs/YEAR/file.pdf" class="button tight">PDF</a>
    <!-- optional: arXiv, ACM, Springer links -->
  </div>
  <div class="pub-talks">
    <!-- optional YouTube talk links -->
  </div>
  <pre class="pub-bibtex" hidden>@inproceedings{...}</pre>
</div>
```

## Conventions

- FontAwesome 6.7.2 loaded via CDN (not local) — use `fa-solid`, `fa-brands` class prefixes
- PDFs stored in `pubs/YEAR/` directories
- Images in `images/`
- The `iframe` `width` attribute only accepts pixel values per HTML spec — use `style="width:100%"` instead of `width="100%"`
