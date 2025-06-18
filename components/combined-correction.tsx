"use client"

import { useState, useRef } from "react"
import { Download, FileText, CheckCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button, ButtonProps, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"
import { Badge, BadgeProps, badgeVariants } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { analyzeEssay } from "@/lib/ai-essay-analysis"
import { extractAnswersFromImage, formatAnswersForDisplay, calculateConfidenceLevel } from "@/lib/ocr-service"
import { compressImage, validateImageFile } from "@/lib/image-utils"
import { Switch } from "@/components/ui/switch"

interface CombinedCorrectionProps {
  user: {
    uid: string
    email: string
    name: string
  }
}

export function CombinedCorrection({ user }: CombinedCorrectionProps) {
  const [activeTab, setActiveTab] = useState("input")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [examName, setExamName] = useState("")
  const [examDate, setExamDate] = useState("")
  const [answerKey, setAnswerKey] = useState("")
  const [essayQuestion, setEssayQuestion] = useState("")
  const [essayRubric, setEssayRubric] = useState("")
  const [studentData, setStudentData] = useState({
    name: "",
    studentId: "",
    class: "",
    mcAnswers: "",
    essayAnswer: "",
  })
  const [results, setResults] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<string>("")
  const [useApiAnalysis, setUseApiAnalysis] = useState(false)

  // Dummy class list
  const classes = ["10 IPA 1", "10 IPA 2", "11 IPA 1", "11 IPA 2", "12 IPA 1", "12 IPA 2", "12 IPA 3"]

  const handleAddStudent = async () => {
    // Validate inputs
    if (!studentData.name || !studentData.studentId || !studentData.class) {
      toast({
        title: "Data tidak lengkap",
        description: "Mohon isi nama, nomor absen, dan kelas siswa",
        variant: "destructive",
      })
      return
    }

    if (!answerKey && !essayQuestion) {
      toast({
        title: "Data ujian tidak lengkap",
        description: "Mohon isi kunci jawaban PG atau pertanyaan esai",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Process multiple choice answers if available
      let mcScore = 0
      const mcDetails = []

      if (answerKey && studentData.mcAnswers) {
        const key = answerKey.toUpperCase()
        const answers = studentData.mcAnswers.toUpperCase()
        let correct = 0

        for (let i = 0; i < Math.min(key.length, answers.length); i++) {
          const isCorrect = key[i] === answers[i]
          if (isCorrect) correct++
          mcDetails.push({
            number: i + 1,
            correct: key[i],
            student: answers[i],
            isCorrect,
          })
        }

        mcScore = Math.round((correct / key.length) * 100)
      }

      // Process essay if available
      let essayScore = 0
      let essayAnalysis = null

      if (essayQuestion && studentData.essayAnswer) {
        setAiLoading(true)

        try {
          // Call AI analysis
          const analysis = await analyzeEssay({
            question: essayQuestion,
            answer: studentData.essayAnswer,
            rubric: essayRubric || "Evaluate based on content, grammar, and relevance to the question.",
            useApi: useApiAnalysis
          })

          essayScore = analysis.score
          essayAnalysis = analysis
          setAiAnalysis(analysis)
        } catch (error) {
          console.error("AI analysis error:", error)
          toast({
            title: "Analisis AI gagal",
            description: "Gagal melakukan analisis esai dengan AI",
            variant: "destructive",
          })

          // Fallback to basic scoring
          essayScore = 70 // Default score
        } finally {
          setAiLoading(false)
        }
      }

      // Calculate combined score
      const hasMC = answerKey && studentData.mcAnswers
      const hasEssay = essayQuestion && studentData.essayAnswer

      let finalScore = 0
      if (hasMC && hasEssay) {
        finalScore = Math.round(mcScore * 0.6 + essayScore * 0.4) // 60% MC, 40% Essay
      } else if (hasMC) {
        finalScore = mcScore
      } else if (hasEssay) {
        finalScore = essayScore
      }

      // Create result object
      const result = {
        id: Date.now().toString(),
        name: studentData.name,
        studentId: studentData.studentId,
        class: studentData.class,
        mcScore: hasMC ? mcScore : null,
        mcDetails: hasMC ? mcDetails : null,
        essayScore: hasEssay ? essayScore : null,
        essayAnalysis: essayAnalysis,
        finalScore,
        timestamp: new Date().toISOString(),
      }

      // Add to results array
      setResults([...results, result])

      // Save to Firestore (in production)
      // await addDoc(collection(db, "combined_results"), {
      //   ...result,
      //   examName,
      //   examDate,
      //   createdAt: serverTimestamp(),
      //   createdBy: user.uid,
      //   teacherName: user.name,
      // })

      toast({
        title: "Data siswa ditambahkan",
        description: `Nilai akhir: ${finalScore}`,
      })

      // Reset student form
      setStudentData({
        name: "",
        studentId: "",
        class: studentData.class, // Keep the class for batch entry
        mcAnswers: "",
        essayAnswer: "",
      })

      // Switch to results tab
      setActiveTab("results")
    } catch (error) {
      console.error("Error processing data:", error)
      toast({
        title: "Error",
        description: "Gagal memproses data siswa",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const exportToGoogleSheets = async () => {
    if (results.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data yang dapat diekspor",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)

    try {
      const allRows: string[][] = [];

      // Add header row
      allRows.push(["Nama Ujian", "Tanggal Ujian", "Nama Siswa", "Nomor Absen", "Kelas", "Nilai PG", "Nilai Esai", "Nilai Akhir", "Timestamp"]);

      // Group results by class and add data rows
      const resultsToExport = selectedClass === "all" ? results : results.filter(result => result.class === selectedClass);

      resultsToExport.forEach((result) => {
        allRows.push([
          examName || "",
          examDate || "",
          result.name,
          result.studentId,
          result.class,
          result.mcScore !== null ? result.mcScore.toString() : "",
          result.essayScore !== null ? result.essayScore.toString() : "",
          result.finalScore.toString(),
          result.timestamp,
        ]);
      });

      const response = await fetch("/api/google-sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: allRows }),
      });

      if (response.ok) {
        toast({
          title: "Ekspor berhasil",
          description: "Data berhasil diekspor ke Google Sheet.",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal mengekspor data ke Google Sheet.");
      }
    } catch (error) {
      console.error("Error exporting to Google Sheets:", error);
      toast({
        title: "Ekspor gagal",
        description: `Gagal mengekspor data ke Google Sheet: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getGradeColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800"
    if (score >= 80) return "bg-blue-100 text-blue-800"
    if (score >= 70) return "bg-yellow-100 text-yellow-800"
    if (score >= 60) return "bg-orange-100 text-orange-800"
    return "bg-red-100 text-red-800"
  }

  const getGradeLabel = (score: number) => {
    if (score >= 90) return "A"
    if (score >= 80) return "B"
    if (score >= 70) return "C"
    if (score >= 60) return "D"
    return "E"
  }

  // Add type for value parameter
  const handleClassChange = (value: string) => {
    setSelectedClass(value)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      toast({
        title: "File tidak valid",
        description: validation.error,
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    toast({
      title: "Memproses gambar",
      description: "Sedang mengompres dan mengekstrak jawaban...",
    })

    try {
      // Compress image to reduce size for base64 storage
      const compressedFile = await compressImage(file, 800, 0.7)

      // Preview the compressed image
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(compressedFile)
      setSelectedImage(compressedFile)

      // Use the new OCR service
      const ocrResult = await extractAnswersFromImage(compressedFile)
      
      if (ocrResult.error) {
        toast({
          title: "Gagal mengekstrak jawaban",
          description: ocrResult.error,
          variant: "destructive",
        })
        return
      }

      setOcrResult(formatAnswersForDisplay(ocrResult.answers))
      setStudentData(prev => ({
        ...prev,
        mcAnswers: ocrResult.answers
      }))

      toast({
        title: "OCR selesai",
        description: `Jawaban berhasil diekstrak (${calculateConfidenceLevel(ocrResult.confidence)})`,
      })
    } catch (error) {
      console.error("Image processing error:", error)
      toast({
        title: "Gagal memproses gambar",
        description: "Silakan coba lagi atau gunakan input manual",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Koreksi Gabungan (PG & Esai)</CardTitle>
          <CardDescription>
            Koreksi ujian dengan kombinasi pilihan ganda dan esai, dengan penilaian otomatis menggunakan AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="setup">Setup Ujian</TabsTrigger>
              <TabsTrigger value="input">Input Jawaban</TabsTrigger>
              <TabsTrigger value="results">Hasil & Export</TabsTrigger>
            </TabsList>

            {/* Setup Tab */}
            <TabsContent value="setup" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exam-name">Nama Ujian</Label>
                  <Input
                    id="exam-name"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="Contoh: UTS Matematika Semester 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exam-date">Tanggal Ujian</Label>
                  <Input id="exam-date" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Pilihan Ganda</h3>
                <div className="space-y-2">
                  <Label htmlFor="answer-key">Kunci Jawaban</Label>
                  <Textarea
                    id="answer-key"
                    value={answerKey}
                    onChange={(e) => setAnswerKey(e.target.value)}
                    placeholder="Contoh: ABCDABCDABCD..."
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-gray-500">
                    Masukkan kunci jawaban pilihan ganda. Kosongkan jika hanya esai.
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Esai</h3>
                <div className="space-y-2">
                  <Label htmlFor="essay-question">Pertanyaan Esai</Label>
                  <Textarea
                    id="essay-question"
                    value={essayQuestion}
                    onChange={(e) => setEssayQuestion(e.target.value)}
                    placeholder="Tulis pertanyaan esai di sini..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="essay-rubric">Rubrik Penilaian (untuk AI)</Label>
                  <Textarea
                    id="essay-rubric"
                    value={essayRubric}
                    onChange={(e) => setEssayRubric(e.target.value)}
                    placeholder="Contoh: Nilai berdasarkan kedalaman analisis, penggunaan bahasa, dan relevansi dengan pertanyaan."
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-gray-500">
                    Masukkan kriteria penilaian untuk membantu AI menilai esai dengan lebih akurat.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="use-api"
                  checked={useApiAnalysis}
                  onCheckedChange={setUseApiAnalysis}
                />
                <Label htmlFor="use-api">Gunakan analisis AI lanjutan (Hugging Face - Gratis)</Label>
              </div>

              <div className="flex justify-end mt-4">
                <Button onClick={() => setActiveTab("input")}>Lanjut ke Input Jawaban</Button>
              </div>
            </TabsContent>

            {/* Input Tab */}
            <TabsContent value="input" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Input Jawaban Siswa</CardTitle>
                  <CardDescription>
                    Masukkan data siswa dan jawaban mereka. Anda bisa menggunakan OCR untuk jawaban PG atau input manual.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="student-name">Nama Siswa</Label>
                      <Input
                        id="student-name"
                        value={studentData.name}
                        onChange={(e) => setStudentData({ ...studentData, name: e.target.value })}
                        placeholder="Nama lengkap siswa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-id">ID Siswa</Label>
                      <Input
                        id="student-id"
                        value={studentData.studentId}
                        onChange={(e) => setStudentData({ ...studentData, studentId: e.target.value })}
                        placeholder="Nomor induk siswa"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <Label htmlFor="student-class">Kelas</Label>
                    <Select
                      value={studentData.class}
                      onValueChange={(value: string) => setStudentData({ ...studentData, class: value })}
                    >
                      <SelectTrigger id="student-class">
                        <SelectValue placeholder="Pilih kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls} value={cls}>
                            {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {answerKey && (
                    <div className="space-y-4 mb-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="mc-answers">Jawaban Pilihan Ganda</Label>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="file-upload" className="cursor-pointer">
                            <span className="text-sm text-blue-600 hover:text-blue-800">
                              Upload Gambar
                            </span>
                            <input
                              id="file-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={fileInputRef}
                              onChange={handleImageUpload}
                            />
                          </Label>
                        </div>
                      </div>

                      {previewUrl && (
                        <div className="mb-4">
                          <img src={previewUrl} alt="Preview" className="max-h-48 rounded-lg" />
                          <button
                            onClick={() => {
                              setSelectedImage(null)
                              setPreviewUrl(null)
                              setOcrResult("")
                              if (fileInputRef.current) {
                                fileInputRef.current.value = ""
                              }
                            }}
                            className="text-sm text-red-600 hover:text-red-800 mt-2"
                          >
                            Hapus gambar
                          </button>
                        </div>
                      )}

                      <Textarea
                        id="mc-answers"
                        value={studentData.mcAnswers}
                        onChange={(e) => setStudentData({ ...studentData, mcAnswers: e.target.value })}
                        placeholder="Contoh: ABCDABCDABCD..."
                        className="min-h-[80px]"
                      />
                      {ocrResult && (
                        <p className="text-sm text-gray-500">
                          Hasil OCR: {ocrResult}
                        </p>
                      )}
                    </div>
                  )}

                  {essayQuestion && (
                    <div className="space-y-2">
                      <Label htmlFor="essay-answer">Jawaban Esai</Label>
                      <div className="bg-gray-50 p-3 rounded-md mb-2">
                        <p className="text-sm font-medium">{essayQuestion}</p>
                      </div>
                      <Textarea
                        id="essay-answer"
                        value={studentData.essayAnswer}
                        onChange={(e) => setStudentData({ ...studentData, essayAnswer: e.target.value })}
                        placeholder="Tulis atau paste jawaban esai siswa di sini..."
                        className="min-h-[200px]"
                      />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    className={buttonVariants({ variant: "outline" })}
                    onClick={() => setActiveTab("setup")}
                  >
                    Kembali ke Setup
                  </Button>
                  <Button onClick={handleAddStudent} disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Proses Jawaban
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              {aiLoading && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <p className="text-blue-600 font-medium">AI sedang menganalisis esai...</p>
                  </div>
                  <Progress value={45} className="mt-2" />
                </div>
              )}

              {aiAnalysis && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Konten</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{aiAnalysis.detailedAnalysis.content}</div>
                        <Progress value={aiAnalysis.detailedAnalysis.content} className="mt-2" />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Struktur</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{aiAnalysis.detailedAnalysis.structure}</div>
                        <Progress value={aiAnalysis.detailedAnalysis.structure} className="mt-2" />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Bahasa</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{aiAnalysis.detailedAnalysis.language}</div>
                        <Progress value={aiAnalysis.detailedAnalysis.language} className="mt-2" />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Relevansi</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{aiAnalysis.detailedAnalysis.relevance}</div>
                        <Progress value={aiAnalysis.detailedAnalysis.relevance} className="mt-2" />
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Analisis Detail</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Umpan Balik</h4>
                        <p className="text-gray-600">{aiAnalysis.feedback}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Kekuatan</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {aiAnalysis.strengths.map((strength: string, index: number) => (
                              <li key={index} className="text-green-600">{strength}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Kelemahan</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {aiAnalysis.weaknesses.map((weakness: string, index: number) => (
                              <li key={index} className="text-red-600">{weakness}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Saran Perbaikan</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {aiAnalysis.suggestions.map((suggestion: string, index: number) => (
                            <li key={index} className="text-blue-600">{suggestion}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Kata Kunci</h4>
                        <div className="flex flex-wrap gap-2">
                          {aiAnalysis.keywords.map((keyword: string, index: number) => (
                            <Badge key={index} variant="secondary">{keyword}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-4 pt-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-medium">Hasil Penilaian</h3>
                  <p className="text-sm text-gray-500">
                    {results.length} siswa telah dinilai untuk {examName || "ujian ini"}
                  </p>
                </div>

                <div className="flex flex-col md:flex-row gap-2">
                  <Select value={selectedClass} onValueChange={handleClassChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kelas</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button onClick={exportToGoogleSheets} disabled={isExporting || results.length === 0}>
                    {isExporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mengekspor...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Export ke CSV
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {results.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableCaption>Daftar hasil penilaian siswa</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>No. Absen</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Nilai PG</TableHead>
                        <TableHead>Nilai Esai</TableHead>
                        <TableHead>Nilai Akhir</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results
                        .filter((result) => selectedClass === "all" || result.class === selectedClass)
                        .map((result) => (
                          <TableRow key={result.id}>
                            <TableCell className="font-medium">{result.name}</TableCell>
                            <TableCell>{result.studentId}</TableCell>
                            <TableCell>{result.class}</TableCell>
                            <TableCell>
                              {result.mcScore !== null ? (
                                <Badge className={badgeVariants({ variant: "secondary" })}>
                                  {result.mcScore}%
                                </Badge>
                              ) : "-"}
                            </TableCell>
                            <TableCell>
                              {result.essayScore !== null ? (
                                <Badge className={badgeVariants({ variant: "secondary" })}>
                                  {result.essayScore}%
                                </Badge>
                              ) : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge className={getGradeColor(result.finalScore)}>{result.finalScore}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Belum ada hasil</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Tambahkan siswa di tab Input Jawaban untuk melihat hasil di sini
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
