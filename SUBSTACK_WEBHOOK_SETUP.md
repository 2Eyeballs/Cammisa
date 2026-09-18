# Substack Webhook Setup Guide

This guide shows how to automatically sync your latest Substack posts to your blog using Zapier.

## How It Works

```
You publish on Substack 
    ↓
Zapier detects new post
    ↓
Zapier triggers GitHub webhook
    ↓
GitHub Actions fetches & updates posts.json
    ↓
Blog shows post (instant, no cache lag!)
```

## Setup Steps

### 1. Push the webhook workflow to GitHub

```bash
cd ~/Documents/GitHub/Cammisa
git add .github/workflows/sync-substack-webhook.yml
git commit -m "add: Substack webhook sync workflow"
git push origin main
```

### 2. Create a GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. **Name:** `Substack Webhook Sync`
4. **Expiration:** No expiration (or 1 year, your choice)
5. **Scopes:** Check only `repo` (full control of private repositories)
6. Click "Generate token"
7. **Copy the token immediately** (you won't see it again!)

### 3. Set Up Zapier

1. Go to: https://zapier.com/sign-up (create free account if needed)
2. Click "Make a Zap" (top left)
3. **Trigger Setup:**
   - Search for "Substack"
   - Select "Substack" → "New Post in Publication"
   - Click "Continue"
   - Connect your Substack account (authorize)
   - Select your publication: **Cammisa Buerhaus**
   - Click "Continue"

4. **Action Setup:**
   - Search for "GitHub"
   - Select "GitHub" → "Create an Issue" (we'll use this to trigger webhook)
   - Actually, better: Search for "Webhooks" → "Webhooks by Zapier"
   - Select "Webhooks by Zapier" → "POST"
   - Click "Continue"

5. **Webhook Configuration:**
   - **URL:** (copy this exactly)
     ```
     https://api.github.com/repos/2Eyeballs/Cammisa/dispatches
     ```
   - **Method:** POST
   - **Headers:** Add these two:
     - `Authorization`: `token YOUR_GITHUB_TOKEN_HERE`
     - `Accept`: `application/vnd.github.v3+raw+json`
   
   - **Data:**
     ```json
     {
       "event_type": "substack_post_published",
       "client_payload": {
         "title": "{{title}}",
         "post_url": "{{post_url}}"
       }
     }
     ```

6. **Test & Publish:**
   - Click "Send" to test
   - You should see GitHub trigger the workflow
   - Click "Publish" to activate the Zap

### 4. Verify It Works

1. Go to GitHub: https://github.com/2Eyeballs/Cammisa/actions
2. Publish a test post on Substack
3. Watch for a new workflow run named "Sync Substack Posts (Webhook)"
4. Check your blog to see the new post appear!

## Troubleshooting

**Webhook not triggering?**
- Check Zapier's "Task History" (Zap dashboard) for errors
- Verify your GitHub token is correct
- Check GitHub Actions logs for failed runs

**Posts not updating?**
- Verify posts.json was committed to your repo
- Check that the webhook workflow ran successfully

## Alternative: Keep Both Methods

You can keep the scheduled `fetch-posts.yml` AND the webhook sync:
- Webhook syncs instantly when you publish
- Scheduled job syncs periodically as a backup
- Best of both worlds!

To do this: Leave both workflows enabled and they'll work together.
