import { defineConfig } from 'vitepress'

const enSidebar = {
  '/guide/': [
    {
      text: 'Getting Started',
      items: [
        { text: 'Introduction', link: '/guide/introduction' },
        { text: 'First Steps', link: '/guide/first-steps' },
        { text: 'Next.js Integration', link: '/guide/nextjs-integration' },
      ]
    },
    {
      text: 'Fundamentals',
      items: [
        { text: 'Controllers', link: '/guide/controllers' },
        { text: 'Providers', link: '/guide/providers' },
        { text: 'Modules', link: '/guide/modules' },
      ]
    },
    {
      text: 'Request Pipeline',
      items: [
        { text: 'Global Middleware', link: '/guide/global-middleware' },
        { text: 'Guards', link: '/guide/guards' },
        { text: 'Interceptors', link: '/guide/interceptors' },
        { text: 'Pipes', link: '/guide/pipes' },
        { text: 'Exception Filters', link: '/guide/exceptions' },
        { text: 'Custom Param Decorators', link: '/guide/custom-param-decorators' },
      ]
    },
    {
      text: 'Extensions',
      items: [
        { text: 'Cache Module', link: '/guide/cache-module' },
        { text: 'Compression Module', link: '/guide/compression-module' },
        { text: 'Schedule & Events', link: '/guide/schedule-events' },
        { text: 'WebSocket Gateway', link: '/guide/websocket-gateway' },
        { text: 'SSE', link: '/guide/sse' },
        { text: 'Config Module', link: '/guide/config-module' },
        { text: 'Logger', link: '/guide/logger' },
        { text: 'Health Check', link: '/guide/health-module' },
        { text: 'Dev Mode Profiler', link: '/guide/dev-mode' },
        { text: 'Session Module', link: '/guide/session-module' },
      ]
    },
    {
      text: 'Security',
      items: [
        { text: 'JWT & Authentication', link: '/guide/jwt-auth' },
        { text: 'NextAuth (Auth.js)', link: '/guide/nextauth' },
        { text: 'Rate Limiting', link: '/guide/throttle-middleware' },
      ]
    },
    {
      text: 'Tooling',
      items: [
        { text: 'CLI', link: '/guide/cli' },
        { text: 'Testing', link: '/guide/testing' },
        { text: 'OpenAPI (Swagger)', link: '/guide/openapi' },
        { text: 'Eden Treaty (Type-Safe)', link: '/guide/eden-treaty' },
      ]
    },
  ],
  '/ai/': [
    {
      text: 'AI Module',
      items: [
        { text: 'Overview', link: '/ai/overview' },
        { text: 'Agents & Tools', link: '/ai/agents' },
        { text: 'Memory System', link: '/ai/memory' },
        { text: 'Workflow Engine', link: '/ai/workflow' },
        { text: 'Plugins', link: '/ai/plugins' },
        { text: 'Structured Output', link: '/ai/structured-output' },
        { text: 'A2A Protocol', link: '/ai/a2a' },
        { text: 'Testing AI', link: '/ai/testing' },
      ]
    }
  ]
}

