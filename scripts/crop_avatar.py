from PIL import Image, ImageOps
import os

img_path = '/Users/pratyushraj/.gemini/antigravity/brain/569fce44-9ccf-44a2-8b2b-9a9b01f1e4ab/.tempmediaStorage/media_569fce44-9ccf-44a2-8b2b-9a9b01f1e4ab_1779027765615.png'
if not os.path.exists(img_path):
    img_path = '/Users/pratyushraj/.gemini/antigravity/brain/569fce44-9ccf-44a2-8b2b-9a9b01f1e4ab/.tempmediaStorage/media_569fce44-9ccf-44a2-8b2b-9a9b01f1e4ab_1779027768297.png'

if os.path.exists(img_path):
    img = Image.open(img_path)
    # The avatar circle is located around the top left:
    # Based on 711x1024, let's crop:
    left = 105
    top = 75
    right = 255
    bottom = 225
    
    avatar_crop = img.crop((left, top, right, bottom))
    output_dir = '/Users/pratyushraj/.gemini/antigravity/scratch/creatorarmour/public/creator-assets'
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, 'simba_avatar.png')
    avatar_crop.save(output_path)
    print(f"✅ Simba avatar cropped and saved to {output_path}")
else:
    print("❌ Screenshot image not found")
