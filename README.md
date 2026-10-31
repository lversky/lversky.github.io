# LZVE.ly

Personal site for **LzvelySky**, designer, manufacturer, and coder — live at <https://lzve.living-the.life/>.

A single-page portfolio about code, hardware, accessibility, current interests, public GitHub work, and ways to get in touch.

## Stack

Plain HTML, CSS, and vanilla JavaScript. No build step or dependencies; GitHub Pages serves the repository as-is.

```
index.html          page content, metadata, and inline technical illustration
css/style.css       responsive editorial layout, themes, and print styles
js/main.js          theme toggle, mobile navigation, and live GitHub data
assets/favicon.svg  site favicon
roblox/             separate Roblox page
```

## Features

- Paper-and-ink visual system with a restrained accent palette and custom technical line illustration.
- Light, dark, and system color themes; the choice is stored in `localStorage`.
- Live public GitHub stats and selected repositories, cached for 15 minutes and with a graceful fallback if the API is unavailable.
- Responsive navigation, skip link, keyboard support, and reduced-motion handling.
- No frameworks, build tools, or package dependencies.

## Local preview

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

GitHub API requests use the public REST API over HTTPS.

## Deploying

Push to the `main` branch of `lversky/lversky.github.io`. GitHub Pages is configured to serve the repository root directly; `.nojekyll` is already committed.

## License

[BSD 3-Clause](LICENSE) © LZVE.ly
