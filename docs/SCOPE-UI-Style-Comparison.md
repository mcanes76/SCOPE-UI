# SCOPE UI style comparison

These are preliminary qualitative design assessments of the implemented mockups, not experimentally validated usability results. No concept is selected as a final design. All use identical abstract data, controls and shared state. Native LOS is the same intentionally unavailable example in every concept.

## Twelve design directions

### 1. Mission Control Console

A steady operational frame: permanent left navigation, a central workspace and a dedicated event rail.

- Layout and navigation: Three-column 210px / flexible / 260px grid; summary above central controls. Square panel edges and 14px gutters. Persistent left application list; selected item has a leading inset bar.
- Visual treatment: background #0D141E, panel #151F2C, accent #82B9D6; ui-monospace, Consolas, monospace; 3px base corner radius.
- Advantage and limitation: High density and permanent rails suit broad consoles; narrow screens need stacking.
- Human factors: Stable scan paths and subdued steel tones help recognition during long sessions. Monospaced labels can slow prose reading.

### 2. Modern Engineering Dashboard

An open dashboard with generous cards, rounded surfaces and horizontal application navigation.

- Layout and navigation: Horizontal application bar, full-width summary, then flexible workspace and 290px event rail. 20px gutters. Top application strip keeps tools together without a permanent left rail.
- Visual treatment: background #111B20, panel #19282D, accent #8FC9BC; system-ui, sans-serif; 14px base corner radius.
- Advantage and limitation: Approachable and legible, with lower peak information density.
- Human factors: Soft panel grouping reduces visual clutter; generous spacing reduces capacity on smaller consoles.

### 3. Gaming-Inspired Operator Console

Responsive, assertive interaction cues with angular navigation and a restrained lavender accent.

- Layout and navigation: 190px left navigation, flexible central workspace, 240px event rail. Uppercase headings and accent edge markers. Angular uppercase application buttons with a strong selected leading edge.
- Visual treatment: background #13131E, panel #1F1F30, accent #B7A2E3; system-ui, sans-serif; 4px base corner radius.
- Advantage and limitation: Strong recognition at the cost of greater visual emphasis.
- Human factors: Immediate selection cues borrow interaction clarity from games. Repeated accent edges may compete with warnings.

### 4. Minimal Dark Console

Content first, with a centered single-column workspace, quiet typography and separators instead of boxes.

- Layout and navigation: Centered maximum 1100px single column; inline navigation, summary row, workspace, then event strip. 28px gaps. Inline application buttons above content; section order follows a simple reading path.
- Visual treatment: background #14181C, panel #1B2228, accent #C0C8CE; system-ui, sans-serif; 4px base corner radius.
- Advantage and limitation: Excellent calmness, but less simultaneous context and weaker partitioning.
- Human factors: Few panel edges reduce competing visual cues. Long vertical scans can hide secondary context.

### 5. Modular Engineering Workspace

A tiled engineering workbench with visibly bounded modules and title bars.

- Layout and navigation: Two equal columns: application tile / stacked summary, then controls / event module. 16px gutters; controls stack. A two-by-two application tile group identifies independent boundaries.
- Visual treatment: background #101720, panel #1A2533, accent #A5BFE6; system-ui, sans-serif; 6px base corner radius.
- Advantage and limitation: Good modular identity; fixed tile proportions may waste space. Tiles are not draggable.
- Human factors: Explicit module edges support chunking. Equal columns give event history more space than some tasks need.

### 6. Tactical Flat Interface

Flat, compact blocks with firm alignment, square targets and subdued olive neutrals.

- Layout and navigation: 180px left application rail, central summary and workspace, then a horizontal event row. 12px gutters. Compact left rail with uppercase section hierarchy and square controls.
- Visual treatment: background #171C18, panel #222B24, accent #B9C59A; system-ui, sans-serif; 0px base corner radius.
- Advantage and limitation: Efficient use of space, with a less relaxed visual rhythm.
- Human factors: Low saturation and predictable edges help scanning. Compact grouping needs spacing review under fatigue.

### 7. Industrial HMI

Large targets, strong borders and an application bank on the right support deliberate actions.

- Layout and navigation: Flexible controls on the left, 300px right application bank and event area. Two-pixel metric borders; 20px spacing. Right-side application bank uses 56px minimum buttons; other actions are at least 48px high.
- Visual treatment: background #1C1A17, panel #2A2721, accent #E4BD7B; system-ui, sans-serif; 3px base corner radius.
- Advantage and limitation: Highly explicit controls; warm action accent competes with semantic warning color.
- Human factors: Large controls and clear labels reduce fine pointing demands. Amber primary actions need separation from warning badges.

