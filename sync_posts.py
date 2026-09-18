#!/usr/bin/env python3
"""
Fetch latest Substack posts and update posts.json
Run this locally on your Mac when you publish a new post
"""

import json
import re
import sys
import subprocess
from pathlib import Path
from xml.etree import ElementTree as ET

def fetch_substack_feed():
    """Fetch RSS feed from Substack using curl"""
    url = "https://cammisabuerhaus.substack.com/feed"
    
    print(f"📡 Fetching: {url}")
    
    try:
        result = subprocess.run([
            'curl', '-sS', '-L',
            '-H', 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            '-H', 'Accept: application/rss+xml, application/xml, text/xml',
            '-H', 'Accept-Language: en-US,en;q=0.9',
            '--connect-timeout', '15',
            '--max-time', '60',
            url
        ], capture_output=True, text=True, timeout=90)
        
        if result.returncode != 0:
            print(f"✗ Fetch failed: {result.stderr}")
            sys.exit(1)
        
        feed_data = result.stdout
        if not feed_data.strip():
            print("✗ Empty response from Substack")
            sys.exit(1)
        
        print(f"✓ Fetch succeeded")
        return feed_data
    except Exception as e:
        print(f"✗ Fetch failed: {e}")
        sys.exit(1)

def parse_rss(feed_data):
    """Parse RSS feed and extract posts"""
    # Strip illegal XML control chars
    feed_data = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', feed_data)
    
    try:
        root = ET.fromstring(feed_data)
    except ET.ParseError as e:
        print(f"✗ RSS parse error: {e}")
        sys.exit(1)
    
    ns = {'content': 'http://purl.org/rss/1.0/modules/content/'}
    items = root.findall('.//item')
    
    posts = []
    for item in items:
        title_elem = item.find('title')
        link_elem = item.find('link')
        pubdate_elem = item.find('pubDate')
        desc_elem = item.find('description')
        content_elem = item.find('content:encoded', ns)
        
        title = title_elem.text if title_elem is not None and title_elem.text else ''
        
        # Skip draft/copy posts
        if title.startswith('[COPY]'):
            continue
        
        posts.append({
            'title': title,
            'link': link_elem.text.strip() if link_elem is not None and link_elem.text else '',
            'pubDate': pubdate_elem.text if pubdate_elem is not None and pubdate_elem.text else '',
            'description': desc_elem.text if desc_elem is not None and desc_elem.text else '',
            'content': content_elem.text if content_elem is not None and content_elem.text else ''
        })
    
    return posts

def update_posts_json(posts):
    """Write posts to posts.json"""
    script_dir = Path(__file__).parent
    posts_file = script_dir / 'posts.json'
    
    if not posts:
        print("✗ No posts to write")
        sys.exit(1)
    
    payload = {'items': posts}
    
    try:
        with open(posts_file, 'w', encoding='utf-8') as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
            f.write('\n')
        print(f"✓ Updated posts.json with {len(posts)} post(s)")
        for i, post in enumerate(posts[:3], 1):
            print(f"  {i}. {post['title'][:70]}")
        return True
    except Exception as e:
        print(f"✗ Failed to write posts.json: {e}")
        sys.exit(1)

def main():
    print("\n🌐 Substack → posts.json Sync")
    print("=" * 50)
    
    # Fetch
    feed_data = fetch_substack_feed()
    
    # Parse
    print("📝 Parsing RSS feed...")
    posts = parse_rss(feed_data)
    print(f"✓ Found {len(posts)} post(s)")
    
    # Update
    print("💾 Writing to posts.json...")
    update_posts_json(posts)
    
    print("=" * 50)
    print("✅ Done! Run these commands to commit:")
    print("\n  cd /Users/cammisahome/Documents/GitHub/Cammisa")
    print("  git add posts.json")
    print("  git commit -m 'chore: sync latest Substack posts'")
    print("  git push origin main")
    print()

if __name__ == '__main__':
    main()
