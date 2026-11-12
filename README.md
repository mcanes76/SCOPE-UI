# SCOPE-UI

Design exploration and target architecture for a unified SCOPE operator console. Twelve visual concepts compare how independently developed applications can share navigation, interaction conventions and a coherent operator experience while retaining their ownership and lifecycle.

The mockups use **simulated local data** and have no connection to operational systems. BLOS, Display, Sensor Calibration and Native LOS are abstract integration boundaries. The existing BLOS UI is not redesigned. This repository is not a production application or a phased implementation plan.

## SCOPE Design Studio

The latest extension adds Visual Family ? Palette ? Component customization, four families and 30 selectable palette IDs (DISCO derived from the supplied BLOS v11 visual reference). Actual application bodies and controls inherit the canonical theme. Advanced mode supports global/category/application/instance overrides, per-corner geometry, interaction states, Reset to Inherited Style, branding and logo import.

The operator toolbar is included in exported mockups: single/split switching, independent app selectors, keyboard/pointer divider resizing, focus/expand/restore and pop-out/return. Detached data models remain independent; only design updates are messaged. Export either a standalone HTML with explicit Parameters JSON/logo import and Save Updated Mockup, or a configurable folder ZIP with params.json and local logo assets. See [Visual systems, windowing and parameters](docs/SCOPE-Visual-Systems.html) and [params.example.json](design-studio/params.example.json). Run `node docs/assets/validate-visual-systems.cjs` for the new subsystem checks.

For customers, copy or extract [dist/SCOPE-Design-Studio.html](dist/SCOPE-Design-Studio.html) and double-click it in Edge or Chrome. The complete offline Studio embeds all scripts, styles, configuration, logos, Earth imagery and Help. It requires no server, installation, launcher, internet, extension or browser security changes. All four navigation modes, all 30 current presets/schemes, editing modes, history, candidates, comparison, notes and exports use the same source implementation.

Developers regenerate the customer edition with `node scripts/build-standalone.cjs` and validate it with `node docs/assets/validate-standalone.cjs`. Node is a build-time requirement only. Distribute the generated HTML alone; rebuild after changing source, presets, startup configuration or logo assets. Do not hand-edit the bundle. The offline adapter uses sandboxed `iframe.srcdoc`, embedded resource acquisition and authenticated frame messages; independent windows and downloads use local Blob URLs. The source edition remains below.

Open [Design Studio](design-studio/index.html) over local HTTP to run a 15-minute customer design workshop around the existing Electric Glass engine. Guided mode covers navigation, material, colors, typography, layout and final review. Advanced mode adds a selectable shell tree, live property inspector, bounded Command Deck rail resizing and preview scaling. Final presentation reveals the simulated applications and hides editor panels.

For development, run `python -m http.server 8080 --bind 127.0.0.1` from the repository root, then visit `http://127.0.0.1:8080/design-studio/`. No build or package installation is required for that edition. Serve the repository root; direct `file://` launch uses the generated customer HTML instead of this modular entry.

The new `design-studio/` directory separates shared state/schema and CSS compilation (`design-core.js`), workshop/editor (`studio.js`, `studio.css`, `index.html`), preview adapter (`preview-runtime.js`, `preview-bridge.js`), exports (`exports.js`), material defaults (`theme-presets.json`) and initial design (`design-config.json`). It reuses `mockups/params.json`, `styles.css` and logo assets. Rename applications/tab labels in `mockups/params.json`, keeping stable IDs; replace `mockups/assets/logo.png` or configure its relative `logoPath`. Missing logos fall back to the SVG crosshair and aspect ratios are preserved.

Undo/redo tracks design changes; application operations remain independent. Save/restore Baseline and Candidate A/B/C, compare two candidates, record workshop notes, and export/import versioned design JSON. Checkpoints are session-only: export JSON before reloading. Other downloads include shell CSS overrides, a printable HTML decision summary, and a standalone final HTML mockup with CSS, configuration, logos, application code and Earth texture embedded. Application data starts fresh in exported and comparison previews.

See the [complete Studio guide](design-studio/README.html) for the six-step workflow, editor ownership rules, configuration, exports, protocol, known limitations and future enhancements. Existing navigation rerenders retain model stores and per-slot view state, but transient focus/scroll/dialog state can reset when moving hosts. Appearance-only edits preserve application DOM. The Studio changes shell presentation; application internals remain protected. Current Chrome/Edge browser review remains necessary for native controls, layout, fullscreen and downloads when automation is unavailable.

