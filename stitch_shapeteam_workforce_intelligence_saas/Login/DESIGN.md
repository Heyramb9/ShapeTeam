---
name: Synthesized Intelligence
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#45464f'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#767680'
  outline-variant: '#c6c5d0'
  surface-tint: '#4f5c8e'
  primary: '#000f3f'
  on-primary: '#ffffff'
  primary-container: '#172554'
  on-primary-container: '#808dc2'
  inverse-primary: '#b7c4fd'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#1c0047'
  on-tertiary: '#ffffff'
  tertiary-container: '#35007a'
  on-tertiary-container: '#a375ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4fd'
  on-primary-fixed: '#071747'
  on-primary-fixed-variant: '#374475'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d2bbff'
  on-tertiary-fixed: '#25005a'
  on-tertiary-fixed-variant: '#5a00c6'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.005em
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  title-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
  metric-val:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system projects authority, precision, and strategic clarity for enterprise leaders orchestrating high-stakes team formations. It addresses HR executives, organizational designers, and engineering leaders who require algorithmic intelligence without black-box opacity. The emotional target is calm confidence, architectural control, and absolute trust in data-driven workforce decisions.

The design movement synthesizes Corporate Modern with Precision Analytics:
- Ultra-clean spatial discipline paired with dense, readable data presentation.
- Crisp mechanical structure anchored by structured micro-borders and deliberate contrast.
- Visual cues that signal computational rigor: tabular-aligned figures, structured status indicator chips, and contextual metric ribbons.
- Controlled use of vibrancy, reserving high-saturation hues strictly for algorithmic state, insight highlights, and directional affinity graphs.

## Colors

The palette establishes an executive hierarchy anchored by deep structural navies, progressive action blues, and algorithmic purple accents.

### Application Rules
- **Primary Navy (`#172554`):** Anchors global navigation headers, high-level structural sidebars, and critical typography elements. It defines the bedrock of the application frame.
- **Secondary Royal Blue (`#2563EB`):** Dedicated to primary interactive controls, focal active states, selected table rows, and positive directional paths.
- **Tertiary Violet (`#7C3AED`):** Signals AI-driven insights, skill vector matches, predictive optimization suggestions, and automated team balancing indicators. It is never used for generic decorative actions.
- **Canvas & Surfaces:** Primary application background uses `#F8FAFC`, maintaining subtle separation from elevated pure white (`#FFFFFF`) card and panel surfaces.
- **Functional Semantics:**
  - Success (`#10B981`): Balanced teams, optimal skill coverage, completed syncs.
  - Warning (`#F59E0B`): Workload saturation, single-point-of-failure risks, soft skill gaps.
  - Critical Slate (`#0F172A`): Primary headings and data figures.
  - Subtle Border (`#E2E8F0`): Explicit structural definition across all surfaces.

## Typography

The typography couples the architectural balance of Manrope for titles and analytic values with the extreme functional legibility of Inter for continuous reading, interface metadata, and interactive elements.

- **Tabular Numerics:** Enable `font-feature-settings: "tnum" 1, "cv05" 1` across all body, title, and metric roles to preserve strict column alignment across analytical tables and comparison matrices.
- **Labels & Microcopy:** `label-sm` leverages uppercase styling paired with expanded tracking (`0.03em`) for table headers, metadata descriptors, and algorithmic confidence tiers.
- **Hierarchy Enforcement:** Headline weights are restricted to 600 and 700 to present decisive clarity without excessive heavy fill.

## Layout & Spacing

The layout operates on a dynamic 12-column responsive grid underpinned by an uncompromising 4px base unit, scaling to an 8px rhythmic pacing across enterprise dashboards.

### Responsive Rules
- **Desktop (1280px+):** Fixed 260px collapsible operational navigation sidebar, followed by a fluid content container constrained to a maximum width of 1600px. Standard gutter is `1.5rem` (`gutter`), outer margin is `2rem` (`margin`).
- **Tablet (768px - 1279px):** Sidebar compacts to an icon rail (68px). Grid shifts to 8 columns with `1rem` gutters (`gutter-sm`). Analytical side-by-side matrices collapse into prioritized vertical stacks.
- **Mobile (< 768px):** 4-column layout with `1rem` canvas margins (`margin-mobile`). Analytical cards reflow from horizontal data spreads into segmented multi-step cards.
- **Density Scaling:** Data-heavy analytical views (e.g., workforce skill inventories) adopt compact row heights (`2.25rem`) using `space-xs` and `space-sm` internal padding.

