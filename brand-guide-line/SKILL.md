---
name: bank-sarfaesi-brand
description: Applies the bank-sarfaesi frontend's brand colors and typography to artifacts that should match the product's look-and-feel. Use it when generating UI mockups, marketing assets, or documents that should align with the bank-sarfaesi visual identity.
---

# Bank-Sarfaesi Brand Styling

## Overview

Brand identity extracted from `bank-sarfaesi-frontend/src/index.css` (Tailwind v4 `@theme` block). This is the single source of truth for the product color and type system. No external font service (Google Fonts, Adobe Fonts, etc.) is loaded — the product relies on browser system-font stacks provided by Tailwind's base reset.

**Keywords**: branding, bank-sarfaesi, visual identity, sand palette, accent, sidebar, ink, dark mode

---

## Brand Guidelines

### Colors

**Neutral / Surface (sand-\*):**

- `--color-sand-50`: `#FAF8F5` — Page background; the lightest warm off-white surface
- `--color-sand-100`: `#F5F0E8` — Card and panel background
- `--color-sand-200`: `#EEECE2` — Subtle divider or secondary card background
- `--color-sand-300`: `#E0DDD4` — Border / separator on light surfaces
- `--color-sand-400`: `#C4C0B6` — Disabled element fill or muted stroke
- `--color-sand-500`: `#A8A49A` — Placeholder text on sand backgrounds

**Sidebar / Navigation (sidebar-\*):**

- `--color-sidebar`: `#1A1A1A` — Sidebar background (near-black chrome)
- `--color-sidebar-active`: `#353535` — Active / selected nav item background
- `--color-sidebar-hover`: `#2A2A2A` — Nav item hover state background
- `--color-sidebar-text`: `#A3A3A3` — Default nav label text
- `--color-sidebar-text-active`: `#FFFFFF` — Active nav label text

**Accent (accent-\*):**

- `--color-accent`: `#C96442` — Primary CTA, active indicator, links
- `--color-accent-hover`: `#B8563A` — Accent hover state (darker)
- `--color-accent-light`: `#F5E6DF` — Tinted accent background (e.g. badge fill, highlight band)

**Ink / Text (ink-\*):**

- `--color-ink`: `#1A1A1A` — Primary body text
- `--color-ink-secondary`: `#5E5C57` — Supporting / secondary label text
- `--color-ink-tertiary`: `#8E8C87` — Captions, timestamps, hints

**Dark Mode (dark-\*):**

- `--color-dark-bg`: `#1A1A1A` — Dark-mode page background
- `--color-dark-border`: `#363636` — Dark-mode border / divider
- `--color-dark-surface`: `#242424` — Dark-mode card or panel surface
- `--color-dark-surface-hover`: `#2E2E2E` — Dark-mode card hover state
- `--color-dark-text`: `#ECECEC` — Dark-mode primary text
- `--color-dark-text-secondary`: `#A3A3A3` — Dark-mode secondary text
- `--color-dark-text-tertiary`: `#737373` — Dark-mode tertiary / hint text

**Additional:**

No additional color tokens are declared outside the groups above. The codebase uses `text-blue-600` / `text-gray-400` as one-off Tailwind utilities in the `ChatFlowEditor` component, but these are not brand tokens and should not be treated as part of the palette.

---

### Typography

- **Headings**: System default — no custom heading font declared
- **Body Text**: System default — no custom body font declared
- **Monospace**: `font-mono` (Tailwind built-in — maps to the browser's system monospace stack: `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, `Liberation Mono`, `Courier New`, `monospace`). Used for code/ID display in `ChatFlowEditor`.
- **Note**: No `<link rel="stylesheet">` font imports exist in `index.html`, no `@font-face` rules exist in any CSS file, and no `--font-*` tokens are declared in the `@theme` block. All heading and body rendering falls back to the operating-system default sans-serif stack provided by Tailwind's preflight reset (`ui-sans-serif`, `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, `"Helvetica Neue"`, `Arial`, `"Noto Sans"`, `sans-serif`).

---

## Usage Notes

- **Light surfaces**: prefer `sand-50` → `sand-200` for page and card backgrounds. Use `sand-300` / `sand-400` for borders and dividers. Reserve `sand-500` for placeholder text.
- **Dark surfaces**: use the `dark-*` palette. Pair `dark-text` (`#ECECEC`) on `dark-bg` (`#1A1A1A`) for primary content; step down to `dark-text-secondary` and `dark-text-tertiary` for hierarchy.
- **Sidebar chrome** is intentionally darker than standard dark-mode surfaces: `sidebar` = `#1A1A1A` matches `dark-bg`, but `sidebar-hover` (`#2A2A2A`) and `sidebar-active` (`#353535`) are exclusive to the nav rail — do not repurpose them for content cards.
- **Accent** is a warm burnt-sienna (`#C96442`). Use it sparingly: primary CTAs, active-state indicators, and focus rings. Use `accent-hover` (`#B8563A`) on `:hover`/`:active`. Use `accent-light` (`#F5E6DF`) for tinted backgrounds such as alert banners, badges, or selection highlights — never as a text color.
- **Text hierarchy** on light backgrounds: `ink` (primary) → `ink-secondary` → `ink-tertiary`. Mirror with `dark-text` → `dark-text-secondary` → `dark-text-tertiary` in dark mode.
- **Custom Tailwind variant**: the codebase registers `@custom-variant dark (&:where(.dark, .dark *))`, meaning dark-mode styles are applied by adding a `.dark` class to a parent element (class strategy), not via the `prefers-color-scheme` media query.
- **One-off utilities**: avoid introducing raw Tailwind color utilities (e.g. `text-blue-600`) into new UI work; map to the token palette above or extend `@theme` with a new named token.