Run `node docs/assets/validate-design-studio.cjs` for the Studio checks, alongside the existing mockup validators. No earlier exploration has been replaced.

The packaging validator audits all 120 shell/preset combinations, checks deterministic generation and embedded resources, and runs actual editor/preview handlers with network calls blocked in controlled fixtures. These tests are not browser rendering tests. No Edge/Chrome `file://` browser test was possible in the current environment; native layout, downloads, fullscreen, pop-ups and printing remain to be checked on the target workstation. See [Studio architecture](docs/SCOPE-Design-Studio-Architecture.html) and [Studio guide](design-studio/README.html) for runtime boundaries and distribution details.

## Existing demonstrators

For the customizable Electric Glass mockup, see [Customizing Electric Glass](#customizing-electric-glass) below. Keep its HTML, `styles.css`, `params.json`, and `assets/` together.

The newest [Electric Glass Integrated Demo](mockups/scope-integrated-electric-glass.html) preserves the four applications, shell concepts, looks, split views and PDF-exportable style guides while adding saturated semantic action buttons, dimensional glass surfaces and explicit alignment-status panels. Its textured perspective Earth starts on ten fictional southeastern US/Gulf nodes. **Reset to Network** restores the regional camera; **Full Earth** and rotation/zoom expose the entire globe. Display and BLOS use independent sparse graphs; an optional dashed-violet BLOS overlay has its own legend. See [Electric Glass Notes](docs/SCOPE-Demo-Notes.html#electric-glass) for assumptions, embedded-image attribution and verification limits. The licensed Earth texture remains embedded; the latest file uses sibling CSS, JSON and logo assets as described under Customizing Electric Glass below.

The Electric Glass demo also offers **Electric Glass – White Trim** in its visual style selector. This fifth look adds fine silver/white shell and panel edges, brighter active-pane trim and restrained upper-edge reflections while preserving colored operational buttons and dark application interiors. It works across all four shells, single/split layouts and separate windows. Its material definition is included in every applicable **Style Guide → Export Style Guide to PDF** export. The other four looks remain available.

In that demo, **Prism Glass** now uses cool white/silver frosted acrylic over the dark navy background, with low-opacity white overlays, reflections and backdrop blur. Application interiors remain dark, semantic controls retain their saturated colors, and the other material looks are unchanged. Prism's revised material definition is included in its style-guide PDF exports.

The newest [Integrated Application Demo](mockups/scope-integrated-demo.html) adds four separate simulated applications to the premium shell. Start with BLOS and Display side by side; select either panel's application independently, expand/restore a panel, or switch to single-application shell navigation. BLOS includes group/discovery/topology examples; Display provides a functional SVG globe; Calibration supports local read/edit/validate/confirm/update flows; Native LOS provides generic local configuration and history. **All functionality is simulation only.** See [Integrated Demo Notes](docs/SCOPE-Demo-Notes.html#integrated) for data ownership, assumptions, example flows and validation limits.

In the integrated demo, **Style Guide** provides Shell & Look plus BLOS, Display, Sensor Calibration and Native LOS coverage for every shell/look. Each guide has **Export Style Guide to PDF**. Two views of the same application share simulated data but keep independent tabs, selections and drafts; separate browser windows start independent demo sessions. All previous generations below remain available.

The latest [Premium Shell Exploration](mockups/scope-shell-premium-exploration.html) presents Aperture, Mosaic, Portal and Command Deck, each with four selectable visual looks: Prism Glass, Nocturne Ink, Carbon Cobalt and Spectrum Blocks. These provide 16 combinations of navigation architecture and visual material. The fifth tab, Visual Comparison, compares the shells and look families. Each concept has a secondary Component Laboratory with a Generic Visualization Gallery and Interactive Controls & States. All charts, statuses and interactions are synthetic and local; application surfaces remain abstract. Open the HTML directly in a browser without a server or dependencies.

Choose a shell and visual look, then open **Style Guide** for its palette, typography, geometry, navigation rules, component-state examples and operator rationale. **Export Style Guide to PDF** opens the browser print dialog for that shell/look combination only. Choose Save as PDF; enable background graphics to retain swatches. Ctrl+P also prepares the current combination's guide. Printing uses paper-friendly component ink while listing the exact screen HEX values. The prototype has no PDF-library or network dependency.

Use **Open BLOS + Display side-by-side** to request two independent browser windows. **Choose applications / windows** lets you select any of the four applications and request side-by-side or two-column grid placement. Each window shows only its abstract application surface and keeps the look chosen at launch. Individual Open window buttons can focus/reuse existing windows. Browsers may block multiple pop-ups from one click, open tabs instead, or adjust positioning; launch each application separately, allow pop-ups for the local file, or choose **Tile selected in Mosaic** for in-page viewing. No application data or backend state is shared between windows.

The earlier [Three-Shell Exploration](mockups/scope-shell-exploration.html) remains available alongside the original twelve-concept demonstrator below. Existing documentation and explorations are preserved.

Open [mockups/scope-ui-concepts.html](mockups/scope-ui-concepts.html) directly in a modern browser by double-clicking the file or using the browser's Open File command. No Node.js, packages, network access or server is needed.

1. Select one of the twelve concept tabs. Comparison provides all twelve concepts against eleven common criteria and identifies promising candidates without selecting a final design.
2. In Workspace, select a placeholder application. Native LOS deliberately displays an unavailable explanation; the shell remains usable.
3. Try the radios, checkbox, switch, preset dropdown, panel cards and workspace label. Increase value updates the generic number; Apply sample validates the label and asks for confirmation. Reset sample restores form defaults after confirmation. Nothing is sent anywhere.
4. Expand the context disclosure, inspect the question-mark tooltip, and show a sample error. The local event list and notification provide feedback. Modes and presets change local labels, not application behavior. The trend is a static reference.
5. Open Style Guide for the active concept. Inspect palettes, layout rules, component examples and all control states. Try the loading-to-success example and editable specimens.

Tab/Shift+Tab moves between controls. Within tab lists, Left/Right and Home/End change the active tab; within radios use native arrow keys. Enter/Space activates buttons. Escape cancels dialogs or dismisses the tooltip. State persists across concept changes and resets on page reload; no browser storage is used.

## Export a style-guide PDF

Choose a concept → Style Guide → **Export Style Guide to PDF**. The browser opens its print dialog for only that concept's style guide. Choose Save as PDF, inspect the preview, and save. Enable background graphics to retain palette swatches. The print layout uses dark text on white and lists the original screen colors. Canceling printing leaves the screen interface intact. Native form rendering and page breaks may differ by browser. Ctrl+P also prepares the selected concept's guide; select a concept before printing from Comparison.

## Repository contents

```text
docs/
  SCOPE-UI-Documentation.html    Tabbed architecture, requirements, comparison and validation
  SCOPE-Demo-Notes.html         Tabbed Integrated Demo / Electric Glass notes and attribution
  assets/
    validate-prototype.cjs       Optional dependency-free developer validation
    validate-integrated-demo.cjs Integrated app contract/handler/guide validation
    validate-electric-glass.cjs Electric action, regional projection and regression checks
mockups/
  params.json                   Presentation labels, branding and logo path
  styles.css                    Electric Glass styles and print rules
  assets/                       Replaceable PNG logo and SVG fallback
  scope-integrated-electric-glass.html  Electric Glass, textured regional Earth and independent links
  scope-integrated-demo.html     Four simulated apps, split view and exportable style guides
  scope-ui-concepts.html         Complete offline HTML/CSS/JavaScript demonstrator
  scope-shell-exploration.html   Earlier Aperture, Mosaic and Portal shell studies
  scope-shell-premium-exploration.html  Four premium shell studies, gallery and comparison
src/
  .gitkeep                      Reserved for future application work
```

The concepts are Mission Control Console, Modern Engineering Dashboard, Gaming-Inspired Operator Console, Minimal Dark Console, Modular Engineering Workspace, Tactical Flat Interface, Industrial HMI, Command Center Dashboard, Precision Instrument Console, Contemporary Desktop Interface, Adaptive Information Dashboard and Hybrid Operator Console.

## Architecture and current limits

Open [SCOPE-UI-Documentation.html](docs/SCOPE-UI-Documentation.html) directly in a browser. Its four tabs contain Architecture, Design Requirements, Style Comparison and Validation. Each tab has section links; tab and section anchors support direct links. Left/Right and Home/End navigate the tabs. Print active tab / Save PDF prints only the selected document. The HTML includes all content and styling locally, including the architecture diagram; no server or external runtime is needed.

Read [Architecture](docs/SCOPE-UI-Documentation.html#architecture) for the recommended framework-neutral shell, approved application registry, independent REST boundaries and integration options. Launch links and isolated frames preserve existing application independence; deeper runtime composition improves visual continuity while increasing trust and compatibility obligations. Shared tokens and component contracts do not require every stackup to use one framework.

[Design Requirements](docs/SCOPE-UI-Documentation.html#design-requirements) separates WHAT information is represented from HOW it is presented. [Style Comparison](docs/SCOPE-UI-Documentation.html#style-comparison) explains desktop layouts and tradeoffs. At smaller widths the layouts share a usable stacked fallback. The prototype's single-file packaging does not prescribe a monolithic production architecture.

Actual stackup contracts, embedding capability, authentication, display hardware and operational requirements remain unknown. Assessments are preliminary design judgments, not validated usability findings. No domain controls, real APIs, production security/session integration or backend availability checks are implemented.

## Customizing Electric Glass

The latest [Electric Glass mockup](mockups/scope-integrated-electric-glass.html) now uses these sibling files:

- [params.json](mockups/params.json): application display names, internal tab labels, shell/view labels, SCOPE branding text and `logoPath`.
- [styles.css](mockups/styles.css): the extracted stylesheet, including every existing material look, semantic action style and PDF print rule. Edit this file to adjust appearance.
- [assets/logo.png](mockups/assets/logo.png): the default 128px transparent crosshair logo. Replace it with your own PNG without changing code. The image keeps its aspect ratio.
- [assets/scope-logo.svg](mockups/assets/scope-logo.svg): the circular crosshair fallback, used automatically if the configured image fails to load.

To rename BLOS, edit `applications.blos.name` in `params.json`. To rename its tabs, edit `applications.blos.tabs.groups`, `.discovery` and `.topology`. The stable IDs `blos`, `display`, `calibration` and `los`, and tab IDs such as `groups` or `globe`, must stay unchanged; labels do not control behavior. Changing an application's display name does not change its model or membership rules.

Edit `branding.name` for shell wordmarks, and `branding.title`, `.eyebrow` and `.tagline` for the main header text. `labels.shells`, `labels.views` and `labels.laboratory` control navigation labels. Keep `logoPath` as `assets/logo.png`, or set another relative image path such as `assets/company.png`. Keep the SVG fallback file available.

Serve the repository over local HTTP so JSON configuration can load:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/mockups/scope-integrated-electric-glass.html`. Reload after editing configuration, images or CSS; use a hard refresh if an old logo remains cached. No build or framework is needed. Missing, invalid or partial configuration falls back to built-in defaults. Browser `file://` access may restrict JSON loading, so direct-file mode deliberately uses defaults; local CSS and default logo assets still work when the folder is kept intact.

**Hide UI Details / Show UI Details** hides and restores application internals, laboratory details and secondary shell data without unmounting the apps. Application selection, internal tabs, drafts, cameras and model state are retained. Navigation, application names and layout containers remain visible. Style guides and PDF exports remain available. Tracked application windows receive the presentation setting; newly opened windows inherit it. No application data is shared through this presentation-only setting.

## Developer validation

Optional, if Node.js is installed:

```bash
node docs/assets/validate-prototype.cjs
git diff --check
git status --short
```

The script checks JavaScript syntax, generated tab/label relationships, shared handlers in a controlled DOM fixture, twelve concept-specific print fragments and token text contrast. It also checks the consolidated documentation's links, tab relationships, keyboard navigation, direct-link handling and print invocation. It is **not a browser renderer** and does not establish browser interaction, visual layout, accessibility conformance or actual PDF pagination. See [Validation](docs/SCOPE-UI-Documentation.html#validation) for performed checks and remaining manual review.

Run `node docs/assets/validate-electric-glass.cjs` for the latest Electric Glass checks, including configuration defaults/renaming, retained detail state, PNG/SVG fallback, source-checked presentation messages, the existing application/guide regressions, and real loopback HTTP requests for the delivered HTML, JSON, CSS and logo assets. These checks still do not replace browser visual, focus or PDF review.
