'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { transactionAPI } from '@/lib/api'
import { toast } from 'sonner'
import { Loader2, UploadCloud } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

interface BulkUploadProps {
  onSuccess: (newTransaction: any) => void
}

export function BulkUpload({ onSuccess }: BulkUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [rawText, setRawText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleBulkProcess = async () => {
    // 1. IMPROVED REGEX: Splits by double newlines OR single newlines 
    // effectively catching different paste formats.
    const lines = rawText
      .split(/\n+/) 
      .map(line => line.trim())
      .filter(line => line.length > 10) 
    
    if (lines.length === 0) {
      toast.error("No valid transaction text found.")
      return
    }

    setIsProcessing(true)
    setProgress(0)
    let successCount = 0

    // 2. SEQUENTIAL PROCESSING: 
    // We loop through each line and hit the AI extractor.
    for (let i = 0; i < lines.length; i++) {
      try {
        const response = await transactionAPI.extract(lines[i])
        
        // Ensure we handle the nested 'transaction' object from your Hono response
        if (response.data && response.data.transaction) {
           onSuccess(response.data.transaction)
           successCount++
        }
      } catch (error) {
        console.error(`Failed to process: ${lines[i]}`, error)
      }
      
      // Update progress bar
      setProgress(((i + 1) / lines.length) * 100)
    }

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} transactions!`)
    } else {
      toast.error("Could not extract any transactions. Check backend logs.")
    }

    setIsProcessing(false)
    setRawText('')
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <UploadCloud className="h-4 w-4" /> Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Bulk Transaction Import</DialogTitle>
          <DialogDescription>
            Paste your bank alerts below. Our AI will split and process each transaction automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Paste your messages here..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={10}
            disabled={isProcessing}
            className="font-mono text-sm"
          />
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span>AI is extracting data...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          <Button 
            onClick={handleBulkProcess} 
            disabled={isProcessing || !rawText.trim()}
            className="w-full"
          >
            {isProcessing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing {Math.round(progress)}%</>
            ) : (
              'Start Import'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}