# Application Integration Implementation Plan

This roadmap is for the proposed operational shell and is separate from Studio Phases B, C and D. Those prototype phases demonstrated container-aware sizing, optional Context and responsive preview fidelity. The reference lab supplies synthetic evidence. The repository establishes no real app onboarding or production deployment. See the [maturity and ownership model](SCOPE-Application-Integration-Architecture.md#product-maturity).

## Proposed production stages and ownership

| Stage | Entry criteria | Deliverables and responsible owners | Exit criteria | Status here |
| --- | --- | --- | --- | --- |
| A — Contracts and architecture | Phase 2 reverted; Phase 1/3 committed; correct integration branch | Repository assessment, ownership boundaries, options, versioned contracts and open decisions. Shell architect with platform/security and each app owner. | App/platform/security review; required runtime and trust assumptions recorded. | Documents and runtime reference contracts implemented; owner sign-off pending. |
| B — Adapter framework | Reviewed contract and one approved runtime/transport | Registration/policy, lifecycle supervision, mount abstraction, cleanup, observability and required transport. Shell/platform team. | Contract conformance, isolation/authorization review, resource/timeout/recovery tests for chosen runtime. | Trusted in-process reference host implemented; production host and iframe/service/native transports not implemented. |
| C — Reference application validation | Reference host and synthetic fixture available | Isolated offline lab; lifecycle, window resize, event/command/context, error, disposal and state tests. Shell test/accessibility owners. | Automated suite passes, target-browser/manual review completed, known limitations accepted. | Automated reference tests implemented. Native rendering and full operator acceptance remain unverified. |
| D — Real application onboarding | A/B approved; team checklist complete; one target explicitly chosen | Application-owned adapter, approved manifest/topics, auth/backend boundaries, compatibility and rollback plan. App team owns adapter/domain state; shell team owns host integration. | One application passes conformance, operational authorization and independent release/state tests without altering other Studio apps. | Not started. No real application is represented as ready. |
| E — End-to-end integration testing | Approved real adapters and representative environments | Multi-application journeys, failure isolation, version skew, operational command controls, performance, accessibility, persistence, deployment/rollback. Joint app/platform/security/operations QA. | Agreed service/performance/accessibility/security criteria met on actual deployment/runtime. | Not started; not validated by mock tests. |

Stage D should onboard one application first, selected from owner readiness evidence rather than assuming BLOS or Display is easiest. Later applications must independently pass the same gates. Avoid rewriting the existing mock registry as an early prerequisite.

## Architecture decisions to settle before production implementation

1. Confirm production runtime, OS/display hardware, deployment channels and offline expectations.
2. Obtain each application's supported framework, mount/embed/native interface, authentication flow, CSP/frame restrictions, instance model, resize behavior and cleanup guarantees.
3. Choose the required transport and trust boundary; approve origin/capability/command policy with security and domain owners.
4. Decide hide versus disposal, pop-out lifecycle, cross-window data ownership and durable workspace/state policy.
5. Define contract/application version support, migration and rollback behavior.
6. Agree measured startup, responsiveness, memory, accessibility, audit and failure-recovery criteria. Do not invent operational thresholds from the synthetic demo.

## Design Studio change control

The original adapter reference checkpoint left the Studio and runtime files unchanged. Later user-scoped prototype updates are recorded in [change control](SCOPE-Application-Integration-Change-Control.md). Any work to connect the reference to the Studio should use a reviewed mount/lifecycle boundary and preserve the offline prototype. Document the exact file/function, rationale, alternatives, impact on all four mock applications, offline/export implications, ownership review and rollback. Do not add operator configuration merely to expose development settings. Keep integration lab controls outside the Studio.

The baseline protection validator compares pre-existing tracked files against `30bf8d6`, enforces exact-file exceptions, verifies the Phase 2 revert tree and rejects new files under the protected Studio/runtime roots.

## Validation and conformance matrix

| Contract or behavior | Executable reference coverage | Additional production evidence required |
| --- | --- | --- |
| Manifest identity, version and schema | Reject unknown fields, versions, duplicates, invalid topics and undeclared/ungranted capabilities | App-owned manifest, supply-chain and release review |
| Singleton launch/mount | Concurrent launch serialized, one mount, second container rejected | Actual app's supported instance policy and mount behavior |
| Activation/deactivation/resize | Reference host methods and synthetic DOM state exercised using the shared geometry model | Visibility, background work and target display behavior |
| Event/command/context permissions | Allowlisted schemas, response validation, payload copies and listener fault isolation | Operational authorization, auditing and approved domain semantics |
| Errors and health | Recoverable synthetic error, failed startup, status envelopes and bounded diagnostics | Backend health sources, liveness policy, observability/retention |
| Cleanup/failure recovery | Disposal, callbacks, cancellation, deadlines, quarantine and safe retry | Frame/process termination, app resources and hostile/unresponsive cases |
| Optional snapshots | Envelope identity/version, save/restore and application validation | Data classification, migration, persistence and privacy/security controls |
| Future frame guard | Source/origin/session/identity/version/schema/sequence/replay rejection | Complete transport, handshake, correlation, policy and real origins |
| Window operations | Synthetic mount in isolated managed geometry. Studio Phase B and D validation is separate prototype evidence | Actual applications under all layouts, sizes, close policies and pop-outs |
| Studio preservation | Baseline protection, source/distribution parity and scoped headless Chrome/Edge preview/export checks | Headed focus/keyboard, pop-outs and target-workstation review. Operational acceptance remains separate |

Run:

```text
node src/integration/tests/validate-integration.cjs
node src/integration/tests/validate-studio-protection.cjs
node docs/assets/validate-prototype.cjs
node docs/assets/validate-integrated-demo.cjs
node docs/assets/validate-electric-glass.cjs
node docs/assets/validate-design-studio.cjs
node docs/assets/validate-workspace.cjs
node docs/assets/validate-visual-systems.cjs
node docs/assets/validate-visual-families.cjs
node docs/assets/validate-component-styles.cjs
node docs/assets/validate-standalone.cjs
node docs/assets/validate-phase1-component-editor.cjs
node docs/assets/validate-window-manager.cjs
node docs/assets/validate-source-sync.cjs
git diff --check
```

`validate-visual-families.cjs` is the **pre-existing legacy material/theme regression test**. Running it does not restore the rejected Phase 2 implementation. The standalone/source-sync validators build temporary artifacts; the checked-in Studio distribution is not regenerated or changed in this checkpoint.

For a manual reference walkthrough, open `examples/app-integration/index.html` directly. Launch, increment inside the app, send a command/context, minimize/restore, move/resize, explicitly maximize/restore, save view state, simulate the error, close/dispose and relaunch. Confirm restored sample state and absence of duplicate mounts/listeners. This validates reference behavior only. The separate [Studio browser suite](SCOPE-Phase-D-Preview-Resolution-and-Scaling.md#validation-and-remaining-limits) covers specific Chrome/Edge prototype flows. Review the reference lab and operational applications in their intended environments.

## Pending production decisions

Review the checklist with the four application owners. Choose the runtime, transport and first onboarding target based on owner readiness and platform/security review. Each real adapter and deployment must meet the operational acceptance gates above.


## Optional theme conformance extension

Run `node src/integration/tests/validate-theme-contract.cjs` alongside the existing integration/protection tests and the Studio regressions, including standalone design switching, managed pop-out, container-aware sizing and Context Panel. The [Phase D browser check](SCOPE-Phase-D-Preview-Resolution-and-Scaling.md) takes an explicit Chrome or Edge executable. Run `python docs/assets/convert-markdown-to-html.py --check` after regenerating the documentation.

| Case | Current executable evidence | Production acceptance still required |
| --- | --- | --- |
| Legacy manifest / explicit Level 0 | Validator preserves original manifests; independent negotiation | Real app receives no theme and stays visually independent |
| Level 1 / Level 2 / bad declaration | Required basic set, level constraints, typed catalog and dynamic flag | Per-app supported-token inventory matches actual controls |
| Negotiation and version skew | Supported intersection, unknown requested token reporting, missing basics, no common version | Authorized session handshake and bounded diagnostics across chosen transport |
| Malformed/unsafe/operational tokens | Invalid values, CSS injection strings, protected/unknown source names rejected | Protected alarms, maps, severity and data palettes remain unchanged during actual updates |
| Initial/change/reset/stale/error | Explicitly labeled receiver-policy fixture exercises revision ordering and last-good behavior | Real receiver atomic rollback, acknowledgement schemas, delayed replies, disconnect and timeout recovery |
| Serialization/offline/backward compatibility | JSON round trip, Node/browser-global helper parity, no DOM/network calls; existing integration test checks local lab resources | Independently deployed app/host release skew and approved older-host manifest fallback |
| Application state and accessibility | Fixture confirms helper does not mutate its inputs or unrelated sample state; Studio regression gate remains separate | Real forms/stores/focus/instance identity, light/dark states, text/focus contrast, scaling, forced colors and reduced motion |

The receiver-policy fixture is not a transport, app adapter or visual rendering test. No theme receiver is attached to BLOS, Display, Sensor Calibration, Native LOS or the synthetic counter. Do not count proposed production cases as passing merely because the pure helper passes. The next implementation decision belongs to the application/platform owners; no further phase begins automatically.
