# Phase 2: SCOPE Visual Families

Phase 1 checkpoint `791e4bf` was verified and its acceptance test rerun before Phase 2 implementation.

Guided → Theme and Advanced → Visual Families offer five curated families. Select a family, then one of its one or two recommended accents. The complete catalog remains accessible in the existing Advanced theme selector; uncurated choices appear under Legacy themes in the family chooser.

| Family | Recommended IDs | Appearance |
| --- | --- | --- |
| Command Dark | `command-dark`, `graphite-dark` | High contrast, flat operational surfaces |
| Electric Glass | `electric-glass`, `electric-teal` | Luminous edges, translucent dark panels |
| Frosted White Glass | `frosted-white-glass` | Soft translucent white, dark text, blue focus |
| Prism Glass | `prism` | Existing cool glass with pastel lavender selection and focus |
| Professional Light | `slate-light`, `civic-blue` | Opaque conventional enterprise surfaces |

The 31 Phase 1 preset IDs and all their global role-color maps are retained byte-for-byte as JSON values. The existing dark `frosted-white` remains a legacy choice; the new light successor uses `frosted-white-glass`. Only two new IDs were introduced, bringing the full catalog to 33. The previous four structural material groups remain valid for legacy parameter imports and presets; `visualFamily` is curated preset metadata, not a replacement for those parameter values. The canonical design choice remains `theme`, so design schema 1 and parameter schemas 1/2 remain compatible.

`theme-presets.json` supplies family defaults as `shellComponents`, plus effect defaults. `visual-system.js` resolves and compiles these through the Phase 1 component machinery. Shell chrome, panels, dialogs, navigation, buttons, inputs, typography, focus and status indicators use that single resolver and `--scope-shell-*` variables. No new parallel theme stylesheet is introduced. Chrome and dialog categories, blur and luminous elevation extend the optional shell schema. Preset role colors remain the source for ordinary component colors. Application-aware global theme integration retains its existing contract; the new shell component selectors exclude application hosts and the application action dialog.

The inspector distinguishes Theme, Family default, Global material/typography override, Legacy component override, Parameters and Component override. Non-default global typography values and explicit legacy button/navigation overrides are retained. Phase 1 per-component overrides retain their own layer. Semantic shell instance overrides also bridge into shell color tokens. Explicit region edits remain effective above family defaults. Switching themes changes the selected ID without clearing user choices. Shell property/category/all resets restore the selected theme with current global customizations; Restore family defaults additionally clears global appearance, component and region overrides and applies recommended typography, retaining branding, applications and arrangement. Both actions are undoable.

Preview, Final, Candidates A/B/C, live A/B, undo/redo, JSON/CSS/HTML and configurable folder exports use the shared compiler. Family comparison preserves the same application state and explicit overrides; strong overrides can intentionally make two families look similar. Existing session-only history/candidate persistence remains unchanged. Export JSON to keep a design across reloads. The standalone Studio embeds all assets and has no external runtime dependency or new server requirement.

Run `node docs/assets/validate-phase2-visual-families.cjs` for curated defaults, retained legacy role maps, representative composited contrast, theme switching, override persistence, reset/history/candidates, live comparison, JSON/CSS/HTML/folder round trips and application DOM/draft/store retention. It generates `docs/SCOPE-Phase-2-Visual-Verification.html` from the actual compiler and `.validation/phase2/contrast.json`. All text checks, including hover, active, selected, disabled, warning, error and dialog/panel fills, require at least 4.5:1. Focus requires at least 3:1 against adjacent control/panel surfaces. The tested default minimums are 5.43:1 for text and 5.43:1 for focus. Custom override colors are intentionally retained and can reduce contrast.

The self-contained visual verification sheet shows all five family defaults with native selected/disabled controls, status indicators, input/select focus targets and open shell dialogs. It can be opened directly and inspected with pointer/keyboard. It is a generated live specimen sheet, not a captured screenshot or proof of native browser rendering. Browser screenshots, native focus/layout, downloads, printing and popup/window behavior remain manual verification risks. Translucent contrast tests use the representative workspace backdrop; unusual custom backgrounds and layered imagery require visual review. Older designs with explicit geometry/font choices retain those choices, which can reduce differences between families.

Validation also runs the full existing repository validators, Phase 1 acceptance, deterministic standalone packaging, source/distribution parity and `git diff --check`. Only after those pass is the distribution rebuilt and the Phase 2 checkpoint created. Phase 3 is outside this change.
