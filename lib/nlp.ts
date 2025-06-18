// Simple NLP utilities for essay analysis
export function extractKeywords(text: string): string[] {
  // Common Indonesian stop words
  const stopWords = [
    "yang",
    "dan",
    "di",
    "ke",
    "dari",
    "untuk",
    "dengan",
    "pada",
    "dalam",
    "adalah",
    "ini",
    "itu",
    "akan",
    "dapat",
    "juga",
    "atau",
    "tidak",
    "ada",
    "sudah",
    "telah",
    "sebagai",
    "oleh",
    "karena",
    "sehingga",
    "namun",
    "tetapi",
    "jika",
    "apabila",
    "ketika",
    "saat",
    "setelah",
    "sebelum",
    "selama",
    "hingga",
  ]

  // Split text into words and filter
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.includes(word) && /^[a-zA-Z]+$/.test(word))

  // Count word frequency
  const wordCount: { [key: string]: number } = {}
  words.forEach((word) => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })

  // Return top keywords sorted by frequency
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word)
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length
}

export function checkGrammar(text: string): string[] {
  const issues: string[] = []

  // Check for repeated words
  const repeatedWords = text.match(/\b(\w+)\s+\1\b/gi)
  if (repeatedWords) {
    issues.push(`Kata berulang ditemukan: "${repeatedWords[0]}"`)
  }

  // Check for sentence endings
  if (!text.match(/[.!?]$/)) {
    issues.push("Paragraf tidak diakhiri dengan tanda baca")
  }

  // Check for very long sentences
  const sentences = text.split(/[.!?]+/)
  sentences.forEach((sentence, index) => {
    const wordCount = sentence.trim().split(/\s+/).length
    if (wordCount > 30) {
      issues.push(`Kalimat ${index + 1} terlalu panjang (${wordCount} kata)`)
    }
  })

  // Check for capitalization at sentence start
  const sentenceStarts = text.match(/[.!?]\s+[a-z]/g)
  if (sentenceStarts) {
    issues.push("Beberapa kalimat tidak dimulai dengan huruf kapital")
  }

  return issues
}

export function calculateReadabilityScore(text: string): number {
  const words = countWords(text)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
  const syllables = estimateSyllables(text)

  // Simplified Flesch Reading Ease formula adapted for Indonesian
  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)

  return Math.max(0, Math.min(100, score))
}

function estimateSyllables(text: string): number {
  // Simple syllable estimation for Indonesian
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || []
  let syllableCount = 0

  words.forEach((word) => {
    // Count vowel groups as syllables
    const vowelGroups = word.match(/[aiueo]+/g) || []
    syllableCount += Math.max(1, vowelGroups.length)
  })

  return syllableCount
}
