from PIL import Image
import os

img_path = '/Users/pratyushraj/.gemini/antigravity/brain/569fce44-9ccf-44a2-8b2b-9a9b01f1e4ab/.tempmediaStorage/media_569fce44-9ccf-44a2-8b2b-9a9b01f1e4ab_1779027765615.png'
if not os.path.exists(img_path):
    # Try the other temp media
    img_path = '/Users/pratyushraj/.gemini/antigravity/brain/569fce44-9ccf-44a2-8b2b-9a9b01f1e4ab/.tempmediaStorage/media_569fce44-9ccf-44a2-8b2b-9a9b01f1e4ab_1779027768297.png'

if os.path.exists(img_path):
    img = Image.open(img_path)
    print(f"Image dimensions: {img.width}x{img.height}")
else:
    print("Error: Image path not found")