### 8. Command Center Dashboard

An overview-led composition with top application navigation and a persistent event column on the left.

- Layout and navigation: Top app bar; 230px event column left of summary and controls. First metric receives extra width and surface emphasis. Horizontal application strip beneath the concept heading.
- Visual treatment: background #121824, panel #1D2739, accent #9BAFE5; system-ui, sans-serif; 6px base corner radius.
- Advantage and limitation: Strong context retention; users must learn the event-first left column.
- Human factors: Event context stays visible beside controls. The wide overview may draw attention away from the current task.

### 9. Precision Instrument Console

Measured alignment, numeric typography and small ruler-like marks establish an instrument-panel rhythm.

- Layout and navigation: 220px left navigation with events underneath; summary and controls on the right. 18px gutters and fine rules. Persistent left list with event history immediately below.
- Visual treatment: background #111A1D, panel #1A292E, accent #94CCD1; system-ui, sans-serif; 2px base corner radius.
- Advantage and limitation: Excellent numeric scanning; fine structures need checks at distance.
- Human factors: Tabular values support comparison. Decorative ruler marks are subordinate and carry no measurement meaning.

### 10. Contemporary Desktop Interface

A familiar desktop-like composition with a quiet sidebar, inset work surface and softly raised panels.

- Layout and navigation: 200px left sidebar, central controls and 260px event rail. Work surface uses the raised token; rounded window-like panels. Sidebar selection uses a filled surface and leading marker.
- Visual treatment: background #171821, panel #242633, accent #B7B2EA; system-ui, sans-serif; 12px base corner radius.
- Advantage and limitation: Easy onboarding, though multiple surface layers add visual depth.
- Human factors: Familiar patterns reduce initial learning. Nested surfaces must remain distinct at low luminance.

### 11. Adaptive Information Dashboard

A task-first workspace with summary and events in a secondary right column, plus progressive disclosure.

- Layout and navigation: Top application bar; wide left controls, 320px right stacked summary and events. Single-column form and expandable context. Top application strip; responsive stacking adapts to viewport, never automatically reorders by live data.
- Visual treatment: background #121C19, panel #1D2D26, accent #A5CCAE; system-ui, sans-serif; 9px base corner radius.
- Advantage and limitation: Low task distraction; more scrolling within the longer main form.
- Human factors: Prioritizes the current task and hides secondary prose. Summary context is less prominent than in overview-led concepts.

### 12. Hybrid Operator Console

Stable left navigation, an overview spanning the workspace and a quieter secondary event rail.

- Layout and navigation: 195px application rail; summary spans center and 250px event rail. Controls stay central; secondary events use dashed framing. Persistent left list preserves application position across selections.
- Visual treatment: background #11191F, panel #1A2832, accent #8FC9CF; system-ui, sans-serif; 7px base corner radius.
- Advantage and limitation: Promising balance; its combined vocabulary needs operator evaluation.
- Human factors: Balances overview and task focus with a restrained cyan accent. Three regions still require a broad display.

## Common comparison matrix

?Strong? denotes an apparent presentation advantage. ?Good? is viable with the stated caveat. ?Mixed? marks a concrete limitation. Density and complexity are descriptive, not scores: higher density is not automatically better. Cell explanations provide the rationale; the concept notes above expand the tradeoffs. Shared behavior does not imply independently validated accessibility.

