'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Phone, PhoneOff, Bot, User, Trash2, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRealtimeChat } from '@/hooks/useRealtimeChat'

export function RealtimeChatInterface() {
  const {
    messages,
    isConnected,
    isConnecting,
    isListening,
    error,
    connect,
    disconnect,
    startListening,
    stopListening,
    clearMessages,
  } = useRealtimeChat()

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleConnect = async () => {
    await connect()
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const handleToggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bot className="h-8 w-8 text-blue-500" />
          </motion.div>
          <h1 className="text-2xl font-bold">Realtime AI Voice Chat</h1>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={clearMessages}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Connection Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card className={`${isConnected ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="font-medium">
                  {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex gap-2">
                {!isConnected ? (
                  <Button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={handleDisconnect}
                    className="flex items-center gap-2"
                  >
                    <PhoneOff className="h-4 w-4" />
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Voice Controls */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      size="lg"
                      variant={isListening ? "destructive" : "default"}
                      onClick={handleToggleListening}
                      className="w-16 h-16 rounded-full"
                    >
                      {isListening ? (
                        <MicOff className="h-6 w-6" />
                      ) : (
                        <Mic className="h-6 w-6" />
                      )}
                    </Button>
                  </motion.div>
                  <p className="text-sm mt-2 text-gray-600">
                    {isListening ? 'Listening...' : 'Click to speak'}
                  </p>
                </div>
                {isListening && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="flex items-center gap-2 text-red-500"
                  >
                    <Volume2 className="h-4 w-4" />
                    <span className="text-sm">Voice detected</span>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={`max-w-[80%] ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="flex-shrink-0"
                    >
                      {message.role === 'user' ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <Bot className="h-5 w-5 text-blue-500" />
                      )}
                    </motion.div>
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <Card className="bg-red-50 border-red-200 max-w-[80%]">
              <CardContent className="p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty state */}
        {messages.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center h-32"
          >
            <div className="text-center text-gray-500">
              <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Connect and start a voice conversation</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Instructions */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-gray-500"
        >
          <p>Click the microphone button to start speaking</p>
          <p>Your voice will be transcribed in real-time</p>
        </motion.div>
      )}
    </div>
  )
} 