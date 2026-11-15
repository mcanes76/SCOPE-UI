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
