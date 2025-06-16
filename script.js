const url = "https://raw.githubusercontent.com/CatherinePA/Datos/main/VentasNov_Dic2024.csv";

let dataGlobal = [];
const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

function loadData() {
  d3.csv(url, d => {
    return {
      Fecha: parseFecha(d.Fecha),
      Mes: d.Mes?.trim(),
      Cliente: d.Cliente?.trim(),
      Producto: d.Producto?.trim(),
      Almacen: d.Almacen?.trim(),
      Cantidad: +d.Cantidad,
      ValorUnitario: +d.ValorUnitario,
      Total: +d.Total?.replace(/[^\d.-]/g, "") // limpia "S/ 1,000.00" → "1000.00"
    };
  }).then(data => {
    console.log("⚠️ Primera fila cruda:", data[0]);
    dataGlobal = data.filter(d => d.Fecha && !isNaN(d.Total));
    console.log("✅ Filas válidas:", dataGlobal.length);

    initFilters();
    drawAllCharts(dataGlobal);
  }).catch(err => {
    console.error("❌ Error cargando CSV:", err);
  });
}

function parseFecha(str) {
  // intenta formatos conocidos
  const f1 = d3.timeParse("%Y-%m-%d");
  const f2 = d3.timeParse("%d/%m/%Y");
  return f1(str) || f2(str) || null;
}

function initFilters() {
  const monthSet = new Set(dataGlobal.map(d => d.Mes));
  const almacenSet = new Set(dataGlobal.map(d => d.Almacen).filter(a => a && /^[A-Z0-9_]+$/.test(a)));
  const clienteSet = new Set(dataGlobal.map(d => d.Cliente));

  const monthFilter = d3.select("#monthFilter");
  monthFilter.append("option").text("Todos").attr("value", "");
  [...monthSet].forEach(m => monthFilter.append("option").text(m).attr("value", m));
  monthFilter.on("change", applyFilters);

  const almacenFilter = d3.select("body").insert("select", "#charts").attr("id", "almacenFilter");
  almacenFilter.append("option").text("Todos Almacenes").attr("value", "");
  [...almacenSet].forEach(a => almacenFilter.append("option").text(a).attr("value", a));
  almacenFilter.on("change", applyFilters);

  const clienteFilter = d3.select("body").insert("select", "#charts").attr("id", "clienteFilter");
  clienteFilter.append("option").text("Todos Clientes").attr("value", "");
  [...clienteSet].forEach(c => clienteFilter.append("option").text(c).attr("value", c));
  clienteFilter.on("change", applyFilters);
}

function applyFilters() {
  const mes = d3.select("#monthFilter").property("value");
  const almacen = d3.select("#almacenFilter").property("value");
  const cliente = d3.select("#clienteFilter").property("value");

  let filtered = dataGlobal;
  if (mes) filtered = filtered.filter(d => d.Mes === mes);
  if (almacen) filtered = filtered.filter(d => d.Almacen === almacen);
  if (cliente) filtered = filtered.filter(d => d.Cliente === cliente);

  drawAllCharts(filtered);
}

function drawAllCharts(data) {
  d3.select("#charts").html("");
  d3.select(".tooltip").remove();

  const container = d3.select("#charts");
  const charts = [
    drawVentasPorMes,
    drawVentasPorAlmacen,
    drawVentasPorCliente,
    drawProductoMasVendido
  ];

  for (let i = 0; i < charts.length; i += 2) {
    const row = container.append("div").attr("class", "chart-row");
    row.append("div").attr("class", "chart-box").call(charts[i], data);
    if (charts[i + 1]) row.append("div").attr("class", "chart-box").call(charts[i + 1], data);
  }

  if (d3.select("body .tooltip").empty()) {
    d3.select("body").append("div").attr("class", "tooltip").style("display", "none");
  }
}

// Las 4 funciones de graficado (drawVentasPorMes, drawVentasPorAlmacen, etc.)
// las mantienes como ya las tenías, no necesitan cambios estructurales si ya funcionaban.
// Si necesitas que las vuelva a pegar aquí, solo dime.

loadData();
