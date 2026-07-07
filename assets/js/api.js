// 1) Publica tu Apps Script como Web App.
// 2) Pega aquí la URL que termina en /exec.
const API_URL = 'PEGA_AQUI_TU_URL_DE_APPS_SCRIPT_EXEC';
const ADMIN_TOKEN = 'XPRESS-ADMIN-2026';

async function api(action, payload = {}) {
  if (!API_URL || API_URL.includes('PEGA_AQUI')) {
    throw new Error('Falta configurar API_URL en assets/js/api.js');
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload })
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch(e) { throw new Error('Respuesta inválida del servidor: ' + text); }
  if (!data.ok) throw new Error(data.error || 'Error desconocido');
  return data.data;
}
