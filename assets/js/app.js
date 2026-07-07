const $ = id => document.getElementById(id);
const state = { catalogos: null };

function escapeHtml(v){
  return String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function opt(list){
  list = Array.isArray(list) ? list : [];
  return '<option value="">Seleccionar</option>' + list.map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join('');
}
function money(v){
  return Number(String(v||0).replace(/[^0-9.]/g,'')||0).toLocaleString('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0});
}
function setMsg(id,msg,type='success'){
  const el=$(id); if(!el) return;
  el.className=type; el.textContent=msg;
}
function renderBrand(subtitle='Administrador'){
  return `<div class="brand"><div class="xm-logo">XM</div><div><h2>Xpress Motos</h2><span>${subtitle}</span></div></div>`;
}
function topbar(title, subtitle, button=''){
  return `<div class="topbar"><div><h1>${title}</h1><p>${subtitle}</p></div>${button}</div>`;
}
async function cargarCatalogos(admin=false){
  state.catalogos = await api(admin ? 'getCatalogosAdmin' : 'getCatalogos', admin ? {token:ADMIN_TOKEN} : {});
  state.catalogos = state.catalogos || {agencias:[],asesores:[],financieras:[],medios:[],estados:[],motivos:[],tiposVenta:[],motos:[],marcas:[]};
  return state.catalogos;
}
if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{});}
