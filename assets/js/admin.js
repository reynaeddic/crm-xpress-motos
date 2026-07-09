document.addEventListener('DOMContentLoaded', initAdmin);
async function initAdmin(){
  $('app').innerHTML = `<div class="layout">
    <aside class="sidebar">${renderBrand('Administrador')}
      <button class="nav active" data-sec="dashboard">Dashboard</button>
      <button class="nav" data-sec="buscar">Buscar Prospectos</button>
      <button class="nav" data-sec="catalogos">Catálogos</button>
      <button class="nav" data-sec="reportes">Reportes PDF</button>
    </aside>
    <main class="content">
      <section id="sec-dashboard"></section>
      <section id="sec-buscar" class="hidden"></section>
      <section id="sec-catalogos" class="hidden"></section>
      <section id="sec-reportes" class="hidden"></section>
    </main>
  </div>`;
  document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>showSec(b.dataset.sec,b)));
  renderDashboard(); renderBuscar(); renderCatalogos(); renderReportes();
  try{ await cargarCatalogos(true); await cargarDashboard(); }catch(e){alert(e.message)}
}
function showSec(sec,btn){document.querySelectorAll('main section').forEach(s=>s.classList.add('hidden')); $('sec-'+sec).classList.remove('hidden'); document.querySelectorAll('.nav').forEach(n=>n.classList.remove('active')); btn.classList.add('active')}
function renderDashboard(){
  $('sec-dashboard').innerHTML=topbar('Dashboard Ejecutivo','Prospección Xpress Motos','<button class="secondary" id="btnRefresh">Actualizar</button>')+
  `<div class="filters"><div><label>Fecha inicial</label><input type="date" id="fInicio"></div><div><label>Fecha final</label><input type="date" id="fFin"></div><button class="primary" id="btnFiltro">Aplicar filtro</button></div><div id="cards" class="cards"></div><div class="panel"><h2>Ranking de Financieras y % de aprobación</h2><div id="finRanking" class="finance-ranking"></div></div><div id="rankings" class="ranking-grid"></div>`;
  $('btnRefresh').addEventListener('click',async()=>{await cargarCatalogos(true); await cargarDashboard();});
  $('btnFiltro').addEventListener('click',cargarDashboard);
}
async function cargarDashboard(){
  const f={start:$('fInicio')?.value||'',end:$('fFin')?.value||''};
  const d=await api('getDashboard',{token:ADMIN_TOKEN,filters:f});
  const k=d.kpis||{};
  $('cards').innerHTML=`<div class="card"><span>Prospectos hoy</span><strong>${k.hoy||0}</strong></div><div class="card"><span>Prospectos mes</span><strong>${k.mes||0}</strong></div><div class="card"><span>Rango seleccionado</span><strong>${k.rango||0}</strong></div><div class="card"><span>Aprobación general</span><strong>${k.aprobacionGeneral||0}%</strong></div>`;
  const fin=Array.isArray(d.financieras)?d.financieras:[];
  $('finRanking').innerHTML=fin.length?fin.map(f=>`<div class="finance-item"><div><strong>${escapeHtml(f.financiera)}</strong><span>${f.aprobados||0} aprobados / ${f.enviadas||0} enviadas</span></div><div class="finance-pct">${f.aprobacion||0}%</div></div>`).join(''):'<p class="muted">Sin datos.</p>';
  const r=d.rankings||{}; const boxes=[['Agencias',r.agencias||[]],['Asesores',r.asesores||[]],['Modelos',r.modelos||[]],['Medios',r.medios||[]],['Marcas',r.marcas||[]]];
  $('rankings').innerHTML=boxes.map(([t,arr])=>`<div class="rank-box"><h3>${t}</h3>${arr.length?arr.slice(0,6).map(x=>`<div class="rank-item"><span>${escapeHtml(x.nombre)}</span><b>${x.total}</b></div>`).join(''):'<p class="muted">Sin datos.</p>'}</div>`).join('');
}
function renderBuscar(){
  $('sec-buscar').innerHTML=topbar('Buscar Prospectos','Consulta por cliente, teléfono, agencia, asesor o modelo')+`<div class="panel"><div class="search-row"><input id="q" placeholder="Buscar..."><button class="primary" id="btnBuscar">Buscar</button></div><div id="tablaProspectos" class="table-wrap"></div></div>`;
  $('btnBuscar').addEventListener('click',buscarProspectosAdmin); $('q').addEventListener('keydown',e=>{if(e.key==='Enter')buscarProspectosAdmin();});
}
async function buscarProspectosAdmin(){
  const rows=await api('buscarProspectos',{token:ADMIN_TOKEN,query:$('q').value});
  const resultados=Array.isArray(rows)?rows:[];
  if(!resultados.length){$('tablaProspectos').innerHTML='<div class="empty-state">No se encontraron prospectos.</div>';return;}
  $('tablaProspectos').innerHTML=`<table><thead><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>Teléfono</th><th>Agencia</th><th>Asesor</th><th>Modelo</th><th>Estado</th></tr></thead><tbody>${resultados.map(r=>`<tr><td>${escapeHtml(r['ID Prospecto']||'')}</td><td>${escapeHtml(r.Fecha||'')}</td><td>${escapeHtml(r.Cliente||'')}</td><td>${escapeHtml(r['Teléfono']||'')}</td><td>${escapeHtml(r.Agencia||'')}</td><td>${escapeHtml(r.Asesor||'')}</td><td>${escapeHtml(r.Modelo||'')}</td><td>${escapeHtml(r['Estado del prospecto']||'')}</td></tr>`).join('')}</tbody></table>`;
}
function renderCatalogos(){
  $('sec-catalogos').innerHTML =
    topbar('Catálogos Web','Administra agencias, asesores, motos, financieras y medios desde el CRM') +
    `<div class="panel">
      <div class="filters">
        <div>
          <label>Seleccionar catálogo</label>
          <select id="catTipo">
            <option value="agencias">Agencias</option>
            <option value="asesores">Asesores</option>
            <option value="motos">Motos</option>
            <option value="financieras">Financieras</option>
            <option value="medios">Medios</option>
            <option value="estados">Estados</option>
            <option value="motivos">Motivos</option>
            <option value="tiposVenta">Tipos de venta</option>
          </select>
        </div>
        <div style="display:flex;align-items:end">
          <button class="primary" id="btnCargarCatalogo">Cargar catálogo</button>
        </div>
      </div>

      <div id="catForm"></div>
      <div id="catTabla" class="table-wrap"></div>
      <div id="catMsg"></div>
    </div>`;

  $('btnCargarCatalogo').addEventListener('click', cargarCatalogoWeb);
  $('catTipo').addEventListener('change', cargarCatalogoWeb);

  cargarCatalogoWeb();
}
async function cargarCatalogoWeb(){
  try{
    setMsg('catMsg','Cargando catálogo...','success');

    const tipo = $('catTipo').value;
    const data = await api('getCatalogosWeb',{token:ADMIN_TOKEN});
    const rows = data[tipo] || [];

    renderFormularioCatalogo(tipo);
    renderTablaCatalogo(tipo, rows);

    setMsg('catMsg','','success');
  }catch(e){
    setMsg('catMsg', e.message || e, 'error');
  }
}

