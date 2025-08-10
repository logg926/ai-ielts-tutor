import { useCallback, useRef, useState, useEffect } from 'react';
import { useEvent } from '../../contexts/EventContext';
import { SessionStatus } from '../../types';

export interface RealtimeSessionCallbacks {
  onConnectionChange?: (status: SessionStatus) => void;
  onAgentHandoff?: (agentName: string) => void;
}

export interface RealtimeAgent {
  name: string;
  instructions: string;
  model?: string;
}

export interface ConnectOptions {
  getEphemeralKey: () => Promise<string>;
  initialAgents: RealtimeAgent[];
  audioElement?: HTMLAudioElement;
  extraContext?: Record<string, any>;
  outputGuardrails?: any[];
}

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
        const ek = await getEphemeralKey();
        const rootAgent = initialAgents[0];

        // Create a simple session object that mimics the RealtimeSession API
        // This is a simplified version for now - you can enhance it with actual WebRTC later
        sessionRef.current = {
          agent: rootAgent,
          audioElement,
          context: extraContext ?? {},
          connected: true,
          sendMessage: (text: string) => {
            logClientEvent({ type: 'user_message', data: { text } }, 'user_message');
            // Here you would normally send to the actual realtime API
            console.log('Sending message:', text);
          },
          interrupt: () => {
            logClientEvent({ type: 'interrupt', data: {} }, 'interrupt');
            console.log('Interrupting...');
          },
          mute: (muted: boolean) => {
            logClientEvent({ type: 'mute', data: { muted } }, 'mute');
            console.log('Mute:', muted);
          },
          close: () => {
            sessionRef.current = null;
            updateStatus('idle');
          }
        };

        updateStatus('connected');
      } catch (error) {
        console.error('Connection failed:', error);
        updateStatus('error');
        throw error;
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