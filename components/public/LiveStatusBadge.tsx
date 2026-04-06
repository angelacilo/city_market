'use client'
 
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parse } from 'date-fns'
 
interface LiveStatusBadgeProps {
  openingTime: string | null
  closingTime: string | null
}
 
export default function LiveStatusBadge({ openingTime, closingTime }: LiveStatusBadgeProps) {
  const [isOpen, setIsOpen] = useState<boolean>(true)
 
  useEffect(() => {
    if (!openingTime || !closingTime) return
 
    const checkStatus = () => {
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes()
      
      const parseT = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number)
        return hours * 60 + minutes
      }
 
      const start = parseT(openingTime)
      const end = parseT(closingTime)
      
      setIsOpen(currentTime >= start && currentTime <= end)
    }
 
    checkStatus()
    const timer = setInterval(checkStatus, 60000) // update every minute
    return () => clearInterval(timer)
  }, [openingTime, closingTime])
 
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '--:--'
    try {
      const date = parse(timeStr, 'HH:mm:ss', new Date())
      return format(date, 'hh:mm a')
    } catch { return timeStr }
  }
 
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Badge className={cn(
        "px-4 py-1.5 uppercase font-black tracking-widest text-[10px] rounded-full flex items-center gap-2",
        isOpen 
          ? "bg-green-600 text-white shadow-lg shadow-green-900/20" 
          : "bg-red-500 text-white shadow-lg shadow-red-900/20"
      )}>
        <div className={cn("w-2 h-2 rounded-full", isOpen ? "bg-white animate-pulse" : "bg-white/50")} />
        {isOpen ? 'Open Now' : 'Closed'}
      </Badge>
 
      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
         <Clock className="w-4 h-4 text-green-600" />
         <span className="uppercase tracking-[0.1em]">
           {openingTime && closingTime 
             ? `${formatTime(openingTime)} - ${formatTime(closingTime)}`
             : 'Business Hours N/A'}
         </span>
      </div>
    </div>
  )
}
