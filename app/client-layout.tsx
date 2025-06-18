"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { Toaster } from "@/components/ui/toaster"
import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/layout/header"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null)

  useEffect(() => {
    console.log("ClientLayout: useEffect triggered, pathname:", pathname)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("ClientLayout: onAuthStateChanged, user:", user ? user.uid : "null")
      if (user) {
        setUserDisplayName(user.displayName || user.email || "Pengguna")
        // Get user role from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid))
        const userData = userDoc.data()
        console.log("ClientLayout: User data from Firestore:", userData)

        if (userData) {
          if (userData.role === "admin") {
            if (pathname !== "/admin") {
              console.log("ClientLayout: Redirecting to /admin")
              router.push("/admin")
              return
            }
          } else if (userData.role === "teacher") {
            if (pathname !== "/guru") {
              console.log("ClientLayout: Redirecting to /guru")
              router.push("/guru")
              return
            }
          } else {
            // Unknown role, redirect to login
            console.log("ClientLayout: Unknown role, redirecting to /")
            router.push("/")
            return
          }
        } else {
          // User data not found in Firestore, redirect to login
          console.log("ClientLayout: User data not found, redirecting to /", user.uid)
          router.push("/")
          return
        }
      } else {
        // Not logged in, redirect to login page if not already there
        if (pathname !== "/") {
          console.log("ClientLayout: Not logged in, redirecting to / ")
          router.push("/")
          return
        }
      }
      console.log("ClientLayout: Setting loading to false")
      setLoading(false)
    })

    return () => {
      console.log("ClientLayout: Unsubscribing from auth state changes")
      unsubscribe()
    }
  }, [pathname, router])

  if (loading) {
    console.log("ClientLayout: Rendering loading spinner")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  console.log("ClientLayout: Rendering children")
  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {pathname !== "/" && (
          <Header userDisplayName={userDisplayName || undefined} />
        )}
        {children}
      </ThemeProvider>
      <Toaster />
    </>
  )
} 