'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { transactionAPI } from '@/lib/api'
import { toast } from 'sonner'
import { Loader2, UploadCloud, CheckCircle2 } from 'lucide-react'
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
    // Split by double newlines or single newlines to find individual messages
    const lines = rawText.split(/\n\n|\r\n\r\n/).filter(line => line.trim().length > 10)
    
    if (lines.length === 0) {
      toast.error("No valid transaction text found.")
      return
    }

    setIsProcessing(true)
    setProgress(0)
    let successCount = 0

    for (let i = 0; i < lines.length; i++) {
      try {
        const response = await transactionAPI.extract(lines[i])
        onSuccess(response.data.transaction)
        successCount++
      } catch (error) {
        console.error("Failed to process line:", lines[i])
      }
      setProgress(((i + 1) / lines.length) * 100)
    }

    toast.success(`Processed ${successCount} transactions!`)
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
            Paste multiple bank SMS alerts or statement rows. Separate each entry with a double enter.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Transaction 1...&#10;&#10;Transaction 2..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={10}
            disabled={isProcessing}
          />
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span>Processing with Local AI...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          <Button onClick={handleBulkProcess} disabled={isProcessing || !rawText.trim()}>
            {isProcessing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
            ) : (
              'Start Import'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}