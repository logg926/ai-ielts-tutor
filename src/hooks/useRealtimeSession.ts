import { useCallback, useRef, useState, useEffect } from 'react';
import {
  RealtimeSession,
  RealtimeAgent,
  OpenAIRealtimeWebRTC,
} from '@openai/agents/realtime';

import { audioFormatForCodec, applyCodecPreferences } from '../lib/codecUtils';
import { useEvent } from '../contexts/EventContext';
import { useHandleSessionHistory } from './useHandleSessionHistory';
import { SessionStatus } from '../types';

export interface RealtimeSessionCallbacks {
  onConnectionChange?: (status: SessionStatus) => void;
}

export interface ConnectOptions {
  getEphemeralKey: () => Promise<string>;
  initialAgents: RealtimeAgent[];
  audioElement?: HTMLAudioElement;
  extraContext?: Record<string, any>;
}

export function useRealtimeSession(callbacks: RealtimeSessionCallbacks = {}) {
  const sessionRef = useRef<RealtimeSession | null>(null);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const { logClientEvent } = useEvent();

  const updateStatus = useCallback(
    (s: SessionStatus) => {
      setStatus(s);
      callbacks.onConnectionChange?.(s);
      logClientEvent({}, s);
    },
    [callbacks, logClientEvent],
  );

  const { logServerEvent } = useEvent();

  const historyHandlers = useHandleSessionHistory().current;

  function handleTransportEvent(event: any) {
    // Handle additional server events that aren't managed by the session
    switch (event.type) {
      case "conversation.item.input_audio_transcription.completed": {
        historyHandlers.handleTranscriptionCompleted(event);
        break;
      }
      case "response.audio_transcript.done": {
        historyHandlers.handleTranscriptionCompleted(event);
        break;
      }
      case "response.audio_transcript.delta": {
        historyHandlers.handleTranscriptionDelta(event);
        break;
      }
      default: {
        logServerEvent(event);
        break;
      } 
    }
  }

  const codecParamRef = useRef<string>(
    (typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('codec') ?? 'opus')
      : 'opus')
      .toLowerCase(),
  );

  // Wrapper to pass current codec param
  const applyCodec = useCallback(
    (pc: RTCPeerConnection) => applyCodecPreferences(pc, codecParamRef.current),
    [],
  );

  useEffect(() => {
    if (sessionRef.current) {
      // Log server errors
      sessionRef.current.on("error", (...args: any[]) => {
        logServerEvent({
          type: "error",
          message: args[0],
        });
      });

      // history events
      sessionRef.current.on("agent_tool_start", historyHandlers.handleAgentToolStart);
      sessionRef.current.on("agent_tool_end", historyHandlers.handleAgentToolEnd);
      sessionRef.current.on("agent_tool_error", historyHandlers.handleAgentToolError);

      // transcript events
      sessionRef.current.on("transcript", historyHandlers.handleTranscript);
      sessionRef.current.on("transcript_delta", historyHandlers.handleTranscriptDelta);

      // transport events
      sessionRef.current.on("transport_event", handleTransportEvent);
    }
  }, [logServerEvent, historyHandlers]);

  const assertconnected = () => {
    if (!sessionRef.current) {
      throw new Error('Session not connected');
    }
  };

  const connect = useCallback(
    async (options: ConnectOptions) => {
      try {
        updateStatus('connecting');

        const transport = new OpenAIRealtimeWebRTC({
          getEphemeralKey: options.getEphemeralKey,
          audioElement: options.audioElement,
          applyCodecPreferences: applyCodec,
        });

        // Create session with the first agent
        const session = new RealtimeSession(options.initialAgents[0], {
          transport,
          extraContext: options.extraContext,
        });

        sessionRef.current = session;

        await session.connect();
        updateStatus('connected');

        logClientEvent({}, 'session_connected');
      } catch (error) {
        console.error('Failed to connect:', error);
        updateStatus('error');
        logClientEvent({ error: error instanceof Error ? error.message : 'Unknown error' }, 'session_error');
        throw error;
      }
    },
    [updateStatus, applyCodec, logClientEvent],
  );

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.disconnect();
      sessionRef.current = null;
    }
    updateStatus('idle');
    logClientEvent({}, 'session_disconnected');
  }, [updateStatus, logClientEvent]);

  const sendUserText = useCallback(
    (text: string) => {
      assertconnected();
      sessionRef.current!.sendUserText(text);
    },
    [],
  );

  const sendEvent = useCallback(
    (event: any) => {
      assertconnected();
      sessionRef.current!.sendEvent(event);
    },
    [],
  );

  const interrupt = useCallback(() => {
    assertconnected();
    sessionRef.current!.interrupt();
  }, []);

  const mute = useCallback(
    (muted: boolean) => {
      assertconnected();
      sessionRef.current!.mute(muted);
    },
    [],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    sendUserText,
    sendEvent,
    interrupt,
    mute,
    status,
  };
}
