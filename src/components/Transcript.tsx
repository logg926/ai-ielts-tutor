'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranscript } from '../contexts/TranscriptContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, User, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export const Transcript: React.FC = () => {
  const { state, clear } = useTranscript()

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Conversation</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={clear}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto space-y-4 pr-2">
          <AnimatePresence>
            {state.items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-full text-gray-500"
              >
                <div className="text-center">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">Start a conversation to see the transcript here</p>
                </div>
              </motion.div>
            ) : (
              state.items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex gap-3 ${
                    item.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      item.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {item.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                      <span className="text-xs opacity-75">
                        {formatTime(item.timestamp)}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <span>{children}</span>,
                          strong: ({ children }) => <strong>{children}</strong>,
                          em: ({ children }) => <em>{children}</em>,
                          code: ({ children }) => (
                            <code className="bg-black/10 px-1 py-0.5 rounded text-xs">
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {item.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
} 