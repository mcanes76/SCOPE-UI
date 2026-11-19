# Phase D: Design Studio Preview Resolution and Scaling

Phase D applies to the SCOPE Design Studio prototype. It was implemented in `edbba36` on `feature/scope-app-integration`. The offline Studio and the operator-only mockup are separate artifacts. The operator mockup runs the same simulation at the browser's own viewport, with its own toolbar and configuration controls. Production shell and application integration proposals are documented in the [Application Integration Architecture](SCOPE-Application-Integration-Architecture.md).

## Resolution and zoom

**Resolution** is the embedded shell's logical viewport in CSS pixels. Studio assigns explicit width and height to the iframe. The shell's media queries, layout and Window Manager receive those dimensions. The preview caption shows the current resolution and effective visual zoom.

| Resolution | Logical viewport |
| --- | --- |
| Fit Studio space (default) | Available borderless preview viewport, rounded down to whole CSS pixels. The size follows the available editor area, including after a Guided/Advanced switch. |
| 1920 × 1080, 1600 × 900, 1366 × 768, 1280 × 720 | Fixed dimensions independent of the available Studio area. |
| Custom | Enter a width from 320 to 7680 and a height from 240 to 4320, then select **Apply resolution**. |

**Zoom** changes only the size of the rendered preview. The iframe scales from its top-left corner, within a wrapper sized to the scaled result. Manual choices are 100%, 85%, 70% and 55%. **Auto Fit** (default) uses the smaller of the available width ratio, height ratio and 100%. This can display a fixed logical viewport at a smaller physical size inside Studio. The wrapper clips overflow created by the transform. An oversized manual preview can be scrolled within its focusable preview area. The outer viewport is measured independently of those scrollbars, which keeps zoom from changing Fit resolution. Browser zoom and device-pixel ratio are separate.

## Guided, Advanced and Present Design

Guided and Advanced share the live iframe, preview resolution and zoom controls. The preview uses the height remaining after the header, workshop steps where applicable, preview toolbar, caption and Studio footer. On desktop, the structure and inspector can scroll within their own panels. The editor can scroll on very short or narrow screens. The shell retains its own application scrolling and [host-aware managed window sizing](SCOPE-Container-Aware-Window-Manager.html).

**Present Design** hides editor chrome, reveals UI Details and requests browser fullscreen when available. A fixed or custom viewport carries through. If the editor was using Fit Studio space, Present starts with the logical dimensions measured at entry. Enable **Fit presentation viewport** to follow the available presentation area. Zoom continues to use the selected Auto Fit or manual setting. **Return to Studio** restores the prior editor mode. Fit Studio space resumes measuring the editor area.

## UI Details, comparison and standalone exports

- New Studio designs start with **UI Details hidden**. The Studio checkbox shows the current visibility. Present Design sets details visible in the current design. Return to Studio leaves that design setting visible until changed.
- **Compare checkpoints** uses the live logical viewport at dialog entry for both candidates, even when the editor uses Fit. Auto Fit uses the smaller common display area to give both previews the same scale. Both show the current Studio UI Details setting and run independent simulations. Candidate A/B/C and Baseline remain design checkpoints. **Compare themes A/B** uses the same live frame and layout.
- New standalone operator HTML exports open with UI Details shown and include their own visibility toggle. To compare responsive behavior, match the browser's CSS viewport, navigation, arrangement, design and details visibility. Studio zoom and resolution are editor settings and are not exported as shell configuration. Standalone files have independent simulation sessions.
- The [Context Panel](SCOPE-Phase-C-Context-Panel.html) is a separate shell control. Its visibility is part of the saved design.

## Validation and remaining limits

The Phase D checkpoint passed 19 existing validators and the focused [browser regression](assets/validate-preview-sizing.cjs) in headless Chrome and Edge. The browser suite used 1440 × 900, 1280 × 720 and 1024 × 600 Studio viewports. It covered preset and custom iframe dimensions, breakpoints, Auto Fit and all four manual zooms, editor controls and scrolling, presentation, checkpoint comparison, UI Details, native pointer dragging and resizing, window bounds and state retention, and offline operator export. The standalone layout was compared at 1600 × 900 and 740 × 680. Before/after captures and geometry were recorded during that checkpoint.

At 1440 × 900, the Guided preview displayed the 1600 × 900 logical viewport at about 56.8% (about 908 × 511 rendered CSS pixels). The browser page stayed at 900px tall in both Guided and Advanced, compared with 1009px and 1124px respectively before Phase D.

Run the browser check with a local browser executable and an optional artifact directory:

```text
node docs/assets/validate-preview-sizing.cjs "<Chrome or Edge executable>" [artifact directory]
```

This evidence covers the exercised offline flows and resolutions. Broader headed browser review covers fullscreen policy, native file pickers and pop-outs, accessibility and focus, print, and target hardware. The narrowest previews can require shell scrolling. Older offline files retain the behavior embedded when generated.
