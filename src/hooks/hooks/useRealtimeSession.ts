import { useCallback, useRef, useState, useEffect } from 'react';
import {
  RealtimeSession,
  RealtimeAgent as OpenAIRealtimeAgent,
  OpenAIRealtimeWebRTC,
  tool,
} from '@openai/agents/realtime';
import { useEvent } from '@/contexts/EventContext';
import { SessionStatus } from '@/types';

// Local RealtimeAgent interface to avoid conflicts
export interface RealtimeAgent {
  name: string;
  instructions: string;
  voice?: string;
  model?: string;
}

export interface RealtimeSessionCallbacks {
  onConnectionChange?: (status: SessionStatus) => void;
  onAgentHandoff?: (agentName: string) => void;
  onNavigateToSection?: (section: string, reason?: string) => void;
}

export interface ConnectOptions {
  getEphemeralKey: () => Promise<string>;
  initialAgents: RealtimeAgent[];
  model?: string;
  audioElement?: HTMLAudioElement;
  extraContext?: Record<string, any>;
  outputGuardrails?: any[];
}

// Create the navigation tool using OpenAI Agents SDK pattern
const createNavigationTool = (onNavigate?: (section: string, reason?: string) => void) => {
  return tool({
    name: 'navigate_to_section',
    description: 'Navigate the user to a specific section of their IELTS report',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          enum: [
            'overall_score',
            'task_response', 
            'coherence_cohesion',
            'lexical_resource',
            'grammar_accuracy',
            'examiner_tip',
            'essay_comparison',
            'original_essay',
            'rewritten_essay'
          ],
          description: 'The section of the report to navigate to'
        },
        reason: {
          type: 'string',
          description: 'Brief explanation of why you are directing attention to this section'
        }
      },
      required: ['section'],
      additionalProperties: false
    },
    execute: async (input: any) => {
      console.log('🧭 [DEBUG] Navigation tool executed:', input);
      
      if (onNavigate && input.section) {
        onNavigate(input.section, input.reason);
      }
      
      return `Successfully navigated to ${input.section} section${input.reason ? `: ${input.reason}` : ''}`;
    }
  });
};

