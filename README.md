# David R. Parker — personal website

Static site: `index.html`, `styles.css`, `main.js`. No build step; open `index.html` in a browser.

## Updating content
- **Text, publications, timeline:** edit `index.html` (each section is labelled by its `id`).
- **Colours and spacing:** the design tokens are at the top of `styles.css` (`:root` for light, `[data-theme="dark"]` for dark).
- **Headshot:** put a square photo at `images/headshot.jpg` and swap the `monogram` block in the hero for the `<img>` shown in the comment there.
- **Hobby photos:** add `<img src="images/….jpg" alt="…" loading="lazy">` as the first child of a `.hobby` card; the icon stays as a fallback.

## Features
Light/dark theme (follows the OS, remembered), glass header, animated aurora and network hero, scroll-driven reveals and progress bar, spotlight bento cards, publication filter. All motion is disabled under `prefers-reduced-motion`.

## Hosting
Any static host works, e.g. GitHub Pages: push these files to a repository and enable Pages on the main branch.
