// ─── A2A Protocol Types ───────────────────────────────────────────
// Based on Google's Agent-to-Agent (A2A) open protocol
// https://google.github.io/A2A/

// ─── Agent Card ──────────────────────────────────────────────────

export interface AgentCapabilities {
  streaming?: boolean;
  pushNotifications?: boolean;
  stateTransitionHistory?: boolean;
}

export interface AgentSkill {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  examples?: string[];
  inputModes?: string[];
  outputModes?: string[];
}

export interface AgentCard {
  name: string;
  description?: string;
  url: string;
  version: string;
  capabilities: AgentCapabilities;
  skills: AgentSkill[];
  defaultInputMode?: string;
  defaultOutputMode?: string;
}

// ─── Task (A2A core resource) ─────────────────────────────────────

export type TaskState =
  | 'submitted'
  | 'working'
  | 'input-required'
  | 'completed'
  | 'canceled'
  | 'failed'
  | 'unknown';

export interface TaskStatus {
  state: TaskState;
  message?: A2AMessage;
  timestamp?: string;
}

export interface Task {
  id: string;
  sessionId?: string;
  status: TaskStatus;
  artifacts?: Artifact[];
  history?: A2AMessage[];
  metadata?: Record<string, unknown>;
}

// ─── Messages ────────────────────────────────────────────────────

export type MessageRole = 'user' | 'agent';

export interface TextPart {
  type: 'text';
  text: string;
  metadata?: Record<string, unknown>;
}

export interface FilePart {
  type: 'file';
  file: {
    name?: string;
    mimeType?: string;
    bytes?: string; // base64
    uri?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface DataPart {
  type: 'data';
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export type Part = TextPart | FilePart | DataPart;

export interface A2AMessage {
  role: MessageRole;
  parts: Part[];
  metadata?: Record<string, unknown>;
}

// ─── Artifacts ───────────────────────────────────────────────────

export interface Artifact {
  name?: string;
  description?: string;
  parts: Part[];
  index?: number;
  append?: boolean;
  lastChunk?: boolean;
  metadata?: Record<string, unknown>;
}

// ─── JSON-RPC ─────────────────────────────────────────────────────

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: T;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// ─── A2A JSON-RPC Methods ─────────────────────────────────────────

export interface TaskSendParams {
  id: string;
  sessionId?: string;
  message: A2AMessage;
  historyLength?: number;
  metadata?: Record<string, unknown>;
}

export interface TaskGetParams {
  id: string;
  historyLength?: number;
}

export interface TaskCancelParams {
  id: string;
}

// ─── Event types (SSE streaming) ──────────────────────────────────

export interface TaskStatusUpdateEvent {
  id: string;
  status: TaskStatus;
  final?: boolean;
}

export interface TaskArtifactUpdateEvent {
  id: string;
  artifact: Artifact;
}

export type A2AEvent = TaskStatusUpdateEvent | TaskArtifactUpdateEvent;
