# Front-end entry points

The site ships two public HTML documents:

- `index.html` renders the landing experience for Marxia Café y Bocaditos.
- `order.html` renders the interactive ordering and checkout view.

Both documents load the compiled `main.js`, which is generated from the modular sources under `src/js/` via `npm run build`. The controller auto-detects which view is active at runtime so we can share one bundle without breaking either page.

## Landing page (`index.html`)

`index.html` links to `order.html` through the hero call-to-action and reuses the language/theme toggles, floating action button menus, and carousel affordances exposed by the controller. Because the landing page does not host the `.order` section or cart summary markup, the bundle's cart routines no-op after the feature detection guards.

## Order page (`order.html`)

`order.html` renders the `.order` section, drawers, and cart summary/payment panels that the controller enhances. When the order view is open, the cart store drives totals, delivery ETA messaging, drawer management, and localization across the checkout UI.

## Build reminder

Edit the sources in `src/js/` and then run `npm run build` to regenerate `main.js` before committing. The generated bundle is checked in so the static HTML continues to work on hosts without a build pipeline.
