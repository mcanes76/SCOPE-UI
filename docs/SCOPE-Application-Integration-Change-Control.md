# Design Studio Protection and Change-Control Record

This record applies Task 11 to the accompanying architecture/reference scope. Initial branch verification returned **`feature/scope-app-integration`** with a clean worktree at **`30bf8d6f0c0ca38a38273fe99114fa0062c57f1b`**, the committed Phase 3 Window Manager checkpoint. The original `feature/scope-design-studio-portable` branch remains at that checkpoint. No reset, merge, push or unrelated automatic commit is part of this work.

## Protected baseline

- Phase 1 Component Editor checkpoint: `791e4bfe96332e4580491db6e519927f4aa12960`.
- Phase 2 revert: `2730fdfdbc298006f2c385b67a03109a2644a8ab`; its Git tree equals the Phase 1 tree.
- Committed Phase 3 baseline: `30bf8d6f0c0ca38a38273fe99114fa0062c57f1b`.
- Preserve every existing tracked file, including current theme presets, mockups, Studio source, validators, build scripts and standalone HTML.
- The rejected Phase 2 Visual Families architecture, curated presets and controls remain absent. Existing earlier material/theme groups and their regression test remain intact.

## Modifications to existing Design Studio files

**None.** No existing tracked file is modified in this checkpoint. There is therefore no operator-facing appearance, control, mounting, navigation, application behavior, store, schema, export or build-pipeline change to the current Studio. The standalone distribution is preserved, not rebuilt. Existing application-specific prototype code is assessed and documented, not migrated.

The new demo reads the existing `design-studio/workspace.js` as a local script and uses only its pure geometry model. Purpose: demonstrate a reference adapter inside a bounded managed window without restructuring the Studio. Impact on existing files: read-only reuse; no imports into the Studio and no application registry/global-store access. The `blos` geometry key is a sizing profile in this isolated demo, not a BLOS registration or adapter.

## Additive implementation inventory

| New location | Purpose and current implementation status |
| --- | --- |
| `src/integration/contracts.js` | Implemented v1 validators and pure future-frame envelope guard |
| `src/integration/adapter-host.js` | Implemented trusted-module reference lifecycle/policy host |
| `src/integration/reference-application.js` | Implemented synthetic counter/context application fixture |
| `src/integration/reference.manifest.json`, `application-manifest.schema.json` | Implemented versioned reference manifest and schema |
| `src/integration/README.md` | Local usage, boundaries and test entry points |
| `src/integration/tests/validate-integration.cjs` | Contract/lifecycle/policy/state/cleanup/reference DOM tests |
| `src/integration/tests/validate-studio-protection.cjs` | Read-only baseline change gate |
| `examples/app-integration/index.html`, `reference.css`, `reference-lab.js` | Separate offline engineering demonstration; not part of the Studio |
| Four requested architecture/contract/plan/checklist documents | Evidence, provisional production architecture and staged onboarding criteria |
| This change-control record | Scope, modification inventory, impact and verification limitations |

These files add no runtime dependency, server requirement, dynamic executable loading, real application adapter, authentication service, backend client, iframe transport, native host or durable state service. The message guard is validation logic, not a production channel. Proposed production responsibilities are explicitly labeled in the architecture and plan.

## Verification and review limits

The protection test compares **every pre-existing tracked path** to the Phase 3 commit using Git's working-tree comparison (including normal text EOL handling). It also rejects new files under `design-studio/`, `dist/`, `mockups/` and `scripts/`. New files are restricted to isolated integration modules/tests, the separate example and new documentation. The check never resets, rewrites, stages or commits protected files. It is a current-change gate, not a permanent prohibition on approved future reusable interfaces.

The contract test covers manifest/version/grant/schema rules, payload limits, serialized singleton launch, activate/deactivate/resize, snapshot identity/version, event isolation, commands/context, recoverable errors, initialization failure/retry, timeout/cleanup quarantine, late callback rejection, future-frame source/origin/session/schema/sequence validation, reference application DOM and offline local-resource/script checks. Existing regression validators retain their original files and behavior. Source/distribution parity and zero automatic offline network requests remain required. Validation builds use ignored `.validation/` output.

