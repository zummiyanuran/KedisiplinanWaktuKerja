(() => {
 'use strict';
 const form = document.getElementById('aspirasiForm');
 const status = document.getElementById('status');
 const submit = document.getElementById('kirim');
 const cfg = window.APP_CONFIG || {};
 const deadline = cfg.deadline || '2026-11-05';
 const deadlineDate = new Date(`${deadline}T23:59:59+07:00`);
 document.getElementById('deadlineText').textContent = new Intl.DateTimeFormat('id-ID', {day:'numeric',month:'long',year:'numeric'}).format(deadlineDate);
 const fields = ['nama','unit','klaster','pasal','sikap','masalah','alasan','usulan','tindak_lanjut'];
 function values(){return Object.fromEntries(fields.map(k=>[k, String(form.elements[k].value || '').trim()]));}
 function notify(message, type){status.textContent=message;status.className='status '+type;}
 function download(){const payload={...values(),disimpan_pada:new Date().toISOString()};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download='salinan-aspirasi.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 document.getElementById('unduh').addEventListener('click',download);
 form.addEventListener('submit',async(event)=>{
   event.preventDefault();notify('','');
   if(!form.reportValidity())return;
   if(Date.now()>deadlineDate.getTime()){notify('Tenggat pengumpulan telah berakhir. Hubungi pengelola jika ingin menyampaikan masukan susulan.','warn');return;}
   if(!cfg.endpoint || !/^https:\/\/script\.google\.com\/macros\/s\//.test(cfg.endpoint)){notify('URL Google Apps Script belum dikonfigurasi. Hubungi pengelola atau gunakan Unduh salinan isian.','error');return;}
   const payload=values();
   payload.website=String(form.elements.website.value || '');
   payload.form_version='1.0';
   submit.disabled=true;submit.textContent='Mengirim…';
   try{
     // Apps Script tidak menyediakan CORS response untuk fetch dari GitHub Pages.
     // no-cors berarti keberhasilan server TIDAK bisa diverifikasi dari browser.
     await fetch(cfg.endpoint,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:new URLSearchParams(payload).toString()});
     notify('Permintaan pengiriman sudah dikirim dari browser, tetapi penerimaan oleh Google Sheets tidak dapat dipastikan otomatis. Silakan konfirmasi ke pengelola jika penting, atau unduh salinan isian sebagai cadangan.','warn');
     // Sengaja tidak reset karena status backend belum terverifikasi.
   }catch(err){notify('Pengiriman gagal dari browser. Periksa jaringan dan URL deployment. Unduh salinan isian agar tidak hilang.','error');}
   finally{submit.disabled=false;submit.textContent='Kirim aspirasi';}
 });
})();
