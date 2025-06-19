"use client"

import type React from "react"

import { useState } from "react"
import { Eye, EyeOff, BookOpen } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { useToast } from "@/components/ui/use-toast"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isRegister) {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        
        // Create user document in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: email,
          role: "teacher", // Default role for new registrations
          createdAt: new Date().toISOString()
        })

        toast({
          title: "Registrasi berhasil",
          description: "Akun guru Anda telah dibuat",
        })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
        toast({
          title: "Login berhasil",
          description: "Selamat datang kembali",
        })
      }
    } catch (error: any) {
      console.error("Auth error:", error)
      toast({
        title: isRegister ? "Registrasi gagal" : "Login gagal",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6 p-6 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          {isRegister ? "Daftar Akun Baru" : "Masuk ke Grader.io"}
        </h2>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-100 placeholder-gray-400 transition-all duration-200"
            placeholder="Email guru@sekolah.com"
          />
        </div>

        <div className="space-y-2">
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-100 placeholder-gray-400 transition-all duration-200"
              placeholder="Password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors duration-200"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Memproses...
            </div>
          ) : isRegister ? (
            "Daftar"
          ) : (
            "Masuk"
          )}
        </button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
        >
          {isRegister ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}
        </button>
      </div>
    </div>
  )
}
