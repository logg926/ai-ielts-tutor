import { z } from "zod";

// Define the allowed moderation categories only once
export const MODERATION_CATEGORIES = [
  "OFFENSIVE",
  "OFF_BRAND",
  "VIOLENCE",
  "NONE",
] as const;

// Derive the union type for ModerationCategory from the array
export type ModerationCategory = (typeof MODERATION_CATEGORIES)[number];

// Create a Zod enum based on the same array
export const ModerationCategoryZod = z.enum([...MODERATION_CATEGORIES]);

export type SessionStatus = 'idle' | 'connecting' | 'connected' | 'error'

export interface TranscriptItem {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  type: 'text' | 'audio'
}

export interface LoggedEvent {
  id: string
  timestamp: Date
  type: string
  data: any
}

export interface Tool {
  type: string
  function?: {
    name: string
    description: string
    parameters: any
  }
}

export interface AgentConfig {
  name: string
  instructions: string
  tools?: Tool[]
  model?: string
}

export interface ServerEvent {
  type: string
  data: any
}
