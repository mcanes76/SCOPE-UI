# SCOPE integrated application demonstration

Open [scope-integrated-demo.html](../mockups/scope-integrated-demo.html) directly in a modern browser. The entire page is **SIMULATION / DEMONSTRATION ONLY**. No network discovery, REST command, hardware access, backend service or browser persistence is implemented. Reloading resets the local session. The earlier mockups and target architecture document are preserved.

## Ownership and component boundaries

The shell owns application selection, single/split arrangement, focused panel, expansion, window launching, look selection and global notifications. The four separate UI modules—`BLOSModule`, `DisplayModule`, `CalibrationModule` and `NativeLOSModule`—own their internal navigation, fields, diagrams and view state. They are registered through `DemoApplicationRegistry` and expose narrow `createView`, `render` and `action` interfaces.

The single HTML file packages those boundaries for convenience. It does not prescribe a single production framework or replace the existing independently developed BLOS UI. These fictional workflows are specifically introduced for this demonstration; they are not inferred production capabilities.

## Local data model

| Contract | Responsibility |
| --- | --- |
| `DemoNodeStore` | Read-only snapshots of ten fictional nodes, demo geographic coordinates, stable topology positions and twelve independently modeled links |
| `DemoMulticastGroupStore` | Group snapshots, eligibility and validated create/join/leave operations |
| `DemoSensorStore` | Three fictitious sensor records, applied values, revisions, last-read times, validation, update and restore |
| `DemoLOSStore` | Generic label/mode/boolean configuration, revision, read time and numbered local history |
| `DemoBus` | Local change notifications; the shell refreshes mounted application views after data changes |
| Per-panel view memory | Application-specific tabs, selected group/node/sensor, globe camera, visibility choices, disclosures and pending drafts |

Display reads the shared node reference service. It does not access BLOS UI state or the multicast group store. BLOS group membership changes update its tables and topology rings; they do **not** create/remove links or change Display's geographic reference data. Store getters return copies so callers cannot mutate private records through a snapshot.

## Single, split and separate-window behavior

The initial split is BLOS on the left and Display on the right. Each panel has its own application dropdown, focus control and Expand action. Return to split restores both selections. Below 850px the two panels stack to preserve readable controls.

Switching applications retains that panel's previous view state for each application and preserves the other panel's state. Showing the same application twice shares its simulated data but keeps tabs, selected nodes/groups, cameras and drafts independent. A group change appears in both BLOS views. Sensor updates propagate to applied values in both views; a draft based on an older revision cannot overwrite the new values silently. Native LOS applied data is shared; pending drafts remain local and the last confirmed update wins.

Single application mode carries the focused selection into the existing shell navigation. Aperture, Mosaic, Portal and Command Deck remain available with all four material looks. Mosaic also retains its original working-set controls.

The separate-window launcher is retained. Each pop-up loads this same file in a minimal application host and starts its **own** in-memory session; data is not synchronized across browser windows. The two panels **within one page** share the local stores. Browsers may block multi-window launches or override positioning; individual launch buttons and in-page Mosaic remain available as fallbacks.

## Application demonstrations and assumptions

**BLOS:** Multicast Groups, Discovery Channel and Network Topology are independent internal tabs. Groups initially contain two nodes each; four nodes are initially ungrouped. N09 is a degraded sample and N10 is unavailable. Group creation accepts a unique 1–40 character name and optional eligible nodes. Join excludes unavailable or already-assigned nodes; Leave confirms removal of an existing member. A node may belong to at most one group **only as a prototype simplification**. Group rings use category colors; node cores and links use explicit green/amber/red state. Links remain fixed when membership changes. Topology selection highlights incident links; zoom and reset preserve a stable base layout. Panning is not advertised or implemented.

**Display:** An interactive **orthographic SVG globe projection**, rather than a WebGL globe. It includes coarse illustrative land polygons, a graticule, front-facing great-circle link segments, ten reference nodes, selected-node information, camera rotation/tilt/zoom/reset and label/connection toggles. Selecting any node centers the camera on its arbitrary coordinates, including nodes previously behind the globe. Land outlines are intentionally approximate; this is not a navigational map. Rotation is controlled with buttons rather than dragging.

**Sensor Calibration:** Sensor 1–3 have generic azimuth, elevation and roll offsets. Read Alignment uses a 300ms local loading example and records browser-local read time. Edit captures a revision and keeps a sensor-specific draft. Demo limits are azimuth/roll ±180° and elevation ±90°; these are not actual calibration requirements. Apply validates and confirms before changing applied values. Cancel discards the selected draft. Restore Sample Defaults confirms before changing applied values. Switching sensors preserves drafts. Another panel's applied update makes an older draft stale; cancel/re-edit to resolve it. No alignment algorithm is provided.

**Native LOS:** Generic status, configuration label, presentation mode, boolean option, Read Status, confirmed Apply Sample, confirmed Reset and numbered history. These fields have no protocol, waveform or operational meaning.

## Style guides and PDF export

Choose a shell and look, then open **Style Guide**. Coverage buttons provide **Shell & Look**, **BLOS**, **Display**, **Sensor Calibration** and **Native LOS** guides. Each includes palette/state conventions, layout, interaction rules, accessibility guidance and explicit demonstration limitations. Four shells × four looks × five coverage topics yield 80 selectable guide exports.

**Export Style Guide to PDF** prints only the selected coverage topic and shell/look combination. Choose Save as PDF in the browser; enable background graphics to retain swatches. This is browser-native printing, not a generated binary download. Screen HEX values are listed even when examples use paper-friendly ink. Native control appearance and pagination vary by browser.

## Example interaction flows

1. In BLOS, create an Exercise Group with N07; use Discovery Channel to join N08. Open BLOS in the other panel and inspect the synchronized membership while retaining different internal tabs. Leave N08 and observe the group table and topology ring update without any link being added or removed.
2. Show BLOS topology on the left and Display globe on the right. Select topology nodes independently of the globe camera. Rotate/zoom the globe, toggle connections/labels and select a hidden node from the shortcuts to center it.
3. Select Sensor Calibration in one panel, read Sensor 1, edit its values and confirm Apply. Change to Sensor 2 and back. Verify retained applied values. Edit and Cancel to discard a draft; enter an out-of-range value to inspect validation. With Calibration in both panels, edit the same sensor in both and verify stale-update protection.
4. Open Native LOS, modify its generic label/mode/option, confirm Apply, read status and reset. Inspect the local history; no external command occurs.

## Executed validation and limits

Run `node docs/assets/validate-integrated-demo.cjs`. The dependency-free script checks actual embedded JavaScript syntax and uses controlled DOM/window fixtures to exercise stores and handlers. Checks passed for group invariants and creation/join/leave, separate link modeling, panel state isolation, same-application data synchronization, globe controls/projection, calibration validation/read/update/cancel/defaults/stale revisions, Native LOS actions, generated IDs/relationships across 208 view cases and 80 concept/topic-specific print fragments. Checks also reject automatic runtime assets and backend-connection APIs. `git diff --check` was run.

No browser surface was available. Consequently rendered visual quality, pointer interactions, native keyboard/focus behavior, screen-reader output, pop-up placement and actual PDF output/pagination were **not verified**. A controlled fixture is not browser testing. Evaluate those behaviors and narrow-screen fit on the intended blue-lit console before relying on this exploration for a design decision.

Authentication, authorization, real REST contracts, production embedding/isolation, persistence, audit, operational networking and hardware integration remain unimplemented. The demonstration establishes no operational safety or accessibility conformance claim.
