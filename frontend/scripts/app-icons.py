# Writes the app icons outside Android: the web app's (app-icons/) and, when given the iOS
# asset catalog, the iOS app icon and launch logo. They are drawn like the Android launcher
# icon: the 192 px ember emblem centred on #140F0D. Usage (Pillow):
#   python3 scripts/app-icons.py src/assets/ember-emblem.png app-icons ios/App/App/Assets.xcassets
import sys
from pathlib import Path
from PIL import Image
emblem_path, web_dir = sys.argv[1], Path(sys.argv[2])
ios_dir = Path(sys.argv[3]) if len(sys.argv) > 3 else None
BG = (20, 15, 13, 255)  # #140F0D, Android's ic_launcher_background
emblem = Image.open(emblem_path).convert("RGBA")
def icon(size, scale, opaque=True):
    canvas = Image.new("RGBA", (size, size), BG if opaque else (0, 0, 0, 0))
    side = round(size * scale)
    e = emblem.resize((side, side), Image.LANCZOS)
    canvas.alpha_composite(e, ((size - side) // 2, (size - side) // 2))
    return canvas.convert("RGB") if opaque else canvas
web_dir.mkdir(parents=True, exist_ok=True)
icon(192, 0.8).save(web_dir / "icon-192.png", optimize=True)
icon(512, 0.8).save(web_dir / "icon-512.png", optimize=True)
icon(512, 0.6).save(web_dir / "icon-maskable-512.png", optimize=True)  # inside the 80% safe zone
icon(180, 0.8).save(web_dir / "apple-touch-icon.png", optimize=True)
if ios_dir:
    icon(1024, 0.72).save(ios_dir / "AppIcon.appiconset/AppIcon-1024.png", optimize=True)
    icon(480, 1.0, opaque=False).save(ios_dir / "Splash.imageset/splash-logo@3x.png", optimize=True)
