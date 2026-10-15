# 05 — Product experience and billing sequence

**Status:** Sequencing assessment; the subsequently requested first Wedding proof is recorded in [06](06-wedding-installation-proof.md).
**Reviewed:** October 15, 2026, web `ef57f6a`, iOS `9e3a70e`.
**Recommendation:** prove a bounded curated-template experience before paid
enforcement; do not require the full private-authoring system before billing.

**Subsequent decision:** the user explicitly selected private web authoring and
cottage reuse before billing. See [11](11-private-cottage-proof.md) for the
implemented local slice. The ordering below is the earlier assessment, not a
claim that billing has shipped or a restriction on that later request.

This adds sequencing to `00a`, not a replacement engine or approval to remove
first-iteration scope. The three starters, private customization/publication,
safe installation and native guide delivery remain planned. The full blueprint
iteration is not finished by shipping curated starters alone.

## Assessment of the current experience plan

The strong part is the result: a normal editable event, not a template runtime
the host must maintain. The main/direct-child structure, Ideas, Decide and
Manage can make suggested content useful immediately. Blank creation and
ordinary offline edits remain available.

The plan bundles two customer jobs with different delivery costs:

| Job                                  | Customer outcome                                          | Place in the sequence                                                     |
| ------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| Start planning                       | Choose a starter, review suggestions, reach a useful plan | Before billing: validate the native setup experience                      |
| Reuse an authored approach           | Customize a private draft, publish and reuse it           | Full `02` authoring UI can follow Event Pass; not a purchase prerequisite |
| Sell a professional template/package | License content, manage clients or receive payouts        | Later; neither initial blueprints nor Event Pass billing                  |

Billing uncertainty centers on price/service policy, sponsorship and lifecycle;
the highest blueprint engineering risk is reliable installation/native delivery.
Those are different boundaries. A working web editor does not prove native
setup is valuable, and purchases alone do not prove shared-planning demand.

## Proposed host journey

1. **Choose:** Start from scratch or choose Wedding, Birthday Party or
   Thanksgiving. Explain suggestions without implying confirmed bookings or
   mandatory activities. Curated starter use is free; no checkout.
2. **Review:** Collect normal root details once. Group optional children,
   starter ideas and instructions, including their audience. Do not make casual
   hosts configure engine modules or permission declarations.
3. **Confirm:** Only selected children need confirmed dates/times. Proposals
   remain proposals; preserve time zones and resolve DST ambiguity. Never
   fabricate dates for excluded/undecided activities. Removing a child explains
   which dependent ideas/instructions will also be omitted.
4. **Create:** While connected, install the reviewed revision through the
   recoverable receipt flow. Preserve setup across lost responses, restart and
   account switches; import canonical IDs, never a local duplicate. Offline
   users can continue an existing plan or use the existing blank flow.
5. **Use:** Open the result with a clear next action: review a starter idea, add
   an idea or edit details. Suggestions stay undecided; personal preferences and
   approvals retain their ordinary meaning. Keep Home/Ideas/Decide/Manage
   navigation rather than adding an engine tab.
6. **Coordinate when needed:** Invitations/RSVPs stay free. When a host enables
   paid collaborative planning, explain that one Event Pass covers the main
   event and children; invitees need no separate purchase. This is proposed
   future billing behavior, not current gating.

After installation, copied instructions/configuration use normal event access
and offline saves. A future Manage tool may own host guide editing; guest-readable
guidance belongs in the invitation/detail projection. Settle exact presentation
in `04`, not by disguising instructions as broadcast notes. Child-only users
see only their assigned event's permitted content.

## Recommended sequence and gates

### A — Internal installation proof

Finalize the typed contract/plan subset in `01`; prove one curated starter
through `03` and the model/transport/import parts of `04`. Require disposable
transaction failure tests, stable IDs, provisioning retry and mixed-client
safety, including planner-only versus guest instructions. This is an internal
proof, not a complete starter launch or a paywall project.

Privacy, transaction and archive safety are not deferred polish. If required
guidance cannot be delivered safely, this gate has not passed.

### B — Usable curated experience before charging

Complete native choice/review/recovery for all three planned starters using
deployment-managed immutable revisions. Ordinary edits to installed events do
not require a full template builder. Verify blank creation, scopes, no invented
decisions, restart/offline edits and second-device delivery via normal sync.

Use moderated/disposable-account trials to establish whether hosts understand
the suggestions, reach a useful plan and want another person to contribute.
Observe setup abandonment, mistaken defaults and first useful idea/decision,
not just catalog taps. Define sample size and acceptance thresholds before the
trial; this review establishes no conversion or willingness-to-pay result.

This is a bounded curated milestone, not completion of the full blueprint
iteration. Do not expand it into discovery, AI creation, new module types or a
marketplace before evaluating billing.

### C — Event Pass foundation and paid launch

Complete the [monetization roadmap](../monetization-roadmap/README.md), including
free portability and expiry/refund/offline gates, before paid enablement.
Policy/cost decisions can progress during A/B without runtime gates. Do not
wait for private template-authoring forms or annual subscriptions.

Template installation and purchase stay separate recoverable workflows. A pass
binds to the resulting canonical root regardless of template origin; it neither
consumes an installation nor changes source-template access. Server-backed
starter installation and delivery to the creating host are part of free setup,
not evidence that all cloud calls should be paid. Personal cross-device
backup/ongoing hosting allowances still need explicit monetization policy;
they cannot retroactively make starter setup require a purchase.

### D — Finish private authoring; evaluate annual coverage later

Complete `02` and the remaining private-template paths in `04` using the proven
planner/install contracts. Private authoring remains in the original blueprint
scope; this recommendation does not turn it into a paid feature. Mark the whole
iteration complete only when every original acceptance criterion is satisfied.
Annual plans depend on repeat-use/economic evidence, not completion of a template
editor, and remain a separate later billing slice.

## Tradeoffs and reasons to revisit

- **Billing first:** earlier payment testing, but adds entitlement/recovery work
  before starter value is validated. Reasonable if existing blank-event users
  already demonstrate shared-planning demand and willingness to pay; require
  evidence rather than assume it.
- **Full blueprints first:** completes reuse/authoring sooner but delays pricing
  feedback with substantial web/editor work. Prefer this if observed needs
  center on authoring/reuse rather than starting and sharing events.
- **Bounded curated setup first (recommended):** proves differentiated value and
  the riskiest data boundary without making billing depend on a marketplace.
  Bound the work at A/B and re-estimate after A.

The engine is not a technical prerequisite for Event Pass entitlements, and
billing is not a prerequisite for free templates. This is a product-risk
ordering recommendation, not a hard architectural dependency or an approved
scope reduction. Revisit it if A reveals disproportionate installation risk or
current users provide stronger evidence for charging existing workflows.

## Current stopping point

Only docs changed. No starter, billing feature, runtime experiment or payment
product was implemented. Next implementation request: resolve typed module/plan
and compatibility choices in `00a`, then execute A. Before charging, independently
resolve monetization policies and complete all of its paid-launch gates.
