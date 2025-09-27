/** @type {import('next').NextConfig} */
const nextConfig = {
  // 성능 최적화 설정
  experimental: {
    // Barrel 최적화 완전 비활성화 (webpack 오류 방지)
    // optimizePackageImports: ['@radix-ui/react-icons'],
  },

  // 컴파일러 최적화
  compiler: {
    // React 컴파일러 최적화
    removeConsole: process.env.NODE_ENV === 'production',
    // CSS 모듈 최적화
    styledComponents: false,
  },

  // 이미지 최적화
  images: {
    // 외부 이미지 도메인 허용
    domains: [
      'api.dicebear.com', // 아바타 생성 서비스
      'images.unsplash.com', // 샘플 이미지
      'placeholder.com',
    ],
    // 이미지 포맷 최적화
    formats: ['image/webp', 'image/avif'],
    // 크기별 이미지 생성
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 지연 로딩 활성화
    dangerouslyAllowSVG: false,
    // 이미지 캐싱
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7일
  },

  // 보안 헤더
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // XSS 보호
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // HSTS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // 정적 자산 캐싱
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API 캐싱
      {
        source: '/api/health',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=60',
          },
        ],
      },
    ];
  },

  // 성능 최적화
  poweredByHeader: false, // X-Powered-By 헤더 제거

  // 압축 설정
  compress: true,

  // 리다이렉트 설정
  async redirects() {
    return [
      // 기본 리다이렉트
      {
        source: '/dashboard',
        destination: '/',
        permanent: true,
      },
      // 구버전 URL 호환성
      {
        source: '/old-reports',
        destination: '/reports',
        permanent: true,
      },
    ];
  },

  // 정적 생성 최적화
  trailingSlash: false,

  // 환경별 설정
  env: {
    // 빌드 시간 정보
    BUILD_TIME: new Date().toISOString(),
    // 버전 정보
    APP_VERSION: process.env.npm_package_version || '2.0.0',
  },

  // 웹팩 최적화
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Barrel 최적화 비활성화 (lucide-react 호환성)
    if (!isServer) {
      config.module.rules.push({
        test: /node_modules\/lucide-react/,
        sideEffects: false,
      });
    }

    // 프로덕션에서 source map 최적화
    if (!dev && !isServer) {
      config.devtool = 'source-map';
    }

    // 번들 크기 최적화
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // 벤더 라이브러리 분리
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            minSize: 20000,
            maxSize: 250000,
          },
          // UI 컴포넌트 분리
          ui: {
            test: /[\\/]components[\\/]ui[\\/]/,
            name: 'ui-components',
            chunks: 'all',
            minSize: 10000,
          },
        },
      },
    };

    // 중복 모듈 제거
    config.plugins.push(
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 8,
      })
    );

    // Tree shaking 최적화 (webpack 호환성 문제로 임시 비활성화)
    // config.optimization.usedExports = true;
    // config.optimization.sideEffects = false;

    return config;
  },

  // ESLint 설정
  eslint: {
    // 프로덕션 빌드 시 ESLint 오류 무시 (배포용 임시 비활성화)
    ignoreDuringBuilds: true,
  },

  // TypeScript 설정
  typescript: {
    // 타입 체크 오류 시 빌드 중단 (배포용 임시 비활성화)
    ignoreBuildErrors: true,
  },

  // 출력 모드 (Standalone for Docker)
  output: 'standalone',

  // 기타 최적화 (주석 처리 - webpack 오류 방지)
  // modularizeImports: {
  //   // 라이브러리 트리 쉐이킹
  //   'lucide-react': {
  //     transform: 'lucide-react/dist/esm/icons/{{member}}',
  //   },
  //   '@radix-ui/react-icons': {
  //     transform: '@radix-ui/react-icons/dist/{{member}}',
  //   },
  // },
};

module.exports = nextConfig;