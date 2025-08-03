'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { SessionStatus } from '../types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from 'lucide-react'

interface BottomToolbarProps {
  status: SessionStatus
  isRecording: boolean
  sessionId: string | null
  onConnect: () => void
  onDisconnect: () => void
  onMicToggle: () => void
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  status,
  isRecording,
  sessionId,
  onConnect,
  onDisconnect,
  onMicToggle
}) => {
  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-center gap-4">
          {/* Connection Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              onClick={isConnected ? onDisconnect : onConnect}
              disabled={isConnecting}
              variant={isConnected ? "destructive" : "default"}
              className="min-w-[120px]"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : isConnected ? (
                <>
                  <PhoneOff className="w-5 h-5 mr-2" />
                  Disconnect
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5 mr-2" />
                  Connect
                </>
              )}
            </Button>
          </motion.div>

          {/* Microphone Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              onClick={onMicToggle}
              disabled={!isConnected}
              variant={isRecording ? "destructive" : "outline"}
              className="min-w-[120px]"
            >
              {isRecording ? (
                <>
                  <MicOff className="w-5 h-5 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  Listen
                </>
              )}
            </Button>
          </motion.div>
        </div>

        {/* Status Info */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            {sessionId ? `Session: ${sessionId.slice(0, 8)}...` : 'No active session'}
          </p>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2"
            >
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm text-red-600 font-medium">Recording...</span>
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 