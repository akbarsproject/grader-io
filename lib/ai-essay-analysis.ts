// AI Essay Analysis using Hybrid Approach (Local + Hugging Face API)

interface EssayAnalysisRequest {
  question: string
  answer: string
  rubric?: string
  useApi?: boolean
}

interface EssayAnalysisResponse {
  score: number
  feedback: string
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  keywords: string[]
  detailedAnalysis: {
    content: number
    structure: number
    language: number
    relevance: number
  }
}

// Local analysis functions
function analyzeContent(answer: string): number {
  const wordCount = answer.split(/\s+/).length
  const sentenceCount = answer.split(/[.!?]+/).length
  const avgWordPerSentence = wordCount / sentenceCount
  
  // Score based on content length and complexity
  let score = Math.min(100, Math.max(0, 
    (wordCount / 10) + // Length factor
    (avgWordPerSentence * 2) + // Complexity factor
    (answer.includes('karena') ? 10 : 0) + // Reasoning
    (answer.includes('contoh') ? 10 : 0) + // Examples
    (answer.includes('menurut') ? 5 : 0) // References
  ))
  
  return Math.round(score)
}

function analyzeStructure(answer: string): number {
  const paragraphs = answer.split(/\n\s*\n/)
  const hasIntroduction = answer.toLowerCase().includes('pendahuluan') || 
                         answer.toLowerCase().includes('pertama')
  const hasConclusion = answer.toLowerCase().includes('kesimpulan') || 
                       answer.toLowerCase().includes('akhirnya')
  
  let score = Math.min(100, Math.max(0,
    (paragraphs.length * 15) + // Paragraph structure
    (hasIntroduction ? 20 : 0) + // Introduction
    (hasConclusion ? 20 : 0) // Conclusion
  ))
  
  return Math.round(score)
}

function analyzeLanguage(answer: string): number {
  const commonErrors = [
    /[a-z][A-Z]/, // Mixed case
    /[.!?]\s*[a-z]/, // Missing capital after period
    /,\s*[A-Z]/, // Comma followed by capital
    /\s{2,}/, // Multiple spaces
  ]
  
  let errorCount = 0
  commonErrors.forEach(pattern => {
    const matches = answer.match(pattern)
    if (matches) errorCount += matches.length
  })
  
  const wordCount = answer.split(/\s+/).length
  const errorRate = errorCount / wordCount
  
  let score = Math.min(100, Math.max(0, 100 - (errorRate * 100)))
  return Math.round(score)
}

function analyzeRelevance(question: string, answer: string): number {
  const questionWords = question.toLowerCase().split(/\s+/)
  const answerWords = answer.toLowerCase().split(/\s+/)
  
  let matchCount = 0
  questionWords.forEach(word => {
    if (word.length > 3 && answerWords.includes(word)) {
      matchCount++
    }
  })
  
  const relevanceScore = (matchCount / questionWords.length) * 100
  return Math.round(Math.min(100, Math.max(0, relevanceScore)))
}

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/)
  const commonWords = ["yang", "dan", "di", "ke", "dari", "untuk", "dengan", "pada", "dalam", "adalah"]
  const filteredWords = words.filter(word => 
    word.length > 3 && 
    !commonWords.includes(word)
  )
  
  const wordCount: { [key: string]: number } = {}
  filteredWords.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })
  
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word)
}