Native browser rendering is not established by controlled DOM tests. The prior Phase 3 native inspection was stopped by Computer Use because it could not reliably determine Chrome's URL; that limitation is not represented as a rendering pass here. The standalone artifact and existing runtime source remain unchanged, and automated regression evidence must be read with its existing browser limitations. The separate reference lab still needs target-browser keyboard, pointer, focus, layout and cleanup review before any production use.

Validation results for this change: all 12 existing validators passed, including Phase 1, Phase 3, legacy navigation/themes/workspace, exports, offline packaging and exact source/distribution parity. Both new integration/protection validators passed; the integration validator includes 11 focused groups. All 69 existing tracked files compare unchanged against the Phase 3 baseline, with zero new files under protected runtime roots. `git diff --check` passed. No native browser rendering pass is claimed.

## Rule for later modifications

Before modifying an existing Studio file, verify the branch again, record the file/function, demonstrate the need for a reusable interface, consider an isolated module first, document UI/state/export/offline effects, preserve unrelated work and obtain any required scope approval. Keep the change narrow, add focused conformance coverage, run all regression checks and record rollback. A narrow reviewed exception may then be added to the protection policy; do not silently update the baseline or regenerate the Studio to hide drift. No new operator-facing control is justified solely by developer convenience.

The requested checkpoint is `SCOPE - Application Integration Architecture` after validation. Stop at the architecture and reference implementation. Original Studio branches, main/trunk and remotes are not changed.


## Optional theme contract extension (current change)

The branch was confirmed as `feature/scope-app-integration` at `6c6ea7d` with a clean working tree before this extension. Phase 1 and the restored pre-Phase-2 themes remain protected; no merge, push or distribution rebuild is part of this change.

| File(s) | Kind | Purpose and impact |
| --- | --- | --- |
| Architecture, contract, plan and onboarding checklist Markdown | Documentation | Define optional adoption levels, tokens, delivery/ownership/error policy, hosting strategies, projection and acceptance criteria; clearly label unimplemented wiring |
| This record and matching generated documentation HTML | Documentation | Record scope/impact; keep offline HTML documentation synchronized |
| `src/integration/README.md` | Documentation | Explain helper usage, test entry point and production limitations |
| `src/integration/theme-contract.js` | New isolated reference source | Pure catalog, declaration/payload validation and negotiation; no DOM, styling, persistence, transport or host delivery |
| `src/integration/contracts.js` | Existing isolated reference source | Permit optional `theme` metadata and validate it; unchanged legacy manifests and host grants; no existing Studio file is modified |
| `src/integration/application-manifest.schema.json` | Reference contract schema | Declare optional theme metadata; runtime additionally enforces compatibility-level constraints |
| `examples/app-integration/index.html` | Existing isolated example source | Load the local optional helper before contracts for offline extended-manifest validation; no control or visual change |
| `src/integration/tests/validate-theme-contract.cjs` | New conformance test source | Validate compatibility, catalog, negotiation, serialization, browser-global loading and proposed receiver-policy examples |

No existing Design Studio, mockup, application store, runtime, export, preset, Component Editor, candidate/history or standalone distribution file is modified. `adapter-host.js`, the synthetic application and its manifest remain unchanged. Theme declarations are metadata only; no app begins inheriting styles. The common design system reuses Phase 1 concepts, without introducing families or another preset catalog. Raw Studio JSON projection and real receivers remain proposals, requiring application-owner review and acceptance tests. Native/browser rendering of new theme adoption cannot be claimed because no adoption UI is implemented.


Validation for the optional theme extension: all 17 validators passed (14 existing `docs/assets/validate-*.cjs` validators, integration lifecycle, Studio protection and six new theme-contract groups). Documentation HTML synchronization and `git diff --check` passed. The protection gate confirms Phase 1 retained, Phase 2 reverted, Phase 3 retained and all 31 presets preserved, with no new Studio runtime files. Existing source/distribution parity, standalone workflows and no-network fixtures passed. No native visual/theme-adoption or production transport test is claimed; those remain application-specific acceptance work. Changes are left on the integration branch for review; no commit, merge or push was requested for this extension.
