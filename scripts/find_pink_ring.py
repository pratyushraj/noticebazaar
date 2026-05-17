from PIL import Image
import os

img_path = '/Users/pratyushraj/.gemini/antigravity/brain/569fce44-9ccf-44a2-8b2b-9a9b01f1e4ab/.tempmediaStorage/media_569fce44-9ccf-44a2-8b2b-9a9b01f1e4ab_1779027765615.png'
if not os.path.exists(img_path):
    img_path = '/Users/pratyushraj/.gemini/antigravity/brain/569fce44-9ccf-44a2-8b2b-9a9b01f1e4ab/.tempmediaStorage/media_569fce44-9ccf-44a2-8b2b-9a9b01f1e4ab_1779027768297.png'

if os.path.exists(img_path):
    img = Image.open(img_path)
    rgb_img = img.convert('RGB')
    
    pink_pixels = []
    
    # Scan top-half where profile pic should be
    for y in range(0, img.height // 2):
        for x in range(0, img.width // 2):
            r, g, b = rgb_img.getpixel((x, y))
            # Instagram story pink ring check: high red, low green, high blue
            if r > 180 and g < 100 and b > 100:
                pink_pixels.append((x, y))
                
    if pink_pixels:
        min_x = min(p[0] for p in pink_pixels)
        max_x = max(p[0] for p in pink_pixels)
        min_y = min(p[1] for p in pink_pixels)
        max_y = max(p[1] for p in pink_pixels)
        
        print(f"🎉 Pink Story Ring detected!")
        print(f"X range: {min_x} to {max_x} (Width: {max_x - min_x})")
        print(f"Y range: {min_y} to {max_y} (Height: {max_y - min_y})")
    else:
        print("❌ Could not find pink story ring pixels")
else:
    print("❌ Image not found")
