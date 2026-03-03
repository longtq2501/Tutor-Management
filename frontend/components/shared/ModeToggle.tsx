"use client"

import * as React from "react"
import { Moon, Sun, Laptop } from "lucide-react"
import { useTheme } from "next-themes"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-[100px] h-[36px] lg:h-[40px] bg-muted/20 rounded-full animate-pulse" />
  }



  return (
    <div className="relative flex items-center bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-full p-1 w-fit">

      {/* Lớp nền trượt (Active Indicator) */}
      <div
        className={`absolute h-[calc(100%-8px)] w-[32px] lg:w-[40px] bg-white dark:bg-[#2A2A2A] shadow-sm rounded-full transition-transform duration-300 ease-out ${theme === 'light' ? 'translate-x-0' :
            theme === 'system' ? 'translate-x-[32px] lg:translate-x-[40px]' :
              'translate-x-[64px] lg:translate-x-[80px]'
          }`}
      />

      {/* Button: Light */}
      <button
        onClick={() => setTheme("light")}
        className={`relative z-10 p-1.5 lg:p-2 w-8 lg:w-10 flex justify-center rounded-full transition-colors ${theme === 'light' ? 'text-yellow-500' : 'text-muted-foreground hover:text-foreground'
          }`}
        title="Chế độ sáng"
      >
        <Sun size={16} className="lg:w-[18px] lg:h-[18px]" />
      </button>

      {/* Button: System */}
      <button
        onClick={() => setTheme("system")}
        className={`relative z-10 p-1.5 lg:p-2 w-8 lg:w-10 flex justify-center rounded-full transition-colors ${theme === 'system' ? 'text-blue-500' : 'text-muted-foreground hover:text-foreground'
          }`}
        title="Theo hệ thống"
      >
        <Laptop size={16} className="lg:w-[18px] lg:h-[18px]" />
      </button>

      {/* Button: Dark */}
      <button
        onClick={() => setTheme("dark")}
        className={`relative z-10 p-1.5 lg:p-2 w-8 lg:w-10 flex justify-center rounded-full transition-colors ${theme === 'dark' ? 'text-indigo-500' : 'text-muted-foreground hover:text-foreground'
          }`}
        title="Chế độ tối"
      >
        <Moon size={16} className="lg:w-[18px] lg:h-[18px]" />
      </button>
    </div>
  )
}