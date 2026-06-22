import os
import re
import json

def parse_frontmatter(file_content):
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', file_content, re.DOTALL)
    if not match:
        return None
    
    yaml_text = match.group(1)
    metadata = {
        'title': '',
        'author': '',
        'date': '',
        'description': '',
        'categories': [],
        'image': ''
    }
    
    lines = yaml_text.split('\n')
    current_key = None
    
    for line in lines:
        if not line.strip():
            continue
        
        # Check if line is key: value
        m = re.match(r'^([a-zA-Z0-9_-]+)\s*:\s*(.*)$', line)
        if m:
            key = m.group(1)
            val = m.group(2).strip()
            
            # Remove quotes
            if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                val = val[1:-1]
            
            if key == 'categories':
                if val.startswith('[') and val.endswith(']'):
                    categories = [c.strip().strip('"').strip("'") for c in val[1:-1].split(',')]
                    metadata[key] = [c for c in categories if c]
                else:
                    metadata[key] = []
                current_key = key
            else:
                metadata[key] = val
                current_key = key
        else:
            # Check if it's a list item under categories
            if current_key == 'categories' and line.strip().startswith('-'):
                item = line.strip()[1:].strip().strip('"').strip("'")
                if item:
                    metadata['categories'].append(item)
            # Or description continuation
            elif current_key == 'description':
                val = line.strip()
                if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                    val = val[1:-1]
                metadata['description'] = (metadata['description'] + " " + val).strip()
                
    return metadata

def main():
    posts_dir = 'posts'
    if not os.path.exists(posts_dir):
        print(f"Directory {posts_dir} not found.")
        return
        
    posts = []
    for entry in os.listdir(posts_dir):
        entry_path = os.path.join(posts_dir, entry)
        if not os.path.isdir(entry_path):
            continue
            
        # Look for index.qmd or index.md
        post_file = None
        for filename in ['index.qmd', 'index.md']:
            path = os.path.join(entry_path, filename)
            if os.path.exists(path):
                post_file = path
                break
                
        if not post_file:
            continue
            
        try:
            with open(post_file, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"Error reading {post_file}: {e}")
            continue
            
        metadata = parse_frontmatter(content)
        if not metadata:
            continue
            
        # Skip drafts
        if metadata.get('draft') == 'true' or metadata.get('draft') is True:
            continue
            
        # Add post ID (directory name)
        metadata['id'] = entry
        
        # Correct image path if it exists
        image = metadata.get('image', '').strip()
        if image:
            # If it's a web URL, leave it. Otherwise prepend posts/{id}/
            if not (image.startswith('http://') or image.startswith('https://') or image.startswith('/')):
                metadata['image'] = f"posts/{entry}/{image}"
        else:
            # Fallback: scan for any image file in the post folder
            md_img_match = re.search(r'!\[.*?\]\((.*?)\)', content)
            if md_img_match:
                img_url = md_img_match.group(1).strip()
                if not (img_url.startswith('http://') or img_url.startswith('https://') or img_url.startswith('/')):
                    metadata['image'] = f"posts/{entry}/{img_url}"
            else:
                # Look for cover.jpg, cover.png, thumbnail.jpg etc in folder
                try:
                    for f_name in os.listdir(entry_path):
                        if f_name.lower() in ['cover.jpg', 'cover.png', 'thumbnail.jpg', 'thumbnail.png']:
                            metadata['image'] = f"posts/{entry}/{f_name}"
                            break
                except Exception:
                    pass
                        
        posts.append(metadata)
        
    # Sort posts by date desc
    def get_date(p):
        d = p.get('date', '')
        return d if d else '1970-01-01'
        
    posts.sort(key=get_date, reverse=True)
    
    # Write to posts.json
    with open('posts.json', 'w', encoding='utf-8') as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)
        
    print(f"Generated posts.json with {len(posts)} posts.")

if __name__ == '__main__':
    main()
