# AdMate Vision Design System
> Created by Stitch AI Designer 'Youngja'

## 1. Brand Identity
- **Keywords**: Trustworthy, Professional, Automated, Premium
- **Concept**: "Visionary Tech" - Clean lines, deep colors with vibrant accents, glassmorphism effects.

## 2. Color Palette (Tailwind CSS)

### Primary Colors (Trust & Action)
- **Primary (Indigo)**: `#6366f1` (`indigo-500`) - Main buttons, active states, key branding.
- **Primary-Dark**: `#4f46e5` (`indigo-600`) - Hover states.
- **Primary-Light**: `#eef2ff` (`indigo-50`) - Background tints.

### Secondary Colors (Structure & Text)
- **Background**: `#ffffff` (White) / `#0f172a` (Slate-900 for Dark mode)
- **Surface**: `#f8fafc` (Slate-50) / `#1e293b` (Slate-800 for Dark mode)
- **Text-Main**: `#0f172a` (Slate-900)
- **Text-Sub**: `#64748b` (Slate-500)

### Accent Colors (Highlights)
- **Accent (Cyan)**: `#06b6d4` (`cyan-500`) - Gradients, icons, special highlights.
- **Gradient**: `from-indigo-500 to-cyan-400`

## 3. Typography
- **Font Family**: `Pretendard`, system-ui, sans-serif
- **Headings**: `font-bold tracking-tight`
- **Body**: `font-medium text-slate-600`

## 4. UI Components & Patterns

### 4.1. Buttons
- **Shape**: `rounded-lg` or `rounded-full`
- **Style (Primary)**: `bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20`
- **Style (Gradient)**: `bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg`

### 4.2. Cards (Glassmorphism)
- **Background**: `bg-white` (Light) or `bg-slate-900/50` (Dark)
- **Effect**: `backdrop-blur-md border border-slate-200/50`
- **Shadow**: `shadow-xl shadow-slate-200/50`
- **Radius**: `rounded-2xl`

### 4.3. Hero Section
- **Layout**: Large video/image area (5:3 ratio).
- **Overlay**: Gradient overlay `bg-gradient-to-t from-slate-900/80 to-transparent`.
- **Content**: White text on overlay, centered alignment.

### 4.4. Inputs & Forms
- **Style**: `bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500/20`
- **Radius**: `rounded-lg`

## 5. Layout Rules
- **Container**: Mobile-first, max-width constrained for readability on desktop.
- **Spacing**: Generous padding (`py-12`, `gap-6`) to create a "Premium" feel.
