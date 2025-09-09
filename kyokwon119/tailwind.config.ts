import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', 'class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				'50': 'rgb(255 251 235 / <alpha-value>)',
  				'100': 'rgb(254 243 199 / <alpha-value>)',
  				'200': 'rgb(253 230 138 / <alpha-value>)',
  				'300': 'rgb(252 211 77 / <alpha-value>)',
  				'400': 'rgb(251 191 36 / <alpha-value>)',
  				'500': 'rgb(245 158 11 / <alpha-value>)',
  				'600': 'rgb(217 119 6 / <alpha-value>)',
  				'700': 'rgb(180 83 9 / <alpha-value>)',
  				'800': 'rgb(146 64 14 / <alpha-value>)',
  				'900': 'rgb(120 53 15 / <alpha-value>)',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			protection: {
  				'50': 'rgb(239 246 255 / <alpha-value>)',
  				'100': 'rgb(219 234 254 / <alpha-value>)',
  				'200': 'rgb(191 219 254 / <alpha-value>)',
  				'300': 'rgb(147 197 253 / <alpha-value>)',
  				'400': 'rgb(96 165 250 / <alpha-value>)',
  				'500': 'rgb(59 130 246 / <alpha-value>)',
  				'600': 'rgb(37 99 235 / <alpha-value>)',
  				'700': 'rgb(29 78 216 / <alpha-value>)',
  				'800': 'rgb(30 64 175 / <alpha-value>)',
  				'900': 'rgb(30 58 138 / <alpha-value>)',
  				'950': 'rgb(23 37 84 / <alpha-value>)'
  			},
  			trust: {
  				'50': 'rgb(236 253 245 / <alpha-value>)',
  				'100': 'rgb(209 250 229 / <alpha-value>)',
  				'200': 'rgb(167 243 208 / <alpha-value>)',
  				'300': 'rgb(110 231 183 / <alpha-value>)',
  				'400': 'rgb(52 211 153 / <alpha-value>)',
  				'500': 'rgb(16 185 129 / <alpha-value>)',
  				'600': 'rgb(5 150 105 / <alpha-value>)',
  				'700': 'rgb(4 120 87 / <alpha-value>)',
  				'800': 'rgb(6 95 70 / <alpha-value>)',
  				'900': 'rgb(6 78 59 / <alpha-value>)',
  				'950': 'rgb(2 44 34 / <alpha-value>)'
  			},
  			urgent: {
  				'50': 'rgb(254 242 242 / <alpha-value>)',
  				'100': 'rgb(254 226 226 / <alpha-value>)',
  				'200': 'rgb(254 202 202 / <alpha-value>)',
  				'300': 'rgb(252 165 165 / <alpha-value>)',
  				'400': 'rgb(248 113 113 / <alpha-value>)',
  				'500': 'rgb(239 68 68 / <alpha-value>)',
  				'600': 'rgb(220 38 38 / <alpha-value>)',
  				'700': 'rgb(185 28 28 / <alpha-value>)',
  				'800': 'rgb(153 27 27 / <alpha-value>)',
  				'900': 'rgb(127 29 29 / <alpha-value>)',
  				'950': 'rgb(69 10 10 / <alpha-value>)'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			xl: 'calc(var(--radius) + 4px)',
  			'2xl': 'calc(var(--radius) + 8px)'
  		},
  		fontFamily: {
  			sans: [
  				'Pretendard',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'system-ui',
  				'Roboto',
  				'Helvetica Neue',
  				'Segoe UI',
  				'Apple SD Gothic Neo',
  				'Noto Sans KR',
  				'Malgun Gothic',
  				'sans-serif'
  			]
  		},
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'slide-up': {
  				from: {
  					transform: 'translateY(16px)',
  					opacity: '0'
  				},
  				to: {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			'slide-down': {
  				from: {
  					transform: 'translateY(-16px)',
  					opacity: '0'
  				},
  				to: {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			'scale-in': {
  				from: {
  					transform: 'scale(0.95)',
  					opacity: '0'
  				},
  				to: {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			float: {
  				'0%, 100%': {
  					transform: 'translateY(0px)'
  				},
  				'50%': {
  					transform: 'translateY(-10px)'
  				}
  			},
  			glow: {
  				'0%, 100%': {
  					boxShadow: '0 0 20px rgb(var(--primary) / 0.3)'
  				},
  				'50%': {
  					boxShadow: '0 0 30px rgb(var(--primary) / 0.6)'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'slide-up': 'slide-up 0.2s ease-out',
  			'slide-down': 'slide-down 0.2s ease-out',
  			'scale-in': 'scale-in 0.2s ease-out',
  			float: 'float 6s ease-in-out infinite',
  			glow: 'glow 2s ease-in-out infinite alternate'
  		},
  		backdropBlur: {
  			xs: '2px'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;