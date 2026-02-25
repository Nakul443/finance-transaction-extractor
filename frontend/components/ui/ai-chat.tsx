// This component handles the message history and calls the transactionAPI.chat we added to your api.ts.

'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { transactionAPI } from '@/lib/api'
import { Loader2, Send, Bot, User } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I can help you analyze your spending. Ask me something like "How much did I spend on coffee?"' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await transactionAPI.chat(userMessage)
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to my brain right now." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="py-3 border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-600" />
          Finance Assistant
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`mt-1 p-1 rounded-full h-fit ${m.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    {m.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm ${
                    m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-3 border-t">
        <form className="flex w-full items-center space-x-2" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
          <Input 
            placeholder="Ask about your finances..." 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}

// Added this to fix your "No default export" error!
export default AIChat;