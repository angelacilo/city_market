'use client'

import { useTheme } from '../providers/ThemeProvider'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full w-10 h-10 bg-gray-50 dark:bg-[#1a2c1a] border border-gray-100 dark:border-green-900/30 text-gray-500 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 transition-all hover:scale-105"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </Button>
  )
}
