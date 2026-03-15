import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DocsLayout } from "./components/layout/DocsLayout";

import { 
  IntroPage, FirstStepsPage, NextjsIntegrationPage,
  ControllersPage, ProvidersPage, ModulesPage,
  GuardsPage, InterceptorsPage, PipesPage, ExceptionsPage,
  OpenAPIPage, LoggerPage, ConfigModulePage, JwtAuthPage,
  CacheModulePage, GlobalMiddlewarePage, WebSocketGatewayPage,
  DevModePage, SessionModulePage, PipelinesPage,
  CliPage, TestingPage, ScheduleEventsPage, HealthModulePage,
  ThrottleMiddlewarePage, EdenTreatyPage, NextAuthPage, SsePage,
  AiModulePage, AiMemoryWorkflowPage, AiPluginsPage, AiA2aPage,
} from "./pages";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/nextjs-backend" replace />} />
        <Route path="/nextjs-backend" element={<DocsLayout />}>
          <Route index element={<IntroPage />} />
          <Route path="/nextjs-backend/first-steps" element={<FirstStepsPage />} />
          <Route path="/nextjs-backend/nextjs-integration" element={<NextjsIntegrationPage />} />
          <Route path="/nextjs-backend/controllers" element={<ControllersPage />} />
          <Route path="/nextjs-backend/providers" element={<ProvidersPage />} />
          <Route path="/nextjs-backend/modules" element={<ModulesPage />} />
          <Route path="/nextjs-backend/guards" element={<GuardsPage />} />
          <Route path="/nextjs-backend/interceptors" element={<InterceptorsPage />} />
          <Route path="/nextjs-backend/pipes" element={<PipesPage />} />
          <Route path="/nextjs-backend/exceptions" element={<ExceptionsPage />} />
          <Route path="/nextjs-backend/openapi" element={<OpenAPIPage />} />
          <Route path="/nextjs-backend/logger" element={<LoggerPage />} />
          <Route path="/nextjs-backend/config-module" element={<ConfigModulePage />} />
          <Route path="/nextjs-backend/jwt-auth" element={<JwtAuthPage />} />
          <Route path="/nextjs-backend/cache-module" element={<CacheModulePage />} />
          <Route path="/nextjs-backend/global-middleware" element={<GlobalMiddlewarePage />} />
          <Route path="/nextjs-backend/websocket-gateway" element={<WebSocketGatewayPage />} />
          <Route path="/nextjs-backend/dev-mode" element={<DevModePage />} />
          <Route path="/nextjs-backend/session-module" element={<SessionModulePage />} />
          <Route path="/nextjs-backend/pipelines" element={<PipelinesPage />} />
          {/* New pages */}
          <Route path="/nextjs-backend/cli" element={<CliPage />} />
          <Route path="/nextjs-backend/testing" element={<TestingPage />} />
          <Route path="/nextjs-backend/schedule-events" element={<ScheduleEventsPage />} />
          <Route path="/nextjs-backend/health-module" element={<HealthModulePage />} />
          <Route path="/nextjs-backend/throttle-middleware" element={<ThrottleMiddlewarePage />} />
          <Route path="/nextjs-backend/eden-treaty" element={<EdenTreatyPage />} />
          <Route path="/nextjs-backend/nextauth" element={<NextAuthPage />} />
          <Route path="/nextjs-backend/sse" element={<SsePage />} />
          {/* AI Module */}
          <Route path="/nextjs-backend/ai-module" element={<AiModulePage />} />
          <Route path="/nextjs-backend/ai-memory-workflow" element={<AiMemoryWorkflowPage />} />
          <Route path="/nextjs-backend/ai-plugins" element={<AiPluginsPage />} />
          <Route path="/nextjs-backend/ai-a2a" element={<AiA2aPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
