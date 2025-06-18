import { createWorker } from "tesseract.js"

interface PreprocessingOptions {
  contrast?: number
  brightness?: number
  threshold?: number
  deskew?: boolean
}

export async function preprocessImageForOCR(
  imageFile: File,
  options: PreprocessingOptions = {}
): Promise<File> {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  const img = new Image()

  return new Promise((resolve, reject) => {
    img.onload = () => {
      // Set canvas size
      canvas.width = img.width
      canvas.height = img.height

      // Draw original image
      ctx?.drawImage(img, 0, 0)

      // Get image data
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
      if (!imageData) {
        reject(new Error("Failed to get image data"))
        return
      }

      // Apply preprocessing
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        // Apply contrast
        if (options.contrast) {
          const factor = (259 * (options.contrast + 255)) / (255 * (259 - options.contrast))
          data[i] = factor * (data[i] - 128) + 128
          data[i + 1] = factor * (data[i + 1] - 128) + 128
          data[i + 2] = factor * (data[i + 2] - 128) + 128
        }

        // Apply brightness
        if (options.brightness) {
          data[i] += options.brightness
          data[i + 1] += options.brightness
          data[i + 2] += options.brightness
        }

        // Apply threshold
        if (options.threshold) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
          const value = avg > options.threshold ? 255 : 0
          data[i] = value
          data[i + 1] = value
          data[i + 2] = value
        }
      }

      // Put processed image data back
      ctx?.putImageData(imageData, 0, 0)

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const processedFile = new File([blob], imageFile.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            })
            resolve(processedFile)
          } else {
            reject(new Error("Failed to create blob"))
          }
        },
        "image/jpeg",
        0.95
      )
    }

    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = URL.createObjectURL(imageFile)
  })
}

export async function detectAnswerSheetFormat(imageFile: File): Promise<{
  isValid: boolean
  error?: string
  format?: "standard" | "custom"
}> {
  try {
    const worker = await createWorker()
    await worker.loadLanguage("eng")
    await worker.initialize("eng")

    // Analyze image for answer sheet patterns
    const { data } = await worker.recognize(imageFile)
    await worker.terminate()

    // Check for common answer sheet patterns
    const text = data.text.toLowerCase()
    
    // Look for common answer sheet indicators
    const hasNumbering = /\d+\./g.test(text)
    const hasOptions = /[a-e][\s\.]/gi.test(text)
    const hasBubbles = /[o●○]/g.test(text)

    if (hasNumbering && (hasOptions || hasBubbles)) {
      return {
        isValid: true,
        format: "standard"
      }
    }

    return {
      isValid: false,
      error: "Format lembar jawaban tidak dikenali. Pastikan gambar jelas dan format sesuai standar."
    }
  } catch (error) {
    return {
      isValid: false,
      error: "Gagal menganalisis format lembar jawaban"
    }
  }
} 