/** @type {import('tailwindcss').Config} */
// @MX:NOTE: [AUTO] Design token foundation for SPEC-UI-001. Primary scale centered on #FF7210 (kyokwon119 brand).
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // shadcn 표준 시맨틱 토큰 (CSS 변수 매핑)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          // Primary 스케일 (#FF7210 중심, 교권119 브랜드 컬러)
          50:  "rgb(var(--primary-50) / <alpha-value>)",
          100: "rgb(var(--primary-100) / <alpha-value>)",
          200: "rgb(var(--primary-200) / <alpha-value>)",
          300: "rgb(var(--primary-300) / <alpha-value>)",
          400: "rgb(var(--primary-400) / <alpha-value>)",
          500: "rgb(var(--primary-500) / <alpha-value>)",
          600: "rgb(var(--primary-600) / <alpha-value>)",
          700: "rgb(var(--primary-700) / <alpha-value>)",
          800: "rgb(var(--primary-800) / <alpha-value>)",
          900: "rgb(var(--primary-900) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Neutral 스케일 (warm stone — pure gray 대신 사용)
        neutral: {
          50:  "rgb(var(--neutral-50) / <alpha-value>)",
          100: "rgb(var(--neutral-100) / <alpha-value>)",
          200: "rgb(var(--neutral-200) / <alpha-value>)",
          300: "rgb(var(--neutral-300) / <alpha-value>)",
          400: "rgb(var(--neutral-400) / <alpha-value>)",
          500: "rgb(var(--neutral-500) / <alpha-value>)",
          600: "rgb(var(--neutral-600) / <alpha-value>)",
          700: "rgb(var(--neutral-700) / <alpha-value>)",
          800: "rgb(var(--neutral-800) / <alpha-value>)",
          900: "rgb(var(--neutral-900) / <alpha-value>)",
          950: "rgb(var(--neutral-950) / <alpha-value>)",
        },
        // Semantic 컬러 (success/warning/error/info)
        success: {
          50:  "rgb(var(--success-50) / <alpha-value>)",
          100: "rgb(var(--success-100) / <alpha-value>)",
          200: "rgb(var(--success-200) / <alpha-value>)",
          300: "rgb(var(--success-300) / <alpha-value>)",
          400: "rgb(var(--success-400) / <alpha-value>)",
          500: "rgb(var(--success-500) / <alpha-value>)",
          600: "rgb(var(--success-600) / <alpha-value>)",
          700: "rgb(var(--success-700) / <alpha-value>)",
          800: "rgb(var(--success-800) / <alpha-value>)",
          900: "rgb(var(--success-900) / <alpha-value>)",
          950: "rgb(var(--success-950) / <alpha-value>)",
          DEFAULT: "rgb(var(--success-500) / <alpha-value>)",
          foreground: "rgb(var(--success-foreground) / <alpha-value>)",
        },
        warning: {
          50:  "rgb(var(--warning-50) / <alpha-value>)",
          100: "rgb(var(--warning-100) / <alpha-value>)",
          200: "rgb(var(--warning-200) / <alpha-value>)",
          300: "rgb(var(--warning-300) / <alpha-value>)",
          400: "rgb(var(--warning-400) / <alpha-value>)",
          500: "rgb(var(--warning-500) / <alpha-value>)",
          600: "rgb(var(--warning-600) / <alpha-value>)",
          700: "rgb(var(--warning-700) / <alpha-value>)",
          800: "rgb(var(--warning-800) / <alpha-value>)",
          900: "rgb(var(--warning-900) / <alpha-value>)",
          950: "rgb(var(--warning-950) / <alpha-value>)",
          DEFAULT: "rgb(var(--warning-500) / <alpha-value>)",
          foreground: "rgb(var(--warning-foreground) / <alpha-value>)",
        },
        error: {
          50:  "rgb(var(--error-50) / <alpha-value>)",
          100: "rgb(var(--error-100) / <alpha-value>)",
          200: "rgb(var(--error-200) / <alpha-value>)",
          300: "rgb(var(--error-300) / <alpha-value>)",
          400: "rgb(var(--error-400) / <alpha-value>)",
          500: "rgb(var(--error-500) / <alpha-value>)",
          600: "rgb(var(--error-600) / <alpha-value>)",
          700: "rgb(var(--error-700) / <alpha-value>)",
          800: "rgb(var(--error-800) / <alpha-value>)",
          900: "rgb(var(--error-900) / <alpha-value>)",
          950: "rgb(var(--error-950) / <alpha-value>)",
          DEFAULT: "rgb(var(--error-500) / <alpha-value>)",
          foreground: "rgb(var(--error-foreground) / <alpha-value>)",
        },
        info: {
          50:  "rgb(var(--info-50) / <alpha-value>)",
          100: "rgb(var(--info-100) / <alpha-value>)",
          200: "rgb(var(--info-200) / <alpha-value>)",
          300: "rgb(var(--info-300) / <alpha-value>)",
          400: "rgb(var(--info-400) / <alpha-value>)",
          500: "rgb(var(--info-500) / <alpha-value>)",
          600: "rgb(var(--info-600) / <alpha-value>)",
          700: "rgb(var(--info-700) / <alpha-value>)",
          800: "rgb(var(--info-800) / <alpha-value>)",
          900: "rgb(var(--info-900) / <alpha-value>)",
          950: "rgb(var(--info-950) / <alpha-value>)",
          DEFAULT: "rgb(var(--info-500) / <alpha-value>)",
          foreground: "rgb(var(--info-foreground) / <alpha-value>)",
        },
        // Accent (indigo, teal) — 상태 표시용
        indigo: {
          50:  "rgb(var(--info-50) / <alpha-value>)",
          500: "rgb(var(--info-500) / <alpha-value>)",
          600: "rgb(var(--info-600) / <alpha-value>)",
          700: "rgb(var(--info-700) / <alpha-value>)",
        },
        teal: {
          50:  "rgb(var(--teal-50) / <alpha-value>)",
          500: "rgb(var(--teal-500) / <alpha-value>)",
          600: "rgb(var(--teal-600) / <alpha-value>)",
          700: "rgb(var(--teal-700) / <alpha-value>)",
        },
        // Legacy 호환 별칭 (protection=info, urgent=error, trust=success)
        // @MX:NOTE: [AUTO] 기존 컴포넌트 호환용 alias. 신규 코드는 semantic 컬러(info/error/success) 직접 사용.
        protection: {
          50:  "rgb(var(--info-50) / <alpha-value>)",
          100: "rgb(var(--info-100) / <alpha-value>)",
          200: "rgb(var(--info-200) / <alpha-value>)",
          300: "rgb(var(--info-300) / <alpha-value>)",
          400: "rgb(var(--info-400) / <alpha-value>)",
          500: "rgb(var(--info-500) / <alpha-value>)",
          600: "rgb(var(--info-600) / <alpha-value>)",
          700: "rgb(var(--info-700) / <alpha-value>)",
          800: "rgb(var(--info-800) / <alpha-value>)",
          900: "rgb(var(--info-900) / <alpha-value>)",
          950: "rgb(var(--info-950) / <alpha-value>)",
          DEFAULT: "rgb(var(--info-600) / <alpha-value>)",
        },
        urgent: {
          50:  "rgb(var(--error-50) / <alpha-value>)",
          100: "rgb(var(--error-100) / <alpha-value>)",
          200: "rgb(var(--error-200) / <alpha-value>)",
          300: "rgb(var(--error-300) / <alpha-value>)",
          400: "rgb(var(--error-400) / <alpha-value>)",
          500: "rgb(var(--error-500) / <alpha-value>)",
          600: "rgb(var(--error-600) / <alpha-value>)",
          700: "rgb(var(--error-700) / <alpha-value>)",
          800: "rgb(var(--error-800) / <alpha-value>)",
          900: "rgb(var(--error-900) / <alpha-value>)",
          950: "rgb(var(--error-950) / <alpha-value>)",
          DEFAULT: "rgb(var(--error-600) / <alpha-value>)",
        },
        trust: {
          50:  "rgb(var(--success-50) / <alpha-value>)",
          100: "rgb(var(--success-100) / <alpha-value>)",
          200: "rgb(var(--success-200) / <alpha-value>)",
          300: "rgb(var(--success-300) / <alpha-value>)",
          400: "rgb(var(--success-400) / <alpha-value>)",
          500: "rgb(var(--success-500) / <alpha-value>)",
          600: "rgb(var(--success-600) / <alpha-value>)",
          700: "rgb(var(--success-700) / <alpha-value>)",
          800: "rgb(var(--success-800) / <alpha-value>)",
          900: "rgb(var(--success-900) / <alpha-value>)",
          950: "rgb(var(--success-950) / <alpha-value>)",
          DEFAULT: "rgb(var(--success-600) / <alpha-value>)",
        },
      },
      borderRadius: {
        // 디자인 토큰 기반 radius 스케일
        sm: "var(--radius-sm)",       // 6px
        md: "var(--radius-md)",       // 8px
        lg: "var(--radius-lg)",       // 12px
        xl: "var(--radius-xl)",       // 16px
      },
      fontFamily: {
        // Pretendard(한글 최적화) + Inter(영문) + 시스템 폴백
        sans: [
          'Pretendard Variable',
          'Pretendard',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Apple SD Gothic Neo',
          'Malgun Gothic',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
      },
      fontSize: {
        // 디자인 토큰 타이포그래피 스케일 [size, lineHeight]
        'display': ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '-0.02em', fontWeight: '700' }], // 36/44
        'h1':      ['1.875rem', { lineHeight: '2.375rem', letterSpacing: '-0.02em', fontWeight: '700' }], // 30/38
        'h2':      ['1.5rem',   { lineHeight: '2rem',    letterSpacing: '-0.015em', fontWeight: '600' }], // 24/32
        'h3':      ['1.25rem',  { lineHeight: '1.75rem', letterSpacing: '-0.01em',  fontWeight: '600' }], // 20/28
        'body':    ['1rem',     { lineHeight: '1.5rem',  fontWeight: '400' }], // 16/24
        'small':   ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }], // 14/20
        'caption': ['0.75rem',  { lineHeight: '1rem',    fontWeight: '500' }], // 12/16
      },
      boxShadow: {
        // Linear-style 매우 부드러운 그림자
        'xs': '0 1px 2px rgba(0,0,0,0.04)',
        'sm': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'md': '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.04)',
        'lg': '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)',
        'xl': '0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.03)',
        '2xl': '0 25px 50px -12px rgba(0,0,0,0.15)',
      },
      zIndex: {
        // 레이어 순서 (토큰 표준화)
        'dropdown': '1000',
        'sticky':   '1020',
        'modal':    '1040',
        'popover':  '1060',
        'tooltip':  '1080',
        'toast':    '1100',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
