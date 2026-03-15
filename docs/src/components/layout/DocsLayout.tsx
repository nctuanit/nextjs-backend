import { Link, Outlet, useLocation } from "react-router-dom";
import { Book, Code, Component, GitFork, Play, Shield, Layers, Box, AlertTriangle, FileJson, BookOpen, Rocket, MonitorPlay, Boxes, ShieldAlert, ArrowLeftRight, Filter, Globe, Terminal, TestTube, Timer, Heart, Zap, Radio, KeyRound, Clock, Bot, Brain, Puzzle, Network } from "lucide-react";

type NavItem = { title: string; path: string; icon?: React.ReactNode };
type NavGroup = { title: string; items: NavItem[] };

const DOCS_NAVIGATION: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { title: "Giới thiệu (Introduction)", path: "/", icon: <BookOpen className="h-4 w-4" /> },
      { title: "Tích Hợp Với Next.js", path: "/nextjs-integration", icon: <Layers className="h-4 w-4" /> },
      { title: "Bước đầu tiên (First Steps)", path: "/first-steps", icon: <Rocket className="h-4 w-4" /> },
    ]
  },
  {
    title: "Fundamentals",
    items: [
      { title: "Controllers", path: "/controllers", icon: <MonitorPlay className="h-4 w-4" /> },
      { title: "Providers", path: "/providers", icon: <Boxes className="h-4 w-4" /> },
      { title: "Modules", path: "/modules", icon: <Layers className="h-4 w-4" /> },
    ]
  },
  {
    title: "Pipelines & Handling",
    items: [
      { title: "Global Middleware", path: "/global-middleware", icon: <Layers className="h-4 w-4" /> },
      { title: "@UseMiddleware", path: "/throttle-middleware", icon: <Filter className="h-4 w-4" /> },
      { title: "Guards", path: "/guards", icon: <ShieldAlert className="h-4 w-4" /> },
      { title: "Interceptors", path: "/interceptors", icon: <ArrowLeftRight className="h-4 w-4" /> },
      { title: "Pipes", path: "/pipes", icon: <Filter className="h-4 w-4" /> },
      { title: "Exception Filters", path: "/exceptions", icon: <AlertTriangle className="h-4 w-4" /> },
    ]
  },
  {
    title: "Extensions",
    items: [
      { title: "Health Check", path: "/health-module", icon: <Heart className="h-4 w-4" /> },
      { title: "Cache Module", path: "/cache-module", icon: <Box className="h-4 w-4" /> },
      { title: "Schedule & Events", path: "/schedule-events", icon: <Clock className="h-4 w-4" /> },
      { title: "WebSocket Gateway", path: "/websocket-gateway", icon: <ArrowLeftRight className="h-4 w-4" /> },
      { title: "SSE (Server-Sent Events)", path: "/sse", icon: <Radio className="h-4 w-4" /> },
      { title: "Logger Service", path: "/logger", icon: <Layers className="h-4 w-4" /> },
      { title: "DevMode Profiler", path: "/dev-mode", icon: <MonitorPlay className="h-4 w-4" /> },
      { title: "Config Module", path: "/config-module", icon: <Box className="h-4 w-4" /> },
    ]
  },
  {
    title: "Security",
    items: [
      { title: "JWT & Authentication", path: "/jwt-auth", icon: <Shield className="h-4 w-4" /> },
      { title: "NextAuth (Auth.js)", path: "/nextauth", icon: <KeyRound className="h-4 w-4" /> },
      { title: "@Throttle (Rate Limit)", path: "/throttle-middleware", icon: <Timer className="h-4 w-4" /> },
    ]
  },
  {
    title: "Tooling",
    items: [
      { title: "CLI", path: "/cli", icon: <Terminal className="h-4 w-4" /> },
      { title: "Testing Utilities", path: "/testing", icon: <TestTube className="h-4 w-4" /> },
      { title: "Eden Treaty (Type-Safe)", path: "/eden-treaty", icon: <Zap className="h-4 w-4" /> },
      { title: "OpenAPI (Swagger)", path: "/openapi", icon: <Globe className="h-4 w-4" /> },
    ]
  },
  {
    title: "AI Module",
    items: [
      { title: "AI Module & Agents", path: "/ai-module", icon: <Bot className="h-4 w-4" /> },
      { title: "Memory & Workflow", path: "/ai-memory-workflow", icon: <Brain className="h-4 w-4" /> },
      { title: "Plugins & Testing", path: "/ai-plugins", icon: <Puzzle className="h-4 w-4" /> },
      { title: "A2A Protocol", path: "/ai-a2a", icon: <Network className="h-4 w-4" /> },
    ]
  }
];

export function DocsLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center px-8">
          <div className="flex gap-3 items-center mr-8">
            
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">Next.js Backend</span>
          </div>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link to="/" className="transition-colors hover:text-foreground/80 text-foreground/60">Documentation</Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground/80 text-foreground/60">GitHub</a>
          </nav>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="container flex-1 items-start md:grid md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)] max-w-screen-2xl px-8">
        
        {/* Left Sidebar */}
        <aside className="fixed top-16 z-30 -ml-2 hidden h-[calc(100vh-4rem)] w-full shrink-0 overflow-y-auto border-r border-border/40 py-6 pr-6 md:sticky md:block">
          <nav className="flex-1 space-y-6">
            {DOCS_NAVIGATION.map((section, idx) => (
              <div key={idx} className="space-y-3">
                <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {section.title}
                </h4>
                <div className="space-y-1">
                  {section.items.map((item, i) => {
                    const isActive = pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={`/nextjs-backend${item.path}`}
                        className={`group flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground ${
                          isActive ? "bg-primary/10 font-bold text-primary hover:bg-primary/15" : ""
                        }`}
                      >
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="relative py-10 w-full min-w-0">
          <div className="mx-auto w-full min-w-0">
            <div className="max-w-5xl mx-auto overflow-hidden">
                <Outlet />
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}
