'use client'

import React from 'react'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-4">IELTS AI Tutor</h1>
        <p className="text-gray-600 text-center mb-6">
          Your AI-powered IELTS writing assistant is ready to help you improve your scores.
        </p>
        <div className="space-y-4">
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            Start Voice Session
          </button>
          <button className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
            View Reports
          </button>
        </div>
      </div>
    </div>
  )
}
