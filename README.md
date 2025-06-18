# Grader.io

Aplikasi penilaian ujian otomatis dengan fitur OCR dan AI untuk membantu guru dalam menilai jawaban pilihan ganda dan esai.

## 🚀 Fitur Utama

### 1. Otomatisasi Koreksi Pilihan Ganda (PG)
- **Upload Gambar**: Upload scan lembar jawaban siswa
- **OCR Integration**: Ekstraksi jawaban otomatis menggunakan Tesseract.js
- **Input Manual**: Alternatif input jawaban secara manual
- **Koreksi Otomatis**: Matching jawaban dengan kunci jawaban
- **Hasil Real-time**: Tampilan skor dan detail jawaban benar/salah
- **Export Data**: Download hasil dalam format CSV

### 2. Asisten Penilaian Esai
- **Input Esai**: Tambah esai baru atau upload dari file
- **Analisis Otomatis**:
  - Highlight kata kunci penting
  - Hitung jumlah kata otomatis
  - Pemeriksaan grammar sederhana
  - Skor keterbacaan
- **Interface Penilaian**: Input skor dan komentar guru
- **Riwayat Penilaian**: Tracking semua penilaian yang sudah dilakukan

### 3. Dashboard & Analytics
- **Statistik Real-time**: Total ujian, siswa, progress koreksi
- **Grafik Distribusi**: Visualisasi sebaran nilai
- **Top Performers**: Daftar siswa berprestasi
- **Activity Log**: Riwayat aktivitas sistem
- **Export Reports**: Download laporan lengkap

## 🛠 Teknologi

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **OCR**: Tesseract.js (client-side)
- **NLP**: Compromise.js untuk analisis teks
- **Charts**: Recharts untuk visualisasi data
- **UI Components**: Radix UI, Lucide React Icons
- **Hosting**: Firebase Hosting
- **AI**: Hugging Face API untuk analisis esai

## 📋 Prasyarat

Sebelum memulai instalasi, pastikan Anda memiliki:

- Node.js 18+ dan npm/yarn
- Akun Firebase (gratis)
- Git

## 🔧 Instalasi

### 1. Clone Repository

\`\`\`bash
git clone https://github.com/username/grader.io.git
cd grader.io
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
# atau
yarn install
\`\`\`

### 3. Setup Firebase

#### a. Buat Project Firebase
1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik "Add project" atau "Tambah project"
3. Masukkan nama project: `grader-io`
4. Disable Google Analytics (opsional)
5. Klik "Create project"

#### b. Setup Authentication
1. Di Firebase Console, pilih "Authentication"
2. Klik "Get started"
3. Pilih tab "Sign-in method"
4. Enable "Email/Password"
5. Klik "Save"

#### c. Setup Firestore Database
1. Di Firebase Console, pilih "Firestore Database"
2. Klik "Create database"
3. Pilih "Start in test mode"
4. Pilih lokasi server (asia-southeast1 untuk Indonesia)
5. Klik "Done"

#### d. Get Firebase Config
1. Di Firebase Console, klik ⚙️ (Settings) > "Project settings"
2. Scroll ke bawah ke "Your apps"
3. Klik "Web" icon (</>) untuk menambah web app
4. Masukkan app nickname: `grader-io-web`
5. Centang "Also set up Firebase Hosting"
6. Klik "Register app"
7. Copy konfigurasi Firebase

### 4. Environment Variables

Buat file `.env.local` di root project:

\`\`\`env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
HUGGINGFACE_API_KEY=your-huggingface-api-key
\`\`\`

### 5. Setup Firebase Rules

#### a. Firestore Rules
1. Di Firebase Console, pilih "Firestore Database"
2. Klik tab "Rules"
3. Replace dengan konten dari `firestore.rules`
4. Klik "Publish"

## 💾 **Penyimpanan Gambar**

Aplikasi ini menggunakan **base64 encoding** untuk menyimpan gambar di Firestore (gratis) sebagai pengganti Firebase Storage (berbayar). 

### Keuntungan:
- ✅ **100% Gratis** - tidak perlu Firebase Storage
- ✅ **Sederhana** - tidak perlu setup tambahan
- ✅ **Terintegrasi** - gambar tersimpan langsung dengan data ujian

### Batasan:
- 📏 **Ukuran file maksimal**: 5MB (otomatis dikompres)
- 📊 **Firestore document limit**: 1MB per document
- 🖼️ **Kompresi otomatis** untuk mengoptimalkan ukuran

### Optimasi yang Diterapkan:
1. **Auto-compression**: Gambar dikompres otomatis ke 800px dengan kualitas 70%
2. **File validation**: Validasi tipe dan ukuran file sebelum upload
3. **Base64 encoding**: Konversi gambar ke format base64 untuk disimpan di Firestore

### 6. Deploy Firestore Indexes

\`\`\`bash
# Install Firebase CLI
npm install -g firebase-tools

# Login ke Firebase
firebase login

# Initialize Firebase di project
firebase init

# Pilih:
# - Firestore: Configure security rules and indexes files
# - Hosting: Configure files for Firebase Hosting
# - Storage: Configure a security rules file for Cloud Storage

# Deploy indexes
firebase deploy --only firestore:indexes
\`\`\`

### 7. Jalankan Development Server

\`\`\`bash
npm run dev
# atau
yarn dev
\`\`\`

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 🚀 Deployment ke Firebase Hosting

### 1. Build Project

\`\`\`bash
npm run build
# atau
yarn build
\`\`\`

### 2. Deploy ke Firebase

\`\`\`bash
# Deploy ke Firebase Hosting
firebase deploy --only hosting

# Atau deploy semua (hosting + rules)
firebase deploy
\`\`\`

### 3. Akses Aplikasi

Setelah deployment berhasil, aplikasi dapat diakses di:
`https://your-project-id.web.app`