## Elevation & Depth

Visual hierarchy uses a calibrated pairing of soft, low-contrast structural borders with ultra-diffused ambient drop shadows. Surfaces must never rely entirely on drop shadows to distinguish boundaries.

- **Surface Base (Layer 0):** Hex `#F8FAFC` flat canvas.
- **Surface Card (Layer 1):** Solid `#FFFFFF` enclosed in a 1px border of `#E2E8F0` coupled with an ambient shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03)`.
- **Surface Hover / Active (Layer 2):** Border color transitions to `#CBD5E1`. Shadow deepens subtly to `0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Flyout / Popover / Dropdown (Layer 3):** `#FFFFFF` surface with `#E2E8F0` border and directional elevation: `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)`.
- **Modal / AI Optimization Drawer (Layer 4):** Backdrop overlay uses `#0F172A` at 40% opacity with a subtle `backdrop-filter: blur(4px)`. Drawer surface maintains an ambient outer shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`.

## Shapes

The design system adopts a Soft shape language (level 1). This compact radius preserves structural density, respects corporate geometric discipline, and prevents cards from looking casual or juvenile.

- **Base Elements (`rounded` / 0.25rem):** Form inputs, buttons, table row highlights, inline code, and status indicator tags.
- **Medium Panels (`rounded-lg` / 0.5rem):** Cards, analytics widgets, popover menus, slide-over sheets, and modal frames.
- **Large Contexts (`rounded-xl` / 0.75rem):** Outermost dashboard canvas panels and onboarding wizard viewports.
- **Full Radius (Pill):** Strictly reserved for numerical skill badges, dynamic percentage confidence meters, and compact presence dots.

## Components

### Buttons
- **Primary:** Filled `#2563EB` with `#FFFFFF` text. Border radius 0.25rem. Hover: `#1D4ED8`. Focus: 2px outline in `#2563EB` offset by 2px `#FFFFFF`.
- **Enterprise Secondary:** Surface `#FFFFFF`, border 1px solid `#E2E8F0`, text `#0F172A`. Hover: `#F8FAFC` background with `#CBD5E1` border.
- **AI Suggestion Action:** Gradient blend or solid `#7C3AED` with white text. Employs a faint purple aura hover effect (`box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2)`).

### Input Fields
- Enclosed with a crisp 1px `#E2E8F0` border on a `#FFFFFF` surface. Internal vertical padding: `0.5rem`, horizontal: `0.75rem`. Text rendered in `body-md` (`#0F172A`). Placeholder text: `#94A3B8`.
- Focus state explicitly swaps border to `#2563EB` with an ambient glow ring of `0 0 0 3px rgba(37, 99, 235, 0.15)`.

### Cards & Analytical Modules
- Always structured with a distinct header region divided by a 1px border (`#F1F5F9`).
- Card padding defaults to `space-lg` (`1.5rem`).
- Summary KPI Cards: Pair `metric-val` text with a supplementary trend indicator chip and uppercase `label-sm` meta title.

### Chips & Badges
- **Skill Proficiency Badge:** Minimal `#F1F5F9` background, `#334155` text, 0.25rem radius, micro-padding (`0.125rem` vertical, `0.375rem` horizontal).
- **AI Match Affinity Chip:** Tinted purple `#F3E8FF`, text `#7C3AED`, border 1px solid `#E9D5FF`. Includes tabular percentage figures (e.g., `94.8% Match`).
- **Workload Risk Badge:** Tinted amber `#FEF3C7`, text `#B45309`, border 1px solid `#FDE68A`.

### Tables & Data Grids
- Headers use `label-sm` in `#64748B`, uppercase, anchored to a `#F8FAFC` background with a bottom border of 1px solid `#E2E8F0`.
- Data rows feature 1px bottom dividers `#F1F5F9`. Hover state shifts row surface to `#F8FAFC`.
- Interactive cell sorting and multi-selection checkstates display with secondary blue accents.

### Checkboxes & Radio Controls
- Base state: 1px border in `#CBD5E1` with clean white fill. Checkbox corner radius is 0.125rem; radio is fully circular.
- Selected state: Solid fill of `#2563EB` with an internal white icon. Focus ring matches input rules.