function renderFormularioCatalogo(tipo){
  const campos = {
    agencias:['Agencia'],
    asesores:['Asesor','Agencia','Correo','Puesto'],
    motos:['Marca','Modelo','Tipo','Precio Público'],
    financieras:['Financiera'],
    medios:['Medio'],
    estados:['Estado'],
    motivos:['Motivo'],
    tiposVenta:['Tipo de venta']
  };

  const lista = campos[tipo] || [];

  $('catForm').innerHTML = `
    <div class="section-title">Agregar nuevo registro</div>
    <div class="grid">
      ${lista.map(c=>`
        <div>
          <label>${escapeHtml(c)}</label>
          <input id="cat_${normalizarId(c)}" placeholder="${escapeHtml(c)}">
        </div>
      `).join('')}
      <div style="display:flex;align-items:end">
        <button class="primary" id="btnAgregarCatalogo">Agregar</button>
      </div>
    </div>
  `;

  $('btnAgregarCatalogo').addEventListener('click', agregarRegistroCatalogo);
}

function renderTablaCatalogo(tipo, rows){
  if(!rows.length){
    $('catTabla').innerHTML = '<div class="empty-state">No hay registros en este catálogo.</div>';
    return;
  }

  const headers = Object.keys(rows[0]);

  $('catTabla').innerHTML = `
    <table>
      <thead>
        <tr>
          ${headers.map(h=>`<th>${escapeHtml(h)}</th>`).join('')}
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((r,i)=>`
          <tr>
            ${headers.map(h=>`<td>${escapeHtml(r[h] ?? '')}</td>`).join('')}
            <td>
              <button class="secondary" onclick="toggleCatalogo('${tipo}',${i},${!esActivo(r.Activo)})">
                ${esActivo(r.Activo) ? 'Desactivar' : 'Activar'}
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function agregarRegistroCatalogo(){
  try{
    const tipo = $('catTipo').value;

    const campos = {
      agencias:['Agencia'],
      asesores:['Asesor','Agencia','Correo','Puesto'],
      motos:['Marca','Modelo','Tipo','Precio Público'],
      financieras:['Financiera'],
      medios:['Medio'],
      estados:['Estado'],
      motivos:['Motivo'],
      tiposVenta:['Tipo de venta']
    };

    const data = {};

    (campos[tipo] || []).forEach(c=>{
      data[c] = $('cat_' + normalizarId(c)).value.trim();
    });

    await api('agregarCatalogo',{token:ADMIN_TOKEN,tipo,data});

    setMsg('catMsg','Registro agregado correctamente.','success');
    await cargarCatalogoWeb();

  }catch(e){
    setMsg('catMsg', e.message || e, 'error');
  }
}

async function toggleCatalogo(tipo,rowIndex,activo){
  try{
    await api('cambiarEstadoCatalogo',{
      token:ADMIN_TOKEN,
      tipo,
      rowIndex,
      activo
    });

    setMsg('catMsg','Estado actualizado correctamente.','success');
    await cargarCatalogoWeb();

  }catch(e){
    setMsg('catMsg', e.message || e, 'error');
  }
}

function esActivo(v){
  return v === true || String(v).toUpperCase() === 'TRUE' || String(v).toUpperCase() === 'SÍ' || String(v).toUpperCase() === 'SI';
}

function normalizarId(v){
  return String(v)
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9]/g,'_');
}
function renderReportes(){
  $('sec-reportes').innerHTML=topbar('Reportes PDF','Genera reportes para dirección')+`<div class="panel grid"><div><label>Tipo</label><select id="tipoRep"><option>Diario</option><option>Semanal</option><option>Mensual</option><option>Trimestral</option><option>Anual</option></select></div><div><label>Fecha inicial</label><input type="date" id="repIni"></div><div><label>Fecha final</label><input type="date" id="repFin"></div><div style="display:flex;align-items:end"><button class="primary" id="btnPdf">Generar PDF</button></div><div id="repMsg"></div></div>`;
  $('btnPdf').addEventListener('click',async()=>{try{const url=await api('generarReportePDF',{token:ADMIN_TOKEN,tipo:$('tipoRep').value,inicio:$('repIni').value,fin:$('repFin').value});$('repMsg').innerHTML=`<a class="btn secondary" href="${escapeHtml(url)}" target="_blank">Abrir PDF generado</a>`;}catch(e){setMsg('repMsg',e.message,'error');}});
}
