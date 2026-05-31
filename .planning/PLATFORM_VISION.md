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

## Roadmap candidates (beyond current asks)
- True multi-tenant data model (family id namespacing across content + auth).
- Per-family admin onboarding + theming presets ("brand kit" per family).
- Public request/help widget → family-admin email (in progress).
- Communications: per-person email/phone, segmented send (email/SMS), templates,
  scheduling (send service to be connected later).
- Family-member search + richer discovery on the home page.
- Audit log / change history surfaced per tenant (we already have config-file revert).
