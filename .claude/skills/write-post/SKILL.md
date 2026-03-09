---
name: write-post
description: Write blog posts and research project pages for avivz.net. Use when the user asks to write, create, draft, or edit a blog post or project page, or says "new post", "new project", "blog post about...", or "project page for...".
---

# Skill: write-post

Write blog posts and research project pages for avivz.net, and preview them locally.

## Instructions

### Deciding post vs. project

- **Post** (`layout: post`): A blog-style note — time-stamped, narrative, appears in /notes/. For write-ups, opinions, tutorials, announcements.
- **Project** (`layout: project`): A project page — no date, appears in /projects/. For ongoing or completed research projects with collaborators, papers, and links.

Ask the user which type if ambiguous.

### Writing a blog post

1. Create the file at `_posts/YYYY-MM-DD-slug.md` where the date is today (or user-specified) and slug is a short kebab-case title.
2. Use this front matter template:

```yaml
---
layout: post
title: "Title"
subtitle: "Optional subtitle"
date: YYYY-MM-DD
authors:
  - name: Aviv Zohar
    url: https://www.avivz.net
tags: [tag1, tag2]
---
```

3. The first paragraph becomes the excerpt (shown on the blog index, truncated to 200 chars). Make it a strong hook.
4. Use `## Heading` for sections, `### Subheading` for subsections.
5. The site has MathJax: use `$...$` for inline math, `$$...$$` for display math.
6. For embedded YouTube videos use:

```html
<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:1.5em 0">
<iframe style="position:absolute;top:0;left:0;width:100%;height:100%" src="https://www.youtube.com/embed/VIDEO_ID" style="border:0" allowfullscreen></iframe>
</div>
```

7. For images, place them in `images/` and reference as `![alt](/images/filename.png)`.
8. Keep the writing style academic but accessible — this is a professor's research blog.

### Writing a project page

1. Ensure the `_projects/` directory exists. If not, create it.
2. Ensure `_config.yml` has a `collections:` section with `projects: output: true`. If not, add it. The permalink should be `/projects/:title/`.
3. Create the file at `_projects/slug.md`.
4. Use this front matter template:

```yaml
---
layout: project
title: "Project Title"
subtitle: "Optional subtitle"
status: active
collaborators:
  - name: Collaborator Name
    url: https://example.com
tags: [blockchain, security]
papers:
  - title: "Paper Title"
    url: /pubs/YEAR/file.pdf
links:
  - title: "GitHub Repository"
    url: https://github.com/...
---
```

- `status`: "active" or "completed" (renders as a colored badge)
- `collaborators`, `papers`, `links` are all optional arrays
- `subtitle`, `status` are optional

5. Write a description of the project as the body. First paragraph becomes excerpt.

### Previewing locally

After writing or editing a post/project, **always** start a local Jekyll server so the user can preview:

1. Run `bundle exec jekyll serve` in the background (use `run_in_background: true`).
2. Tell the user the site is available at `http://localhost:4000`.
3. Provide the direct URL to the new content:
   - Posts: `http://localhost:4000/notes/YYYY/MM/DD/slug/`
   - Projects: `http://localhost:4000/projects/slug/`
   - Blog index: `http://localhost:4000/notes/`
   - Projects index: `http://localhost:4000/projects/`
4. Open the page for the user using: `cmd.exe /c start "" "http://localhost:4000/notes/YYYY/MM/DD/slug/"` (or the appropriate project URL).
5. If jekyll serve is already running (port 4000 in use), just tell the user to refresh — no need to restart unless `_config.yml` changed.

### Style guidelines

- Write in first person (the author is Prof. Aviv Zohar)
- Academic but conversational tone — like explaining to a smart colleague over coffee
- Use concrete examples and code snippets where relevant
- LaTeX-style section numbering is NOT used in posts (the layout handles headings)
- Keep paragraphs focused; use section breaks liberally
- Reference related papers or projects when relevant