const viSidebar = {
  '/vi/guide/': [
    {
      text: 'Bắt Đầu',
      items: [
        { text: 'Giới Thiệu', link: '/vi/guide/introduction' },
        { text: 'Những Bước Đầu', link: '/vi/guide/first-steps' },
        { text: 'Tích Hợp Next.js', link: '/vi/guide/nextjs-integration' },
      ]
    },
    {
      text: 'Nền Tảng',
      items: [
        { text: 'Controllers', link: '/vi/guide/controllers' },
        { text: 'Providers', link: '/vi/guide/providers' },
        { text: 'Modules', link: '/vi/guide/modules' },
      ]
    },
    {
      text: 'Request Pipeline',
      items: [
        { text: 'Global Middleware', link: '/vi/guide/global-middleware' },
        { text: 'Guards (Bảo Vệ)', link: '/vi/guide/guards' },
        { text: 'Interceptors', link: '/vi/guide/interceptors' },
        { text: 'Pipes', link: '/vi/guide/pipes' },
        { text: 'Exception Filters', link: '/vi/guide/exceptions' },
        { text: 'Custom Param Decorators', link: '/vi/guide/custom-param-decorators' },
      ]
    },
    {
      text: 'Mở Rộng',
      items: [
        { text: 'Cache Module', link: '/vi/guide/cache-module' },
        { text: 'Compression Module', link: '/vi/guide/compression-module' },
        { text: 'Schedule & Events', link: '/vi/guide/schedule-events' },
        { text: 'WebSocket Gateway', link: '/vi/guide/websocket-gateway' },
        { text: 'SSE', link: '/vi/guide/sse' },
        { text: 'Config Module', link: '/vi/guide/config-module' },
        { text: 'Logger', link: '/vi/guide/logger' },
        { text: 'Health Check', link: '/vi/guide/health-module' },
        { text: 'Dev Mode Profiler', link: '/vi/guide/dev-mode' },
        { text: 'Session Module', link: '/vi/guide/session-module' },
      ]
    },
    {
      text: 'Bảo Mật',
      items: [
        { text: 'JWT & Authentication', link: '/vi/guide/jwt-auth' },
        { text: 'NextAuth (Auth.js)', link: '/vi/guide/nextauth' },
        { text: 'Rate Limiting', link: '/vi/guide/throttle-middleware' },
      ]
    },
    {
      text: 'Công Cụ',
      items: [
        { text: 'CLI', link: '/vi/guide/cli' },
        { text: 'Testing', link: '/vi/guide/testing' },
        { text: 'OpenAPI (Swagger)', link: '/vi/guide/openapi' },
        { text: 'Eden Treaty (Type-Safe)', link: '/vi/guide/eden-treaty' },
      ]
    },
  ],
  '/vi/ai/': [
    {
      text: 'AI Module',
      items: [
        { text: 'Tổng Quan', link: '/vi/ai/overview' },
        { text: 'Agents & Tools', link: '/vi/ai/agents' },
        { text: 'Hệ Thống Memory', link: '/vi/ai/memory' },
        { text: 'Workflow Engine', link: '/vi/ai/workflow' },
        { text: 'Plugins', link: '/vi/ai/plugins' },
        { text: 'Structured Output', link: '/vi/ai/structured-output' },
        { text: 'Giao Thức A2A', link: '/vi/ai/a2a' },
        { text: 'Testing AI', link: '/vi/ai/testing' },
      ]
    }
  ]
}

export default defineConfig({
  title: 'Next.js Backend',
  description: 'NestJS-style architecture for Bun & Node.js with ElysiaJS',
  base: '/nextjs-backend/',

  head: [
    ['link', { rel: 'icon', href: '/nextjs-backend/favicon.ico' }],
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/introduction' },
          { text: 'AI Module', link: '/ai/overview' },
          {
            text: 'v2.1',
            items: [
              { text: 'Changelog', link: '/changelog' },
              { text: 'npm', link: 'https://www.npmjs.com/package/next-js-backend' },
            ]
          }
        ],
        sidebar: enSidebar,
      }
    },
    vi: {
      label: 'Tiếng Việt',
      lang: 'vi',
      link: '/vi/',
      themeConfig: {
        nav: [
          { text: 'Hướng Dẫn', link: '/vi/guide/introduction' },
          { text: 'AI Module', link: '/vi/ai/overview' },
          {
            text: 'v2.1',
            items: [
              { text: 'Changelog', link: '/vi/changelog' },
              { text: 'npm', link: 'https://www.npmjs.com/package/next-js-backend' },
            ]
          }
        ],
        sidebar: viSidebar,
        outlineTitle: 'Trên trang này',
        returnToTopLabel: 'Về đầu trang',
        sidebarMenuLabel: 'Danh Mục',
        darkModeSwitchLabel: 'Giao Diện',
        langMenuLabel: 'Ngôn Ngữ',
        lastUpdatedText: 'Cập nhật lần cuối',
      }
    }
  },

  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'Next.js Backend',

    socialLinks: [
      { icon: 'github', link: 'https://github.com/nctuanit/nextjs-backend' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present nctuanit'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/nctuanit/nextjs-backend/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  }
})
