# SCOPE UI design requirements

## Purpose and operator environment

Explore a common operator experience across independent BLOS, Display, Sensor Calibration and Native LOS boundaries. BLOS already exists and is not redesigned. All prototype content is abstract, local and simulated.

The intended console is used for extended sessions in a dark room with blue ambient lighting. Operators may be familiar with modern gaming interfaces. Borrow responsiveness, legible organization and immediate feedback; avoid decorative science-fiction treatments. Physical display, viewing distance and ambient luminance remain unknown.

Objectives: fast orientation, low cognitive workload, restrained luminance, stable navigation, recognizable abnormal states and consistent keyboard/mouse behavior. No final concept is selected by this exploration.

## WHAT: information inventory

| Category | Abstract meaning | Demonstrator instance |
| --- | --- | --- |
| Application identification | Which independent application is represented | Four named placeholder entries |
| Availability | Whether access is available, unavailable or unknown | Three ready labels; Native LOS unavailable |
| Current selection | Operator's current application context | Navigation marker and workspace heading |
| System/subsystem state | State reported through an agreed integration contract | Abstract availability only; no invented operational state |
| Connection state | Network/session connectivity and confidence | Explicit offline/local footer; no live connection |
| Generic status | Non-domain condition | Enabled/paused local-feedback label |
| Alerts and notifications | Outcome, warning or failure information | Notification, warning boundary and sample error |
| Generic measurement | Value with a meaningful unit in a real application | 42 generic units, incrementable |
| Configuration state | Draft versus accepted settings | Draft / Saved rN |
| User-entered values | Operator-provided text or choice | Workspace label, mode and preset |
| Control availability | Whether an action can be invoked | Enabled examples and disabled operational placeholder |
| Confirmation | Review before a consequential action | Apply/reset modal |
| Errors and warnings | Invalid input or unavailable resource | Empty-label error and unavailable application |
| Time and timestamps | Event order, time basis and freshness | Synthetic sequence starting 09:00:00; labeled DEMO |
| Event history | Recent changes with context | Last five local events |
| Contextual information | Secondary explanation and integration boundaries | Tooltip and native disclosure |
| Historical values | A sequence suitable for comparison | Static 38, 40, 39, 42, 41, 42-unit reference trend |

This inventory identifies candidate information, not a requirement that every application exposes every category. Availability does not prove backend health, and a selected application can be unavailable.

## HOW: information-to-component mapping

| Information | Presentation | Why |
| --- | --- | --- |
| Application identity/selection | Stable labeled navigation with marker and heading | Redundant context prevents disorientation |
| Availability | Symbol, word and explanatory panel | Supports color-independent recognition and recovery |
| Generic value | Numeric card with unit | Precise comparison without unnecessary instrumentation |
| History | Thin static line plus exact accessible values | Illustrates trend presentation without inventing a domain |
| Mode | Radio group | Makes a small exclusive choice visible |
| Independent choice | Checkbox | Allows a boolean preference without suggesting exclusivity |
| Immediate boolean state | Switch and on/off label | Shows a reversible local state change |
| Preset | Native dropdown | Keeps a compact list discoverable and keyboard accessible |
| Editable configuration | Labeled text input and draft/saved status | Separates editing from acceptance |
| Current panel | Selectable cards | Supports a persistent information choice |
| Action | Primary, secondary or tertiary button | Establishes importance and consistent outcomes |
| Confirmation | Native modal dialog | Makes the proposed action concrete and cancellable |
| Context | Details/summary and tooltip | Discloses secondary prose on demand |
| Failure/outcome | Visible text, semantic symbol and polite notification | Immediate feedback without relying on hue |

Do not select gauges or charts solely for appearance. Actual measurement visualization needs units, ranges, time basis and data contracts supplied by an owner.

## Interaction requirements

- Thirteen top-level tabs: twelve full concept names and Comparison. Only one concept occupies the workspace. Arrow keys and Home/End activate adjacent tabs; Tab leaves the tab list.
- Each concept has Workspace and Style Guide views. The same data and control state persist across concept changes for direct comparison; reload resets the session.
- Application buttons change the placeholder context. Native LOS remains selectable to expose its unavailable explanation. No operational connection or retry is implied.
- Review/Compare radios are exclusive. Locked is disabled and unselected. Style-guide specimens also show disabled-selected independently.
- Checkbox controls an annotation in the disclosure. Switch updates the enabled/paused label. Preset selection updates feedback. Cards update the selected panel and feedback.
- Label editing immediately changes draft context. Apply rejects blank/whitespace-only input and otherwise opens confirmation. Confirm increments a local saved revision; cancel preserves draft edits.
- Increase value adds one. Reset confirms then restores form and value defaults, preserving concept/application selection and event history.
- Sample error reports an intentional local failure; loading example disables repeat activation for 600ms before success.
- Enabled specimen controls provide notification feedback. Native fields, disclosures and navigation produce observable state changes. Disabled controls cannot activate.
- Notifications retain the latest message until another interaction; event history shows five recent logged workbench actions. No backend or persistent storage exists.

