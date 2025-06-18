"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { buttonVariants } from "@/components/ui/button"

export default function AdminPanel() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    totalExams: 0,
    activeExams: 0
  })
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("AdminPanel: useEffect (auth check) triggered")
    // Only fetch user data if authenticated, client-layout handles initial auth state and redirect
    const fetchUserData = async () => {
      console.log("AdminPanel: fetchUserData called, auth.currentUser:", auth.currentUser ? auth.currentUser.uid : "null")
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))
        const userData = userDoc.data()
        console.log("AdminPanel: User data from Firestore:", userData)
        if (userData && userData.role === "admin") {
          setCurrentUser(userData)
        } else {
          // If user is not admin, it means the layout should have redirected them.
          // This page will simply not render content until the correct user is set by client-layout
          // or the user is redirected away.
          console.log("AdminPanel: User is not admin or data missing. Relying on ClientLayout redirect.")
          // Optionally, you could add a router.push here for a fallback, but it should be handled by ClientLayout
        }
      } else {
        // No user logged in, client-layout should handle redirect to login.
        // This page will simply not render content.
        console.log("AdminPanel: No user logged in. Relying on ClientLayout redirect.")
      }
      setLoading(false)
      console.log("AdminPanel: Setting loading to false")
    }

    fetchUserData()

    // Cleanup is not needed for auth.currentUser directly, but keeping for reference if onAuthStateChanged was here.
    // const unsubscribe = onAuthStateChanged(auth, (user) => { /* ... */ }); return () => unsubscribe();
  }, [router, toast])

  useEffect(() => {
    console.log("AdminPanel: useEffect (fetch stats) triggered. currentUser:", currentUser)
    if (!currentUser || currentUser.role !== "admin") {
      console.log("AdminPanel: Not fetching stats (not admin or user not loaded)")
      return // Only fetch stats if current user is admin
    }

    // Fetch admin statistics
    const fetchStats = async () => {
      try {
        console.log("AdminPanel: Fetching admin statistics...")
        // Get total teachers
        const teachersQuery = query(collection(db, "users"), where("role", "==", "teacher"))
        const teachersSnapshot = await getDocs(teachersQuery)
        
        // Get total students
        const studentsQuery = query(collection(db, "users"), where("role", "==", "student"))
        const studentsSnapshot = await getDocs(studentsQuery)
        
        // Get total exams
        const examsQuery = query(collection(db, "exams"))
        const examsSnapshot = await getDocs(examsQuery)
        
        // Get active exams
        const activeExamsQuery = query(collection(db, "exams"), where("status", "==", "active"))
        const activeExamsSnapshot = await getDocs(activeExamsQuery)

        setStats({
          totalTeachers: teachersSnapshot.size,
          totalStudents: studentsSnapshot.size,
          totalExams: examsSnapshot.size,
          activeExams: activeExamsSnapshot.size
        })
        console.log("AdminPanel: Stats fetched successfully:", { totalTeachers: teachersSnapshot.size, totalStudents: studentsSnapshot.size, totalExams: examsSnapshot.size, activeExams: activeExamsSnapshot.size })
      } catch (error) {
        console.error("AdminPanel: Error fetching stats:", error)
        toast({
          title: "Error",
          description: "Gagal mengambil data statistik",
          variant: "destructive"
        })
      }
    }

    fetchStats()
  }, [currentUser, toast])

  console.log("AdminPanel: Rendering component. loading:", loading, "currentUser:", currentUser ? currentUser.role : "null")
  if (loading || !currentUser || currentUser.role !== "admin") {
    console.log("AdminPanel: Displaying loading spinner or nothing (unauthorized)")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  console.log("AdminPanel: User is authorized, rendering content.")
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teachers">Guru</TabsTrigger>
          <TabsTrigger value="students">Siswa</TabsTrigger>
          <TabsTrigger value="exams">Ujian</TabsTrigger>
          <TabsTrigger value="settings">Pengaturan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Guru</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTeachers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Ujian</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalExams}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ujian Aktif</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeExams}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Aktivitas Terbaru</CardTitle>
              <CardDescription>Daftar aktivitas terbaru di sistem</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add activity log component here */}
              <p className="text-sm text-gray-500">Belum ada aktivitas</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Guru</CardTitle>
              <CardDescription>Kelola data guru dan akses mereka</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add teacher management component here */}
              <p className="text-sm text-gray-500">Fitur dalam pengembangan</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Siswa</CardTitle>
              <CardDescription>Kelola data siswa dan kelas</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add student management component here */}
              <p className="text-sm text-gray-500">Fitur dalam pengembangan</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Ujian</CardTitle>
              <CardDescription>Kelola jadwal dan pengaturan ujian</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add exam management component here */}
              <p className="text-sm text-gray-500">Fitur dalam pengembangan</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Sistem</CardTitle>
              <CardDescription>Konfigurasi sistem dan preferensi</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add system settings component here */}
              <p className="text-sm text-gray-500">Fitur dalam pengembangan</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 