export async function analyzeEssay(data: EssayAnalysisRequest): Promise<EssayAnalysisResponse> {
  try {
    // If API is requested and available, use Hugging Face
    if (data.useApi && process.env.HUGGINGFACE_API_KEY) {
      const prompt = `
        Pertanyaan: ${data.question}
        Jawaban: ${data.answer}
        ${data.rubric ? `Rubrik: ${data.rubric}` : ''}
        
        Analisis jawaban esai di atas dan berikan:
        1. Skor keseluruhan (0-100)
        2. Umpan balik umum
        3. Daftar kekuatan
        4. Daftar kelemahan
        5. Saran perbaikan
        6. Kata kunci penting
        7. Analisis detail untuk konten, struktur, bahasa, dan relevansi
      `

      // Use indobert-base-p1 for text analysis
      const analysisResponse = await fetch(
        "https://api-inference.huggingface.co/models/indonesian-nlp/indobert-base-p1",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: prompt
          })
        }
      )

      if (analysisResponse.ok) {
        const analysisResult = await analysisResponse.json()
        
        // Process the API response
        const contentScore = Math.min(100, Math.max(0, 
          (analysisResult[0]?.score || 0.5) * 100 + 
          (data.answer.length / 10)
        ))

        // Generate structured feedback based on analysis
        const feedback = analysisResult[0]?.label === "POSITIVE" 
          ? "Jawaban menunjukkan pemahaman yang baik terhadap topik."
          : "Jawaban memerlukan pengembangan lebih lanjut."

        const strengths = []
        const weaknesses = []
        const suggestions = []

        if (contentScore >= 90) {
          strengths.push("Analisis mendalam terhadap topik")
          strengths.push("Struktur jawaban yang terorganisir")
          weaknesses.push("Beberapa poin minor dapat dikembangkan")
          suggestions.push("Tambahkan contoh konkret")
        } else if (contentScore >= 80) {
          strengths.push("Pemahaman yang baik terhadap topik")
          strengths.push("Argumen yang cukup terstruktur")
          weaknesses.push("Beberapa bagian kurang dikembangkan")
          suggestions.push("Kembangkan poin-poin utama")
        } else {
          strengths.push("Upaya menjawab pertanyaan")
          weaknesses.push("Kurang pengembangan ide")
          weaknesses.push("Struktur jawaban kurang jelas")
          suggestions.push("Pelajari kembali materi terkait")
        }

        return {
          score: contentScore,
          feedback,
          strengths,
          weaknesses,
          suggestions,
          keywords: extractKeywords(data.answer),
          detailedAnalysis: {
            content: contentScore,
            structure: analyzeStructure(data.answer),
            language: analyzeLanguage(data.answer),
            relevance: analyzeRelevance(data.question, data.answer)
          }
        }
      }
    }

    // Fallback to local analysis
    const contentScore = analyzeContent(data.answer)
    const structureScore = analyzeStructure(data.answer)
    const languageScore = analyzeLanguage(data.answer)
    const relevanceScore = analyzeRelevance(data.question, data.answer)
    
    const averageScore = Math.round(
      (contentScore + structureScore + languageScore + relevanceScore) / 4
    )

    // Generate feedback based on scores
    let feedback = ""
    const strengths = []
    const weaknesses = []
    const suggestions = []

    if (averageScore >= 90) {
      feedback = "Jawaban sangat baik dengan analisis mendalam dan struktur yang jelas."
      strengths.push("Analisis mendalam terhadap topik")
      strengths.push("Struktur jawaban yang terorganisir dengan baik")
      strengths.push("Penggunaan bahasa yang tepat dan efektif")
      weaknesses.push("Beberapa poin minor dapat dikembangkan lebih lanjut")
      suggestions.push("Tambahkan contoh konkret untuk memperkuat argumen")
    } else if (averageScore >= 80) {
      feedback = "Jawaban baik dengan pemahaman yang solid terhadap topik."
      strengths.push("Pemahaman yang baik terhadap topik")
      strengths.push("Argumen yang cukup terstruktur")
      weaknesses.push("Beberapa bagian kurang dikembangkan")
      weaknesses.push("Transisi antar paragraf dapat ditingkatkan")
      suggestions.push("Kembangkan poin-poin utama dengan lebih detail")
      suggestions.push("Perbaiki struktur paragraf untuk alur yang lebih baik")
    } else if (averageScore >= 70) {
      feedback = "Jawaban cukup baik namun memerlukan pengembangan lebih lanjut."
      strengths.push("Ide dasar yang relevan dengan pertanyaan")
      strengths.push("Beberapa poin penting telah diidentifikasi")
      weaknesses.push("Kurang pengembangan ide")
      weaknesses.push("Struktur jawaban kurang terorganisir")
      weaknesses.push("Beberapa kesalahan tata bahasa")
      suggestions.push("Kembangkan argumen dengan lebih mendalam")
      suggestions.push("Perbaiki struktur jawaban dengan paragraf yang lebih jelas")
      suggestions.push("Perhatikan tata bahasa dan ejaan")
    } else {
      feedback = "Jawaban memerlukan perbaikan signifikan dalam konten dan struktur."
      strengths.push("Upaya untuk menjawab pertanyaan")
      weaknesses.push("Kurangnya pemahaman terhadap topik")
      weaknesses.push("Struktur jawaban tidak jelas")
      weaknesses.push("Banyak kesalahan tata bahasa dan ejaan")
      suggestions.push("Pelajari kembali materi terkait topik")
      suggestions.push("Buat outline sebelum menulis jawaban")
      suggestions.push("Perhatikan tata bahasa dan ejaan")
    }

    return {
      score: averageScore,
      feedback,
      strengths,
      weaknesses,
      suggestions,
      keywords: extractKeywords(data.answer),
      detailedAnalysis: {
        content: contentScore,
        structure: structureScore,
        language: languageScore,
        relevance: relevanceScore
      }
    }
  } catch (error) {
    console.error("Essay analysis error:", error)
    throw new Error("Failed to analyze essay")
  }
}
