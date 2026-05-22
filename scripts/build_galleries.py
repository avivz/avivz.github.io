#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "pillow",
#     "pyyaml",
# ]
# ///
"""Build the photography feed.

Reads `_data/photography_sources.yml`, resizes images from each listed source
directory into `photos/<slug>/{full,thumb}/`, extracts EXIF `DateTimeOriginal`
from each photo, and writes a `_data/galleries.yml` manifest with a flat photo
list grouped by year-month for the chronological feed at /photography/.

Run after dropping new photos into a published gallery directory:

    uv run scripts/build_galleries.py
"""

from __future__ import annotations

import argparse
import shutil
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

import yaml  # type: ignore[import-untyped]
from PIL import Image, ImageOps  # type: ignore[import-untyped]
from PIL.ExifTags import IFD  # type: ignore[import-untyped]

REPO_ROOT = Path(__file__).resolve().parent.parent
SOURCES_FILE = REPO_ROOT / "_data" / "photography_sources.yml"
DATA_FILE = REPO_ROOT / "_data" / "galleries.yml"
PHOTOS_DIR = REPO_ROOT / "photos"
PAGES_DIR = REPO_ROOT / "photography"

FULL_LONG_EDGE = 2400
THUMB_LONG_EDGE = 900
FULL_QUALITY = 85
THUMB_QUALITY = 80

IMAGE_EXTS = {".jpg", ".jpeg", ".png"}

EXIF_DATETIME_ORIGINAL = 0x9003
EXIF_DATETIME_DIGITIZED = 0x9004
EXIF_DATETIME = 0x0132


@dataclass(frozen=True)
class GallerySource:
    slug: str
    dirs: tuple[str, ...]
    title: str
    location: str | None = None
    thumb: str | None = None
    exclude: frozenset[str] = frozenset()


def normalize_dirs(value: Any) -> tuple[str, ...]:
    """Accept either a string or a list of strings for the `dir:` field."""
    if isinstance(value, str):
        return (value,)
    if isinstance(value, list):
        return tuple(value)
    raise ValueError(f"`dir` must be a string or list, got {type(value).__name__}")


def load_sources() -> dict[str, Any]:
    if not SOURCES_FILE.exists():
        sys.exit(f"Missing config: {SOURCES_FILE}")
    with SOURCES_FILE.open() as f:
        data: dict[str, Any] = yaml.safe_load(f)
    return data


def parse_exif_datetime(value: str) -> datetime | None:
    try:
        return datetime.strptime(value, "%Y:%m:%d %H:%M:%S")
    except (ValueError, TypeError):
        return None


def get_taken(src: Path) -> datetime:
    """Return EXIF DateTimeOriginal, falling back to file mtime."""
    try:
        with Image.open(src) as im:
            exif = im.getexif()
            ifd = exif.get_ifd(IFD.Exif)
            for tag in (EXIF_DATETIME_ORIGINAL, EXIF_DATETIME_DIGITIZED):
                val = ifd.get(tag)
                if val:
                    parsed = parse_exif_datetime(str(val))
                    if parsed:
                        return parsed
            val = exif.get(EXIF_DATETIME)
            if val:
                parsed = parse_exif_datetime(str(val))
                if parsed:
                    return parsed
    except Exception:
        pass
    return datetime.fromtimestamp(src.stat().st_mtime)


def resize(src: Path, dst: Path, long_edge: int, quality: int) -> tuple[int, int]:
    if dst.exists() and dst.stat().st_mtime > src.stat().st_mtime:
        with Image.open(dst) as im:
            w, h = im.size
            return w, h
    dst.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)
        im.thumbnail((long_edge, long_edge), Image.LANCZOS)
        im = im.convert("RGB")
        im.save(dst, "JPEG", quality=quality, optimize=True, progressive=True)
        w, h = im.size
        return w, h


