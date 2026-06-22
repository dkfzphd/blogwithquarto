
import os
import datetime
import re

def slugify(text):
    text = text.lower()
    return re.sub(r'[^a-z0-9]+', '-', text).strip('-')

def create_post():
    print("Creating a new blog post...")
    title = input("Enter post title: ")
    if not title:
        print("Title is required.")
        return

    slug = slugify(title)
    date = datetime.date.today().strftime("%Y-%m-%d")
    
    # Define post directory
    post_dir = os.path.join("posts", slug)
    
    # Check if directory exists
    if os.path.exists(post_dir):
        print(f"Error: Directory '{post_dir}' already exists.")
        return

    # Create directory
    os.makedirs(post_dir)
    print(f"Created directory: {post_dir}")

    # Define file content
    content = f"""---
title: "{title}"
author: "Te Guo"
date: "{date}"
categories: [news]
---

Write your content here...
"""

    # Write to file
    file_path = os.path.join(post_dir, "index.qmd")
    with open(file_path, "w") as f:
        f.write(content)

    print(f"Created new post at: {file_path}")
    print("\nNext steps:")
    print(f"1. Edit {file_path}")
    print("2. git add .")
    print("3. git commit -m 'New post: " + title + "'")
    print("4. git push")

if __name__ == "__main__":
    create_post()