## 📱 Penggunaan

### 1. Login
- Buka aplikasi di browser
- Masukkan email dan password
- Klik "Masuk"

### 2. Koreksi Pilihan Ganda
- Pilih tab "Koreksi Pilihan Ganda"
- Isi nama ujian dan kelas
- Input kunci jawaban
- Upload gambar lembar jawaban atau input manual
- Klik "Koreksi Otomatis"
- Review hasil dan klik "Simpan Hasil"

### 3. Penilaian Esai
- Pilih tab "Penilaian Esai"
- Tambah esai baru atau pilih dari daftar
- Gunakan fitur highlight kata kunci
- Review analisis grammar
- Berikan nilai dan komentar
- Klik "Simpan Penilaian"

### 4. Admin Panel
- Pilih "Admin Panel" di navigation
- Lihat statistik dan analytics
- Export data sesuai kebutuhan

## 🔧 Konfigurasi Lanjutan

### OCR Settings
Untuk meningkatkan akurasi OCR, edit file `lib/ocr.ts`:

\`\`\`typescript
// Tambah konfigurasi bahasa Indonesia
await worker.loadLanguage('ind+eng')
await worker.initialize('ind+eng')

// Konfigurasi OCR parameters
await worker.setParameters({
  tessedit_char_whitelist: 'ABCDE',
  tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
})
\`\`\`

### Database Optimization
Untuk performa yang lebih baik dengan 1200+ siswa:

1. **Firestore Composite Indexes**: Sudah dikonfigurasi di `firestore.indexes.json`
2. **Pagination**: Implementasi lazy loading untuk daftar besar
3. **Caching**: Gunakan React Query untuk caching data

### Security Rules
Rules sudah dikonfigurasi untuk:
- Hanya user yang login dapat akses data
- Isolasi data per guru
- Validasi tipe file upload

## 🐛 Troubleshooting

### Error: Firebase not initialized
- Pastikan file `.env.local` sudah benar
- Restart development server

### OCR tidak berfungsi
- Pastikan gambar berkualitas baik
- Format yang didukung: JPG, PNG, GIF
- Ukuran maksimal: 10MB

### Firestore permission denied
- Cek Firebase rules sudah di-deploy
- Pastikan user sudah login

### Build error
\`\`\`bash
# Clear cache dan reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
\`\`\`

## 📊 Monitoring & Analytics

### Firebase Analytics
Untuk tracking penggunaan aplikasi:

1. Enable Google Analytics di Firebase Console
2. Tambah tracking events di komponen React
3. Monitor di Firebase Analytics dashboard

### Performance Monitoring
\`\`\`bash
# Install Firebase Performance
npm install firebase/performance

# Tambah di lib/firebase.ts
import { getPerformance } from 'firebase/performance'
export const perf = getPerformance(app)
\`\`\`

## 🔒 Security Best Practices

1. **Environment Variables**: Jangan commit `.env.local`
2. **Firebase Rules**: Selalu test rules sebelum production
3. **Input Validation**: Validasi semua input user
4. **File Upload**: Batasi tipe dan ukuran file
5. **Authentication**: Gunakan strong password policy

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Support

Jika mengalami masalah atau butuh bantuan:

1. Cek dokumentasi di atas
2. Buka issue di GitHub repository
3. Email: support@grader.io

## 🎯 Roadmap

### Version 2.0
- [ ] Mobile app (React Native)
- [ ] Bulk upload lembar jawaban
- [ ] AI-powered essay scoring
- [ ] Integration dengan LMS
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Plagiarism detection untuk esai
- [ ] Voice-to-text untuk input esai

### Version 1.1
- [ ] Dark mode
- [ ] Offline support
- [ ] Print reports
- [ ] Email notifications
- [ ] Backup & restore data

---

**Dibuat dengan ❤️ untuk memudahkan guru dalam mengoreksi ujian**
