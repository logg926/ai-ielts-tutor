'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function TestInterface() {
  const [testResult, setTestResult] = useState<any>(null)
  const [isTesting, setIsTesting] = useState(false)

  const testSessionCreation = async () => {
    setIsTesting(true)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/test-realtime')
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold mb-4">Realtime API Test</h1>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">Test Session Creation</h2>
                <p className="text-sm text-gray-600 mb-4">
                  This will test if your API key can create a Realtime API session.
                </p>
                <Button 
                  onClick={testSessionCreation}
                  disabled={isTesting}
                  className="w-full"
                >
                  {isTesting ? 'Testing...' : 'Test Session Creation'}
                </Button>
              </div>

              {testResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg ${
                    testResult.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <h3 className="font-semibold mb-2">
                    {testResult.success ? '✅ Test Passed' : '❌ Test Failed'}
                  </h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </motion.div>
              )}

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold mb-2">Next Steps</h3>
                <ul className="text-sm space-y-1">
                  <li>• If session creation fails, check your API key and Realtime API access</li>
                  <li>• If session creation works but WebRTC times out, try the WebSocket version</li>
                  <li>• Check browser console for detailed error messages</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
} 