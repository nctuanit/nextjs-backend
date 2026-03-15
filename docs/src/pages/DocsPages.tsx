import { MarkdownRenderer } from "../components/MarkdownRenderer";

import introRaw from "../content/intro.mdx" with { type: "text" };
import firstStepsRaw from "../content/first-steps.mdx" with { type: "text" };
import controllersRaw from "../content/controllers.mdx" with { type: "text" };
import providersRaw from "../content/providers.mdx" with { type: "text" };
import modulesRaw from "../content/modules.mdx" with { type: "text" };
import guardsRaw from "../content/guards.mdx" with { type: "text" };
import interceptorsRaw from "../content/interceptors.mdx" with { type: "text" };
import pipesRaw from "../content/pipes.mdx" with { type: "text" };
import exceptionsRaw from "../content/exceptions.mdx" with { type: "text" };
import openapiRaw from "../content/openapi.mdx" with { type: "text" };
import nextjsIntegrationRaw from "../content/nextjs-integration.mdx" with { type: "text" };
import loggerRaw from "../content/logger.mdx" with { type: "text" };
import configModuleRaw from "../content/config-module.mdx" with { type: "text" };
import jwtAuthRaw from "../content/jwt-auth.mdx" with { type: "text" };
import cacheModuleRaw from "../content/cache-module.mdx" with { type: "text" };
import globalMiddlewareRaw from "../content/global-middleware.mdx" with { type: "text" };
import websocketGatewayRaw from "../content/websocket-gateway.mdx" with { type: "text" };
import devModeRaw from "../content/dev-mode.mdx" with { type: "text" };
import sessionModuleRaw from "../content/session-module.mdx" with { type: "text" };
import pipelinesRaw from "../content/pipelines.mdx" with { type: "text" };

// New pages
import cliRaw from "../content/cli.mdx" with { type: "text" };
import testingRaw from "../content/testing.mdx" with { type: "text" };
import scheduleEventsRaw from "../content/schedule-events.mdx" with { type: "text" };
import healthModuleRaw from "../content/health-module.mdx" with { type: "text" };
import throttleMiddlewareRaw from "../content/throttle-middleware.mdx" with { type: "text" };
import edenTreatyRaw from "../content/eden-treaty.mdx" with { type: "text" };
import nextauthRaw from "../content/nextauth.mdx" with { type: "text" };
import sseRaw from "../content/sse.mdx" with { type: "text" };

// AI Module pages
import aiModuleRaw from "../content/ai-module.mdx" with { type: "text" };
import aiMemoryWorkflowRaw from "../content/ai-memory-workflow.mdx" with { type: "text" };
import aiPluginsRaw from "../content/ai-plugins.mdx" with { type: "text" };
import aiA2aRaw from "../content/ai-a2a.mdx" with { type: "text" };

export function IntroPage() { return <MarkdownRenderer content={introRaw as unknown as string} />; }
export function FirstStepsPage() { return <MarkdownRenderer content={firstStepsRaw as unknown as string} />; }
export function NextjsIntegrationPage() { return <MarkdownRenderer content={nextjsIntegrationRaw as unknown as string} />; }
export function ControllersPage() { return <MarkdownRenderer content={controllersRaw as unknown as string} />; }
export function ProvidersPage() { return <MarkdownRenderer content={providersRaw as unknown as string} />; }
export function ModulesPage() { return <MarkdownRenderer content={modulesRaw as unknown as string} />; }
export function GuardsPage() { return <MarkdownRenderer content={guardsRaw as unknown as string} />; }
export function InterceptorsPage() { return <MarkdownRenderer content={interceptorsRaw as unknown as string} />; }
export function PipesPage() { return <MarkdownRenderer content={pipesRaw as unknown as string} />; }
export function ExceptionsPage() { return <MarkdownRenderer content={exceptionsRaw as unknown as string} />; }
export function OpenAPIPage() { return <MarkdownRenderer content={openapiRaw as unknown as string} />; }
export function LoggerPage() { return <MarkdownRenderer content={loggerRaw as unknown as string} />; }
export function ConfigModulePage() { return <MarkdownRenderer content={configModuleRaw as unknown as string} />; }
export function JwtAuthPage() { return <MarkdownRenderer content={jwtAuthRaw as unknown as string} />; }
export function CacheModulePage() { return <MarkdownRenderer content={cacheModuleRaw as unknown as string} />; }
export function GlobalMiddlewarePage() { return <MarkdownRenderer content={globalMiddlewareRaw as unknown as string} />; }
export function WebSocketGatewayPage() { return <MarkdownRenderer content={websocketGatewayRaw as unknown as string} />; }
export function DevModePage() { return <MarkdownRenderer content={devModeRaw as unknown as string} />; }
export function SessionModulePage() { return <MarkdownRenderer content={sessionModuleRaw as unknown as string} />; }
export function PipelinesPage() { return <MarkdownRenderer content={pipelinesRaw as unknown as string} />; }

// New pages
export function CliPage() { return <MarkdownRenderer content={cliRaw as unknown as string} />; }
export function TestingPage() { return <MarkdownRenderer content={testingRaw as unknown as string} />; }
export function ScheduleEventsPage() { return <MarkdownRenderer content={scheduleEventsRaw as unknown as string} />; }
export function HealthModulePage() { return <MarkdownRenderer content={healthModuleRaw as unknown as string} />; }
export function ThrottleMiddlewarePage() { return <MarkdownRenderer content={throttleMiddlewareRaw as unknown as string} />; }
export function EdenTreatyPage() { return <MarkdownRenderer content={edenTreatyRaw as unknown as string} />; }
export function NextAuthPage() { return <MarkdownRenderer content={nextauthRaw as unknown as string} />; }
export function SsePage() { return <MarkdownRenderer content={sseRaw as unknown as string} />; }

// AI Module pages
export function AiModulePage() { return <MarkdownRenderer content={aiModuleRaw as unknown as string} />; }
export function AiMemoryWorkflowPage() { return <MarkdownRenderer content={aiMemoryWorkflowRaw as unknown as string} />; }
export function AiPluginsPage() { return <MarkdownRenderer content={aiPluginsRaw as unknown as string} />; }
export function AiA2aPage() { return <MarkdownRenderer content={aiA2aRaw as unknown as string} />; }
