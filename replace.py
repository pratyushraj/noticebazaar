import os
import re

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if not file.endswith(('.ts', '.tsx', '.css', '.html', '.json', '.md')):
                continue
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Replace case variations
            content = content.replace("NoticeBazaar", "Creator Armour")
            content = content.replace("Noticebazaar", "Creator Armour")
            content = content.replace("noticebazaar", "creatorarmour")
            content = content.replace("NOTICEBAZAAR", "CREATOR ARMOUR")
            
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {filepath}")

process_directory('/Users/pratyushraj/Documents/noticebazaar/src')
process_directory('/Users/pratyushraj/Documents/noticebazaar/server')
