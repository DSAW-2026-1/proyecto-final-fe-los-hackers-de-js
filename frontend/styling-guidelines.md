Styling Guidelines — Visual tokens and conventions
Date: 2026-04-21

Purpose
- Short, actionable guide describing the visual design decisions used across the prototype. Use this to keep UI consistent when adding or updating components.

Layout & Containers
- Page section wrapper: `bg-muted/30 py-12` for full-width sections with soft background.
- Centered content container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- Use `Card` for grouped content blocks. Default card padding used in pages: `p-6`.

Typography
- Page title / hero headings: `text-4xl font-bold` (Checkout and OrderHistory page titles).
- Section headings: `text-xl` or `text-2xl` depending on importance.
- Body copy: `text-sm` for main text and `text-xs` for auxiliary/meta text.
- Use `font-medium` for item headings and IDs (e.g., order id lines).

Spacing
- Vertical rhythm: use `space-y-*` inside stacked lists and `gap-*` for flex/grid gaps.
- Buttons and card paddings: `p-6` inside `Card` for most blocks to match Checkout.

Component primitives

Buttons
- Use the central `Button` component from `src/app/components/ui/button.tsx`.
- Primary actions: `variant="default"` (uses `bg-primary` / `text-primary-foreground`).
- Secondary or less-emphatic: `variant="outline"` or `variant="secondary"`.
- Small actions (inline): `size="sm"` and icons can use `size="icon"`.
- For anchor links styled as buttons, use `Button asChild` and render an `<a>` inside.

Badges (status tags)
- Use `Badge` component from `src/app/components/ui/badge.tsx` for compact status labels.
- Status mapping used in `OrderHistory`:
  - `Entregado`: `variant="default"` + `className="bg-green-600"` (approved/positive)
  - `En tránsito`: `variant="default"` (primary color) — progress bar uses `bg-primary`
  - `Enviado`: `variant="secondary"`
  - `Pendiente`: `variant="outline"`
  - `Cancelado`: `variant="destructive"`

Cards & Lists
- Use `Card` to wrap list items and keep consistent elevation and border radii.
- Example: each order in `OrderHistory` is a `Card` with `p-6` and internal `flex` layout to separate content and actions.

Progress Bars
- Container: `h-2 bg-gray-200 rounded-full overflow-hidden`.
- Fill: use `bg-primary rounded-full` and set inline width style (e.g., `style={{ width: '60%' }}`). This visually matches `Button` primary color.

Colors & Tokens (usage examples)
- Primary: `bg-primary`, `text-primary`, `text-primary-foreground` — used for main CTAs and important badges.
- Muted section backgrounds: `bg-muted/30` and `bg-muted` for neutral surfaces.
- Muted text: `text-muted-foreground` for secondary copy and meta information.

Accessibility & Interaction
- Keep button sizes and padding consistent for tap targets (use `size` variants).
- Use `focus-visible` ring styles included in primitives to preserve keyboard navigation visibility.

Patterns and conventions
- Prefer `Card` for discrete list items rather than ad-hoc borders.
- Reuse `Badge` for status/labels so variant tokens remain consistent across admin and buyer views.
- When adding new status colors, update `styling-guidelines.md` and the `Badge` usage mapping in components referencing statuses.

Where to update tokens
- Visual tokens and base theme live in `default_shadcn_theme.css` and Tailwind config. Update there when changing color values.

Notes
- This guide is intentionally short — use it as a quick reference. For large visual changes, update both this file and example components (e.g., `Checkout`, `AdminDashboard`, `OrderHistory`).
