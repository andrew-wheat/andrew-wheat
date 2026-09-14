from __future__ import annotations

import base64
import hashlib
import io
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


PROJECT_ROOT = Path(__file__).resolve().parent.parent
PORTFOLIO_ROOT = PROJECT_ROOT.parent
PROJECT_ASSETS = (
    PROJECT_ROOT
    / "assets"
    / "images"
    / "Projects"
    / "Hunter's Point Cooperative Housing"
)
SOURCE_ASSETS = (
    PORTFOLIO_ROOT
    / "assets"
    / "images"
    / "Projects"
    / "Hunter's Point Cooperative Housing"
)
FONT_ROOT = PORTFOLIO_ROOT / "assets" / "fonts" / "Inter" / "static"


def short_digest(data: bytes) -> str:
    return hashlib.sha1(data).hexdigest()[:10]


def draw_top_aligned(
    draw: ImageDraw.ImageDraw,
    position: tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
) -> None:
    x, top = position
    bounds = font.getbbox(text)
    draw.text((x, top - bounds[1]), text, font=font, fill=(0, 0, 0))


def build_housing_parti() -> str:
    source = PROJECT_ASSETS / "housing parti.jpg"
    image = Image.open(source).convert("RGB")
    draw = ImageDraw.Draw(image)
    regular = ImageFont.truetype(FONT_ROOT / "Inter_18pt-Regular.ttf", 96)
    bold = ImageFont.truetype(FONT_ROOT / "Inter_18pt-Bold.ttf", 96)

    # White-out only the existing type. Diagram geometry and legend swatches sit
    # outside these rectangles and remain byte-for-byte inherited from the source.
    text_lines = [
        (490, 801, 872, "ARTICULATED WALLS", bold, 3800),
        (490, 1027, 1116, "Articulated interior walls create a porch condition,", regular, 3800),
        (490, 1138, 1229, "reducing percieved linearity of the corridor", regular, 3800),
        (1107, 1400, 1472, "Corridor", regular, 2500),
        (1110, 1595, 1665, "Porch", regular, 2500),
        (496, 2624, 2696, "LAYERED LANDINGS AND WORKSHOPS", bold, 3800),
        (491, 2850, 2941, "Workshops and landings are dispersed and", regular, 3800),
        (495, 2963, 3053, "layered throughout the undulating circulation path,", regular, 3800),
        (493, 3074, 3166, "generating varying levels of visibility, interaction,", regular, 3800),
        (493, 3187, 3278, "and formality of use.", regular, 3800),
        (1110, 3525, 3616, "Landing", regular, 2500),
        (1105, 3719, 3808, "Workshop", regular, 2500),
        (489, 4667, 4739, "FIGURE GROUND GARDEN", bold, 3900),
        (
            487,
            4892,
            4983,
            "On the ground floor, a meandering circulation pattern occurs, where",
            regular,
            4100,
        ),
        (
            484,
            5004,
            5096,
            "vendor stalls, workshops and community services such as a cafe, library",
            regular,
            4100,
        ),
        (486, 5118, 5208, "and gym are scattered between greenspaces.", regular, 4100),
        (
            483,
            5342,
            5433,
            "A central plaza intruduces a cruciform axis to the site, inviting overlap of",
            regular,
            4100,
        ),
        (
            488,
            5455,
            5546,
            "movement between the neighborhood, and the green corridor.",
            regular,
            4100,
        ),
        (1097, 5772, 5844, "Vendors / Services", regular, 2600),
        (1101, 5966, 6056, "Greenspace", regular, 2500),
    ]

    for x, top, bottom, text, font, right in text_lines:
        draw.rectangle((x - 18, top - 14, right, bottom + 14), fill=(255, 255, 255))
        draw_top_aligned(draw, (x, top), text, font)

    output = io.BytesIO()
    image.save(output, format="PNG", optimize=True)
    payload = output.getvalue()
    output_name = f"housing-parti-inter-{short_digest(payload)}.png"
    (PROJECT_ASSETS / output_name).write_bytes(payload)
    return output_name


def build_full_diagram() -> str:
    source_svg = (SOURCE_ASSETS / "Composite Diagram for Animation.svg").read_text(
        encoding="utf-8"
    )
    regular = base64.b64encode(
        (FONT_ROOT / "Inter_18pt-Regular.ttf").read_bytes()
    ).decode("ascii")
    bold = base64.b64encode((FONT_ROOT / "Inter_18pt-Bold.ttf").read_bytes()).decode(
        "ascii"
    )
    font_css = f"""
  <rect x="0" y="0" width="2592" height="1512" fill="#ffffff" />
  <style>
    @font-face {{
      font-family: 'Inter Diagram';
      src: url(data:font/ttf;base64,{regular}) format('truetype');
      font-style: normal;
      font-weight: 400;
    }}
    @font-face {{
      font-family: 'Inter Diagram';
      src: url(data:font/ttf;base64,{bold}) format('truetype');
      font-style: normal;
      font-weight: 700;
    }}
  </style>"""
    updated_svg = source_svg.replace(
        "font-family=\"Arial Narrow\"", "font-family=\"Inter Diagram\""
    )
    opening_end = updated_svg.index(">", updated_svg.index("<svg")) + 1
    updated_svg = updated_svg[:opening_end] + font_css + updated_svg[opening_end:]
    payload = updated_svg.encode("utf-8")
    output_name = f"full-diagram-reference-inter-{short_digest(payload)}.svg"
    (PROJECT_ASSETS / output_name).write_bytes(payload)
    return output_name


print(f"housing_parti={build_housing_parti()}")
print(f"full_diagram={build_full_diagram()}")
