import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: '교권119 - 교사의 권리, 우리가 지킵니다',
    template: '%s | 교권119'
  },
  description: '교권 보호를 위한 신고 및 법률 상담 시스템. 교권침해 신고, 법률 상담, 자료 공유를 통해 교사의 권익을 보호합니다.',
  keywords: [
    '교권보호',
    '교사권리',
    '교권침해',
    '법률상담',
    '교육법',
    '교권119',
    '교사지원',
    '교육공무원',
    '학교폭력',
    '교권신고'
  ],
  authors: [
    { name: '교권119', url: 'https://kyokwon119.com' }
  ],
  creator: '교권119',
  publisher: '교권119',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://kyokwon119.com'),
  alternates: {
    canonical: '/',
    languages: {
      'ko-KR': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    title: '교권119 - 교사의 권리, 우리가 지킵니다',
    description: '교권 보호를 위한 신고 및 법률 상담 시스템. 교권침해 신고, 법률 상담, 자료 공유를 통해 교사의 권익을 보호합니다.',
    siteName: '교권119',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '교권119 - 교사의 권리 보호 시스템',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '교권119 - 교사의 권리, 우리가 지킵니다',
    description: '교권 보호를 위한 신고 및 법률 상담 시스템',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: {
      'naver-site-verification': process.env.NAVER_SITE_VERIFICATION || '',
    },
  },
  category: 'education',
  classification: 'education, legal, protection',
  referrer: 'origin-when-cross-origin',
  applicationName: '교권119',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '교권119',
    startupImage: [
      {
        url: '/icons/icon-192x192.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/apple-touch-icon.png',
      },
    ],
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FB923C' },
    { media: '(prefers-color-scheme: dark)', color: '#1F2937' }
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': '교권119',
    'msapplication-TileColor': '#FB923C',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#FB923C',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}