"use client"

import { useState, useEffect } from "react"
import { LoginPage } from "@/components/login-page"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useToast } from "@/components/ui/use-toast"
import { LoadingScreen } from "@/components/loading-screen"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Sparkles, Brain, LineChart, Shield, Zap } from "lucide-react"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(false)
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split("@")[0] || "User",
        })
        setIsLoggedIn(true)
      } else {
        setCurrentUser(null)
        setIsLoggedIn(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await auth.signOut()
      toast({
        title: "Logout berhasil",
        description: "Anda telah keluar dari sistem",
      })
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Logout gagal",
        description: "Terjadi kesalahan saat logout",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        {/* Hero Section */}
        <section className="relative w-full py-12 md:py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
          <div className="container mx-auto text-center space-y-6 md:space-y-8 relative z-10">
            <div className="flex justify-center mb-6 md:mb-8">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-75 animate-pulse"></div>
                <BookOpen className="relative h-16 md:h-24 w-16 md:w-24 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-7xl font-extrabold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Grader.io
            </h1>
            <p className="text-lg md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-4">
              Transformasi penilaian ujian dengan AI. Koreksi otomatis, analisis mendalam, dan wawasan real-time untuk pendidikan yang lebih baik.
            </p>
            <div className="flex justify-center mt-8 md:mt-12 px-4">
              <div className="w-full max-w-sm backdrop-blur-sm bg-white/10 rounded-2xl p-1">
                <LoginPage />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-20 relative px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-16 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Fitur Unggulan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-blue-500/50 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 rounded-full bg-blue-500/10">
                      <Sparkles className="h-8 w-8 text-blue-400" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-semibold text-center text-white">Koreksi Otomatis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-center">OCR canggih untuk ekstraksi jawaban dan koreksi instan dengan akurasi tinggi.</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-purple-500/50 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 rounded-full bg-purple-500/10">
                      <Brain className="h-8 w-8 text-purple-400" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-semibold text-center text-white">AI Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-center">Analisis esai mendalam dengan AI, memberikan feedback konstruktif dan penilaian objektif.</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-pink-500/50 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 rounded-full bg-pink-500/10">
                      <LineChart className="h-8 w-8 text-pink-400" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-semibold text-center text-white">Analytics Pro</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-center">Dashboard interaktif dengan visualisasi data real-time dan insights mendalam.</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-green-500/50 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 rounded-full bg-green-500/10">
                      <Shield className="h-8 w-8 text-green-400" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-semibold text-center text-white">Keamanan Tingkat Tinggi</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-center">Enkripsi end-to-end dan sistem keamanan multi-layer untuk data sensitif.</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-yellow-500/50 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 rounded-full bg-yellow-500/10">
                      <Zap className="h-8 w-8 text-yellow-400" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-semibold text-center text-white">Performa Tinggi</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-center">Proses koreksi cepat dan efisien dengan teknologi cloud terdepan.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 md:py-8 bg-gray-900/50 backdrop-blur-sm border-t border-gray-800">
          <div className="container mx-auto text-center px-4">
            <p className="text-sm md:text-base text-gray-400">&copy; {new Date().getFullYear()} Grader.io. Dibuat dengan ❤️ untuk pendidikan yang lebih baik.</p>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center">
      <p className="text-lg text-gray-700">Redirecting...</p>
    </div>
  )
}