| Concept | Dark-room readability | Information density | Visual hierarchy | Navigation clarity | Interaction feedback | Control-state differentiation | Accessibility | Consistency | Engineering-console suitability | Visual complexity | Design-system adoption |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mission Control Console | Strong; low glare | High; three rails | Strong; fixed zones | Strong; left rail | Clear; explicit text | Strong; bar + label | Good; dense labels | Strong; stable frame | Strong; persistent context | Medium; many borders | Good; reusable zones |
| Modern Engineering Dashboard | Strong; soft surfaces | Medium; open spacing | Strong; large metrics | Good; top strip | Clear; direct labels | Strong; labels + borders | Good; roomy controls | Strong; card grammar | Good; broad overview | Low; few hard edges | Strong; familiar patterns |
| Gaming-Inspired Operator Console | Good; accent restraint | High; compact rails | Good; competing edges | Strong; bold labels | Strong; emphatic states | Strong; edge + label | Good; uppercase restraint | Good; strong motifs | Good; operator familiarity | Higher; repeated accents | Good; limit decoration |
| Minimal Dark Console | Strong; neutral palette | Low; long vertical flow | Good; quiet headings | Good; simple inline list | Clear; text feedback | Good; subtle active bar | Good; larger base text | Strong; spare rules | Mixed; context below fold | Low; few surfaces | Strong; small vocabulary |
| Modular Engineering Workspace | Good; bounded surfaces | Medium; equal modules | Good; title bars | Good; app tiles | Clear; local feedback | Strong; border + text | Good; stacked fields | Strong; module headers | Good; independent modules | Medium; repeated frames | Strong; composable panels |
| Tactical Flat Interface | Good; muted olive | High; compact spacing | Strong; aligned blocks | Strong; left rail | Clear; firm targets | Strong; square outlines | Good; 44px targets | Strong; flat grammar | Strong; efficient scans | Medium; dense groupings | Strong; simple geometry |
| Industrial HMI | Good; warm neutrals | Medium; large targets | Strong; clear borders | Good; right bank unusual | Strong; large actions | Strong; heavy boundaries | Strong; large controls | Strong; repeated geometry | Strong; deliberate operation | Medium; heavy framing | Good; semantic caution |
| Command Center Dashboard | Good; controlled indigo | High; persistent rail | Strong; overview emphasis | Good; horizontal bar | Clear; nearby events | Strong; text + border | Good; standard controls | Strong; stable columns | Strong; broad context | Medium; overview emphasis | Good; composable regions |
| Precision Instrument Console | Good; fine rules | High; narrow margins | Strong; numeric rhythm | Strong; persistent list | Clear; precise outlines | Strong; shape + label | Good; rule visibility review | Strong; measured alignment | Strong; numeric readability | Medium; fine markings | Good; token discipline |
| Contemporary Desktop Interface | Good; neutral surfaces | Medium; panel padding | Good; familiar hierarchy | Strong; desktop sidebar | Clear; conventional states | Strong; fill + marker | Good; familiar targets | Strong; desktop grammar | Good; low learning burden | Medium; layered surfaces | Strong; conventional kit |
| Adaptive Information Dashboard | Strong; muted surfaces | Medium; stacked fields | Strong; task emphasis | Good; top strip | Clear; adjacent feedback | Strong; labels + marker | Good; natural form order | Strong; fixed priorities | Strong; task-focused use | Low; disclosed context | Strong; responsive regions |
| Hybrid Operator Console | Strong; controlled cyan | High; balanced rails | Strong; restrained overview | Strong; stable left rail | Clear; explicit feedback | Strong; marker + label | Good; 44px targets | Strong; repeated tokens | Strong; balanced context | Medium; three regions | Strong; small shared kit |

## Promising candidates

Hybrid Operator Console balances a stable left rail, broad summary and central task area. It is a promising general console candidate if the target display supports three simultaneous regions.

Modern Engineering Dashboard favors legibility, familiar components and generous spacing. It merits evaluation when overview and approachability matter more than peak density.

Mission Control Console offers persistent context and predictable scan paths. It merits evaluation for broad engineering consoles, with particular attention to monospaced prose and sustained visual load.

These candidates match the Comparison tab. Industrial HMI remains useful when pointing precision and larger targets dominate; Minimal Dark Console is useful as a low-clutter reference. The other concepts test meaningful alternative navigation and hierarchy choices rather than serving as lower-ranked aesthetic variants.

## Shared conventions and responsive behavior

Every concept implements native forms, separate focus and selection, confirmation, local notifications, semantic statuses and a guide with visual state references. At widths below 1100px they converge on a common two-column fallback; below 760px they stack. This intentionally prioritizes usable narrow-screen behavior over preserving every desktop distinction. All concept state survives switching, allowing direct comparison without different data.

Style guides list actual tokens and explain primary/secondary/tertiary actions, exclusive radios, checkbox/switch states, fields, cards, tabs, notifications and the static reference chart. Print layouts use paper-friendly ink while listing original screen HEX values; browser Save as PDF is user initiated.

## Limitations and evidence needed

The matrix judges composition from design reasoning, not operator performance. There are no task completion times, error rates, fatigue measurements or population studies. Younger operators familiar with games are an anticipated audience, not evidence that decorative gaming treatments improve performance.

Evaluate the intended display and blue ambient environment with representative operators: compare navigation time, error recognition, keyboard-only use, focus visibility, long-session comfort, distance legibility and information density. Vary tasks and ordering to reduce familiarity effects. Assess zoom, screen reader behavior and print pagination separately. Token contrast checks alone do not establish accessibility or dark-room comfort.

The application content is a generic boundary demonstration. A final design may change once actual information categories, alert semantics, hosting constraints and existing application integration contracts are supplied. See [Architecture](SCOPE-UI-Architecture.md), [Design Requirements](SCOPE-UI-Design-Requirements.md) and [Validation](Validation.md).
