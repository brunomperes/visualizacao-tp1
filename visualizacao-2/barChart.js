var m = [40, 160, 0, 220], // top right bottom left
    w = 1280 - m[1] - m[3], // width
    h = 800 - m[0] - m[2], // height
    x = d3.scale.linear().range([0, w]),
    y = 25, // bar height
    z = d3.scale.ordinal().range(["steelblue", "#aaa"]); // bar color

var hierarchy = d3.layout.partition()
    .value(function(d) { return d.size; });

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("top");

var svg = d3.select("#chart").append("svg:svg")
    .attr("width", w + m[1] + m[3])
    .attr("height", h + m[0] + m[2])
  .append("svg:g")
    .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

svg.append("svg:rect")
    .attr("class", "background")
    .attr("width", w)
    .attr("height", h)
    .on("click", up);

svg.append("svg:g")
    .attr("class", "x axis");

svg.append("svg:g")
    .attr("class", "y axis")
  .append("svg:line")
    .attr("y1", "100%");


function texto(d) {
  switch (d.depth){
    case 0:
      return 'Lista de ' + d.name;
    case 1:
      return 'Artistas do Gênero: ' + d.name;
    case 2:
      return 'Gênero: ' + d.parent.name + ' > Álbuns do Artista: ' +  d.name;
  }
}

/*
 * Busca uma chave, se não encontrar a cria
 */
function dictKeyOfValue(arr, value) {
  for (var i = arr.length - 1; i >= 0; i--) {
    if (arr[i].name == value){
      return i;
    }
  }
  var newKey = arr.push({"name": value, "children" :[]});
  newKey--;
  return newKey;
}

/*
 * Monta a estrutura
* flare
*   - genero
*       - artista
*           - album
 */
var listaArtistas = [];
d3.json("artists.json", function(jsonArtistas) {

  for (var i = jsonArtistas.length - 1; i >= 0; i--) {
    artistaId = jsonArtistas[i].id;
    listaArtistas[artistaId] = jsonArtistas[i];
  };

  d3.json("albums.json", function(jsonAlbuns) {

    var data = {};
    data.name = "Gêneros";
    data.children = [];
    for (var i = jsonAlbuns.length - 1; i >= 0; i--) {
      
      var albumGenreKey = dictKeyOfValue(data.children, jsonAlbuns[i].genre);

      artistaIdDoAlbum = jsonAlbuns[i].artist_id;
      // Ve se o artista do album já está presente na lista daquele genero
      var artistsKeyInCurrentGenre = dictKeyOfValue(data.children[albumGenreKey].children, listaArtistas[artistaIdDoAlbum].name);

      data.children[albumGenreKey].children[artistsKeyInCurrentGenre].children.push({"name": jsonAlbuns[i].title, "size" : jsonAlbuns[i].ratings});
    }
    root = data;

    //Original
    hierarchy.nodes(root);
    x.domain([0, root.value]).nice();
    down(root, 0);
  });
});

function down(d, i) {
  if (!d.children || this.__transition__) return;

  $('#texto-hierarquia').text(texto(d));

  var duration = d3.event && d3.event.altKey ? 7500 : 750,
      delay = duration / d.children.length;

  // Mark any currently-displayed bars as exiting.
  var exit = svg.selectAll(".enter").attr("class", "exit");

  // Entering nodes immediately obscure the clicked-on bar, so hide it.
  exit.selectAll("rect").filter(function(p) { return p === d; })
      .style("fill-opacity", 1e-6);

  // Enter the new bars for the clicked-on data.
  // Per above, entering bars are immediately visible.
  var enter = bar(d)
      .attr("transform", stack(i))
      .style("opacity", 1);

  // Have the text fade-in, even though the bars are visible.
  // Color the bars as parents; they will fade to children if appropriate.
  enter.select("text").style("fill-opacity", 1e-6);
  enter.select("rect").style("fill", z(true));

  // Update the x-scale domain.
  x.domain([0, d3.max(d.children, function(d) { return d.value; })]).nice();

  // Update the x-axis.
  svg.selectAll(".x.axis").transition()
      .duration(duration)
      .call(xAxis);

  // Transition entering bars to their new position.
  var enterTransition = enter.transition()
      .duration(duration)
      .delay(function(d, i) { return i * delay; })
      .attr("transform", function(d, i) { return "translate(0," + y * i * 1.2 + ")"; });

  // Transition entering text.
  enterTransition.select("text").style("fill-opacity", 1);

  // Transition entering rects to the new x-scale.
  enterTransition.select("rect")
      .attr("width", function(d) { return x(d.value); })
      .style("fill", function(d) { return z(!!d.children); });

  // Transition exiting bars to fade out.
  var exitTransition = exit.transition()
      .duration(duration)
      .style("opacity", 1e-6)
      .remove();

  // Transition exiting bars to the new x-scale.
  exitTransition.selectAll("rect").attr("width", function(d) { return x(d.value); });

  // Rebind the current node to the background.
  svg.select(".background").data([d]).transition().duration(duration * 2); d.index = i;
}

