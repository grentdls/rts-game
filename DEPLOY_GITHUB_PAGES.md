# GitHub Pages Deployment

## One-Time Setup

1. Create a new GitHub repository.
2. Push this local project to the repository.
3. Open the repository on GitHub.
4. Go to `Settings` -> `Pages`.
5. Under `Build and deployment`, choose:
   - Source: `Deploy from a branch`
   - Branch: `gh-pages`
   - Folder: `/ (root)`
6. Save.

GitHub will generate a website URL like:

```text
https://YOUR_NAME.github.io/YOUR_REPOSITORY/
```

## Push With The Helper Script

After creating an empty GitHub repository, copy its HTTPS URL and run:

```powershell
.\publish-github-pages.ps1 "https://github.com/YOUR_NAME/YOUR_REPOSITORY.git"
```

## Update The Website Later

After editing the game:

```powershell
git add index.html styles.css game.js README.md DEPLOY_GITHUB_PAGES.md publish-github-pages.ps1 .gitignore .nojekyll
git commit -m "Update game"
.\publish-github-pages.ps1 "https://github.com/YOUR_NAME/YOUR_REPOSITORY.git"
```

The helper script pushes the source branch `main` and updates the playable website branch `gh-pages`.
