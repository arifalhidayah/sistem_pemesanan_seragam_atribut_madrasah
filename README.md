# Sistem Pemesanan Seragam & Atribut Madrasah
**MI Darun Najah Srobyong**

Aplikasi manajemen pemesanan seragam dan atribut sekolah berbasis web yang modern, cepat, dan responsif. Dirancang khusus untuk mempermudah Koperasi Madrasah dalam mengelola transaksi, stok kategori, pelunasan, hingga pembuatan laporan otomatis.

## 🚀 Fitur Utama

- **Manajemen Kategori Dinamis**: Admin dapat menambah, mengedit, atau menghapus kategori barang (misal: Seragam, Atribut, Buku) dan rincian item di dalamnya secara real-time.
- **Progressive Web App (PWA)**: 
    - Aplikasi dapat diinstal langsung di HP (Android/iOS) atau Desktop.
    - Ikon kustom dan pengalaman pengguna seperti aplikasi natif.
- **Pemesanan & Pelunasan**: 
    - Form pesanan yang cerdas dengan kalkulasi otomatis.
    - Dukungan untuk DP (Down Payment) dan riwayat cicilan pembayaran.
    - **Atribusi Admin**: Pencatatan otomatis nama admin yang bertugas pada setiap pembuatan pesanan dan penerimaan pembayaran.
- **Integrasi WhatsApp & Cloud**:
    - Kirim nota PDF langsung ke WhatsApp wali murid.
    - Hosting PDF otomatis menggunakan **Google Drive pribadi** via Google Apps Script (bebas biaya cloud storage).
- **Laporan & Rekapitulasi**:
    - Laporan Keuangan (Omzet, Piutang, Target).
    - Nota Produksi untuk Penjahit (Rekap ukuran per gender).
    - Rekap khusus jumlah pesanan Jilbab.
- **Autentikasi & Profil**:
    - Keamanan data dengan Firebase Authentication.
    - **Menu Profil**: Admin dapat mengatur nama tampilan asli yang akan tercetak otomatis di kuitansi PDF.

## 🛠️ Teknologi yang Digunakan

- **Frontend**: React.js (Vite), Tailwind CSS.
- **Backend / Database**: Firebase Firestore.
- **Autentikasi**: Firebase Auth.
- **PDF Engine**: jsPDF & jspdf-autotable.
- **Icons**: Lucide React.
- **PWA Capabilities**: `vite-plugin-pwa` (Service Workers, Manifest).
- **Cloud Bridge**: Google Apps Script (untuk pengunggahan PDF ke Google Drive).

## 📦 Cara Instalasi

1. **Clone Repositori**:
   ```bash
   git clone [URL-REPOSI-ANDA]
   cd sistem_pemesanan_seragam_atribut_madrasah
   ```

2. **Install Dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Firebase**:
   - Buat project di [Firebase Console](https://console.firebase.google.com/).
   - Aktifkan Firestore dan Authentication (Email/Password).
   - Salin konfigurasi Firebase Anda ke dalam file `src/firebase.js`.

4. **Konfigurasi WhatsApp (Google Drive)**:
   - Buka file `google_apps_script.js` di root folder.
   - Deploy kode tersebut di [Google Apps Script](https://script.google.com/) sebagai **Web App**.
   - Masukkan ID Folder Drive tujuan pada variabel `TARGET_FOLDER_ID`.
   - Salin URL Web App yang dihasilkan ke dalam `src/utils/WhatsAppUtils.js`.

5. **Jalankan Aplikasi**:
   ```bash
   npm run dev
   ```

## 🤖 Otomasi Deployment (CI/CD)
Proyek ini dikonfigurasi dengan GitHub Actions untuk deployment otomatis:
- **Setiap Push ke `main`**: Aplikasi akan dibangun (`build`) dan di-deploy otomatis ke live hosting.
- **Setiap Pull Request**: Firebase akan membuat link *Preview* sementara untuk meninjau perubahan.

> [!NOTE]
> Pastikan Anda telah menambahkan `FIREBASE_SERVICE_ACCOUNT_SISTEM_PEMESANAN_SERAGAM` di **GitHub Secrets** repositori Anda.


## 📱 Penggunaan Mobile (PWA)
Aplikasi ini mendukung instalasi di perangkat mobile:
- Di Android (Chrome), pilih menu "Tambahkan ke Layar Utama".
- Di iPhone (Safari), pilih menu "Add to Home Screen".
- Setelah diinstal, aplikasi akan memiliki ikon **Emas-Hijau** dan dapat diakses dengan cepat tanpa browser.

---
Dibuat dengan ❤️ untuk MI Darun Najah Srobyong.
