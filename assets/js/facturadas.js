document.addEventListener('DOMContentLoaded', initFacturadas);

let guardandoFacturada = false;
let ultimoIntentoFacturada = null;

async function initFacturadas(){
  $('app').innerHTML = `
    <div class="asesor-shell">
      <div class="asesor-head">
        <div>
          <h1>Registro de Motos Facturadas</h1>
          <p>Captura únicamente unidades facturadas y entregadas</p>
        </div>
        <div class="install-tip">Facturación</div>
      </div>

      <div id="formWrap" class="panel">
        <p class="muted">Cargando catálogos...</p>
      </div>
    </div>
  `;

  try{
    await cargarCatalogos(false);
    renderFormFacturadas();
  }catch(e){
    $('formWrap').innerHTML = `<div class="error">${escapeHtml(e.message || e)}</div>`;
  }
}

function renderFormFacturadas(){
  const c = state.catalogos;

  $('formWrap').innerHTML = `
    <form id="facturadaForm">

      <div class="section-title">Información del cliente</div>
      <div class="grid">
        <div>
          <label>Agencia *</label>
          <select id="agencia" required>${opt(c.agencias)}</select>
        </div>

        <div>
          <label>Asesor *</label>
          <select id="asesor" required></select>
        </div>

        <div>
          <label>Cliente *</label>
          <input id="cliente" required>
        </div>
      </div>

      <div class="section-title">Información de la unidad</div>
      <div class="grid">
        <div>
          <label>Marca *</label>
          <select id="marca" required>${opt(c.marcas)}</select>
        </div>

        <div>
          <label>Modelo *</label>
          <select id="modelo" required></select>
        </div>

        <div>
          <label>No. de serie *</label>
          <input id="serie" required>
        </div>
      </div>

      <div class="section-title">Información de facturación</div>
      <div class="grid">
        <div>
          <label>Tipo de venta *</label>
          <select id="tipoVenta" required>
            <option>Contado</option>
            <option>Financiamiento</option>
          </select>
        </div>

        <div id="financieraBox">
          <label>Financiera</label>
          <select id="financiera">${opt(c.financieras)}</select>
        </div>
      </div>

      <label>Observaciones</label>
      <textarea id="observaciones" placeholder="Observaciones adicionales..."></textarea>

      <button id="btnGuardar" class="primary" style="width:100%;margin-top:18px" type="submit">
        Registrar moto facturada
      </button>

      <div id="mensaje"></div>
    </form>
  `;

  $('agencia').addEventListener('change', cargarAsesoresFacturadas);
  $('marca').addEventListener('change', cargarModelosFacturadas);
  $('tipoVenta').addEventListener('change', actualizarFinancieraFacturada);
  $('facturadaForm').addEventListener('submit', guardarFacturadaAsesor);

  cargarAsesoresFacturadas();
  cargarModelosFacturadas();
  actualizarFinancieraFacturada();
}

function cargarAsesoresFacturadas(){
  const ag = $('agencia').value;

  const asesores = (state.catalogos.asesores || [])
    .filter(a => !ag || a.agencia === ag)
    .map(a => a.asesor);

  $('asesor').innerHTML = opt(asesores);
}

function cargarModelosFacturadas(){
  const ma = $('marca').value;

  const modelos = (state.catalogos.motos || [])
    .filter(m => m.marca === ma)
    .map(m => m.modelo);

  $('modelo').innerHTML = opt(modelos);
}

function actualizarFinancieraFacturada(){
  const tipo = $('tipoVenta').value;

  if(tipo === 'Financiamiento'){
    $('financieraBox').style.display = 'block';
    $('financiera').required = true;
  }else{
    $('financieraBox').style.display = 'none';
    $('financiera').required = false;
    $('financiera').value = '';
  }
}

function obtenerFormFacturada(){
  return {
    agencia: agencia.value,
    asesor: asesor.value,
    cliente: cliente.value,
    marca: marca.value,
    modelo: modelo.value,
    serie: serie.value,
    tipoVenta: tipoVenta.value,
    financiera: tipoVenta.value === 'Financiamiento' ? financiera.value : '',
    observaciones: observaciones.value
  };
}

async function guardarFacturadaAsesor(e){
  e.preventDefault();

  if(guardandoFacturada) return;

  const form = obtenerFormFacturada();
  ultimoIntentoFacturada = form;

  await enviarFacturada(form);
}

async function reintentarGuardarFacturada(){
  if(!ultimoIntentoFacturada || guardandoFacturada) return;
  await enviarFacturada(ultimoIntentoFacturada);
}

async function enviarFacturada(form){
  const btn = $('btnGuardar');

  try{
    guardandoFacturada = true;

    if(btn){
      btn.disabled = true;
      btn.textContent = 'Guardando...';
    }

    setMsg('mensaje','Guardando moto facturada, por favor espera...','success');

    const r = await api('guardarFacturada',{form});

    const id = r && r.id ? r.id : 'Sin folio';

    $('formWrap').innerHTML = `
      <div class="success-ticket">
        <h2>✅ Moto facturada registrada</h2>

        <div class="ticket-grid">
          <div><span>Folio</span><strong>${escapeHtml(id)}</strong></div>
          <div><span>Cliente</span><strong>${escapeHtml(form.cliente)}</strong></div>
          <div><span>Moto</span><strong>${escapeHtml(form.marca)} ${escapeHtml(form.modelo)}</strong></div>
          <div><span>No. de serie</span><strong>${escapeHtml(form.serie)}</strong></div>
          <div><span>Tipo de venta</span><strong>${escapeHtml(form.tipoVenta)}</strong></div>
          <div><span>Financiera</span><strong>${escapeHtml(form.financiera || 'No aplica')}</strong></div>
        </div>

        <button class="primary" style="width:100%;margin-top:18px" onclick="renderFormFacturadas()">
          Registrar otra moto
        </button>
      </div>
    `;

    ultimoIntentoFacturada = null;

  }catch(err){
    const msg = err && err.message
      ? err.message
      : 'No se pudo registrar la moto facturada. Revisa tu conexión e intenta nuevamente.';

    $('mensaje').className = 'error';
    $('mensaje').innerHTML = `
      ${escapeHtml(msg)}
      <br><br>
      <button type="button" class="secondary" onclick="reintentarGuardarFacturada()">
        Reintentar
      </button>
    `;
  }finally{
    guardandoFacturada = false;

    if(btn){
      btn.disabled = false;
      btn.textContent = 'Registrar moto facturada';
    }
  }
}
