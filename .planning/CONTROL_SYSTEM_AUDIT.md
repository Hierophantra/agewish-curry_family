# Curry Family Hub — Control System Audit

> Motto: **"Everything important can be changed within a disciplined design system."**
> Controlled flexibility via tokens + constrained presets — not per-pixel chaos.
> Produced from a 6-dimension parallel audit (tokens, components, content/schema, admin/editor, a11y, debug/testing). Evidence cites real file paths + lines.

---

## 1. Wiring audit

### (a) Wired well — keep and build on
| Area | Evidence |
|---|---|
| Color is genuinely tokenized; the runtime theme editor mirrors `@theme` exactly | `app/globals.css` @theme ↔ `lib/theme-vars.ts:8-51` |
| Two-weight type enforced *structurally* (only `--font-weight-normal/medium` defined) | `app/globals.css:44-48` |
| Single source of truth: Zod schemas → TS types (`z.infer`) | `lib/types.ts` |
| Sole typed, fail-loud content access point | `lib/content.ts:23-33` (`readJSON` uses `.parse()`) |
| Consistent config-object pattern (hero/theme/tree-layout: defaulted schema + try/catch loader + commit route) | `lib/content.ts:176-206`, `app/api/admin/*/route.ts` |
| Per-element override engine (color/bg/fontSize/text/dx/dy/scale, sitewide + per-page) | `lib/types.ts:303-328`, `lib/theme-vars.ts:107-156` |
| `visibility` enum = clean per-item show/hide vocabulary | `lib/types.ts:61-74` |
| Strong a11y baseline: modal focus-trap+return, `aria-modal`, reduced-motion, focus-visible rings, decorative `aria-hidden` | `Lightbox.tsx`, `lib/focus-trap.ts`, `template.tsx` |
| Admin gating is server-only; live applier runs for all, edit UI for admins only | `lib/admin.ts:16-26`, `ThemeController.tsx:404` |
| Complete cross-ref integrity validator exists | `lib/content.ts:222-424` `validateBidirectionalRefs` |

### (b) Partially wired — the gap
| Item | Gap |
|---|---|
| `validateBidirectionalRefs()` | Complete but **dead at runtime** — never called by any route/layout/build. |
| Per-page theme config (`theme.pages[pathname]`) | Proven concept, but carries only colors/light/elements — **cannot** express section order/visibility/title. |
| `featured` video flag + `getFeaturedVideos()` | Exist, but **no screen renders** a featured section. |
| Section-page headers (tree/photographs/videos/chronicles) | h1 + eyebrow + subtitle hardcoded in JSX with **no `data-edit-id`** — home is editable, section pages are not. |
| Hero section | `<section>` is `data-edit-id=hero`, but image content lives only in `/admin/hero` — Shift+E sees an empty box. |
| Client-side pre-save validation | None. Only server Zod returns a raw error string; bad hex silently dropped (`ThemeController.tsx:683`), `dx/dy` unbounded in markup. |
| Preview vs published | Draft applies through the same applier as the live site; no "this is a preview" framing, no published peek. |
| Revert / version history | Save commits straight to `main`; recovery only via git. No in-app revert. |
| Eyebrow font-size token | Utility sets 11px, but ~33 sites override to `text-[10px]` — the token's size field is effectively dead. |
| Card system | `surface-card` (16px, gold-warm hover, 220ms) competes with a hand-rolled `rounded-lg`+hover-lift in 5 media cards (300/200ms). |

### (c) Hardcoded that should become configurable
| Item | Location | Should become |
|---|---|---|
| **Phantom `navy-light` token** (dead hover on ~18 admin buttons) | `EditPhotoForm.tsx:464` + ~17 more | Real `@theme` token (alias of `navy-soft`) — **bug-grade** |
| Section-page headers (title/eyebrow/subtitle) | `tree/page.tsx:30-37` + 3 siblings | `data-edit-id` text (reuse Shift+E) |
| Tree subtitle hardcodes "Ernest E Curry, born 1930" | `tree/page.tsx:34-36` | `data-edit-id` or screen config |
| Nav labels, footer "Download the archive" CTA, brand mark `src`, empty-state copy | `NavTabs.tsx:14-20`, `Footer.tsx:33-39`, `StarMark.tsx:18` | `content/site.json` (SiteSchema) |
| Home hub card definitions | `app/(protected)/page.tsx:60-107` | `content/screens.json` |
| Radius / shadow / motion / z-index / eyebrow size | scattered arbitrary values | additive `@theme` presets |
| `validateBidirectionalRefs` not wired | `lib/content.ts:222` | admin validation route + overlay |
| No bulk reset (page/sitewide/all) | `ThemeController.tsx` per-key only | bulk reset actions on the draft |

