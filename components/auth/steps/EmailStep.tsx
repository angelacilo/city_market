'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Loader2, 
  Mail, 
  ArrowRight, 
  ChevronLeft,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function EmailStep({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Step 1: Check if user exists (Optional but good for UX)
      // Note: Supabase resetPasswordForEmail returns success even if user doesn't exist 
      // when user enumeration protection is enabled.
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/forgot-password?step=password'
      })
      
      if (resetError) {
         if (resetError.message.includes('rate limit')) {
            throw new Error('Email rate limit exceeded. Please wait a few minutes before trying again.')
         }
         throw resetError
      }

      toast.success('Password reset code sent to your email.')
      onSuccess(email)
    } catch (err: any) {
      console.error('[RESET_PASS]', err)
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter leading-none italic font-serif uppercase">
          Reset{' '}
          <span className="text-[#1b6b3e] dark:text-green-500 underline decoration-green-100 dark:decoration-green-900/30 underline-offset-8">
            Password
          </span>
        </h2>
        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.4em] max-w-[280px] mx-auto leading-relaxed">
          Enter your email and we'll send you a recovery code
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3">
          <label htmlFor="reset-email" className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4">
            Email Address
          </label>
          <div className="relative group">
            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
            <Input
              id="reset-email"
              type="email"
              placeholder="your@email.com"
              autoComplete="email"
              className="h-14 pl-14 pr-6 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm tracking-tight placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-inner"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/10 mt-4 animate-in fade-in zoom-in duration-300">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-[10px] font-black text-red-900 dark:text-red-400 uppercase tracking-widest leading-relaxed">
                {error}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-2">
           <Button 
             type="submit" 
             className="w-full h-14 rounded-2xl bg-green-700 hover:bg-green-800 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 group" 
             disabled={loading}
           >
             {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
             ) : (
                <div className="flex items-center justify-center gap-3">
                   <span>Send Recovery Code</span>
                   <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
             )}
           </Button>

           <Button
             type="button"
             variant="ghost"
             onClick={() => window.history.back()}
             className="w-full h-12 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-green-700 dark:hover:text-white transition-all"
           >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Sign In
           </Button>
        </div>
      </form>
    </div>
  )
}
