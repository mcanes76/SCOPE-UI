# SCOPE-UI

Design exploration and target architecture for a unified SCOPE operator console. Twelve visual concepts compare how independently developed applications can share navigation, interaction conventions and a coherent operator experience while retaining their ownership and lifecycle.

The mockups use **simulated local data** and have no connection to operational systems. BLOS, Display, Sensor Calibration and Native LOS are abstract integration boundaries. The existing BLOS UI is not redesigned. This repository is not a production application or a phased implementation plan.

## Open the demonstrator

The latest [Premium Shell Exploration](mockups/scope-shell-premium-exploration.html) presents Aperture, Mosaic, Portal and Command Deck with distinct multicolor materials and navigation models. Its fifth tab, Visual Comparison, compares the four alternatives. Each concept has a secondary Component Laboratory with a Generic Visualization Gallery and Interactive Controls & States. All charts, statuses and interactions are synthetic and local; application surfaces remain abstract. Open the HTML directly in a browser without a server or dependencies.

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
  assets/
    validate-prototype.cjs       Optional dependency-free developer validation
mockups/
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

## Developer validation

Optional, if Node.js is installed:

```bash
node docs/assets/validate-prototype.cjs
git diff --check
git status --short
```

The script checks JavaScript syntax, generated tab/label relationships, shared handlers in a controlled DOM fixture, twelve concept-specific print fragments and token text contrast. It also checks the consolidated documentation's links, tab relationships, keyboard navigation, direct-link handling and print invocation. It is **not a browser renderer** and does not establish browser interaction, visual layout, accessibility conformance or actual PDF pagination. See [Validation](docs/SCOPE-UI-Documentation.html#validation) for performed checks and remaining manual review.
