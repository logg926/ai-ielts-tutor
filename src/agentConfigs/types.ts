export interface AgentConfig {
  name: string
  instructions: string
  tools?: any[]
  model?: string
}

export interface Tool {
  type: string
  function?: {
    name: string
    description: string
    parameters: any
  }
} 