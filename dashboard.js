(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const cfg = window.APP_CONFIG || {};
  const interval = 60000;
  let lastData = null;
  let requestNumber = 0;
  let busy = false;
  let refreshTimer = null;
  const number = n => new Intl.NumberFormat('id-ID').format(n || 0);
  const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function notify(message, isError=false) {
    $('connectionText').textContent = message;
    $('connectionDot').className = 'dot ' + (isError ? 'error' : 'online');
  }
  function jsonp(url) {
    return new Promise((resolve,reject) => {
      const key = 'kpDashCb' + (++requestNumber);
      const script = document.createElement('script');
      let finished = false;
      const cleanup = () => {delete window[key]; script.remove(); clearTimeout(timer);};
      const finish = (err,data) => {if(finished)return; finished=true;cleanup(); err ? reject(err) : resolve(data);};
      const timer = setTimeout(() => finish(new Error('Koneksi habis waktu')), 18000);
      window[key] = result => finish(null,result);
      script.onerror = () => finish(new Error('Endpoint tidak dapat diakses'));
      script.src = url + (url.includes('?') ? '&' : '?') + 'action=dashboard&callback=' + key + '&_=' + Date.now();
      document.head.appendChild(script);
    });
  }
  function renderBars(id, rows, total, color) {
    const root = $(id);
    root.innerHTML = '';
    const max = Math.max(...rows.map(row=>Number(row.count)||0),1);
    rows.forEach(row => {
      const item = document.createElement('div'); item.className='bar-row';
      const label=document.createElement('div');label.className='bar-label';label.textContent=row.label;
      const value=document.createElement('strong');value.className='bar-number';value.textContent=number(row.count);
      const track=document.createElement('div');track.className='bar-track';
      const fill=document.createElement('div');fill.className='bar-fill '+color;
      fill.style.width=(Number(row.count)/max*100)+'%';
      track.appendChild(fill);
      const percent=document.createElement('span');percent.className='bar-percent';percent.textContent=total?Math.round(Number(row.count)/total*100)+'%':'0%';
      item.append(label,value,track,percent);root.appendChild(item);
    });
  }
  function render(data) {
    if (!data || data.status!=='ok' || !Array.isArray(data.clusters)|| !Array.isArray(data.stances)) throw new Error(data && data.message || 'Respons dashboard tidak sesuai');
    lastData=data;
    $('total').textContent=number(data.total);
    $('activeClusters').textContent=number(data.activeClusters)+' / '+data.clusters.length;
    $('needsExplanation').textContent=number(data.needsExplanation);
    $('newNorms').textContent=number(data.newNorms);
    renderBars('clusters',data.clusters,data.total,'blue');
    renderBars('stances',data.stances,data.total,'teal');
    $('lastUpdated').textContent=data.generatedAt ? new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'medium',timeZone:'Asia/Jakarta'}).format(new Date(data.generatedAt))+' WIB' : '—';
    $('empty').hidden = data.total>0;
    $('dataNote').textContent='Statistik dihitung dari tab Aspirasi. Masukan belum tentu telah diverifikasi atau disepakati.';
  }
  async function refresh() {
    if (busy) return;
    busy = true; $('refreshButton').disabled = true;
    if (!cfg.endpoint || !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(cfg.endpoint)) {
      notify('Alamat Apps Script belum dikonfigurasi.',true);busy=false;$('refreshButton').disabled=false;return;
    }
    try {const data=await jsonp(cfg.endpoint);render(data);notify('Tersambung · diperbarui otomatis setiap 60 detik');}
    catch (e) {notify('Belum dapat memuat statistik: '+e.message,true);$('dataNote').textContent='Periksa apakah fungsi doGet dashboard sudah diterapkan sebagai versi deployment terbaru.';}
    finally {busy=false;$('refreshButton').disabled=false;}
  }
  $('refreshButton').addEventListener('click',refresh);
  refresh();
  refreshTimer=setInterval(()=>{if(!document.hidden)refresh();},interval);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
})();
