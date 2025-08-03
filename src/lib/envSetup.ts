import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

export const getEnvVar = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`)
  }
  return value
}

export const OPENAI_API_KEY = getEnvVar('OPENAI_API_KEY')