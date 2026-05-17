from PIL import Image
import os

img_path = '/Users/pratyushraj/.gemini/antigravity/brain/569fce44-9ccf-44a2-8b2b-9a9b01f1e4ab/media__1779041467617.png'
output_path = '/Users/pratyushraj/.gemini/antigravity/scratch/creatorarmour/public/creator-assets/prateek_avatar_cropped.jpg'

os.makedirs(os.path.dirname(output_path), exist_ok=True)

if os.path.exists(img_path):
    img = Image.open(img_path)
    
    # 767x1024 image
    # Let's crop it to a perfect 767x767 square.
    # To center on the face, let's offset the crop slightly higher to get the head perfectly framed.
    # From y=60 to y=827 is 767 pixels high. This will frame the head and upper jacket perfectly!
    left = 0
    top = 60
    right = 767
    bottom = 827
    
    # Crop
    cropped_img = img.crop((left, top, right, bottom))
    
    # Convert RGBA to RGB (for JPEG saving)
    if cropped_img.mode in ('RGBA', 'LA') or (cropped_img.mode == 'P' and 'transparency' in cropped_img.info):
        background = Image.new("RGB", cropped_img.size, (255, 255, 255))
        background.paste(cropped_img, mask=cropped_img.split()[3]) # 3 is the alpha channel
        cropped_img = background
    
    # Save optimized JPEG
    cropped_img.save(output_path, "JPEG", quality=90)
    print(f"✅ Perfectly square cropped avatar saved to {output_path}!")
else:
    print(f"❌ Error: Image not found at {img_path}")
