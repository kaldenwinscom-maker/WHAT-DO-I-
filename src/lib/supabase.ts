import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  company: string | null;
  role: "user" | "admin" | "superadmin";
  plan: "free" | "pro" | "agency";
  plan_expires_at: string | null;
  stripe_customer_id: string | null;
  onboarded: boolean;
  preferences: Record<string, unknown>;
  created_at: string;
};

export type Conversation = {
  id: string;
  user_id: string;
  agent_id: string | null;
  title: string | null;
  model: string;
  message_count: number;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model: string | null;
  tokens_used: number;
  created_at: string;
};

export type AIAgent = {
  id: string;
  name: string;
  type: string;
  description: string;
  emoji: string;
  color: string;
  model: string;
  system_prompt: string;
  total_messages: number;
  is_public: boolean;
  created_at: string;
};
