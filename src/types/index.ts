export type Page = 
  | "landing" | "auth" | "dashboard" | "chat" | "agents" 
  | "workflows" | "crm" | "analytics" | "files" | "team" 
  | "settings" | "admin";

export type Plan = "free" | "pro" | "agency";
export type UserRole = "user" | "admin" | "superadmin";
export type TeamRole = "admin" | "member" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: Plan;
  role: UserRole;
  company?: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "google";
  contextWindow: number;
  costPer1kTokens: number;
  icon: string;
}

export const AI_MODELS: AIModel[] = [
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", contextWindow: 128000, costPer1kTokens: 0.005, icon: "⚡" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", contextWindow: 128000, costPer1kTokens: 0.00015, icon: "⚡" },
  { id: "claude-sonnet-4-6", name: "Claude 3.5 Sonnet", provider: "anthropic", contextWindow: 200000, costPer1kTokens: 0.003, icon: "🧠" },
  { id: "claude-haiku-4-5-20251001", name: "Claude 3.5 Haiku", provider: "anthropic", contextWindow: 200000, costPer1kTokens: 0.00025, icon: "🧠" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "google", contextWindow: 1000000, costPer1kTokens: 0.00125, icon: "💎" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "google", contextWindow: 1000000, costPer1kTokens: 0.000075, icon: "💎" },
];

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model?: string;
  tokens?: number;
}

export interface Conversation {
  id: string;
  title: string;
  agentType?: string;
  model: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  config: Record<string, unknown>;
  color: string;
  icon: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  triggerType: string;
  nodes: WorkflowNode[];
  connections: Array<{ from: string; to: string }>;
  runCount: number;
  lastRunAt?: Date;
  createdAt: Date;
}

export interface CRMLead {
  id: string;
  company: string;
  name: string;
  email: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
  score: number;
  value: number;
  source: string;
  createdAt: Date;
}

export interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: "new" | "contacted" | "proposal" | "closed";
  probability: number;
  closeDate?: Date;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  aiSummary?: string;
  url?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: "active" | "invited" | "offline";
  avatar?: string;
  joinedAt: Date;
}

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  body?: string;
  read: boolean;
  createdAt: Date;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}
