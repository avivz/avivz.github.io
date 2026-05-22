# Photography Build Script

`build_galleries.py` syncs photos from a local source archive (Dropbox) into the website. It resizes, extracts EXIF dates, and writes the Jekyll manifest that powers `/photography/`.

## How to run

From the repo root:

```sh
uv run scripts/build_galleries.py            # all galleries
uv run scripts/build_galleries.py --only foo  # just the gallery with slug "foo"
```

The script uses [PEP 723 inline dependencies](https://peps.python.org/pep-0723/), so `uv` installs Pillow + PyYAML on first run. No venv needed.

Reruns are incremental: photos with an output already newer than the source are skipped, so a no-op rebuild takes under a second.

## Typical workflows

### Adding a new shoot

1. Drop photos into a new subdir under the source root (`/mnt/c/Dropbox/PersonalArchive/SelectedPhotography/`).
2. Add an entry to `_data/photography_sources.yml`:
   ```yaml
   - slug: my-shoot
     dir: 2026_05_MyShoot
     title: My Shoot
     location: Somewhere, NJ
   ```
3. Build:
   ```sh
   uv run scripts/build_galleries.py
   ```
4. Commit and push (don't forget the stub page under `photography/`):
   ```sh
   git add photos/ photography/ _data/galleries.yml _data/photography_sources.yml
   git commit -m "Add my-shoot gallery"
   git push
   ```

### Merging multiple source dirs into one gallery

`dir:` accepts a list, so several Dropbox dirs can feed one gallery. Photos are merged and sorted by EXIF date:

```yaml
- slug: pole-farm
  dir:
    - Nov_2025_PoleFarm2
    - Dec_2025_PoleFarm3
    - Dec_2025_PoleFarm4
  title: Pole Farm
  location: Mercer Meadows, NJ
```

Filenames across the merged dirs must not collide — the script will error if they do.

### Choosing the cover thumbnail

By default the first photo in the gallery (oldest) is the cover. Override with `thumb:`:

```yaml
- slug: cemetery-fox
  dir: 2026_04_CemeteryFox
  title: Cemetery Fox
  thumb: DSC_5108.jpg
```

The filename must match one of the photos in the gallery's source dir(s).

### Hiding a photo

1. Find its filename — right-click the thumbnail on the page → **Copy image address**. The filename is the last path segment, e.g. `DSC_1234.jpg`.
2. Add it to that gallery's `exclude:` list in `_data/photography_sources.yml`:
   ```yaml
   - slug: florida
     dir: Dec_2025_Florida
     title: Florida
     exclude:
       - DSC_1234.jpg
       - DSC_5678.jpg
   ```
3. Rerun the script. The excluded photos are skipped, and their previously-generated copies under `photos/florida/` are deleted.

### Adding or removing photos from an existing shoot

Edit the Dropbox source directory directly, then rerun the script. New photos are processed; deleted photos have their generated copies pruned automatically.

## What the script does (in order)

1. **Reads** `_data/photography_sources.yml` — the source-of-truth config.
2. **For each gallery entry**, iterates every directory in `dir:` (string or list).
3. **Skips** any filename in `exclude:`. Errors on filename collisions across multiple source dirs.
4. **Resizes** each photo twice using Pillow:
   - **Full**: 2400px on the long edge, JPEG quality 85, progressive. → `photos/<slug>/full/<name>.jpg`
   - **Thumb**: 900px on the long edge, JPEG quality 80, progressive. → `photos/<slug>/thumb/<name>.jpg`
   - Honors EXIF orientation so rotated phone shots come out right-side-up.
   - Skips if the output is newer than the source.
5. **Extracts** the capture time from EXIF `DateTimeOriginal` (with fallbacks to `DateTimeDigitized`, `DateTime`, then file mtime). Photos within a gallery are sorted oldest-first by this date.
6. **Picks the cover photo** — `thumb:` filename if specified, otherwise the first photo.
7. **Writes a stub page** under `photography/<slug>.html` so Jekyll generates the per-gallery page at `/photography/<slug>/`.
8. **Cleans up**:
   - stale outputs in `photos/<slug>/{full,thumb}/` (excluded or removed from source)
   - orphaned slug directories under `photos/` (whole galleries removed from config)
   - orphaned stub pages under `photography/`
9. **Writes** `_data/galleries.yml` — the manifest Jekyll consumes.

## Site structure

- `/photography/` — card grid index, one card per gallery (cover thumbnail + title + photo count)
- `/photography/<slug>/` — single gallery page with the photo grid and PhotoSwipe lightbox; the lightbox caption shows `<date> · <location>`

Reorder galleries on the index by reordering them in `_data/photography_sources.yml`.

## File layout

```
scripts/
  build_galleries.py             # this script
  README.md                      # this doc
_data/
  photography_sources.yml        # source config — edit this
  galleries.yml                  # generated manifest — do not edit
_layouts/
  photography.html               # the gallery page layout
photography/
  index.html                     # /photography/ entry point
photos/                          # generated, committed
  <slug>/
    full/*.jpg
    thumb/*.jpg
```

## Source config schema (`_data/photography_sources.yml`)

```yaml
source_dir: /mnt/c/Dropbox/PersonalArchive/SelectedPhotography

galleries:
  - slug: cemetery-fox            # required, becomes /photography/<slug>/
    dir: 2026_04_CemeteryFox      # required, subdir name OR list of subdirs
    title: Cemetery Fox           # required, shown on card + gallery page
    location: Princeton, NJ       # optional, shown on gallery page + lightbox caption
    thumb: DSC_5108.jpg           # optional, defaults to first photo
    exclude:                      # optional, filenames to skip
      - DSC_1234.jpg
```

## Tweaking output sizes

Constants near the top of the script:

```python
FULL_LONG_EDGE = 2400
THUMB_LONG_EDGE = 900
FULL_QUALITY = 85
THUMB_QUALITY = 80
```

After changing any of these, delete `photos/` and rerun to re-encode all images (the mtime-based skip won't notice a quality change).

## Footprint

At current settings, the resized photos average ~500–700 KB each. Roughly:

| Photos | Disk |
|------:|-----:|
|    50 |  ~30 MB |
|   500 | ~300 MB |
|  2000 |  ~1 GB (GitHub Pages soft limit) |

Source RAWs/full-resolution JPEGs stay in Dropbox and are never committed.
