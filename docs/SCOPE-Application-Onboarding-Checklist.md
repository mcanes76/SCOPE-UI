# Application Team Integration Checklist

Use this checklist separately for production onboarding of BLOS, Display, Sensor Calibration and Native LOS. Each application remains pending. Studio journeys and the synthetic adapter lab provide prototype and reference evidence. See the [maturity model](SCOPE-Application-Integration-Architecture.md#product-maturity).

| Application | Real UI/runtime/mount contract confirmed | Auth/backend ownership confirmed | Adapter and conformance review | Current evidence |
| --- | --- | --- | --- | --- |
| BLOS | Pending application team | Pending application/security teams | Not started | Existing simulated mock and stable Studio ID only |
| Display | Pending application team | Pending application/security teams | Not started | Existing simulated mock and stable Studio ID only |
| Sensor Calibration | Pending application team | Pending application/security teams | Not started | Existing simulated mock and stable Studio ID only |
| Native LOS | Pending application team; name does not establish deployment technology | Pending application/security teams | Not started | Existing simulated mock and stable Studio ID only |

## Ownership and runtime

- [ ] Name an application owner, adapter maintainer, backend/API owner, security contact and release owner.
- [ ] Supply the real framework/runtime, supported OS/host, deployment/update model and startup entry point.
- [ ] Confirm whether module mounting, a web component, iframe embedding, service/API integration or native IPC is supported. Identify restrictions and unsupported options.
- [ ] Confirm independent UI ownership: shell code must not modify application controls, forms, store internals, validation or business logic.
- [ ] Define stable application/instance identifiers, multi-instance support and singleton limitations.
- [ ] Record entry criteria and open decisions from the [architecture](SCOPE-Application-Integration-Architecture.md).

## Manifest and lifecycle

- [ ] Agree contract/application versions and the compatibility/rollback policy.
- [ ] Provide an approved manifest and capabilities; do not provide arbitrary executable URLs for host loading.
- [ ] Implement initialize/mount/activate/deactivate/resize/dispose against the approved transport.
- [ ] Agree production semantics for hide, minimize, close, unload and detach. Studio caching describes the prototype.
- [ ] Document supported host sizes, high-DPI and responsive behavior, keyboard focus, modal/pop-up ownership and accessibility on the chosen platform. Phase B and D measurements describe the Studio and standalone simulations.
- [ ] Demonstrate one permitted mount per instance, no duplicate listeners, cooperative cancellation and cleanup after partial startup.
- [ ] Define recovery for failure, deadline, reload and unresponsive process/frame. Identify resources requiring host termination.

## State and communication

- [ ] Identify the authoritative owner of domain data, view state, authentication state and workspace metadata.
- [ ] If snapshots are supported, define their versioned schema, validation, sensitive-data exclusions, migration and retention rules.
- [ ] Enumerate required contexts, incoming commands and outgoing events, with bounded request/response schemas and explicit permissions.
- [ ] Confirm that context is advisory and does not grant access; the receiving application/backend authorizes commands.
- [ ] Specify correlation, acknowledgements, error handling, deduplication, ordering and limits needed for real workflows.
- [ ] Define whether pop-outs share an application session or use independent data. Do not assume the mock's independent simulations synchronize.

## Security, reliability and release

- [ ] Document authentication/authorization boundaries and avoid passing credentials via generic context or events.
- [ ] If using web frames, review exact origins, framing restrictions, sandbox/CSP, permissions, navigation and validated message identity/session/sequence rules.
- [ ] If using a native/service boundary, review the actual IPC/API authentication, authorization and process privileges.
- [ ] Define health/status meanings, liveness checks, timeouts, diagnostics, redaction, retention and support ownership.
- [ ] Agree measurable latency, resource, availability, accessibility and operator acceptance requirements on actual hardware.
- [ ] Test version skew, partial failures, stale snapshots, cleanup failures, independent app releases and rollback.
- [ ] Obtain application/platform/security review and pass the [conformance matrix](SCOPE-Application-Integration-Plan.md).

## Studio protection review

- [ ] Confirm the active integration branch and preserve unrelated work.
- [ ] Record every proposed change to an existing Studio file and why a reusable interface cannot be added in an isolated module instead.
- [ ] Preserve Guided/Advanced/Final, all navigation modes, Component Editor, all 31 restored themes, Candidates A/B/C, history, mock applications, window behavior and exports.
- [ ] Keep the standalone operator mockup usable offline. Keep Studio editor controls out of operator exports.
- [ ] Do not restore Phase 2 Visual Families or silently redefine existing application IDs/preset IDs.
- [ ] Run protection, contract and full regression validation; review native browser behavior where available.
- [ ] Distinguish reference evidence from real integration readiness in the review record. Do not merge or push without separate authorization.


## Optional visual integration acceptance

- [ ] Select Level 0 (independent), Level 1 (basic) or Level 2 (supported tokens with dynamic updates); obtain application-owner approval. Level 0 remains a valid integration.
- [ ] Declare theme major versions, exact supported tokens and dynamic support in the optional manifest `theme` field. Verify the old-manifest Level 0 path and older-host manifest fallback.
- [ ] Record app-owned alarm, status, safety, map/track and visualization colors that must never inherit shell values. Include domain controls with semantic fills in the exclusions.
- [ ] Agree local font alias mappings, logical-unit/high-DPI conversion, single font-scale application, density interpretation and unavailable-font behavior.
- [ ] Choose an approved same-DOM, Shadow DOM, iframe, separate-host or native delivery path; document origin/session/identity, permission, reply schema, timeout and recovery policy.
- [ ] Keep adoption inside app-owned code: no shell selectors, stylesheet injection, cross-frame DOM access or direct store manipulation. Check inherited global CSS does not become an accidental contract.
- [ ] Validate initial delivery, supported-subset negotiation, unknown/protected tokens, missing basics, version skew and malformed payloads. Provide explicit bounded diagnostics.
- [ ] Demonstrate atomic update/rollback, revision ordering, duplicate/stale reply handling, disconnect/timeouts and last-good/default fallback. Initial-only apps must not be force-remounted.
- [ ] Demonstrate light/dark switching and shell reset while preserving forms, data, selection, active alarms, operational palettes, application overrides, focus and mounted instance identity.
- [ ] Verify normal/hover/active/selected/disabled/focus control states, small text and translucent-source projection on actual target hardware. Record text contrast (normally at least 4.5:1, large text 3:1), visible non-text/focus contrast (3:1 where applicable), zoom/text scaling, keyboard access, forced colors and reduced motion. Disabled controls must remain understandable; document applicable accessibility exceptions and product requirements.
- [ ] Confirm apps receive only projected presentation values, never raw `scope-design.json`, application parameters or credentials. Review diagnostics for sensitive content.
- [ ] Run the theme helper conformance test and application-specific receiver/transport tests. Mark unimplemented production paths as pending; helper fixtures alone do not establish operational or accessibility conformance.
