var fileNameSimplificado = 'dadosSimplificado.json';
var fileNameCompleto = 'dados.json';

$(document).ready(function () {
    if(window.location.href.indexOf("completo") > -1) {
       plotaGrafico(fileNameCompleto);
    } else {
       plotaGrafico(fileNameSimplificado);
    }
});

function plotaGrafico (nomeArquivo) {
  d3.json(nomeArquivo, function(data) {

    nv.addGraph(function() {
      var chart = nv.models.stackedAreaChart()
                    .margin({right: 100})
                    .x(function(d) { return d[0] })
                    .y(function(d) { return d[1] })
                    .useInteractiveGuideline(true)    //Tooltips which show all data points.
                    .rightAlignYAxis(true)      //Let's move the y-axis to the right side.
                    .transitionDuration(500)
                    .showControls(true)       //Allow user to choose 'Stacked', 'Stream', 'Expanded' mode.
                    .clipEdge(true);

      chart.yAxis
          .tickFormat(d3.format(',d'));

      d3.select('#chart svg')
        .datum(data)
        .call(chart);

      nv.utils.windowResize(chart.update);

      return chart;
    });
  });
};
