document.addEventListener('DOMContentLoaded', initAsesor);

let guardandoProspecto = false;
let ultimoFormIntento = null;

async function initAsesor(){
  $('app').innerHTML = `<div class="asesor-shell">
    <div class="asesor-head"><div><h1>CRM Xpress Motos</h1><p>Captura de nuevo prospecto</p></div><div class="install-tip">Acceso para asesores</div></div>
    <div id="formWrap" class="panel"><p class="muted">Cargando catálogos...</p></div>
  </div>`;
  try{
    await cargarCatalogos(false);
    renderFormAsesor();
  }catch(e){
    $('formWrap').innerHTML = `<div class="error">${escapeHtml(e.message || e)}</div>`;
  }
}

function renderFormAsesor(){
  const c = state.catalogos;
  $('formWrap').innerHTML = `<form id="prospectoForm">
    <div class="grid">
      <div><label>Agencia *</label><select id="agencia" required>${opt(c.agencias)}</select></div>
      <div><label>Asesor *</label><select id="asesor" required></select></div>
      <div><label>Nombre del cliente *</label><input id="cliente" required></div>
      <div><label>Teléfono *</label><input id="telefono" required inputmode="tel"></div>
      <div><label>Municipio</label><input id="municipio"></div>
      <div><label>Medio de prospección</label><select id="medio">${opt(c.medios)}</select></div>
    </div>

    <div class="section-title">Moto solicitada</div>
    <div class="grid">
      <div><label>Marca</label><select id="marca">${opt(c.marcas)}</select></div>
      <div><label>Modelo</label><select id="modelo"></select></div>
      <div><label>Tipo</label><input id="tipo" readonly></div>
      <div><label>Precio Público</label><input id="precio" readonly></div>
      <div><label>Tipo de venta</label><select id="tipoVenta">${opt(c.tiposVenta)}</select></div>
      <div><label>Contado</label><select id="contado"><option>No</option><option>Sí</option></select></div>
    </div>

    <div class="section-title">Resultados por financiera</div>
    <div id="financieras" class="grid">
      ${(c.financieras || []).map(f => `
        <div>
          <label>${escapeHtml(f)}</label>
          <select data-fin="${escapeHtml(f)}">
            <option>No se envió solicitud</option>
            <option>Aprobado</option>
            <option>No aprobado</option>
          </select>
        </div>
      `).join('')}
    </div>

    <div class="section-title">Seguimiento</div>
    <div class="grid">
      <div><label>Estado del prospecto</label><select id="estado">${opt(c.estados)}</select></div>
      <div><label>Motivo de pérdida</label><select id="motivo">${opt(c.motivos)}</select></div>
    </div>

    <label>Observaciones</label>
    <textarea id="observaciones"></textarea>

    <button id="btnGuardar" class="primary" style="width:100%;margin-top:18px" type="submit">
      Guardar Prospecto
    </button>

    <div id="mensaje"></div>
  </form>`;

  $('agencia').addEventListener('change', cargarAsesores);
  $('marca').addEventListener('change', cargarModelos);
  $('modelo').addEventListener('change', actualizarMoto);
  $('prospectoForm').addEventListener('submit', guardarProspectoAsesor);

  cargarAsesores();
  cargarModelos();
}

function cargarAsesores(){
  const ag = $('agencia').value;
  const asesores = (state.catalogos.asesores || [])
    .filter(a => !ag || a.agencia === ag)
    .map(a => a.asesor);

  $('asesor').innerHTML = opt(asesores);
}

function cargarModelos(){
  const ma = $('marca').value;
  const modelos = (state.catalogos.motos || [])
    .filter(m => m.marca === ma)
    .map(m => m.modelo);

  $('modelo').innerHTML = opt(modelos);
  actualizarMoto();
}

function actualizarMoto(){
  const ma = $('marca').value;
  const mo = $('modelo').value;

  const m = (state.catalogos.motos || [])
    .find(x => x.marca === ma && x.modelo === mo);

  $('tipo').value = m ? m.tipo : '';
  $('precio').value = m ? money(m.precio) : '';
}

function obtenerFormularioProspecto(){
  const financieras = {};

  document.querySelectorAll('[data-fin]').forEach(s => {
    financieras[s.dataset.fin] = s.value;
  });

  return {
    agencia: agencia.value,
    asesor: asesor.value,
    cliente: cliente.value,
    telefono: telefono.value,
    municipio: municipio.value,
    medio: medio.value,
    marca: marca.value,
    modelo: modelo.value,
    tipo: tipo.value,
    precio: precio.value.replace(/[^0-9.]/g,''),
    tipoVenta: tipoVenta.value,
    contado: contado.value,
    estado: estado.value,
    motivo: motivo.value,
    observaciones: observaciones.value,
    financieras
  };
}

async function guardarProspectoAsesor(e){
  e.preventDefault();

  if (guardandoProspecto) return;

  const form = obtenerFormularioProspecto();
  ultimoFormIntento = form;

  await enviarProspecto(form);
}

async function reintentarGuardarProspecto(){
  if (!ultimoFormIntento || guardandoProspecto) return;
  await enviarProspecto(ultimoFormIntento);
}

async function enviarProspecto(form){
  const btn = $('btnGuardar');

  try{
    guardandoProspecto = true;

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Guardando...';
    }

    setMsg('mensaje','Guardando prospecto, por favor espera...','success');

    const r = await api('guardarProspecto', { form });

    const id = r && r.id ? r.id : 'Sin folio';

    setMsg('mensaje',`Prospecto guardado correctamente. Folio: ${id}`,'success');

    $('prospectoForm').reset();
    cargarAsesores();
    cargarModelos();

    ultimoFormIntento = null;

  }catch(err){
    const msg = err && err.message ? err.message : 'No se pudo guardar el prospecto. Revisa tu conexión e intenta nuevamente.';

    $('mensaje').className = 'error';
    $('mensaje').innerHTML = `
      ${escapeHtml(msg)}
      <br><br>
      <button type="button" class="secondary" onclick="reintentarGuardarProspecto()">
        Reintentar
      </button>
    `;
  }finally{
    guardandoProspecto = false;

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Guardar Prospecto';
    }
  }
}
