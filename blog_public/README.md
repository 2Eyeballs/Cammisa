# Cammisa Blog

A Jekyll blog for your writings and reflections.

## Setup

1. **Install Jekyll** (one-time setup):
```bash
gem install jekyll bundler
```

2. **Install dependencies**:
```bash
cd blog
bundle install
```

3. **Serve locally**:
```bash
bundle exec jekyll serve
```
Then visit `http://localhost:4000` in your browser.

## Creating Blog Posts

Add new files to the `_posts` folder with the naming format:
```
YEAR-MONTH-DAY-title.md
```

Example: `2026-02-23-my-first-post.md`

Start files with front matter:
```markdown
---
layout: post
title:  "My Post Title"
date:   2026-02-23 10:00:00 -0500
categories: writing
---

Your post content here...
```

## File Structure

```
blog/
├── _posts/          # Your blog posts
├── _layouts/        # Page templates
├── assets/          # CSS, JS, images
├── _config.yml      # Site configuration
├── Gemfile          # Ruby dependencies
├── index.md         # Blog home page
└── about.md         # About page
```

## Deployment

Push to GitHub and it will auto-build. Your blog will be at:
`https://yourusername.github.io/blog`

## Resources

- [Jekyll Docs](https://jekyllrb.com/docs/)
- [Markdown Guide](https://www.markdownguide.org/)
- [Jekyll Themes](https://jekyllthemes.io/)
