# Isolated application integration reference

Open [`../../examples/app-integration/index.html`](../../examples/app-integration/index.html) directly in Chrome or Edge, keeping the repository files together. It uses classic local scripts, no fetch, server or external package. No existing Design Studio file imports these modules. There are no new controls in the Studio.

- `contracts.js`: runtime contract validation and a pure future-frame message guard.
- `adapter-host.js`: trusted-module registration, serialized lifecycle, capability/schema checks, cooperative deadlines and disposal.
- `reference-application.js`, `reference.manifest.json`: one synthetic application fixture; no operational application is adapted.
- `application-manifest.schema.json`: corresponding versioned manifest schema plus runtime cross-field rules.
- `tests/`: contract, reference DOM lifecycle and Design Studio protection checks.

Run `node src/integration/tests/validate-integration.cjs` and `node src/integration/tests/validate-studio-protection.cjs`, then the existing `docs/assets/validate-*.cjs` validators. The protection check compares every pre-existing tracked file to checkpoint `30bf8d6` and rejects changed/deleted files and new files inside the existing Studio/runtime directories. It does not regenerate or reset any file.

Read the [architecture](../../docs/SCOPE-Application-Integration-Architecture.md), [contract](../../docs/SCOPE-Application-Integration-Contract.md), [roadmap](../../docs/SCOPE-Application-Integration-Plan.md), [application checklist](../../docs/SCOPE-Application-Onboarding-Checklist.md), and [change-control record](../../docs/SCOPE-Application-Integration-Change-Control.md).

This is executable reference material, not a production integration platform. In-process adapters execute trusted code in the same JavaScript realm; capabilities do not sandbox that code. No authentication, authorization service, backend communication, iframe lifecycle transport, native host, durable workspace store or real-application migration is implemented. The iframe message guard is tested validation logic only. Production decisions require application-owner and runtime/security review.


## Optional application theme contract

`theme-contract.js` is an isolated, technology-neutral presentation-token reference. The existing manifest validator accepts an optional `theme` declaration; missing metadata keeps Level 0 independent appearance. The helper validates typed payloads and negotiates supported tokens, reporting incompatibility instead of injecting styles. The lab loads it as a local script; no new controls, mockup changes or external runtime dependencies are added.

Run `node src/integration/tests/validate-theme-contract.cjs`. Its receiver-policy fixture demonstrates ordering/fallback rules only. Host delivery, authorization, design-to-token projection, application receivers and acknowledgements are **proposed**, not implemented. `ScopeAdapterHost` does not automatically apply or persist a theme, and the synthetic application continues to use its own appearance. See the contract's optional theme section before implementing a receiver. App-owned operational colors and state must stay outside the portable presentation vocabulary.
