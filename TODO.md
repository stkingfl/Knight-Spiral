# TODO

## Cloudflare Pages Launch

- [ ] Push the latest `main` branch to GitHub.
- [ ] In Cloudflare, go to **Workers & Pages**.
- [ ] Create a Pages app from the GitHub repository.
- [ ] Use build settings:
  - Framework preset: `None`
  - Production branch: `main`
  - Build command: `exit 0`
  - Build output directory: `/`
  - Root directory: blank, unless this project is inside a larger repository.
- [ ] Deploy and open the generated `<project-name>.pages.dev` URL.
- [ ] Verify `index.html`, `styles.css`, `app.js`, and `simulation-worker.js` load successfully.
- [ ] Smoke test default knight runs at 2,500 and 10,000 placements.
- [ ] Smoke test a rider-piece queue and confirm the 25,000 placement cap appears.
- [ ] Add a custom domain in **Pages > Custom domains** if needed.
