"""Extract diagram-only crops from the Legacy Square source booklet."""

from pathlib import Path
from tempfile import TemporaryDirectory
import subprocess

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "assets/images/Projects/Legacy Square/legacy square booklet.pdf"
DEST = ROOT / "selected-works/assets/images/Projects/Legacy Square"
POPPLER = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe"

# Bounds frame each graphic after the surrounding prose is masked. Numbered
# keys and labels within the graphics are retained.
CROPS = [
    (4, "03-views-and-sound", (0.00, 0.00, 1.00, 1.00)),
    (4, "legacy-square-card", (0.15, 0.05, 0.84, 0.95)),
    (5, "04-stage-plan", (0.00, 0.00, 1.00, 1.00)),
    (7, "05-park-section", (0.00, 0.24, 1.00, 1.00)),
    (7, "legacy-square-hover", (0.00, 0.24, 1.00, 1.00)),
    (10, "06-stage-operating-modes", (0.00, 0.05, 0.65, 1.00)),
]

# Paragraph fields in the original booklet, expressed in page fractions.
# These are painted white on a separate raster copy; the PDF remains untouched.
MASKS = {
    5: [(0.015, 0.05, 0.32, 0.24)],
    7: [(0.015, 0.05, 0.37, 0.24)],
    10: [(0.015, 0.05, 0.34, 0.26)],
}


def region(page, bounds):
    width, height = page.size
    box = tuple(round(value * (width if index % 2 == 0 else height))
                for index, value in enumerate(bounds))
    return page.crop(box)


def save_site_plans(page):
    """Compose the two site diagrams with their original reference graphics."""
    locator = region(page, (0.00, 0.05, 0.285, 0.55))
    plan = region(page, (0.275, 0.05, 0.995, 0.96))
    key = region(page, (0.03, 0.845, 0.18, 0.95))
    scale = region(page, (0.18, 0.89, 0.235, 0.95))
    north = region(page, (0.235, 0.89, 0.285, 0.95))
    composed = Image.new("RGB", (3200, 1750), "white")
    # Keep the locator's key, scale, and north arrow in one vertical sequence.
    composed.paste(locator, (25, 25))
    composed.paste(plan.resize((2130, 1570), Image.Resampling.LANCZOS), (980, 25))
    composed.paste(key, (145, 1095))
    composed.paste(scale, (145, 1320))
    composed.paste(north, (145, 1470))
    output = DEST / "01-site-plans-locator-key-v3.webp"
    composed.save(output, "WEBP", quality=92, method=6)
    print(output.stem, composed.size)


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory() as temp:
        temp = Path(temp)
        pages = sorted({3, *(number for number, _, _ in CROPS)})
        for number in pages:
            subprocess.run(
                [str(POPPLER), "-f", str(number), "-l", str(number),
                 "-r", "120", "-singlefile", "-png", str(SOURCE),
                 str(temp / f"page-{number:02d}")],
                check=True,
            )
        with Image.open(temp / "page-03.png") as source:
            save_site_plans(source.convert("RGB"))
        for number, name, bounds in CROPS:
            with Image.open(temp / f"page-{number:02d}.png") as source:
                page = source.convert("RGB")
                width, height = page.size
                draw = ImageDraw.Draw(page)
                for mask in MASKS.get(number, []):
                    rectangle = tuple(round(value * (width if index % 2 == 0 else height))
                                      for index, value in enumerate(mask))
                    draw.rectangle(rectangle, fill="white")
                if name == "legacy-square-hover":
                    draw.rectangle((0, round(height * 0.91), width, height),
                                   fill="#e8e8e8")
                crop = region(page, bounds)
                crop.save(DEST / f"{name}.webp", "WEBP", quality=92, method=6)
                print(name, crop.size)


if __name__ == "__main__":
    main()
