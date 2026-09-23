"""Whiten the pale blue studio backdrop in MODEL 01 without changing the model."""

from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/images/Projects/[de]construct + [re]configure/MODEL 01 cropped.png"
OPTIMIZED = ROOT / "assets/images/optimized/model-01-cropped-white-background.webp"
SELECTED = ROOT / "assets/images/selected/models/model-01-cropped-white-background.webp"


def main():
    image = Image.open(SOURCE).convert("RGB")
    pixels = np.asarray(image).copy()
    red = pixels[:, :, 0].astype(np.int16)
    green = pixels[:, :, 1].astype(np.int16)
    blue = pixels[:, :, 2].astype(np.int16)

    # The backdrop is light, neutral-to-blue. Warm wood and skin fall outside
    # this mask, so their original pixels remain untouched.
    backdrop = (
        (red >= 236)
        & (green >= 238)
        & (blue >= 244)
        & (green >= red - 3)
        & (blue >= green - 2)
    )
    pixels[backdrop] = 255
    # No part of the photographed object enters these outer side gutters.
    # Cover the remaining blue texture there while retaining its real shadow.
    pixels[:, : int(image.width * 0.07)] = 255
    pixels[:, int(image.width * 0.91) :] = 255
    corrected = Image.fromarray(pixels, "RGB")
    corrected.save(SOURCE, optimize=True)
    corrected.resize((2400, 1350), Image.Resampling.LANCZOS).save(OPTIMIZED, "WEBP", quality=88, method=6)
    corrected.resize((2000, 1125), Image.Resampling.LANCZOS).save(SELECTED, "WEBP", quality=88, method=6)
    print(f"Whitened {int(backdrop.sum()):,} backdrop pixels in {image.width}x{image.height} source")


if __name__ == "__main__":
    main()
