'use client'

import React, { useState, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import react-pdf components to avoid SSR issues
const Document = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Document })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8">Loading PDF viewer...</div>
})

const Page = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Page })), {
  ssr: false
})

// Configure PDF.js worker and load CSS only on client side
if (typeof window !== 'undefined') {
  import('react-pdf').then(({ pdfjs }) => {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString()
  })
  
  // Load CSS files dynamically
  try {
    require('react-pdf/dist/Page/AnnotationLayer.css')
    require('react-pdf/dist/Page/TextLayer.css')
  } catch (e) {
    console.warn('Could not load PDF CSS files:', e)
  }
}

interface PDFViewerProps {
  pdfUrl?: string
  className?: string
}

export interface PDFViewerRef {
  goToPage: (pageNumber: number) => void
  getCurrentPage: () => number
  getTotalPages: () => number
}

const PDFViewer = forwardRef<PDFViewerRef, PDFViewerProps>(({ 
  pdfUrl = '/material.pdf',
  className = ''
}, ref) => {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
    console.log(`PDF loaded successfully with ${numPages} pages`)
  }, [])

  const onDocumentLoadError = useCallback((error: Error) => {
    setError(`Failed to load PDF: ${error.message}`)
    setLoading(false)
    console.error('PDF load error:', error)
  }, [])

  const goToPage = useCallback((targetPage: number) => {
    if (targetPage >= 1 && targetPage <= numPages) {
      setPageNumber(targetPage)
      console.log(`Navigated to page ${targetPage}`)
      return true
    } else {
      console.warn(`Invalid page number: ${targetPage}. Valid range: 1-${numPages}`)
      return false
    }
  }, [numPages])

  const nextPage = useCallback(() => {
    if (pageNumber < numPages) {
      setPageNumber(prev => prev + 1)
    }
  }, [pageNumber, numPages])

  const prevPage = useCallback(() => {
    if (pageNumber > 1) {
      setPageNumber(prev => prev - 1)
    }
  }, [pageNumber])

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    goToPage,
    getCurrentPage: () => pageNumber,
    getTotalPages: () => numPages
  }), [goToPage, pageNumber, numPages])

  if (error) {
    return (
      <Card className={`w-full h-full ${className}`}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-red-600 mb-2">Error loading PDF</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full h-full ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Study Material
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={pageNumber <= 1 || loading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[80px] text-center">
              {loading ? 'Loading...' : `${pageNumber} / ${numPages}`}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={pageNumber >= numPages || loading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="flex justify-center">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading PDF...</span>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-lg max-h-full"
              scale={0.8}
            />
          </Document>
        </div>
      </CardContent>
    </Card>
  )
})

PDFViewer.displayName = 'PDFViewer'

export default PDFViewer
