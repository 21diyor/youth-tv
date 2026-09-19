# Youth TV — Design System

## Design Direction

The interface should feel like a premium, modern government/enterprise information system.

The design must be:
- Minimal
- Calm
- Precise
- Professional
- Data-focused
- Highly readable on large TV screens
- Visually polished without being decorative

Reference feeling:
modern financial dashboards, premium enterprise software, editorial data visualization, and high-end government digital services.

The interface must NOT look like a generic AI-generated SaaS dashboard.

---

## Core Principles

### 1. Information First

The purpose of the interface is to communicate information clearly.

Hierarchy should come from:
- typography
- spacing
- alignment
- scale
- subtle contrast

Do not rely on decoration to create hierarchy.

### 2. Use Space Intentionally

Prefer generous whitespace and clear grouping.

Do not fill every empty area with:
- cards
- icons
- illustrations
- badges
- decorative elements

Empty space is part of the design.

### 3. Restraint

Avoid excessive:
- shadows
- rounded corners
- gradients
- borders
- accent colors
- animations
- icons

Every visual element must have a functional reason to exist.

---

# Color System

Default interface theme: LIGHT.

Use neutral colors for most of the interface.

Primary surfaces:
- white
- off-white
- very light neutral gray

Primary text:
- near-black

Secondary text:
- muted neutral gray

Borders:
- subtle neutral gray

Use strong colors mainly for:
- data visualization
- status
- selected states
- important indicators

Do not use large colorful backgrounds without a specific reason.

Do not use gradients in the main interface.

---

# Typography

Use the project's Geist-based typography.

Typography should feel editorial and precise.

Page titles:
- strong but not oversized
- tight letter spacing
- medium or semibold weight

Section titles:
- clearly separated from content
- medium or semibold

Body text:
- comfortable and neutral

Metadata:
- smaller
- muted
- never difficult to read

Large statistical numbers may be visually prominent.

Avoid giant marketing-style headings.

---

# Cards

Cards should not dominate the interface.

Use cards only when content genuinely belongs inside a contained surface.

Preferred card style:
- white background
- thin subtle border
- restrained radius
- little or no shadow
- comfortable internal spacing

Avoid:
- floating card walls
- excessive nesting of cards
- large shadows
- glowing cards
- gradient cards
- every statistic being placed inside a separate decorative card

Where possible, use layout, separators, and whitespace instead.

---

# Border Radius

Use restrained rounding.

Controls can have small or medium radius.

Large containers should not look bubbly.

Avoid excessive pill-shaped UI.

Pills should primarily be used for:
- status
- filters
- compact categories

---

# Buttons

Buttons should be visually quiet.

Primary actions:
- strong contrast
- simple
- obvious

Secondary actions:
- outline, ghost, or subtle styles

Avoid:
- gradients
- glow
- oversized buttons
- unnecessary icons
- excessive pill shapes

---

# Icons

Use Lucide icons.

Icons should support comprehension, not decoration.

Do not place an icon next to every heading or statistic.

Avoid decorative icon boxes unless they communicate meaningful categories or states.

---

# Data Visualization

Citizen Appeals is a data-heavy section.

Charts should be one of the strongest visual elements of the interface.

Use:
- line charts for trends over time
- bar charts for comparisons
- stacked bars for composition
- donut/pie charts only for simple part-to-whole relationships
- area charts selectively
- progress visualization where appropriate

Charts should:
- have clear labels
- have useful tooltips
- use subtle grid lines
- use restrained colors
- animate smoothly when entering the screen
- animate naturally when data changes

Do not use rainbow chart palettes.

Do not use unnecessary 3D charts.

Do not overload a single chart with too many datasets.

Important numbers may use count-up animations.

Animations must communicate change rather than merely decorate the page.

---

# Citizen Appeals Dashboard

The Citizen Appeals section should feel like a professional analytical dashboard rather than a collection of KPI cards.

It should eventually communicate:

- total appeals
- resolved appeals
- appeals in progress
- overdue appeals
- resolution rate
- changes compared with previous periods
- appeals over time
- appeals by category
- appeals by region
- appeal status distribution
- processing performance
- recent activity or relevant operational information

The exact dashboard structure should be driven by the available data.

Use visual hierarchy so the most important information is understood first.

---

# TV Mode

TV screens are viewed from a distance.

TV interfaces therefore require:
- larger typography
- strong contrast
- clear hierarchy
- fewer small controls
- simplified information density

TV mode is primarily for viewing, not interaction.

Content should work well at 1920x1080.

Do not simply enlarge the desktop admin dashboard for TV mode.

TV slides should have purpose-built layouts.

---

# Motion

Motion should feel premium and subtle.

Good uses:
- number count-up
- chart drawing
- chart transitions
- subtle content entrance
- slideshow transitions
- state changes

Avoid:
- bouncing
- glowing
- constant floating
- excessive stagger effects
- animation on every element

Animation should never make information harder to read.

---

# Layout

Prefer:
- strong grid alignment
- consistent spacing
- predictable content width
- meaningful whitespace
- clear section hierarchy

Avoid automatically wrapping every section inside a card.

Use separators when they provide cleaner structure.

---

# shadcn/ui

Use shadcn/ui components as the base UI system.

Prefer existing shadcn components before creating new primitives.

Customize shadcn components when necessary to fit this design system.

Do not treat default shadcn styling as untouchable.

The visual identity of Youth TV should remain consistent even when using library components.

---

# Anti-AI-Slop Rules

Never automatically add:
- gradients
- glowing elements
- glassmorphism
- huge hero text
- excessive rounded cards
- excessive badges
- random colorful icons
- decorative blobs
- fake testimonials
- meaningless statistics
- unnecessary marketing copy
- excessive shadows
- emoji as interface icons

Do not create visual complexity simply to make the interface appear "designed."

Prefer deliberate simplicity.

When uncertain, remove rather than add.

---

# Final Standard

Every screen should look like it was intentionally designed for the Youth Affairs Agency by a professional product design team.

The interface should feel trustworthy enough for government use, polished enough for public display, and restrained enough to remain visually relevant for years.