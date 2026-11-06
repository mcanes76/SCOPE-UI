# SCOPE Electric Glass and regional Earth

Open [scope-integrated-electric-glass.html](../mockups/scope-integrated-electric-glass.html) directly in a modern browser. All nodes, links, groups, alignment values and commands are **SIMULATION / DEMONSTRATION ONLY**. Earlier mockups and architecture documents are unchanged.

## Visual layer and semantic controls

Electric Glass adds opaque navy fallbacks, layered reflections, cool edges, recessed workspaces and soft elevation. Browsers supporting backdrop blur use 14px panel/header blur and 10px raised-card blur. Text remains on dark, substantially opaque fills; no heavy glass is placed over the geographic display.

| Action | Fill | Foreground |
| --- | --- | --- |
| Enable / Join | `#00D96C` | `#052415` |
| Leave / Disable | `#D91F35` | White |
| Warning | `#FFD000` | `#2B2300` |
| Read / Refresh | `#00BFFF` | `#052139` |
| Edit / Update / Create | `#7040D9` | White |
| Neutral / Cancel | `#263A50` | `#E8F2FF` |

The requested red `#F23545` and violet `#8B5CF6` remain reference tokens. White-label action fills are darkened to preserve contrast. Action semantics override all four material looks. Disabled actions replace their semantic fill with opaque gray, a dashed edge and a subtle hatch. Focus, press, selection, loading and outcome text remain distinct. Non-destructive selection uses cyan, never red.

Sensor alignment status derives from **synthetic** thresholds: absolute azimuth ≤2°, elevation ≤1°, and roll ≤1°. Sensor 1 initially passes; Sensors 2 and 3 initially show saturated yellow **Out of Alignment / Adjustment Required**. Legal edit ranges are separate, unchanged demonstration limits. Validation failure is red and explicitly says values were not applied. These are not real sensor tolerances or calibration algorithms.

## Regional inventory and independent connectivity

Ten fictional nodes use one-decimal approximate coordinates spanning 26.8–34.0°N and 92.4–78.9°W. Labels such as West Gulf A, Inland East and Gulf Offshore B are fictional reference names, not installations or infrastructure. There is no claim of RF range, line of sight, communications feasibility or operational routing.

- `DemoNodeStore` supplies node identities and locations through read-only snapshots.
- `DemoBLOSConnectivityStore` supplies eleven sparse links for BLOS topology and the optional overlay.
- `DemoDisplayConnectivityStore` supplies nine links for Display. It is a separate graph with its own edge list.
- Multicast create/join/leave operations change neither link graph.

The models contain small clusters and a few regional interconnections. Display links use green/yellow/red health semantics. The optional BLOS layer uses **dashed violet** with an explicit legend, so its line color identifies its model rather than implying link health. BLOS's own topology retains its status colors. Selecting a node highlights only edges incident to that node and dims unrelated edges. Dark casing on selected connections separates crossings. Labels can be hidden independently in each view.

## Earth renderer and camera

The Earth is now a **textured perspective 3D sphere**, rendered locally with Canvas 2D ray–sphere intersection and equirectangular texture sampling. A depth-matched SVG overlay provides keyboard-accessible node selection and projected great-circle links. This replaces the earlier illustrative orthographic SVG base only in the new file; it does not add a runtime library or map service.

Initial camera and **Reset to Network**: longitude −86.4°, latitude 30.2°, zoom 7×. **Full Earth** restores zoom 1× with the same regional orientation. Rotate, tilt and zoom remain available; **Center selected** is separate from selecting a node, so connection inspection does not unexpectedly move the map. Cameras, selected nodes, labels and overlays remain independent between panels. The same projection/viewBox is used in single, split and separate-window hosts; narrow displays scale the view rather than changing its geographic framing.

The renderer uses a spherical Earth rather than a terrain/ellipsoid engine. Lighting is illustrative and camera-relative, not current sunlight. Texture sampling is bilinear and capped at 4096×2048, the raster adapts up to 1000 pixels wide, an eight-frame raster cache avoids repeated work, and rendering occurs on interaction rather than a continuous animation loop. If Canvas/image decoding fails, an explicit message identifies the shaded-sphere or vector-only fallback. Pop-up behavior remains subject to browser permissions.

## Embedded image attribution

**Earth Day Map — Solar System Scope / INOVE**, [texture source and attribution](https://www.solarsystemscope.com/textures/), distributed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/). The source [8K Earth Day Map JPEG](https://www.solarsystemscope.com/textures/download/8k_earth_daymap.jpg) is embedded in the HTML. Adaptations: downsampling to a 4096×2048 sampling grid, perspective reprojection, local lighting/shading and independent fictional network overlays. No endorsement is implied. This geographic texture is not live satellite imagery.

The self-contained HTML is larger because it embeds the licensed Earth image. No image, JavaScript, stylesheet or API is fetched at runtime. Attribution links are optional outbound links only.

## Style guides and validation

All 80 shell/look/coverage guide exports are preserved. Every guide includes an Electric Glass definition with filled semantic specimens, disabled/loading/outcome references, glass properties, alignment thresholds and regional-model conventions. The Display and Calibration application guides describe the new implementation. Export remains browser-native Save as PDF for the selected guide only.

Run `node docs/assets/validate-electric-glass.cjs`. Executed checks passed for existing group, sensor, Native LOS and panel interactions; independent link models; regional camera reset; initial node visibility; projection/inverse-projection round-trips; semantic classes; yellow alignment presentation; 208 generated view cases; and 80 concept-specific print fragments. Sampled semantic-button foreground contrast, including the brightest gradient stop and hover fills, had a minimum ratio of **4.56:1**. This is a token calculation, not a complete rendered-accessibility assessment.

The actual renderer's pixel routine also generated regional and full-Earth raster samples for inspection; these confirmed recognizable Gulf/coastline framing and a textured full sphere. This is separate from browser UI testing. Browser surfaces were unavailable, so actual browser compositing, image-load lifecycle, native keyboard/focus, side-by-side fit, pop-up placement, screen-reader output and PDF pagination remain unverified. Review these on the intended blue-lit console. No production backend, hardware or operational function was introduced; no commit or push was performed.
