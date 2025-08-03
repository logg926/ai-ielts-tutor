import { AgentConfig } from './types'

export const simpleHandoffConfig: AgentConfig = {
  name: 'Simple Handoff Agent',
  instructions: `You are a specialized agent that can handle specific tasks and hand off to other agents when needed. You are knowledgeable about various topics and can provide detailed assistance.`,
  model: 'gpt-4o-realtime-preview'
} 