## Control-state requirements

| State | Required distinction / implemented example |
| --- | --- |
| Default | Solid neutral border and raised background |
| Hover | Accent-mixed surface and accent boundary |
| Focus | Separate 3px accent outline with 3px offset |
| Pressed | Temporary inset line and 1px movement |
| Selected | Persistent accent border, leading marker and semantic selection |
| Unselected | Full contrast, solid neutral boundary; remains enabled |
| Disabled | Dashed border/label, reduced opacity and native lockout |
| Loading | Disabled action with Working… and aria-busy |
| Success | Check + success text and semantic outline |
| Warning | Triangle + warning text and semantic outline |
| Error | Cross + error text; invalid input also gains an error boundary |

Primary actions use accent fill and dark ink, secondary actions raised fill and a solid border, tertiary actions transparent underlined text. Radios use a native selected dot; checkboxes a tick; switches thumb position and fill. Native glyph activation supplies pressed feedback. Fields use the background token and invalid/error messaging. Cards and navigation share hover/focus/pressed rules with buttons; active cards add selected text. Passive status indicators have no pressed/selected behavior. OS dropdown menus may differ by browser.

Each guide pins state appearances in labeled specimens while the actual controls demonstrate pointer and keyboard behavior. A pinned focus specimen does not mean it actually holds keyboard focus. Radio specimens use independent groups where necessary; the additional live group demonstrates exclusivity.

## Per-concept style-guide requirements

Each guide describes philosophy, HEX palette, semantic colors, surface colors, font families/sizes/weights, spacing, grid, navigation, buttons, radios, checkbox/switch, fields/dropdowns, cards/panels, statuses, alerts, chart rules, control states, accessibility and dark-room rationale. CSS tokens and concept configuration drive both rendering and guide text.

Export Style Guide to PDF invokes browser printing of the active concept's dedicated guide. The print layout uses paper-friendly ink, lists original screen HEX values, preserves swatches when background graphics is enabled, includes component/state examples and excludes unrelated concepts and workspace. The operator chooses Save as PDF and a filename; the page does not silently download a PDF. Browser pagination and native form-glyph rendering may vary.

## Accessibility and human factors

Use descriptive labels, headings, fieldsets/legends, native controls and explicit tab relationships. All workbench targets have at least 44px height through their labels; Industrial HMI actions are at least 48px and application buttons 56px. Focus must be distinguishable from hover and selection. Dialogs start on Cancel, contain focus through native modality, support Escape and restore focus. Tooltip information is available on hover, focus or click; Escape dismisses it.

Use text/symbol redundancy for statuses. Retain stable application order and avoid flashing, glow or autonomous content motion. All layouts stack below 760px, with a common intermediate layout below 1100px. The comparison matrix scrolls in a labeled keyboard-focusable region. Font zoom and narrow viewports require review; no full assistive-technology conformance claim is made.

Restrict bright areas in the screen interface. Text, controls and status differentiation need contrast review against the actual surfaces; reduced-opacity disabled controls remain identifiable as unavailable. Screen contrast measurements cannot establish dark-room comfort. Evaluate glare, blue ambient lighting, viewing distance, task timing, fatigue and status recognition with representative operators before final selection.

## Prototype constraints

One HTML file with embedded CSS/JavaScript; no external assets, web fonts, packages, runtime requests or server requirement. No production framework or domain functionality. No telemetry or storage. `src/` remains reserved. Synthetic event timestamps describe local action sequence, not wall-clock activity. Presets and modes change visible local state only; they do not claim to configure an application. The reference chart is intentionally static.

## Acceptance criteria and review procedure

| Area | Acceptance evidence |
| --- | --- |
| Repository | Required files present; clean baseline recorded; final status and diff check; no commit/push |
| Navigation | 12 named concept tabs and Comparison activate without reload; related view panels and application labels update |
| Distinctness | Each concept changes desktop composition, navigation treatment and hierarchy, not only accent |
| Shared content | Same form, value, application names, statuses and event model across concepts |
| Interaction | Exercise radios, checkbox, switch, dropdown, cards, text, apply/cancel/confirm, increment/reset, disclosure, tooltip, loading and error |
| States | Inspect hover/focus/press separately from persistent selection; disabled cannot activate; radio disabled-selected reference exists |
| Export | Only chosen guide appears in print media; palette, examples and state contract remain present |
| Documentation | Architecture defines target boundaries and tradeoffs; no phased plan or inferred domain APIs |

For browser review, visit every concept, change each control family, open each guide and inspect comparison. Check keyboard navigation and modal behavior, narrow-screen overflow and print media. Record what was actually executed in `docs/Validation.md`; do not substitute unexecuted acceptance criteria for test results.
