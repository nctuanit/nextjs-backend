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
