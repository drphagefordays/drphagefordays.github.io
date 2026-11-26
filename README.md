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

## Publications update (monthly)
The Publications list is rebuilt automatically on the 1st of each month by `.github/workflows/update-publications.yml`,
which runs `scripts/update_publications.py`. It reads the public ORCID record, fetches each paper's details from Crossref
and rewrites the list in `index.html` (between the `pubs:start` / `pubs:end` markers). It commits only if something changed.

- **Add a paper:** make sure it is on your ORCID record; it appears after the next run (or run the workflow by hand from the Actions tab).
- **Entries ORCID cannot describe** (thesis details, work in preparation) and **hidden papers** live in `data/publications_manual.json`.
  An entry there replaces any ORCID work with the same title; add a DOI to `exclude_dois` to hide a paper.
- **Run locally:** `python scripts/update_publications.py` (Python 3, no extra packages).
- If a run fails (ORCID or Crossref unreachable) it stops without touching the page, and GitHub emails a failure notice.
