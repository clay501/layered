# Layered Health (v3: video hero)

A fuller home page: moving hero layers, a story told section by section, a sticky header with About and Contact Clay buttons, a looping video in the Why section, and sections that stack like sheets.


Website for Layered Health Psychotherapy, a sister identity to Seen/Unfold. Built in the Layered Health brand: warm limestone ground, stacked borderless layers, Unbounded Black headlines and Inter.

## Files

- `index.html`: home ("Self-Discovery / Layer by Layer" with the colored layers)
- `about.html`: intro and "Meet Clay Klaus-Wade"
- `blog/what-is-psychodynamic-therapy/index.html`: first blog post, linked from the footer (head tags and JSON-LD inline)
- `sitemap.xml`: site URLs for search engines
- `main.js`: scroll reveals, hero layer drift, sticky header state, video play/pause (all respect reduced motion)
- `styles.css`: shared styles; brand colors live at the top as CSS variables
- `assets/`: `layered-health-lockup.svg` (the outlined brand lockup used in the header and footer), logo mark, headshot, Psychology Today icon

Plain static HTML and CSS, no build step. Deploy the repo root to Cloudflare Pages, Netlify, Vercel or GitHub Pages.