function up(d) {
  if (!d.parent || this.__transition__) return;
  $('#texto-hierarquia').text(texto(d.parent));
  var duration = d3.event && d3.event.altKey ? 7500 : 750,
      delay = duration / d.children.length;

  // Mark any currently-displayed bars as exiting.
  var exit = svg.selectAll(".enter").attr("class", "exit");

  // Enter the new bars for the clicked-on data's parent.
  var enter = bar(d.parent)
      .attr("transform", function(d, i) { return "translate(0," + y * i * 1.2 + ")"; })
      .style("opacity", 1e-6);

  // Color the bars as appropriate.
  // Exiting nodes will obscure the parent bar, so hide it.
  enter.select("rect")
      .style("fill", function(d) { return z(!!d.children); })
    .filter(function(p) { return p === d; })
      .style("fill-opacity", 1e-6);

  // Update the x-scale domain.
  x.domain([0, d3.max(d.parent.children, function(d) { return d.value; })]).nice();

  // Update the x-axis.
  svg.selectAll(".x.axis").transition()
      .duration(duration * 2)
      .call(xAxis);

  // Transition entering bars to fade in over the full duration.
  var enterTransition = enter.transition()
      .duration(duration * 2)
      .style("opacity", 1);

  // Transition entering rects to the new x-scale.
  // When the entering parent rect is done, make it visible!
  enterTransition.select("rect")
      .attr("width", function(d) { return x(d.value); })
      .each("end", function(p) { if (p === d) d3.select(this).style("fill-opacity", null); });

  // Transition exiting bars to the parent's position.
  var exitTransition = exit.selectAll("g").transition()
      .duration(duration)
      .delay(function(d, i) { return i * delay; })
      .attr("transform", stack(d.index));

  // Transition exiting text to fade out.
  exitTransition.select("text")
      .style("fill-opacity", 1e-6);

  // Transition exiting rects to the new scale and fade to parent color.
  exitTransition.select("rect")
      .attr("width", function(d) { return x(d.value); })
      .style("fill", z(true));

  // Remove exiting nodes when the last child has finished transitioning.
  exit.transition().duration(duration * 2).remove();

  // Rebind the current parent to the background.
  svg.select(".background").data([d.parent]).transition().duration(duration * 2);
}

// Creates a set of bars for the given data node, at the specified index.
function bar(d) {
  var bar = svg.insert("svg:g", ".y.axis")
      .attr("class", "enter")
      .attr("transform", "translate(0,5)")
    .selectAll("g")
      .data(d.children)
    .enter().append("svg:g")
      .style("cursor", function(d) { return !d.children ? null : "pointer"; })
      .on("click", down);

  bar.append("svg:text")
      .attr("x", -6)
      .attr("y", y / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .text(function(d) { return d.name; });

  bar.append("svg:rect")
      .attr("width", function(d) { return x(d.value); })
      .attr("height", y);

  return bar;
}

// A stateful closure for stacking bars horizontally.
function stack(i) {
  var x0 = 0;
  return function(d) {
    var tx = "translate(" + x0 + "," + y * i * 1.2 + ")";
    x0 += x(d.value);
    return tx;
  };
}