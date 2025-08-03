import { useRef, useCallback } from 'react';
import { useEvent } from '../contexts/EventContext';
import { useTranscript } from '../contexts/TranscriptContext';

export function useHandleSessionHistory() {
  const { logHistoryItem } = useEvent();
  const { addTranscriptMessage, addTranscriptBreadcrumb } = useTranscript();

  const handleTranscriptionCompleted = useCallback((event: any) => {
    if (event.data?.transcript) {
      addTranscriptMessage({
        role: 'user',
        content: event.data.transcript,
        timestamp: new Date(),
      });
    }
    logHistoryItem(event);
  }, [addTranscriptMessage, logHistoryItem]);

  const handleTranscriptionDelta = useCallback((event: any) => {
    logHistoryItem(event);
  }, [logHistoryItem]);

  const handleAgentToolStart = useCallback((event: any) => {
    addTranscriptBreadcrumb(`Tool started: ${event.data.name}`, event.data);
    logHistoryItem(event);
  }, [addTranscriptBreadcrumb, logHistoryItem]);

  const handleAgentToolEnd = useCallback((event: any) => {
    addTranscriptBreadcrumb(`Tool completed: ${event.data.name}`, event.data);
    logHistoryItem(event);
  }, [addTranscriptBreadcrumb, logHistoryItem]);

  const handleAgentToolError = useCallback((event: any) => {
    addTranscriptBreadcrumb(`Tool error: ${event.data.name}`, event.data);
    logHistoryItem(event);
  }, [addTranscriptBreadcrumb, logHistoryItem]);

  const handleTranscript = useCallback((event: any) => {
    if (event.data?.content) {
      addTranscriptMessage({
        role: 'assistant',
        content: event.data.content,
        timestamp: new Date(),
      });
    }
    logHistoryItem(event);
  }, [addTranscriptMessage, logHistoryItem]);

  const handleTranscriptDelta = useCallback((event: any) => {
    logHistoryItem(event);
  }, [logHistoryItem]);

  return {
    current: {
      handleTranscriptionCompleted,
      handleTranscriptionDelta,
      handleAgentToolStart,
      handleAgentToolEnd,
      handleAgentToolError,
      handleTranscript,
      handleTranscriptDelta,
    },
  };
} 