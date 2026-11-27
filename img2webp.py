from PIL import Image
import sys

Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2], "WEBP", quality=85)
