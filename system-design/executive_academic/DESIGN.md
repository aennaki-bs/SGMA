---
name: Executive Academic
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#44474e'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#465f88'
  primary: '#000a1e'
  on-primary: '#ffffff'
  primary-container: '#002147'
  on-primary-container: '#708ab5'
  inverse-primary: '#aec7f6'
  secondary: '#775a19'
  on-secondary: '#ffffff'
  secondary-container: '#fed488'
  on-secondary-container: '#785a1a'
  tertiary: '#090b0c'
  on-tertiary: '#ffffff'
  tertiary-container: '#1f2223'
  on-tertiary-container: '#87898a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#aec7f6'
  on-primary-fixed: '#001b3d'
  on-primary-fixed-variant: '#2d476f'
  secondary-fixed: '#ffdea5'
  secondary-fixed-dim: '#e9c176'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5d4201'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Noto Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
  display-lg-mobile:
    fontFamily: Noto Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Noto Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Noto Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  arabic-headline:
    fontFamily: Noto Naskh Arabic
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 44px
  arabic-body:
    fontFamily: Noto Naskh Arabic
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style

The design system embodies a prestigious, authoritative, and forward-thinking academic environment. It is tailored for high-level educational administration and international scholarly exchange, targeting an audience of executives, researchers, and global students. 

The aesthetic blends **Modern Corporate** reliability with **Glassmorphism** to signify transparency and innovation. By utilizing high-contrast surfaces and subtle gradients, the UI evokes a sense of "digital leather"—a premium, tactile, and high-end professional atmosphere. The emotional response should be one of trust, intellectual rigor, and institutional stability.

## Colors

The palette is anchored by **Deep Institutional Blue**, representing tradition and depth. **Refined Gold** is reserved for strategic accents—such as primary actions, achievement indicators, and active states—to provide a sense of excellence without overwhelming the interface.

- **Primary:** Deep Blue (#002147) for headers, primary buttons, and structural navigation.
- **Secondary:** Refined Gold (#C5A059) for highlights, borders of featured elements, and success-oriented micro-interactions.
- **Backgrounds:** A mix of pure white (#FFFFFF) for readability and light grey (#F8F9FA) for subtle section differentiation.
- **Gradients:** Use linear gradients (135°) from the primary blue to a slightly lighter tint for interactive surfaces to add depth.

## Typography

This design system prioritizes bilingual legibility. **Noto Sans** provides a clean, neutral grotesque aesthetic for French/Latin scripts, while **Noto Naskh Arabic** offers a contemporary yet traditional feel for Arabic scripts.

- **Weight Scaling:** Headlines use SemiBold (600) or Bold (700) to command authority. Body text stays at Regular (400) for prolonged reading comfort.
- **Bi-directional Support:** Line heights for Arabic levels are slightly increased to accommodate the script's ascending and descending strokes without crowding. 
- **Hierarchy:** Use the Gold accent color sparingly on labels to denote importance or status.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model with generous whitespace to facilitate focus.

- **Grid:** A 12-column grid for desktop (max-width 1440px) and a 4-column grid for mobile.
- **RTL/LTR:** Layouts must mirror horizontally when switching languages. Navigation bars should move from left-aligned (French) to right-aligned (Arabic).
- **Rhythm:** An 8px base unit drives all spacing. For "Executive" density, use `lg` (48px) spacing between major sections to prevent visual clutter and maintain a premium, airy feel.

## Elevation & Depth

Visual hierarchy is established through **Glassmorphism** and **Elevation-2** shadows.

- **Surfaces:** Use backdrop-blur (12px to 20px) on navigation bars and floating modals. Backgrounds should be semi-transparent white (e.g., `rgba(255, 255, 255, 0.7)`).
- **Shadows:** Utilize soft, ambient shadows. Elevation-2 is defined as `0px 4px 20px rgba(0, 33, 71, 0.08)`, using the primary blue for the shadow tint to maintain color harmony.
- **Borders:** Subtle 1px borders in Refined Gold or light grey help define container edges on high-contrast surfaces without adding weight.

## Shapes

The design system utilizes **ROUND_EIGHT** (0.5rem/8px) as the standard corner radius. 

- **Standard Elements:** Buttons, cards, and input fields all utilize the 8px radius to balance professional rigidity with modern softness.
- **Large Containers:** Dashboard widgets or hero sections may scale to `rounded-lg` (16px) to emphasize a "contained" and safe environment.
- **Icons:** Should follow a medium-stroke weight with slightly rounded terminals to match the font geometry.

## Components

- **Buttons:** Primary buttons are solid Deep Blue with white text. Secondary buttons use a Refined Gold border with a subtle glass effect background.
- **Cards:** White or frosted-glass backgrounds with an Elevation-2 shadow. On hover, the border transitions to a 1px Refined Gold stroke.
- **Input Fields:** Minimalist design with a 1px bottom border that expands to a full 8px-rounded container on focus, highlighted by a Gold glow.
- **Chips/Badges:** Small, pill-shaped markers using highly desaturated versions of the primary/secondary colors for status (e.g., "Enrolled", "Distinction").
- **Navigation:** A top-pinned glassmorphic bar that reflects the background color of the content scrolling beneath it, ensuring the "Executive" feel remains constant.
- **Data Tables:** High-contrast headers in Deep Blue with refined, thin horizontal dividers and ample cell padding for readability.