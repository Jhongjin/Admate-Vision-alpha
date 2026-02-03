# Design Token Specification

옥외 광고 게재 현황 자동 보고 툴 — Color Palette & Typography System

---

## Color Palette

### Primary
| Token     | Hex       | Usage |
|----------|-----------|--------|
| primary-50  | `#EEF2FF` | Light backgrounds, hover states |
| primary-100 | `#E0E7FF` | Subtle fills |
| primary-200 | `#C7D2FE` | Borders, dividers |
| primary-300 | `#A5B4FC` | Disabled or secondary emphasis |
| primary-400 | `#818CF8` | Default primary (buttons, links) |
| primary-500 | `#6366F1` | Primary brand, key CTAs |

**Guidelines:** Use primary-400/500 for main actions and navigation. Use 50–200 for backgrounds and borders.

### Secondary
| Token        | Hex       | Usage |
|-------------|-----------|--------|
| secondary-50  | `#F8FAFC` | Page/section backgrounds |
| secondary-100 | `#F1F5F9` | Card backgrounds |
| secondary-200 | `#E2E8F0` | Borders, separators |
| secondary-300 | `#CBD5E1` | Placeholder, disabled text |
| secondary-400 | `#94A3B8` | Secondary text, icons |
| secondary-500 | `#64748B` | Body secondary text |

**Guidelines:** Use for supporting UI (cards, panels, secondary text). Keeps focus on primary actions.

### Accent
| Token   | Hex       | Usage |
|--------|-----------|--------|
| accent-400 | `#22D3EE` | Highlights, badges, success |
| accent-500 | `#06B6D4` | Links, info, active states |

**Guidelines:** Use sparingly for emphasis, success states, and informational highlights.

### Grayscale
| Token   | Hex       |
|--------|-----------|
| gray-50  | `#FAFAFA` |
| gray-100 | `#F4F4F5` |
| gray-200 | `#E4E4E7` |
| gray-300 | `#D4D4D8` |
| gray-400 | `#A1A1AA` |
| gray-500 | `#71717A` |
| gray-600 | `#52525B` |
| gray-700 | `#3F3F46` |
| gray-800 | `#27272A` |
| gray-900 | `#18181B` |

---

## Typography & Font

### Font Families
- **Primary:** `"Pretendard Variable", "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, sans-serif`
- **Fallback:** `ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`

**Usage:** Primary stack for all UI text (Korean + Latin). Fallback for systems without Pretendard.

### Font Sizes
| Style | rem | px (16px base) | Usage |
|-------|-----|----------------|--------|
| xs    | 0.75rem | 12px | Captions, labels, overlines |
| sm    | 0.875rem | 14px | Secondary text, table cells |
| base  | 1rem    | 16px | Body text |
| lg    | 1.125rem | 18px | Lead paragraphs, section intros |
| xl    | 1.25rem | 20px | H4, card titles |
| 2xl   | 1.5rem  | 24px | H3 |
| 3xl   | 1.875rem | 30px | H2 |
| 4xl   | 2.25rem | 36px | H1 |

### Font Weights
| Name    | Value | Usage |
|---------|-------|--------|
| light   | 300   | Decorative, large headings |
| regular | 400   | Body text |
| medium  | 500   | Emphasis, labels |
| semibold| 600   | Subheadings, buttons |
| bold    | 700   | Headings, strong emphasis |

### Line Heights & Letter Spacing
| Style | Line Height | Letter Spacing | Use for |
|-------|-------------|----------------|---------|
| xs    | 1rem (16px)   | 0.01em | text-xs |
| sm    | 1.25rem (20px) | 0 | text-sm |
| base  | 1.5rem (24px)  | 0 | text-base |
| lg    | 1.75rem (28px) | -0.01em | text-lg |
| xl    | 1.75rem (28px) | -0.02em | text-xl |
| 2xl   | 2rem (32px)    | -0.02em | text-2xl |
| 3xl   | 2.25rem (36px) | -0.02em | text-3xl |
| 4xl   | 2.5rem (40px)  | -0.02em | text-4xl |

---

## Tailwind CSS Theme (JSON snippet)

Tailwind v3 `theme.extend` 형식으로 병합 가능한 JSON:

```json
{
  "colors": {
    "primary": {
      "50": "#EEF2FF",
      "100": "#E0E7FF",
      "200": "#C7D2FE",
      "300": "#A5B4FC",
      "400": "#818CF8",
      "500": "#6366F1"
    },
    "secondary": {
      "50": "#F8FAFC",
      "100": "#F1F5F9",
      "200": "#E2E8F0",
      "300": "#CBD5E1",
      "400": "#94A3B8",
      "500": "#64748B"
    },
    "accent": {
      "400": "#22D3EE",
      "500": "#06B6D4"
    },
    "gray": {
      "50": "#FAFAFA",
      "100": "#F4F4F5",
      "200": "#E4E4E7",
      "300": "#D4D4D8",
      "400": "#A1A1AA",
      "500": "#71717A",
      "600": "#52525B",
      "700": "#3F3F46",
      "800": "#27272A",
      "900": "#18181B"
    }
  },
  "fontFamily": {
    "sans": [
      "\"Pretendard Variable\", \"Pretendard\", -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    ]
  },
  "fontSize": {
    "xs": ["0.75rem", { "lineHeight": "1rem", "letterSpacing": "0.01em" }],
    "sm": ["0.875rem", { "lineHeight": "1.25rem", "letterSpacing": "0" }],
    "base": ["1rem", { "lineHeight": "1.5rem", "letterSpacing": "0" }],
    "lg": ["1.125rem", { "lineHeight": "1.75rem", "letterSpacing": "-0.01em" }],
    "xl": ["1.25rem", { "lineHeight": "1.75rem", "letterSpacing": "-0.02em" }],
    "2xl": ["1.5rem", { "lineHeight": "2rem", "letterSpacing": "-0.02em" }],
    "3xl": ["1.875rem", { "lineHeight": "2.25rem", "letterSpacing": "-0.02em" }],
    "4xl": ["2.25rem", { "lineHeight": "2.5rem", "letterSpacing": "-0.02em" }]
  },
  "fontWeight": {
    "light": "300",
    "normal": "400",
    "medium": "500",
    "semibold": "600",
    "bold": "700"
  }
}
```

Tailwind v4에서는 위 토큰을 `globals.css`의 `@theme` 및 `:root`에 CSS 변수로 적용하여 사용합니다.
