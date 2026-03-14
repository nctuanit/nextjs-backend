import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DocsLayout } from "./components/layout/DocsLayout";

import { 
  IntroPage, FirstStepsPage, NextjsIntegrationPage,
  ControllersPage, ProvidersPage, ModulesPage,
  GuardsPage, InterceptorsPage, PipesPage, ExceptionsPage,
  OpenAPIPage, LoggerPage, ConfigModulePage, JwtAuthPage,
  CacheModulePage, GlobalMiddlewarePage, WebSocketGatewayPage,
  DevModePage
} from "./pages";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DocsLayout />}>
          <Route index element={<IntroPage />} />
          <Route path="first-steps" element={<FirstStepsPage />} />
          <Route path="nextjs-integration" element={<NextjsIntegrationPage />} />
          <Route path="controllers" element={<ControllersPage />} />
          <Route path="providers" element={<ProvidersPage />} />
          <Route path="modules" element={<ModulesPage />} />
          <Route path="guards" element={<GuardsPage />} />
          <Route path="interceptors" element={<InterceptorsPage />} />
          <Route path="pipes" element={<PipesPage />} />
          <Route path="exceptions" element={<ExceptionsPage />} />
          <Route path="openapi" element={<OpenAPIPage />} />
          <Route path="logger" element={<LoggerPage />} />
          <Route path="config-module" element={<ConfigModulePage />} />
          <Route path="jwt-auth" element={<JwtAuthPage />} />
          <Route path="cache-module" element={<CacheModulePage />} />
          <Route path="global-middleware" element={<GlobalMiddlewarePage />} />
          <Route path="websocket-gateway" element={<WebSocketGatewayPage />} />
          <Route path="dev-mode" element={<DevModePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