export function useRealtimeSession(callbacks: RealtimeSessionCallbacks = {}) {
  const sessionRef = useRef<any | null>(null);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const { logClientEvent } = useEvent();

  const updateStatus = useCallback(
    (s: SessionStatus) => {
      setStatus(s);
      callbacks.onConnectionChange?.(s);
      logClientEvent({ type: 'status_change', data: s }, 'status_change');
    },
    [callbacks, logClientEvent],
  );

  const connect = useCallback(
    async ({
      getEphemeralKey,
      initialAgents,
      audioElement,
      extraContext,
      outputGuardrails,
    }: ConnectOptions) => {
      if (sessionRef.current) return; // already connected

      updateStatus('connecting');

      try {
        console.log('🔄 [DEBUG] Starting connection process...');
        
        const ek = await getEphemeralKey();
        console.log('🔄 [DEBUG] Ephemeral key received:', {
          type: typeof ek,
          isString: typeof ek === 'string',
          length: typeof ek === 'string' ? ek.length : 'N/A',
          value: typeof ek === 'string' ? ek.substring(0, 10) + '...' : ek
        });
        
        const rootAgent = initialAgents[0];
        console.log('🔄 [DEBUG] Using agent:', rootAgent);

        // Create navigation tool for this session
        const navigationTool = createNavigationTool(callbacks.onNavigateToSection);

        // Create proper OpenAI RealtimeAgent using the constructor
        console.log('🔄 [DEBUG] Creating OpenAI RealtimeAgent...');
        const openAIAgent = new OpenAIRealtimeAgent({
          name: rootAgent.name,
          instructions: rootAgent.instructions,
          voice: rootAgent.voice || 'alloy',
          tools: [navigationTool],
          handoffs: [],
        });
        console.log('✅ [DEBUG] OpenAI RealtimeAgent created successfully');

        // Create real OpenAI Realtime session with WebRTC audio transport
        console.log('🔄 [DEBUG] Creating RealtimeSession with WebRTC...');
        console.log('🔄 [DEBUG] Audio element:', audioElement ? 'Provided' : 'Missing');
        
        sessionRef.current = new RealtimeSession(openAIAgent, {
          transport: new OpenAIRealtimeWebRTC({
            audioElement,
            useInsecureApiKey: true,
          }),
          model: 'gpt-4o-realtime-preview',
          config: {
            inputAudioFormat: 'pcm16',
            outputAudioFormat: 'pcm16',
            inputAudioTranscription: {
              model: 'whisper-1',
            },
            turnDetection: {
              type: 'server_vad',
              threshold: 0.5,
              silence_duration_ms: 200,
            },

          },
          outputGuardrails: outputGuardrails ?? [],
          context: extraContext ?? {},
        });
        console.log('✅ [DEBUG] RealtimeSession created successfully');

        // Set up event listeners for the real session
        console.log('🔄 [DEBUG] Setting up event listeners...');
        
        sessionRef.current.on('error', (...args: any[]) => {
          console.error('❌ [DEBUG] Session error event:', args);
          console.error('❌ [DEBUG] Error details:', args[0]);
          
          // Extract the actual error message from the nested error object
          const errorEvent = args[0];
          const actualError = errorEvent?.error;
          console.error('❌ [DEBUG] Actual error object:', actualError);
          console.error('❌ [DEBUG] Error type:', actualError?.type);
          console.error('❌ [DEBUG] Error code:', actualError?.code);
          console.error('❌ [DEBUG] Error message:', actualError?.message);
          console.error('❌ [DEBUG] Error details:', actualError?.details);
          
          logClientEvent({ type: 'error', data: { message: actualError?.message || args[0] } }, 'error');
          updateStatus('error');
        });

        sessionRef.current.on('connected', () => {
          console.log('✅ [DEBUG] Session connected event - AUDIO SHOULD BE WORKING');
          updateStatus('connected');
        });

        sessionRef.current.on('disconnected', () => {
          console.log('🔌 [DEBUG] Session disconnected event');
          updateStatus('idle');
        });

        // Add more event listeners for debugging
        sessionRef.current.on('conversation.item.created', (event: any) => {
          console.log('🗣️ [DEBUG] Conversation item created:', event);
        });

        sessionRef.current.on('response.audio.delta', (event: any) => {
          console.log('🔊 [DEBUG] Audio delta received - AUDIO PLAYING');
        });

        sessionRef.current.on('response.done', (event: any) => {
          console.log('✅ [DEBUG] Response completed:', event);
        });



        console.log('✅ [DEBUG] Event listeners set up successfully');

        // Connect to the real OpenAI Realtime API
        console.log('🔄 [DEBUG] Connecting to OpenAI Realtime API...');
        
        // Ensure ephemeral key is a string
        const apiKey = typeof ek === 'string' ? ek : String(ek);
        console.log('🔄 [DEBUG] API key prepared:', {
          originalType: typeof ek,
          finalType: typeof apiKey,
          keyLength: apiKey.length
        });
        
        await sessionRef.current.connect({ apiKey });
        console.log('✅ [DEBUG] Connection call completed successfully');

        updateStatus('connected');
        console.log('✅ [DEBUG] Status updated to connected');
        
      } catch (error) {
        console.error('❌ [DEBUG] Connection failed with error:', error);
        console.error('❌ [DEBUG] Error name:', error instanceof Error ? error.name : 'Unknown');
        console.error('❌ [DEBUG] Error message:', error instanceof Error ? error.message : 'Unknown error');
        console.error('❌ [DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        updateStatus('error');
        console.log('❌ [DEBUG] Status updated to error');
        
        logClientEvent({ type: 'connection_error', data: { error: error instanceof Error ? error.message : 'Unknown error' } }, 'connection_error');
        console.log('❌ [DEBUG] Error event logged');
      }
    },
    [updateStatus, logClientEvent],
  );

  const disconnect = useCallback(() => {
    sessionRef.current?.close();
    sessionRef.current = null;
    updateStatus('idle');
  }, [updateStatus]);

  const assertConnected = () => {
    if (!sessionRef.current) throw new Error('RealtimeSession not connected');
  };

  const interrupt = useCallback(() => {
    sessionRef.current?.interrupt();
  }, []);
  
  const sendUserText = useCallback((text: string) => {
    assertConnected();
    sessionRef.current!.sendMessage(text);
  }, []);

  const mute = useCallback((m: boolean) => {
    sessionRef.current?.mute(m);
  }, []);

  return {
    status,
    connect,
    disconnect,
    sendUserText,
    mute,
    interrupt,
  } as const;
}