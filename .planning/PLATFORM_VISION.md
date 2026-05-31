# Platform Vision — multi-family product

> Decided 2026-05-31 by the owner (Trace, trace@agewish). Standing context for all future work.

The Curry Family Hub is evolving from a single private family archive into a
**productized platform marketable to other families**.

## Principles
- **Multi-tenant mindset.** Each *family* is a tenant: its own content, its own
  **admin** account, and the full admin menu scoped to that family. Trace may hand a
  family's admin the keys, or manage all families himself.
- **Generalize, don't hardcode.** Continue the content-separated, config-driven
  discipline. No hardcoded family names, emails, or user-facing strings in
  components — everything flows from `content/*.json` (per-tenant) + tokens/presets.
- **Near-full admin control, disciplined.** Keep extending the admin/editor surface
  (content, appearance, navigation, sections, communications) with constrained
  flexibility — tokens + presets, not chaos. (See CONTROL_SYSTEM_AUDIT.md.)
- **Per-family admin + menus.** Today auth is a single GitHub-OAuth admin allowlist.
  A true multi-tenant build will need per-family admin identity + data isolation
  (deferred; design new features so they don't fight that later).
- **Configurable branding/recipients.** Admin/notify email = trace@agewish (agewish.com)
  for now; make recipient configurable per family (site.json) so it generalizes.
- **Proactive ideas welcome.** Offer 10/10 A+ suggestions (visual, UX, navigation,
  architecture, features) — Trace explicitly invited them.

## Approved next direction (2026-05-31) — research-first, then build
A GPT research prompt was produced to de-risk the architecture before building these.
- **Per-user accounts + personalized post-login dashboard** (replaces the home screen
  for logged-in members): since-last-login summary, favorites, weather, widgets, nav.
- **Activity "board"**: feed of what was added + who; entries auto-expire after 15–30 days.
- **"New" badges** on items a user hasn't viewed (per-user "seen" tracking).
- **Timeline view** (births/marriages/events). Build it.
- **Relationship path** ("how am I related to X?"): build it, ship feature-flagged OFF.
- **Per-user favorites**; **weather widget**.
- **Crux/blocker:** the app today has NO per-user identity (single shared family
  password) and NO database (content is JSON-in-git committed via the GitHub API).
  Per-user features need real per-member auth + a datastore — architecture decided
  from the research, keeping the archival content model and the multi-tenant goal in mind.

## Roadmap candidates (beyond current asks)
- True multi-tenant data model (family id namespacing across content + auth).
- Per-family admin onboarding + theming presets ("brand kit" per family).
- Public request/help widget → family-admin email (in progress).
- Communications: per-person email/phone, segmented send (email/SMS), templates,
  scheduling (send service to be connected later).
- Family-member search + richer discovery on the home page.
- Audit log / change history surfaced per tenant (we already have config-file revert).
