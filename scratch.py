from PIL import Image

def get_bbox(image_path):
    img = Image.open(image_path).convert("RGBA")
    bbox = img.getbbox()
    print(f"Original size: {img.size}")
    print(f"Bounding box: {bbox}")
    if bbox:
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        print(f"Content size: {w}x{h}")
        print(f"Top whitespace: {bbox[1]}")
        print(f"Bottom whitespace: {img.size[1] - bbox[3]}")

get_bbox('public/logo.png')
