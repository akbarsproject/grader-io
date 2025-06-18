"use client"

import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { auth } from "@/lib/firebase"
import React from "react"

// Component ThemeToggle yang sudah ada di sini agar bisa digunakan secara internal
function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface HeaderProps {
  userDisplayName?: string;
}

export function Header({ userDisplayName }: HeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error logging out:", error)
      // Optionally, show a toast notification here
    }
  }

  return (
    <header className="bg-card text-card-foreground border-b border-border p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">Grader.io</h1>
      <div className="flex items-center space-x-4">
        {userDisplayName && <span className="text-sm font-medium">Halo, {userDisplayName}!</span>}
        <ThemeToggle />
        <Button onClick={handleLogout}>Logout</Button>
      </div>
    </header>
  )
} 