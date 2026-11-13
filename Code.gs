/**
 * Backend untuk aplikasi GitHub Pages. Pasang sebagai Apps Script
 * TERIKAT (bound) pada Google Sheet tujuan: Extensions > Apps Script.
 * Deploy sebagai Web App: Execute as Me; Who has access: Anyone.
 * Karena endpoint publik, verifikasi dan moderasi isi sebelum dipakai.
 */
const SHEET_NAME = 'Aspirasi';
const HEADERS = [
 'Waktu penerimaan (WIB)','ID aspirasi','Nama (opsional)','Unit kerja (opsional)',
 'Klaster isu','Pasal/ayat','Pandangan','Masalah atau aspirasi','Alasan',
 'Usulan norma atau solusi','Tindak lanjut yang diharapkan','Versi formulir'
];
const CLUSTERS = [
 'Jam kerja dan pilihan shift','Dispensasi keterlambatan',
 'Pemenuhan durasi kerja dan pulang lebih awal','Kerja lembur dan pekerjaan mendadak',
 'Care work dan akomodasi yang layak','Kerja di Mana Saja (KDM)',
 'Presensi, koreksi dan persetujuan atasan','Sanksi kedisiplinan dan hak jawab',
 'Evaluasi hasil kerja dan akuntabilitas','Pengaturan dalam Tata Tertib atau SOP',
 'Evaluasi berkala kebijakan','Lainnya'
];
const STANCES = ['Setuju','Setuju dengan perubahan','Tidak setuju','Memerlukan penjelasan','Mengusulkan norma baru'];
const FOLLOWUPS = ['Perubahan norma Tata Tertib','Pengaturan dalam SOP/petunjuk teknis',
 'Penjelasan atau sosialisasi','Kajian dan analisis data','Pembahasan lanjutan dalam forum','Lainnya'];
/**
 * Endpoint GET: hanya statistik agregat yang boleh ditampilkan publik.
 * JSONP diperlukan karena dashboard dijalankan dari GitHub Pages.
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    if (params.action !== 'dashboard') {
      return ContentService.createTextOutput('Endpoint aspirasi aktif. Gunakan halaman formulir GitHub Pages.')
        .setMimeType(ContentService.MimeType.TEXT);
    }
    const callback = String(params.callback || '');
    // Nama callback dibatasi supaya tidak menjadi sarana injeksi JavaScript.
    if (!/^kpDashCb[0-9]{1,10}$/.test(callback)) {
      return ContentService.createTextOutput(JSON.stringify({status:'invalid',message:'Callback tidak valid'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const book = SpreadsheetApp.getActiveSpreadsheet();
    if (!book) throw new Error('Spreadsheet belum terhubung.');
    const sheet = book.getSheetByName(SHEET_NAME);
    const clusterCounts = Object.fromEntries(CLUSTERS.map(name => [name,0]));
    const stanceCounts = Object.fromEntries(STANCES.map(name => [name,0]));
    let total = 0;
    if (sheet && sheet.getLastRow() > 1) {
      // Hanya baca klaster isu (E) dan pandangan (G); tidak membaca nama/isi aspirasi.
      const values = sheet.getRange(2,5,sheet.getLastRow()-1,3).getValues();
      values.forEach(row => {
        const cluster = String(row[0] || '').trim();
        const stance = String(row[2] || '').trim();
        if (!cluster && !stance) return;
        total++;
        if (Object.prototype.hasOwnProperty.call(clusterCounts,cluster)) clusterCounts[cluster]++;
        if (Object.prototype.hasOwnProperty.call(stanceCounts,stance)) stanceCounts[stance]++;
      });
    }
    const data = {
      status:'ok', total:total,
      activeClusters:Object.values(clusterCounts).filter(count => count > 0).length,
      needsExplanation:stanceCounts['Memerlukan penjelasan'],
      newNorms:stanceCounts['Mengusulkan norma baru'],
      clusters:CLUSTERS.map(label => ({label:label,count:clusterCounts[label]})),
      stances:STANCES.map(label => ({label:label,count:stanceCounts[label]})),
      generatedAt:new Date().toISOString()
    };
    return ContentService.createTextOutput(callback+'('+JSON.stringify(data)+');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } catch (err) {
    console.error('Dashboard:',err);
    // Jangan tampilkan rincian kesalahan server ke publik.
    const callback = String((e && e.parameter && e.parameter.callback) || '');
    if (/^kpDashCb[0-9]{1,10}$/.test(callback)) {
      return ContentService.createTextOutput(callback+'('+JSON.stringify({status:'error',message:'Statistik belum tersedia'})+');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(JSON.stringify({status:'error'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
function doPost(e){
 const lock=LockService.getScriptLock();
 try{
  lock.waitLock(15000);
  const p=(e&&e.parameter)||{};
  if(p.website) return response('ignored'); // honeypot anti-spam sederhana
  const trim=(key,max)=>String(p[key]||'').trim().slice(0,max);
  const val={nama:trim('nama',120),unit:trim('unit',120),klaster:trim('klaster',150),
    pasal:trim('pasal',150),sikap:trim('sikap',80),masalah:trim('masalah',4000),
    alasan:trim('alasan',4000),usulan:trim('usulan',4000),
    tindak:trim('tindak_lanjut',120),versi:trim('form_version',30)};
  if(!CLUSTERS.includes(val.klaster)||!STANCES.includes(val.sikap)||
     !FOLLOWUPS.includes(val.tindak)||val.masalah.length<15){return response('invalid');}
  const book=SpreadsheetApp.getActiveSpreadsheet();
  if(!book) throw new Error('Pasang script pada Google Sheet tujuan.');
  let sheet=book.getSheetByName(SHEET_NAME);
  if(!sheet)sheet=book.insertSheet(SHEET_NAME);
  if(sheet.getLastRow()===0){sheet.appendRow(HEADERS);sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,HEADERS.length).setBackground('#253c72').setFontColor('#ffffff').setFontWeight('bold');}
  // Lindungi Sheet dari injeksi formula (=, +, -, @) serta tab/newline awal.
  const safe=s=> /^[\s]*[=+\-@]/.test(s)? "'"+s : s;
  sheet.appendRow([new Date(),Utilities.getUuid(),safe(val.nama),safe(val.unit),safe(val.klaster),
    safe(val.pasal),safe(val.sikap),safe(val.masalah),safe(val.alasan),safe(val.usulan),safe(val.tindak),safe(val.versi)]);
  sheet.getRange(sheet.getLastRow(),1).setNumberFormat('dd mmm yyyy hh:mm:ss');
  SpreadsheetApp.flush();
  return response('received');
 }catch(err){console.error(err);return response('error');}
 finally{if(lock.hasLock())lock.releaseLock();}
}
function response(result){return ContentService.createTextOutput(JSON.stringify({status:result})).setMimeType(ContentService.MimeType.JSON);}
