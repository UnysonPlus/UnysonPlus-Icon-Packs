# UnysonPlus Icon Packs

The on-demand SVG icon-pack catalog for the **UnysonPlus** plugin's icon picker
(icon-v3). The plugin bundles only Lucide + Tabler and downloads any other pack
from here on demand into `wp-content/uploads/unysonplus-icon-packs/`, so a site
carries only the icon sets it uses and the plugin stays small.

## Layout

```
catalog.json                       # list of installable packs (title, slug, svg_open, count)
packs/<slug>/<slug>-icons.json     # { name => inner-svg markup }
packs/<slug>/<slug>-search.json    # { name => space-joined keywords }
build/build-packs.mjs              # regenerates packs/ + catalog.json from upstream sets
```

The plugin fetches `catalog.json` from the repo root (raw GitHub), then per pack
pulls `packs/<slug>/<slug>-icons.json` + `-search.json`. Every `svg_open` uses
`currentColor`, so icons recolour with the element.

## Current packs

| Slug | Title | Icons |
|---|---|---|
| feather | Feather | 287 |
| heroicons-outline | Heroicons (Outline) | 324 |
| heroicons-solid | Heroicons (Solid) | 324 |
| bootstrap | Bootstrap Icons | 2078 |
| phosphor | Phosphor | 1512 |

## Regenerate

```
cd build
npm install
node build-packs.mjs   # rewrites ../packs/** and ../catalog.json
```

Add a pack by installing its npm source and appending an entry to the `PACKS`
array in `build/build-packs.mjs` (source dir + a `currentColor` `svg_open`).

## License

Each icon set keeps its upstream license (Feather MIT, Heroicons MIT, Bootstrap
Icons MIT, Phosphor MIT). See each project for details.
