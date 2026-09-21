"""Учебная проверка изображения по доле красных пикселей."""

import argparse
import sys

from PIL import Image, UnidentifiedImageError


def classify(image):
    # Прозрачность отображаем на белом фоне: скрытый красный не считается.
    rgba = image.convert("RGBA")
    background = Image.new("RGBA", rgba.size, "white")
    rgb = Image.alpha_composite(background, rgba).convert("RGB")
    red_count = sum(
        1 for r, g, b in rgb.get_flattened_data()
        if r >= 150 and r >= g * 1.5 and r >= b * 1.5
    )
    return "DEFECT" if red_count / (rgb.width * rgb.height) >= 0.20 else "OK"


def main():
    parser = argparse.ArgumentParser(description="Проверить изображение: OK или DEFECT.")
    parser.add_argument("image", help="Путь к изображению (PNG, JPEG и др.)")
    args = parser.parse_args()
    try:
        with Image.open(args.image) as image:
            result = classify(image)
    except (OSError, UnidentifiedImageError, Image.DecompressionBombError) as error:
        print(f"Не удалось прочитать изображение: {error}", file=sys.stderr)
        return 1
    print(result)
    return 0


if __name__ == "__main__":
    sys.exit(main())
