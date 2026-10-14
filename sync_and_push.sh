#!/bin/bash
# Quick sync script: fetch Substack posts and auto-commit to GitHub

cd /Users/cammisahome/Documents/GitHub/Cammisa

echo "🔄 Syncing Substack posts..."
python3 sync_posts.py

if [ $? -ne 0 ]; then
    echo "❌ Sync failed!"
    exit 1
fi

echo ""
echo "📤 Committing to GitHub..."
git add posts.json
git commit -m "chore: sync latest Substack posts" || echo "ℹ️  No changes to commit"
git push origin main

echo "✅ All done! Blog updated."
