# Phase 1: SCOPE Shell Component Editor

Open `dist/SCOPE-Design-Studio.html` directly in Chrome or Edge and select **Advanced → Shell Component Editor (Phase 1)**. Expand a category, edit a property and observe the preview immediately. Guided retains its existing simple controls. Final and Candidates A/B/C use the same design state and compiler.

The editor covers button default/hover/active/disabled colors, borders and radius; navigation inactive/selected/hover colors and spacing; panel fill opacity, border, shadow, radius and padding; font family, body/heading size, weight and color; input/select fill, border and focus; and success/warning/error/neutral status colors. Status text and symbols are retained.

Each property shows its resolved value and source. Precedence is global theme → optional parameter `shellComponents` → design `shellComponents`. A property reset clears both optional layers for that property; category and all resets work the same way. Reset is undoable. Unset categories emit no extra rules, preserving legacy designs. The existing application-aware Component Styles inspector retains its prior behavior.

Optional `shellComponents` is supported by design schema 1 and parameter schema 2. Old parameter schema 1 still migrates. No version bump or runtime dependency is required. The new `design-studio/shell-components.schema.json` documents the constrained fields; `design-core.js` and `parameters.js` validate them at runtime. Unsupported fields/colors/fonts and non-finite numbers are rejected; numeric ranges are bounded.

Example in either design JSON or parameters JSON:

```json
{
  "shellComponents": {
    "buttons": { "radius": 6, "background": "#123456", "hoverBg": "#234567" },
    "tabs": { "selectedBg": "#345678", "spacing": 8 },
    "panels": { "opacity": 0.9, "paddingX": 16, "elevation": "flat" },
    "typography": { "fontFamily": "Segoe UI", "fontSize": 16, "headingSize": 28 },
    "inputs": { "focusColor": "#00AAFF" },
    "success": { "background": "#008844", "text": "#FFFFFF" }
  }
}
```

`visual-system.js` owns the resolver and CSS compiler. Generated `--scope-shell-*` properties are separate from the legacy application styling properties. Every new selector excludes `[data-demo-host]`, its descendants, `#demo-action-dialog` and its descendants. Panel opacity affects the fill, not children. Appearance edits use the existing preview update path without replacing application DOM or modifying application stores, forms or operations. Existing global theme styling of application surfaces is preserved.

JSON, CSS, decision summary, candidates, comparisons, standalone operator HTML, Save Updated Mockup and configurable folder exports retain the design through the existing pipeline. Folder `params.json` contains the effective shell overrides. Explicit parameter import with a `shellComponents` field replaces design shell overrides so edited folder parameters take effect; omitted fields retain existing design overrides. Importing `{ "shellComponents": {} }` resets shell components to the selected theme. Fonts use local system fallbacks. There is no new server requirement.

Validation:

- `node docs/assets/validate-phase1-component-editor.cjs` exercises all 31 palette defaults, validation, parameter/design inheritance, selectors, live editor handlers, all reset scopes, undo/redo, Candidates A/B/C, comparison, JSON/CSS, standalone runtime, parameter imports and folder ZIPs. It checks that application drafts and model stores survive shell edits without a rerender.
- Existing prototype, integrated-demo, electric-glass, design-studio, visual-systems, visual-families, component-styles, workspace, standalone and source-sync validators provide regression coverage.
- Validate temporary output first. Rebuild the customer artifact with `node scripts/build-standalone.cjs`; verify parity using `node docs/assets/validate-source-sync.cjs`.

Remaining limits: controlled fixtures do not verify native browser layout, hover/focus rendering, printing, downloads or popup behavior. Browser automation was unavailable; a native Chrome inspection also failed on the minimized window. Review light/dark themes, narrow layouts, long labels, large padding and native controls on the target workstation. Custom colors can reduce contrast or obscure status meaning; this shell editor does not automatically correct them. Shell geometry can change available application viewport space. Theme resets restore the current global theme, including any global visual-role customizations. History and candidate checkpoints retain their existing session-only lifecycle; export JSON to persist them across reloads.

This change implements Phase 1 only.
