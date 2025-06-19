"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { CombinedCorrection } from "@/components/combined-correction"
import { onAuthStateChanged } from "firebase/auth"
import { buttonVariants } from "@/components/ui/button"

export default function GuruDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("correction")
  const [stats, setStats] = useState({
    totalExams: 0,
    activeExams: 0,
    totalStudents: 0,
    pendingCorrections: 0
  })
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("GuruDashboard: useEffect (auth check) triggered")
    // Only fetch user data if authenticated, client-layout handles initial auth state and redirect
    const fetchUserData = async () => {
      console.log("GuruDashboard: fetchUserData called, auth.currentUser:", auth.currentUser ? auth.currentUser.uid : "null")
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))
        const userData = userDoc.data()
        console.log("GuruDashboard: User data from Firestore:", userData)
        if (userData && userData.role === "teacher") {
          setCurrentUser(userData)
        } else {
          // If user is not teacher, it means the layout should have redirected them.
          // This page will simply not render content until the correct user is set by client-layout
          // or the user is redirected away.
          console.log("GuruDashboard: User is not teacher or data missing. Relying on ClientLayout redirect.")
        }
      } else {
        // No user logged in, client-layout should handle redirect to login.
        // This page will simply not render content.
        console.log("GuruDashboard: No user logged in. Relying on ClientLayout redirect.")
      }
      setLoading(false)
      console.log("GuruDashboard: Setting loading to false")
    }

    fetchUserData()

    // Cleanup is not needed for auth.currentUser directly, but keeping for reference if onAuthStateChanged was here.
    // const unsubscribe = onAuthStateChanged(auth, (user) => { /* ... */ }); return () => unsubscribe();
  }, [router, toast])

  useEffect(() => {
    console.log("GuruDashboard: useEffect (fetch stats) triggered. currentUser:", currentUser)
    if (!currentUser || currentUser.role !== "teacher") {
      console.log("GuruDashboard: Not fetching stats (not teacher or user not loaded)")
      return // Only fetch stats if current user is teacher
    }

    // Fetch teacher statistics
    const fetchStats = async () => {
      try {
        console.log("GuruDashboard: Fetching teacher statistics...")
        // Get teacher's exams
        const examsQuery = query(collection(db, "exams"), where("teacherId", "==", currentUser.uid))
        const examsSnapshot = await getDocs(examsQuery)
        
        // Get active exams
        const activeExamsQuery = query(
          collection(db, "exams"), 
          where("teacherId", "==", currentUser.uid),
          where("status", "==", "active")
        )
        const activeExamsSnapshot = await getDocs(activeExamsQuery)
        
        // Get total students in teacher's classes
        const studentsQuery = query(collection(db, "students"), where("teacherId", "==", currentUser.uid))
        const studentsSnapshot = await getDocs(studentsQuery)
        
        // Get pending corrections
        const correctionsQuery = query(
          collection(db, "corrections"),
          where("teacherId", "==", currentUser.uid),
          where("status", "==", "pending")
        )
        const correctionsSnapshot = await getDocs(correctionsQuery)

        setStats({
          totalExams: examsSnapshot.size,
          activeExams: activeExamsSnapshot.size,
          totalStudents: studentsSnapshot.size,
          pendingCorrections: correctionsSnapshot.size
        })
        console.log("GuruDashboard: Stats fetched successfully:", { totalExams: examsSnapshot.size, activeExams: activeExamsSnapshot.size, totalStudents: studentsSnapshot.size, pendingCorrections: correctionsSnapshot.size })
      } catch (error) {
        console.error("GuruDashboard: Error fetching stats:", error)
        toast({
          title: "Error",
          description: "Gagal mengambil data statistik",
          variant: "destructive"
        })
      }
    }

    fetchStats()
  }, [currentUser, toast])

  console.log("GuruDashboard: Rendering component. loading:", loading, "currentUser:", currentUser ? currentUser.role : "null")
  if (loading || !currentUser || currentUser.role !== "teacher") {
    console.log("GuruDashboard: Displaying loading spinner or nothing (unauthorized)")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  console.log("GuruDashboard: User is authorized, rendering content.")
  return (
    <div className="container mx-auto py-4 md:py-6 px-4 space-y-4 md:space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto -mx-4 px-4">
          <TabsList className="w-full md:w-auto inline-flex">
            <TabsTrigger value="correction" className="text-sm md:text-base">Koreksi Ujian</TabsTrigger>
            <TabsTrigger value="exams" className="text-sm md:text-base">Ujian Saya</TabsTrigger>
            <TabsTrigger value="students" className="text-sm md:text-base">Data Siswa</TabsTrigger>
            <TabsTrigger value="reports" className="text-sm md:text-base">Laporan</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="correction">
          {/* Pass currentUser to CombinedCorrection */}
          {currentUser && <CombinedCorrection user={currentUser} />}
        </TabsContent>

        <TabsContent value="exams">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Ujian Saya</CardTitle>
              <CardDescription className="text-sm md:text-base">Kelola ujian yang telah dibuat</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Ujian</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold">{stats.totalExams}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ujian Aktif</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold">{stats.activeExams}</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Data Siswa</CardTitle>
              <CardDescription className="text-sm md:text-base">Kelola data siswa dan kelas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold">{stats.totalStudents}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Koreksi Tertunda</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold">{stats.pendingCorrections}</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Laporan</CardTitle>
              <CardDescription className="text-sm md:text-base">Lihat laporan dan analisis</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Fitur laporan akan segera hadir</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
