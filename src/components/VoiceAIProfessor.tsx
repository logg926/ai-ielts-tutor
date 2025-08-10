'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRealtimeSession, type RealtimeAgent } from '@/hooks/hooks/useRealtimeSession';
import { useTranscript } from '@/contexts/TranscriptContext';
import { SessionStatus } from '@/types';

interface VoiceAIProfessorProps {
  reportData: any;
}

export default function VoiceAIProfessor({ reportData }: VoiceAIProfessorProps) {
  const [hasStartedTour, setHasStartedTour] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle');
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
  // Create the IELTS professor agent
  const ieltsAgent: RealtimeAgent = {
    name: "IELTS Writing Professor",
    instructions: `You are an experienced IELTS writing professor providing personalized guidance to a student about their essay analysis report. 

You should:
- Be encouraging and supportive while being honest about areas for improvement
- Provide specific, actionable advice based on the student's scores and analysis
- Explain IELTS scoring criteria in simple terms
- Give concrete examples when possible
- Keep responses conversational but professional
- Speak naturally as if you're having a face-to-face conversation with the student

Student's Essay Analysis:
- Overall Score: ${reportData?.overall_score || 'N/A'}/9
- Task Response: ${reportData?.task_response || 'N/A'}/9
- Coherence & Cohesion: ${reportData?.coherence_cohesion || 'N/A'}/9
- Lexical Resource: ${reportData?.lexical_resource || 'N/A'}/9
- Grammar & Accuracy: ${reportData?.grammar_accuracy || 'N/A'}/9
- Examiner Tip: ${reportData?.examiner_tip || 'No specific tip available'}

When the student first connects, greet them warmly and offer to guide them through their results or answer any questions they have about their essay analysis.`,
    model: "gpt-4o-realtime-preview-2025-06-03"
  };

  // Create audio element for the session
  const sdkAudioElement = React.useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const el = document.createElement('audio');
    el.autoplay = true;
    el.style.display = 'none';
    document.body.appendChild(el);
    return el;
  }, []);

  // Attach SDK audio element once it exists
  useEffect(() => {
    if (sdkAudioElement && !audioElementRef.current) {
      audioElementRef.current = sdkAudioElement;
    }
  }, [sdkAudioElement]);

  const { 
    status,
    connect,
    disconnect,
    sendUserText,
    interrupt
  } = useRealtimeSession({
    onConnectionChange: (s) => setSessionStatus(s),
  });

  const { transcriptItems } = useTranscript();

  const handleStartGuidedTour = async () => {
    try {
      await connect({
        getEphemeralKey: async () => {
          const response = await fetch('/api/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              agentConfig: ieltsAgent
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create session');
          }

          const data = await response.json();
          return data.clientSecret;
        },
        initialAgents: [ieltsAgent],
        audioElement: audioElementRef.current || undefined,
        extraContext: {
          reportData: reportData
        }
      });
      setHasStartedTour(true);
    } catch (err) {
      console.error('Failed to start guided tour:', err);
    }
  };

  const handleEndSession = async () => {
    try {
      disconnect();
      setHasStartedTour(false);
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl mb-6 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold">AI Writing Professor</h3>
              <p className="text-indigo-100">Voice-guided essay analysis walkthrough</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Status indicator */}
            <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-full px-3 py-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
              <span className="text-sm font-medium">{getStatusText()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">

        {/* Control buttons */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          {status === 'idle' && !hasStartedTour && (
            <button
              onClick={handleStartGuidedTour}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition-all flex items-center space-x-3 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
              </svg>
              <span>Start Voice Guidance</span>
            </button>
          )}

          {status === 'connected' && (
            <>
              <button
                onClick={() => sendUserText("Can you guide me through my essay analysis results?")}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span>Ask for Guidance</span>
              </button>

              <button
                onClick={handleEndSession}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>End Session</span>
              </button>
            </>
          )}

          {(status === 'connecting') && (
            <div className="flex items-center space-x-3 text-indigo-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              <span className="font-medium">Connecting...</span>
            </div>
          )}
        </div>

        {/* Conversation Display */}
        {transcriptItems.length > 0 && (
          <div className="bg-white bg-opacity-10 rounded-lg p-4 max-h-60 overflow-y-auto">
            <h4 className="font-semibold mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Conversation
            </h4>
            <div className="space-y-3">
              {transcriptItems.map((item, index) => (
                <div key={index} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    item.role === 'user' 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="text-sm">{item.content}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {item.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Error Display */}
      {status === 'error' && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">
            <strong>Error:</strong> Connection failed. Please try again.
          </p>
        </div>
      )}

        {/* Instructions */}
        {status === 'idle' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-100 rounded-full p-2 mr-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900">How it works</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">1</div>
                <div>
                  <p className="font-medium text-gray-900">Start Voice Guidance</p>
                  <p className="text-sm text-gray-600">Click the button to connect with your AI professor</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">2</div>
                <div>
                  <p className="font-medium text-gray-900">Get Personalized Guidance</p>
                  <p className="text-sm text-gray-600">The AI will explain your scores and provide feedback</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">3</div>
                <div>
                  <p className="font-medium text-gray-900">Ask Questions</p>
                  <p className="text-sm text-gray-600">Get specific advice on grammar, vocabulary, or structure</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">4</div>
                <div>
                  <p className="font-medium text-gray-900">Improve Your Writing</p>
                  <p className="text-sm text-gray-600">Apply the feedback to enhance your IELTS performance</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
