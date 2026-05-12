# Knight Spiral Game

Starter simulation for OEIS A392177/A392178.

The OEIS reference game has two players, Black and Red. Each player scans the
square spiral from its own current position and places a knight on the smallest
unoccupied cell that is not attacked by an opposing knight.

## Browser Visualization

Open `index.html` in a browser to change the number of placements and inspect
the board. The canvas supports drag-to-pan, wheel/trackpad zoom, double-click
zoom, and touch pinch zoom. Type any nonnegative placement count into the
number field; the slider expands when you go past its current range, so large
runs such as 2,000,000 placements are entered directly.

The browser app has a fairy-piece palette using supported leapers and riders
from Wikipedia's list at `https://en.wikipedia.org/wiki/List_of_fairy_chess_pieces`.
Drag palette cards into the cycle queue, use the add button, reorder queued
cards, or remove cards. The queue is the player list: 2-5 cards are required,
duplicates are allowed, and order matters. The default queue is `Knight,
Knight`, matching the OEIS two-player reference game.

Long simulations run in `simulation-worker.js` when available, with a chunked
main-thread fallback. The renderer indexes occupied tiles and draws only the
visible part of the board while panning and zooming. Rider-piece queues are
capped at 25,000 placements so expensive experiments cannot lock up a visitor's
browser tab.

## Static Deployment

This app does not need Heroku or any backend server. Deploy the repository
folder as static files with `index.html` as the entry point and no build
command. Cloudflare Pages, GitHub Pages, Netlify, Vercel, or S3/CloudFront can
serve the app directly.

Required public files are:

- `index.html`
- `styles.css`
- `app.js`
- `simulation-worker.js`

### Cloudflare Pages

Recommended Git-connected deployment:

1. Put this folder in a GitHub or GitLab repository. If this folder is the whole
   repository, keep `index.html` at the repository root.
2. In Cloudflare, go to **Workers & Pages**.
3. Select **Create application**.
4. Select the **Pages** tab.
5. Select **Import an existing Git repository**.
6. Pick the repository and select **Begin setup**.
7. Use these build settings:
   - Framework preset: `None`
   - Production branch: `main`
   - Build command: `exit 0`
   - Build output directory: `/`
   - Root directory: leave blank unless this project lives inside a larger
     repository; in that case set it to this folder path, such as
     `knights_games`.
8. Select **Save and Deploy**. The site will be available at
   `<project-name>.pages.dev`.

For a one-off manual deploy, use Cloudflare Pages Direct Upload instead:

1. In Cloudflare, go to **Workers & Pages**.
2. Select **Create application**.
3. Select **Get started** under drag-and-drop upload.
4. Upload this folder, or a zip containing the required public files above.
5. Select **Deploy site**.

Use Git-connected deployment if you want Cloudflare to redeploy automatically
on every push. Use Direct Upload only for a quick manual launch; Direct Upload
projects cannot be converted to Git-connected projects later, so you would
create a new Pages project if you want automatic deployments.

If you prefer a local URL:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Run the correctness check against the published OEIS prefixes:

```sh
python3 knights.py --check --no-board --terms 0
```

Print the first Black terms and render the first 288 spiral cells:

```sh
python3 knights.py --terms 75 --cells 288
```

Show placement order instead of only the final sequence order:

```sh
python3 knights.py --placements 20 --terms 0 --no-board
```

## Changing Rules

Rules live in `PlayerRule` in `knights.py`.

To add more colors, pass more players into `KnightSpiralGame`:

```python
game = KnightSpiralGame(
    (
        PlayerRule("Black", "B"),
        PlayerRule("Red", "R"),
        PlayerRule("Blue", "U"),
    )
)
```

To change how a color attacks, change `attack_offsets`. To change which colors
block a color's placement, set `blocked_by`; the default is every other color.
