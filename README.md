# 2D RTS Browser Game

This repository contains a static browser RTS game. It can be hosted directly with GitHub Pages because it only needs HTML, CSS, and JavaScript.

## Play Locally

```powershell
python -m http.server 5173
```

Then open:

```text
http://127.0.0.1:5173/
```

## GitHub Pages

Use GitHub Pages with the `main` branch and the repository root as the publish source.

After creating an empty GitHub repository, this helper script can push the project:

```powershell
.\publish-github-pages.ps1 "https://github.com/YOUR_NAME/YOUR_REPOSITORY.git"
```

The playable files are:

- `index.html`
- `styles.css`
- `game.js`

The local `Docs/` folder is ignored on purpose because it contains design documents and is not required to run the website.
