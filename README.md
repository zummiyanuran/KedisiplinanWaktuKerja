# Portal Aspirasi Kedisiplinan Waktu Kerja — Komnas Perempuan

Aplikasi web statis untuk **GitHub Pages** dengan backend **Google Apps Script + Google Sheets**. Tidak perlu server berbayar, Node.js, database eksternal, ataupun OAuth responden.

## Isi proyek

- `index.html`: formulir responsif dengan klaster isu forum Badan Pekerja 28 Oktober 2026.
- `app.js`: validasi isian, pengiriman, dan ekspor cadangan JSON.
- `config.js`: konfigurasi endpoint dan batas tanggal.
- `Code.gs`: kode backend untuk mencatat setiap respons ke Google Sheets.
- `README.md`: panduan implementasi dan batasan.

## Langkah pemasangan

1. Masuk ke Google Drive dan buat **Google Spreadsheet baru** khusus penerimaan aspirasi. Batasi aksesnya hanya kepada tim pengelola yang diberi mandat. Nama contoh: `Aspirasi Tatib BP 2026`.
2. Di spreadsheet itu klik **Extensions > Apps Script**. Ganti isi file `Code.gs` yang ada dengan isi `Code.gs` dari proyek ini, lalu **Save**.
3. Klik **Deploy > New deployment > Web app**. Pilih **Execute as: Me** dan **Who has access: Anyone**. Konfirmasikan izin yang muncul. Salin URL `/exec` (bukan URL `/dev`). Pilihan 'Anyone' diperlukan untuk menerima kiriman dari halaman statis tanpa login Google; jangan gunakan untuk data rahasia. Admin tetap harus membatasi akses ke Sheet.
4. Buka `config.js` dan paste URL tadi pada `endpoint`. Periksa `deadline` (default `2026-11-05`). Perubahan kode Apps Script memerlukan **deployment versi baru / edit deployment** untuk dipakai di URL produksi.
5. Buat repository GitHub, misalnya `aspirasi-tatib-kp`. Upload `index.html`, `app.js`, `config.js`, dan `README.md` **ke root** repositori. **Jangan** upload spreadsheet tanggapan atau data individu. `Code.gs` boleh ditempatkan di repo sebagai kode contoh, tetapi jangan menaruh token rahasia.
6. Di GitHub: **Settings > Pages > Build and deployment > Deploy from a branch**; pilih `main` dan `/(root)` lalu Save. Kunjungi URL Pages yang ditampilkan di panel GitHub.
7. Kirim respons uji tanpa data personal (misalnya contoh isu keterlambatan). Buka Google Sheets dan **pastikan baris baru benar-benar masuk** sebelum tautan diberikan ke seluruh pekerja. Coba juga data invalid dan tanggal tenggat.
8. Bagikan URL GitHub Pages melalui kanal internal. Secara rutin unduh cadangan Sheet dan olah isinya dalam DIM. Jangan publikasikan tab tanggapan mentah.

## Penting: pengiriman dan verifikasi

Google Apps Script Web App tidak menyediakan respons CORS yang dapat dibaca secara langsung oleh halaman GitHub Pages. Karena itu `fetch(..., mode:'no-cors')` hanya menandakan browser telah mencoba mengirim, **bukan bukti bahwa baris tersimpan**. Halaman tidak mengklaim sukses pasti dan sengaja mempertahankan jawaban agar bisa dicadangkan.

Pengelola **wajib** mengetes spreadsheet sesudah deployment. Bila dibutuhkan konfirmasi server yang dapat diverifikasi atau autentikasi pekerja, gunakan backend tambahan (mis. Cloudflare Worker / Firebase) dan kontrol akses yang sesuai; kode ini adalah versi sederhana untuk konsultasi internal, bukan sistem pengelolaan data sensitif.

## Keamanan dan tata kelola

- Endpoint Apps Script di `config.js` adalah **publik** dan dapat dikirimi data oleh siapa pun yang mengetahui URL. Honeypot dan validasi bukan autentikasi. Jangan gunakan endpoint ini untuk data kepegawaian rahasia.
- Tidak ada persyaratan pengisian identitas; jangan meminta data kesehatan, nama anggota keluarga, lokasi real-time, atau file bukti presensi.
- Data di Google Sheets harus dibatasi, dijadwalkan retensinya oleh pengelola, dan tidak dipublikasikan di GitHub.
- Formulir ini tidak membuktikan bahwa responden adalah pekerja internal. Untuk keperluan voting resmi atau konfirmasi identitas, pakai sistem autentikasi organisasi.
- Pengelola harus memeriksa duplikat, spam, dan masukan yang mengandung informasi sensitif sebelum dimasukkan ke DIM.
- Tenggat pada antarmuka browser bukan kontrol server. Penutupan penerimaan yang benar membutuhkan perubahan deployment atau pemeriksaan tenggat di backend.
- `Code.gs` menambah ID acak untuk setiap isian; tidak menerapkan penyimpanan nomor IP atau geolokasi.

## Struktur pengolahan DIM

Kolom Sheet mencakup kode aspirasi, klaster, pasal, pandangan, masalah, alasan, usulan, dan tindak lanjut yang diharapkan. Tambahkan di Sheet kerja DIM terpisah kolom: `Hasil telaah SDMHK`, `Status pembahasan`, `Alasan keputusan`, `Penanggung jawab`, dan `Tindak lanjut`. Jangan campur masukan mentah dengan keputusan resmi.

## Status proyek

Ini adalah **template siap-deploy**, belum dihubungkan ke Google Sheet milik organisasi. Pengelola harus memasang endpoint dan melakukan pengujian akhir. Nama pasal perlu ditautkan kembali ke DIM yang digunakan lembaga.
