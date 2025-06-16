// script.js
const url = "https://raw.githubusercontent.com/CatherinePA/Datos/refs/heads/main/VentasOct_Dic2024.csv";

let dataGlobal = [];
const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

function loadData() {
  d3.csv(url, d => {
    return {
      Fecha: d3.timeParse("%Y-%m-%d")(d.Fecha),
      Mes: d.Mes,
      Cliente: d.Cliente,
      Producto: d.Producto,
      Almacen: d.Almacen,
      Cantidad: +d.Cantidad,
      ValorUnitario: +d.ValorUnitario,
      Total: +d.Total
    };
  }).then(data => {
    dataGlobal = data.filter(d => d.Fecha && !isNaN(d.Total));
    initFilters();
    drawAllCharts(dataGlobal);
  });
}

function initFilters() {
  const monthSet = new Set(dataGlobal.map(d => d.Mes));
  const almacenSet = new Set(dataGlobal.map(d => d.Almacen));
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

function drawVentasPorMes(selection, data) {
  const svg = selection.append("svg").attr("height", 300);
  const margin = { top: 20, right: 30, bottom: 30, left: 50 };
  const width = parseInt(svg.style("width")) || 400;
  const height = parseInt(svg.attr("height")) - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const grouped = d3.rollup(data, v => d3.sum(v, d => d.Total), d => d.Mes);
  const entries = Array.from(grouped, ([key, value]) => ({ mes: key, total: value })).sort((a, b) => a.mes.localeCompare(b.mes));

  const x = d3.scaleBand().domain(entries.map(d => d.mes)).range([0, width]).padding(0.1);
  const y = d3.scaleLinear().domain([0, d3.max(entries, d => d.total)]).nice().range([height, 0]);

  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y));

  const tooltip = d3.select(".tooltip");
  g.selectAll("rect")
    .data(entries)
    .enter()
    .append("rect")
    .attr("x", d => x(d.mes))
    .attr("y", d => y(d.total))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.total))
    .attr("fill", colorScale("mes"))
    .on("mouseover", (event, d) => {
      tooltip.style("display", "block").html(`<strong>${d.mes}</strong><br>Total: ${d.total.toFixed(2)}`);
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 30) + "px");
    })
    .on("mouseout", () => tooltip.style("display", "none"));
}

function drawVentasPorAlmacen(selection, data) {
  const svg = selection.append("svg").attr("height", 300);
  const margin = { top: 20, right: 30, bottom: 30, left: 50 };
  const width = parseInt(svg.style("width")) || 400;
  const height = parseInt(svg.attr("height")) - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const grouped = d3.rollup(data, v => d3.sum(v, d => d.Total), d => d.Almacen);
  const entries = Array.from(grouped, ([key, value]) => ({ almacen: key, total: value })).sort((a, b) => b.total - a.total);

  const x = d3.scaleBand().domain(entries.map(d => d.almacen)).range([0, width]).padding(0.1);
  const y = d3.scaleLinear().domain([0, d3.max(entries, d => d.total)]).nice().range([height, 0]);

  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y));

  g.selectAll("rect")
    .data(entries)
    .enter()
    .append("rect")
    .attr("x", d => x(d.almacen))
    .attr("y", d => y(d.total))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.total))
    .attr("fill", colorScale("almacen"))
    .on("mouseover", (event, d) => {
      d3.select(".tooltip").style("display", "block").html(`<strong>${d.almacen}</strong><br>Total: ${d.total.toFixed(2)}`);
    })
    .on("mousemove", event => {
      d3.select(".tooltip").style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 30) + "px");
    })
    .on("mouseout", () => d3.select(".tooltip").style("display", "none"));
}

function drawVentasPorCliente(selection, data) {
  const svg = selection.append("svg").attr("height", 300);
  const margin = { top: 20, right: 30, bottom: 90, left: 50 };
  const width = parseInt(svg.style("width")) || 400;
  const height = parseInt(svg.attr("height")) - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const grouped = d3.rollup(data, v => d3.sum(v, d => d.Total), d => d.Cliente);
  const entries = Array.from(grouped, ([key, value]) => ({ cliente: key, total: value })).sort((a, b) => b.total - a.total).slice(0, 10);

  const x = d3.scaleBand().domain(entries.map(d => d.cliente)).range([0, width]).padding(0.1);
  const y = d3.scaleLinear().domain([0, d3.max(entries, d => d.total)]).nice().range([height, 0]);

  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x)).selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");
  g.append("g").call(d3.axisLeft(y));

  g.selectAll("rect")
    .data(entries)
    .enter()
    .append("rect")
    .attr("x", d => x(d.cliente))
    .attr("y", d => y(d.total))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.total))
    .attr("fill", colorScale("cliente"))
    .on("mouseover", (event, d) => {
      d3.select(".tooltip").style("display", "block").html(`<strong>${d.cliente}</strong><br>Total: ${d.total.toFixed(2)}`);
    })
    .on("mousemove", event => {
      d3.select(".tooltip").style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 30) + "px");
    })
    .on("mouseout", () => d3.select(".tooltip").style("display", "none"));
}

function drawProductoMasVendido(selection, data) {
  const svg = selection.append("svg").attr("height", 300);
  const margin = { top: 20, right: 30, bottom: 90, left: 50 };
  const width = parseInt(svg.style("width")) || 400;
  const height = parseInt(svg.attr("height")) - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const grouped = d3.rollup(data, v => d3.sum(v, d => d.Cantidad), d => d.Producto);
  const entries = Array.from(grouped, ([key, value]) => ({ producto: key, cantidad: value })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);

  const x = d3.scaleBand().domain(entries.map(d => d.producto)).range([0, width]).padding(0.1);
  const y = d3.scaleLinear().domain([0, d3.max(entries, d => d.cantidad)]).nice().range([height, 0]);

  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x)).selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");
  g.append("g").call(d3.axisLeft(y));

  g.selectAll("rect")
    .data(entries)
    .enter()
    .append("rect")
    .attr("x", d => x(d.producto))
    .attr("y", d => y(d.cantidad))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.cantidad))
    .attr("fill", colorScale("producto"))
    .on("mouseover", (event, d) => {
      d3.select(".tooltip").style("display", "block").html(`<strong>${d.producto}</strong><br>Cantidad: ${d.cantidad}`);
    })
    .on("mousemove", event => {
      d3.select(".tooltip").style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 30) + "px");
    })
    .on("mouseout", () => d3.select(".tooltip").style("display", "none"));
}

loadData();
