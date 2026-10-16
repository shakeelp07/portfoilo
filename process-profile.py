"""Process HCL_imag-1mb.jpg into profile, favicon, and PWA icon assets."""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
SRC_NAMES = ("HCL_imag-1mb.jpg", "HCL_imag-1mb.JPG", "HCL_imag-1mb.jpeg")
OUT_DIR = ROOT / "images"
PROFILE_SIZE = 640
JPEG_QUALITY = 85
WEBP_QUALITY = 82
MAX_BYTES = 200 * 1024


def find_source() -> Path | None:
    for name in SRC_NAMES:
        path = ROOT / name
        if path.is_file():
            return path
    fallback = OUT_DIR / "profile.jpg"
    if fallback.is_file():
        return fallback
    return None


def square_crop_face(img: Image.Image) -> Image.Image:
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = max(0, int((h - side) * 0.12))
    if top + side > h:
        top = h - side
    return img.crop((left, top, left + side, top + side))


def circular_mask(size: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size - 1, size - 1), fill=255)
    return mask


def save_jpeg_under_limit(img: Image.Image, dest: Path) -> None:
    quality = JPEG_QUALITY
    while quality >= 55:
        img.save(dest, "JPEG", quality=quality, optimize=True, progressive=True)
        if dest.stat().st_size <= MAX_BYTES:
            return
        quality -= 5
    smaller = img.resize((int(img.width * 0.85), int(img.height * 0.85)), Image.Resampling.LANCZOS)
    smaller.save(dest, "JPEG", quality=72, optimize=True, progressive=True)


def write_circle_png(img: Image.Image, size: int, dest: Path) -> None:
    square = img.resize((size, size), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(square, (0, 0), circular_mask(size))
    out.save(dest, "PNG", optimize=True)


def main() -> None:
    src = find_source()
    if not src:
        raise SystemExit(
            "Place HCL_imag-1mb.jpg in the project root, then run: python process-profile.py"
        )

    OUT_DIR.mkdir(exist_ok=True)
    img = Image.open(src).convert("RGB")
    square = square_crop_face(img)
    profile = square.resize((PROFILE_SIZE, PROFILE_SIZE), Image.Resampling.LANCZOS)

    jpg_path = OUT_DIR / "profile.jpg"
    webp_path = OUT_DIR / "profile.webp"
    save_jpeg_under_limit(profile, jpg_path)
    profile.save(webp_path, "WEBP", quality=WEBP_QUALITY, method=6)

    write_circle_png(profile, 32, OUT_DIR / "favicon-32.png")
    write_circle_png(profile, 192, OUT_DIR / "icon-192.png")
    write_circle_png(profile, 512, OUT_DIR / "icon-512.png")

    print(f"Wrote {jpg_path} ({jpg_path.stat().st_size // 1024} KB)")
    print(f"Wrote {webp_path} ({webp_path.stat().st_size // 1024} KB)")
    print("Wrote favicon-32.png, icon-192.png, icon-512.png")


if __name__ == "__main__":
    main()