def process_source(source: GallerySource, source_root: Path) -> list[dict[str, Any]]:
    out_dir = PHOTOS_DIR / source.slug
    full_dir = out_dir / "full"
    thumb_dir = out_dir / "thumb"

    photos: list[dict[str, Any]] = []
    seen_names: dict[str, str] = {}  # filename -> source dir, for collision detection
    for d in source.dirs:
        src_dir = source_root / d
        if not src_dir.is_dir():
            sys.exit(f"Source dir missing: {src_dir}")
        for path in sorted(src_dir.iterdir()):
            if path.suffix.lower() not in IMAGE_EXTS:
                continue
            if path.name in source.exclude:
                continue
            if path.name in seen_names:
                sys.exit(
                    f"Filename collision in gallery '{source.slug}': "
                    f"'{path.name}' appears in both {seen_names[path.name]}/ "
                    f"and {d}/. Rename one in source, or add to exclude."
                )
            seen_names[path.name] = d
            full_dst = full_dir / path.name
            thumb_dst = thumb_dir / path.name
            fw, fh = resize(path, full_dst, FULL_LONG_EDGE, FULL_QUALITY)
            tw, th = resize(path, thumb_dst, THUMB_LONG_EDGE, THUMB_QUALITY)
            taken = get_taken(path)
            photos.append({
                "src": path.name,
                "full": f"/photos/{source.slug}/full/{path.name}",
                "thumb": f"/photos/{source.slug}/thumb/{path.name}",
                "w": fw,
                "h": fh,
                "tw": tw,
                "th": th,
                "taken": taken.isoformat(),
                "taken_ts": int(taken.timestamp()),
            })

    # Sort within a gallery by date taken (oldest first), with filename as tiebreaker.
    photos.sort(key=lambda p: (p["taken_ts"], p["src"]))

    # Clean up outputs for files that were excluded or removed from source.
    for sub in ("full", "thumb"):
        sub_dir = out_dir / sub
        if not sub_dir.exists():
            continue
        for f in sub_dir.iterdir():
            if f.name not in seen_names:
                f.unlink()
                print(f"  removed stale {f.relative_to(REPO_ROOT)}")

    return photos


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", help="Process only this slug", default=None)
    args = parser.parse_args()

    config = load_sources()
    source_root = Path(config["source_dir"])
    raw_sources = config["galleries"]

    sources = [
        GallerySource(
            slug=s["slug"],
            dirs=normalize_dirs(s["dir"]),
            title=s["title"],
            location=s.get("location"),
            thumb=s.get("thumb"),
            exclude=frozenset(s.get("exclude") or []),
        )
        for s in raw_sources
    ]
    if args.only and not any(s.slug == args.only for s in sources):
        sys.exit(f"No gallery matching --only={args.only}")

    # Load existing manifest so --only mode can reuse cached gallery entries.
    cached_by_slug: dict[str, dict[str, Any]] = {}
    if DATA_FILE.exists():
        with DATA_FILE.open() as f:
            existing = yaml.safe_load(f) or []
        if isinstance(existing, list):
            cached_by_slug = {g["slug"]: g for g in existing if "slug" in g}

    galleries: list[dict[str, Any]] = []
    for source in sources:
        if args.only and source.slug != args.only and source.slug in cached_by_slug:
            galleries.append(cached_by_slug[source.slug])
            print(f"Reusing cached {source.slug}")
            continue
        print(f"Processing {source.slug} from {', '.join(source.dirs)}/ ...")
        photos = process_source(source, source_root)
        if not photos:
            sys.exit(f"Gallery '{source.slug}' has no photos.")
        print(f"  -> {len(photos)} photos")

        cover = photos[0]
        if source.thumb:
            match = next((p for p in photos if p["src"] == source.thumb), None)
            if match:
                cover = match
            else:
                print(f"  warning: thumb '{source.thumb}' not in gallery, using first photo")

        galleries.append({
            "slug": source.slug,
            "title": source.title,
            "location": source.location,
            "cover": cover,
            "photos": photos,
        })
        write_stub(source.slug)

    # Prune entire slug directories no longer listed in the config.
    configured_slugs = {s.slug for s in sources}
    if PHOTOS_DIR.exists():
        for d in PHOTOS_DIR.iterdir():
            if d.is_dir() and d.name not in configured_slugs:
                shutil.rmtree(d)
                print(f"Removed orphaned gallery {d.relative_to(REPO_ROOT)}")

    # Prune stub pages for galleries no longer in the config.
    if PAGES_DIR.exists():
        for stub in PAGES_DIR.glob("*.html"):
            if stub.name == "index.html":
                continue
            if stub.stem not in configured_slugs:
                stub.unlink()
                print(f"Removed orphaned page {stub.relative_to(REPO_ROOT)}")

    total = sum(len(g["photos"]) for g in galleries)

    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with DATA_FILE.open("w") as f:
        yaml.safe_dump(galleries, f, sort_keys=False, allow_unicode=True)
    print(f"Wrote {DATA_FILE} ({len(galleries)} galleries, {total} photos)")


def write_stub(slug: str) -> None:
    PAGES_DIR.mkdir(parents=True, exist_ok=True)
    stub = PAGES_DIR / f"{slug}.html"
    content = (
        "---\n"
        "layout: gallery\n"
        f"slug: {slug}\n"
        f"permalink: /photography/{slug}/\n"
        "---\n"
    )
    if not stub.exists() or stub.read_text() != content:
        stub.write_text(content)


if __name__ == "__main__":
    main()
