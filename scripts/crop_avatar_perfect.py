from PIL import Image
import os

img_path = '/Users/pratyushraj/.gemini/antigravity/brain/569fce44-9ccf-44a2-8b2b-9a9b01f1e4ab/.tempmediaStorage/media_569fce44-9ccf-44a2-8b2b-9a9b01f1e4ab_1779027765615.png'
if not os.path.exists(img_path):
    img_path = '/Users/pratyushraj/.gemini/antigravity/brain/569fce44-9ccf-44a2-8b2b-9a9b01f1e4ab/.tempmediaStorage/media_569fce44-9ccf-44a2-8b2b-9a9b01f1e4ab_1779027768297.png'

if os.path.exists(img_path):
    img = Image.open(img_path)
    
    # Crop precisely inside the pink story ring
    # Ring bounds are X: 83 to 354, Y: 58 to 314
    # Let's crop slightly inside the ring for a perfect image of the dog!
    left = 103
    top = 78
    right = 334
    bottom = 294
    
    avatar_crop = img.crop((left, top, right, bottom))
    output_path = '/Users/pratyushraj/.gemini/antigravity/scratch/creatorarmour/public/creator-assets/simba_avatar.png'
    
    avatar_crop.save(output_path)
    print(f"✅ Pixel-perfect Simba avatar cropped and saved to {output_path}")
else:
    print("❌ Screenshot image not found")