### (d) Should stay hardcoded — for consistency / correctness
| Item | Reason |
|---|---|
| Two-weight type, navy/gold/ivory palette, sentence-case, 3-star motif | Brand discipline guardrails |
| Lightbox internals (zoom bounds, focus-trap, scroll-lock, keyboard map) | a11y + behavioral correctness, not style |
| Grid column breakpoints across galleries | Uniform "10-foot UI" rhythm |
| z-index ladder & connector geometry | Structural invariants (tokenize names, don't expose to users) |
| `data-edit-id` attributes, route↔segment mapping, `readJSON`/validator logic | Code-level wiring, not user content |
| Semantic colors (rose-memory/emerald-archive/blue-remembrance), id slugs (primary keys), home-not-an-edit-surface | Intentional, meaning-bearing, referential integrity |

---

## 2. Recommended configuration schema

**Three mechanisms, clear ownership** (document this in CLAUDE.md to prevent drift):
- **`data-edit-id` element overrides → `theme.json`** — one-off visual/text nudges (color, bg, fontSize, text, position), sitewide or per-page. *Appearance.*
- **`content/*.json` (Zod)** — archival data + reusable chrome copy (nav labels, empty states, brand). *Structure & content.*
- **`hero.json` / `tree-layout.json` / (new) `screens.json`** — media + spatial + section config. *Layout.*

### (a) Design-token presets — additive `@theme` (NON-colliding semantic names so existing `rounded-md`, `shadow-md`, `z-40` are untouched)
```css
@theme {
  --color-navy-light: #2A3A6E;        /* fixes dead hover:bg-navy-light */
  /* semantic radius (NOT rounded-sm/md which Tailwind owns) */
  --radius-control: 8px; --radius-well: 12px; --radius-card: 16px;
  /* motion */
  --dur-fast: 200ms; --dur-card: 220ms; --dur-slow: 500ms;
  --ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1);
  /* eyebrow type (new names) */
  --text-eyebrow: 0.625rem; --text-eyebrow-sm: 0.5625rem;
  /* z-index ladder (documented; reserve top tier for debug) */
  --z-ambient: 30; --z-nav: 40; --z-panel: 50; --z-editor: 95; --z-lightbox: 100; --z-debug: 120;
}
@utility focus-ring { @apply focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2; }
@utility hover-lift { transition: transform var(--dur-card) var(--ease-out-soft), box-shadow var(--dur-card); }
```

### (b) Component-level config (constrained — presets/swatches, not free values, where consistency/a11y is at stake)
- Text content → `data-edit-id` text (already) **+ required-text guard** (brand/heading ids can't be blanked).
- Color → **palette swatches** from `COLOR_KEYS`; free hex behind an explicit toggle **+ WCAG contrast warning**.
- Font size → **type-scale presets** (enum), not a free 10–120px slider.
- Position (dx/dy) / scale → bounded + grid-snapped; box-kind also needs a paired text-contrast check.
- Visibility → boolean per section (mirror the item `visibility` mental model).

### (c) Screen-level config — new `content/screens.json` + `ScreensSchema` (additive, all-optional, literals stay as fallbacks)
```ts
ScreensSchema = z.object({
  site: z.object({ brandName, brandEyebrow, footerEyebrow }).partial().default({}),
  nav: z.object({ tabs: z.array(z.object({ href, label, enabled: z.boolean().default(true), order: z.number() })).default([]) }).default({}),
  routes: z.record(z.string(), z.object({   // keyed by pathname, like theme.pages
    header: z.object({ eyebrow, title, subtitle }).partial().optional(),
    sections: z.array(z.object({ id, enabled: z.boolean().default(true), order: z.number() })).default([]),
    flags: z.record(z.string(), z.boolean()).default({}),
    emptyState: z.object({ title, body }).partial().optional(),
  })).default({}),
}).default({})
// getScreens() in lib/content.ts mirrors getTheme()/getHero() try/catch-returns-default.
```

### (d) Admin/editor config
- **Validation rules** stay in code (reuse Zod schemas + `validateBidirectionalRefs`) — not a parallel JSON ruleset.
- **Reset scopes**: element → page → sitewide → all (draft-level, Cancel-able).
- **Debug flags**: client-only overlay state (breakpoint, source, boundaries, grid, focus, content-health) — never in `content/*.json`.
- **Draft/publish model**: today = commit-to-main + ~90s rebuild. Add (Phase 3) git-history "restore previous version" via Octokit before considering a content-branch/PR flow.

---

## 3. Prioritized implementation plan

### Phase 1 — low-risk, additive, high-value (this pass)
*Boundary: nothing here changes the family-facing published render; all new editing/debug surfaces are admin-only.*
1. **Fix the `navy-light` phantom token** (`globals.css`) — bug-grade, additive. *(low risk)*
2. **Additive `@theme` token presets** — semantic radius, motion, z-scale (`--z-debug`), eyebrow type; `focus-ring` + `hover-lift` utilities. No collision with Tailwind numeric scales → existing classes unchanged. *(low risk)*
3. **Admin `DebugOverlay`** (Shift+D, read-only): breakpoint + viewport, theme/config-source summary, list of on-page `data-edit-id`s, toggles for editable boundaries / layout grid / forced focus rings, and a Content-health check. *(low risk — admin-only overlay, no writes)*
4. **Wire `validateBidirectionalRefs()`** into `/api/admin/validate` (dead code → live safety net), surfaced in the overlay. *(low risk — read-only, admin-only)*
5. **ThemeController guardrails**: non-blocking **WCAG contrast warning** on color/element edits; **bulk reset** ("Reset this page", "Reset everything"); **bounded** `dx/dy` inputs + hex hint. *(low risk — admin editor only; addresses deliverables #11/#12/#14)*

Files: `app/globals.css`, `lib/theme-vars.ts`, `components/debug/DebugOverlay.tsx` (new), `app/(protected)/layout.tsx`, `app/api/admin/validate/route.ts` (new), `components/theme/ThemeController.tsx`.

### Phase 2 — admin controls + constrain freedoms
- Tag the **four section-page headers** with `data-edit-id` (title/eyebrow/subtitle) — closes the biggest editable-surface gap, zero new infra.
- `content/site.json` + `SiteSchema` + `getSite()` + `/admin/site` + save route → nav labels, footer CTA, brand mark, empty-state copy (fixes sentence-case violations).
- **Font size → presets enum**; **color → palette swatches** (free hex behind a toggle); **required-text guard**.
- **Client pre-save validation** with inline field errors across forms.
- Extract `<BackLink>` + `btn-primary`/`btn-sm` utilities (kill the ~26× back-link and ~18× button duplication; lights up the `navy-light` fix); converge the 5 media cards onto one card system; tokenize/migrate the z-index ladder + add a stacking-conflict detector.
- v1/v2 alias **normalization layer** in the loaders (non-destructive).

### Phase 3 — preview / save / publish workflow
- Preview-vs-published framing + "view published" peek in Shift+E.
- In-app **revert** via GitHub commits API ("restore previous version") for `theme.json`/`tree-layout.json`/content files.
- `content/screens.json` (section order/visibility/header copy) + `/admin/screens`; wire the featured-video home section behind a flag.
- Stale-SHA conflict → friendly reload-and-retry; server-side override validation (contrast/required-text/clamp) before commit.

### Phase 4 — advanced layout editing
- In-editor **device-size preview** (390/768/full) — guards desktop-only free-drag.
- Optional content-branch + Vercel-preview draft/publish.
- Tokenize prototype panel padding; finish shadow presets.

---

## 4. Testing checklist
- [ ] `npx tsc --noEmit` clean; `npm run build` exits 0 (page count unchanged).
- [ ] New `@theme` tokens resolve (`rounded-card`, `text-eyebrow`, `var(--z-debug)`) and **no existing utility changed** (spot-check a card radius, an eyebrow, nav z-order).
- [ ] `hover:bg-navy-light` now produces a visible hover on admin buttons.
- [ ] DebugOverlay: Shift+D toggles (admin only; **absent for non-admins**); breakpoint readout matches window resize; config-source counts match `theme.json`; boundaries/grid/focus toggles draw and clear cleanly; overlay sits above editor + lightbox.
- [ ] `/api/admin/validate` returns 403 for non-admins; returns the integrity result for admins; a deliberately broken ref is reported.
- [ ] ThemeController: low-contrast color edit shows the advisory; "Reset this page" / "Reset everything" clear the draft and remain **Cancel-able**; `dx/dy` inputs reject out-of-range; Save still commits.
- [ ] Family-facing pages (home, tree, photographs, videos, chronicles) render identically for a non-admin before/after.
- [ ] a11y not regressed: focus rings intact, reduced-motion honored, no new contrast failures in shipped chrome.
```
