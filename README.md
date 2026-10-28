# GestureBio - Website Perkenalan Diri dengan Gerakan Jari (AI Finger Gesture)

Website interaktif perkenalan diri (*Self-Introduction Portfolio*) menggunakan teknologi pengenalan gestur jari realtime berbasis **Google MediaPipe Hands** dan **Computer Vision**. 100% berjalan di sisi klien (*client-side*), tanpa backend khusus, dan **siap dideploy langsung ke Vercel**.

---

## ✨ Fitur Utama

- 🤟 **Deteksi Gestur Jari Realtime:** Menggunakan model Machine Learning MediaPipe 21 landmarks tangan langsung di browser.
- 🟢 **OpenCV Terminal HUD:** Tampilan futuristik mirip window OpenCV dengan teks neon hijau (`Gesture: Fikri Pradipa`, `Status: Ready`, FPS, Counter, & Indikator Jari Aktif).
- 🎴 **Dynamic Glassmorphism Bio Cards:** Kartu profil interaktif yang berganti otomatis mengikuti gerakan jari.
- 🗣️ **Text-to-Speech (Suara Perkenalan):** Website dapat membacakan nama dan bio secara otomatis dalam bahasa Indonesia (bisa dihidupkan/dimatikan).
- ✏️ **Kustomisasi Profil (Edit Biodata):** Modal bawaan untuk mengganti Nama Lengkap, Peran, Kampus, Skill, Hobi, dan Kontak tanpa perlu mengedit kode sumber (tersimpan aman di `localStorage`).
- 📸 **Snapshot Pose & Watermark:** Ambil tangkapan layar momen pose tanganmu beserta kartu perkenalan diri dan unduh dalam format PNG.
- 📱 **Responsive & Mobile Ready:** Mendukung layar desktop, tablet, maupun smartphone dengan fitur flip kamera & mirror mode.
- ⚡ **Mode Simulasi Interaktif:** Jika kamera tidak diizinkan atau tidak tersedia, kamu tetap bisa mencoba dan mendemokan seluruh gestur dengan klik di panduan sidebar.

---

## 🖐️ Daftar Gerakan Jari & Bagian Biodata

| Gestur | Gerakan Jari | Bagian Perkenalan Diri |
| :---: | :--- | :--- |
| **🤟** | **I Love You / Rock** *(Seperti di Foto)* | **Nama Lengkap & Identitas Utama** (*Fikri Pradipa*) |
| **☝️** | **1 Jari (Telunjuk)** | **Pendidikan & Asal Daerah** (*Mahasiswa Informatika*) |
| **✌️** | **2 Jari (Peace / Victory)** | **Keahlian & Tech Stack** (*JS, Python, MediaPipe, dll.*) |
| **🖐️** | **5 Jari (Telapak Terbuka)** | **Salam Kenal & Sambutan Pengunjung** |
| **👍** | **Jempol ke Atas (Thumbs Up)** | **Hobi, Minat & Passion** |
| **👌** | **OK / Pinch Sign** | **Kontak & Media Sosial** |
| **✊** | **Kepalan Tangan (Fist)** | **Mode Siaga / Status Ready** |

---

## 🚀 Cara Menjalankan Secara Lokal

Karena browser membatasi akses webcam pada protokol `file://`, jalankan website ini menggunakan local development server:

### Opsi 1: Menggunakan npx serve (Paling Mudah)
```bash
npx serve .
```
Buka browser di `http://localhost:3000`.

### Opsi 2: Menggunakan VS Code Live Server
1. Buka folder ini di VS Code.
2. Klik kanan pada `index.html` -> pilih **Open with Live Server**.

### Opsi 3: Menggunakan Python
```bash
python -m http.server 8000
```
Buka browser di `http://localhost:8000`.

---

## 🌐 Cara Deploy ke Vercel (Gratis & 2 Menit Selesai)

Vercel memberikan domain **HTTPS gratis secara otomatis**—ini sangat penting karena kamera browser **hanya bisa aktif di HTTPS atau localhost**.

### Cara 1: Menggunakan GitHub + Dashboard Vercel (Rekomendasi)
1. Buat repositori baru di akun [GitHub](https://github.com/new).
2. Push seluruh file proyek ini ke repositori tersebut:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit gesture perkenalan diri"
   git branch -M main
   git remote add origin https://github.com/<username-kamu>/<nama-repo>.git
   git push -u origin main
   ```
3. Buka dashboard [Vercel](https://vercel.com) dan login.
4. Klik **Add New Project** -> Pilih repositori GitHub tadi.
5. Pada bagian **Framework Preset**, pilih **Other** (karena HTML/CSS/JS murni).
6. Klik **Deploy**! Dalam hitungan detik website kamu sudah aktif secara global di URL `https://nama-project.vercel.app`.

### Cara 2: Menggunakan Vercel CLI Langsung dari Terminal
Jika kamu memiliki `vercel` CLI terpasang:
```bash
# Login ke Vercel
npx vercel login

# Deploy ke production
npx vercel --prod
```

---

## 📁 Struktur File Proyek

```
website-pertama/
├── index.html        # Struktur halaman, HUD overlay, modal profil, & CDN MediaPipe
├── style.css         # Styling modern glassmorphism, OpenCV cyberpunk HUD, & animasi
├── script.js         # Logika MediaPipe Hands, klasifikasi 21 landmark, TTS, & snapshot
├── vercel.json       # Konfigurasi header keamanan & camera permissions di Vercel
└── README.md         # Dokumentasi lengkap proyek
```

---

## 💡 Tips & Trik Kamera
- Pastikan pencahayaan ruangan cukup agar AI dapat mendeteksi 21 titik sendi jari secara presisi.
- Posisikan telapak tangan menghadap kamera dengan jarak sekitar 40cm - 1 meter.
- Gunakan tombol **Cermin (Mirror)** jika ingin arah gerakan tangan terasa alami layaknya cermin.
