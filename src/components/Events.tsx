'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEvents } from '../contexts/EventContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Activity } from 'lucide-react'

export const Events: React.FC = () => {
  const { state, clear } = useEvents()

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }

  const getEventColor = (type: string) => {
    if (type.includes('error')) return 'text-red-600'
    if (type.includes('connected') || type.includes('created')) return 'text-green-600'
    if (type.includes('started')) return 'text-blue-600'
    if (type.includes('stopped')) return 'text-yellow-600'
    return 'text-gray-600'
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Events</CardTitle>
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
        <div className="h-full overflow-y-auto space-y-2 pr-2">
          <AnimatePresence>
            {state.events.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-full text-gray-500"
              >
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No events logged yet</p>
                </div>
              </motion.div>
            ) : (
              state.events.slice().reverse().map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="border rounded-lg p-3 bg-white"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${getEventColor(event.type)}`}>
                          {event.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(event.timestamp)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-700">
                        <pre className="whitespace-pre-wrap break-words">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </div>
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