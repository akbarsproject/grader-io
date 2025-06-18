import { createWorker } from "tesseract.js"
import { preprocessImageForOCR, detectAnswerSheetFormat } from "./image-preprocessing"

export interface OCRResult {
  answers: string
  confidence: number
  error?: string
}

export interface OCRValidationResult {
  isValid: boolean
  error?: string
  suggestions?: string[]
}

export async function extractAnswersFromImage(imageFile: File): Promise<OCRResult> {
  try {
    // First, validate the answer sheet format
    const formatCheck = await detectAnswerSheetFormat(imageFile)
    if (!formatCheck.isValid) {
      return {
        answers: "",
        confidence: 0,
        error: formatCheck.error
      }
    }

    // Preprocess the image for better OCR results
    const processedImage = await preprocessImageForOCR(imageFile, {
      contrast: 1.2,
      brightness: 10,
      threshold: 128
    })

    // Initialize Tesseract worker
    const worker = await createWorker()
    await worker.loadLanguage("eng")
    await worker.initialize("eng")

    // Configure Tesseract for better accuracy
    await worker.setParameters({
      tessedit_char_whitelist: "ABCDE",
      tessedit_pageseg_mode: "6", // Assume uniform text
    })

    // Perform OCR
    const { data } = await worker.recognize(processedImage)
    await worker.terminate()

    // Extract and validate answers
    const answers = data.text.replace(/[^ABCDE]/gi, "").toUpperCase()
    const confidence = data.confidence

    // Validate the extracted answers
    const validation = validateExtractedAnswers(answers)
    if (!validation.isValid) {
      return {
        answers: "",
        confidence: 0,
        error: validation.error,
        suggestions: validation.suggestions
      }
    }

    return {
      answers,
      confidence
    }
  } catch (error) {
    console.error("OCR Error:", error)
    return {
      answers: "",
      confidence: 0,
      error: "Gagal mengekstrak jawaban dari gambar. Silakan coba lagi atau gunakan input manual."
    }
  }
}

export function validateExtractedAnswers(answers: string): OCRValidationResult {
  // Check if we have any answers
  if (!answers) {
    return {
      isValid: false,
      error: "Tidak ada jawaban yang terdeteksi",
      suggestions: ["Pastikan gambar jelas dan tidak blur", "Coba sesuaikan pencahayaan"]
    }
  }

  // Check if answers contain only A-E
  if (!/^[ABCDE]*$/i.test(answers)) {
    return {
      isValid: false,
      error: "Format jawaban tidak valid",
      suggestions: ["Pastikan hanya huruf A-E yang ada di lembar jawaban"]
    }
  }

  // Check if we have a reasonable number of answers
  if (answers.length < 5) {
    return {
      isValid: false,
      error: "Jumlah jawaban terlalu sedikit",
      suggestions: ["Pastikan semua jawaban terlihat dalam gambar"]
    }
  }

  if (answers.length > 100) {
    return {
      isValid: false,
      error: "Jumlah jawaban terlalu banyak",
      suggestions: ["Pastikan gambar hanya berisi lembar jawaban"]
    }
  }

  return { isValid: true }
}

export function formatAnswersForDisplay(answers: string): string {
  // Add spaces between answers for better readability
  return answers.split("").join(" ")
}

export function calculateConfidenceLevel(confidence: number): string {
  if (confidence >= 90) return "Sangat Baik"
  if (confidence >= 80) return "Baik"
  if (confidence >= 70) return "Cukup"
  return "Kurang"
} 