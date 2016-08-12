'use strict';
var App = App || {};

var Graph = function (options) {

    var self = this;

    // Charting utilities: Hover, Click, and Text Parsing
    var utils = new ChartUtils({selectors: ['.nv-bar', '.nv-point']});

    // Color map for the charts
    var colorMap = options.colorMap;

    function enableMouseCallbacks(chartDiv, chart, authors){
        $(chartDiv + " svg .nv-bar").each(function (i, elem) {

            $(elem).hover(function () {

                utils.hoveringCB.call({
                    authors: authors,
                    chart: d3.select("#results"), selector: '.nv-bar'
                }, d3.select(elem).data()[0], 0, i)

            }, function () {

                utils.endCB.call({authors: authors});

            });
        });

        d3.select(chartDiv).selectAll(".nv-bar")
            .on('click', utils.clickCB);

        chart.legend.updateState(false);
    }

    /**
     * Creates and plots the Bubble Scatter Plot
     *
     * @constructor
     * @this {Graph}
     * @param {Object} data The data to be mapped
     * @param {String} chartDiv ID if the div the chart is created in
     * @param {Array} subDomainCount The subDomain count per item
     * @param {Array} authors The authors corresponding to the data
     * @param {Object} xLabelMap The mapping between the x axis ticks and names
     * @param {Object} yLabelMap The mapping between the y axis ticks and names
     */
    self.graphEncodingBubbleNVD3Chart = function (data, chartDiv, subDomainCount,
                                                  authors, xLabelMap, yLabelMap) {
        /* the width and height of the chart */
        var totWidth = d3.select('.chartDivBubbles').node().clientWidth,
            totHeight = totWidth * 0.9,
            margins = { top : 20, bottom: 150, left: 150, right: 30},
            chart = null;

        var nonSpat = _.toPairs(xLabelMap);
        var spat = _.toPairs(yLabelMap);

        nv.addGraph(function () {

            d3.select(chartDiv).append("svg")
                .attr("width", totWidth - margins.left - margins.right)
                .attr("height", totHeight - margins.top - margins.bottom);

            chart = nv.models.scatterChart()
                .showLegend(false)
                .margin(margins)
                .pointRange([0, (parseInt( (totWidth- margins.left - margins.right) * 0.05) * 45)])
                .useVoronoi(false);

                /* Set the header formatter */
                chart.tooltip.headerFormatter(function(){
                    return "";
                });

                /* Set the value formatter to output the number of papers*/
                chart.tooltip.valueFormatter(function(d){
                    return d;
                });

                var previousTooltip = chart.tooltip.contentGenerator();
                chart.tooltip.contentGenerator(function (d) {

                    if(!d.point.domains) return;

                    d3.select('.nvtooltip').style('visibility', 'visible');

                    // clone the series data that the tooltip uses
                    var templateSeries = _.cloneDeep(d.series[0]);
                    // set the total number of papers
                    d.value = templateSeries.value;

                    // remove the old series value
                    d.series = [];

                    // iterate over the sub domain data to populate the tooltip
                    _.toPairs(d.point.domains).forEach(function(pair){

                        // create a copy of the template
                        var series = _.cloneDeep(templateSeries);

                        // series label
                        series.key = pair[0];
                        // series value
                        series.value = pair[1];
                        // series color
                        series.color = colorMap[series.key];

                        // add the label to the tooltip
                        d.series.push(series);
                    });

                    // clean up
                    templateSeries = null;

                    // call the default tooltip function with the newly modified data
                    return previousTooltip(d);
                });

                /*** substitute the numerical labels for the ordinal values x-axis ***/

                // x-axis
                chart.xAxis.tickFormat(function (d) {
                    if (_.isInteger(d) && d < nonSpat.length)  return nonSpat[d][0];
                });

                // y-axis
                chart.yAxis.tickFormat(function (d) {
                    if (_.isInteger(d) && d < spat.length)  return spat[d][0];
                });

                // add the data to the chart
                d3.select(chartDiv + ' svg')
                    .datum([data])
                    .call(chart);

                //nv.utils.windowResize(chart.update);
                return chart;
        },
            function () {

                // wrap the text of the y-axis
                d3.selectAll(chartDiv + ' svg .nv-y text')
                    .call(utils.wrap)
                    .attr('transform', 'translate(' + -60 + ',' + '0)')
                    .style({"text-anchor": "end", "font-weight": "bold"});

                // move the text of the x-axis down and rotate it
                d3.select(chartDiv + ' svg .nv-x .nv-axis')
                    .attr('transform', 'translate(' + -10 + ',' + chart.margin().bottom / 3.0 + ')')
                    .selectAll('text')
                    .style({"text-anchor": "end", "font-weight": "bold"})
                    .attr("transform", "rotate(-45)");

                $(chartDiv + " svg .nv-point").each(function (i, elem) {

                    $(elem).hover(function () {
                        utils.hoveringCB.call({
                            chart: d3.select("#results"),
                            selector: '.nv-point'
                            }, d3.select(elem).data()[0][0], 0, i)
                    },
                        function () {
                            utils.endCB.call({authors: authors});
                    })
                        .click(function(){
                            utils.clickCB.call(elem, d3.select(elem).data()[0]);
                        });
                });
            }
        );
    };

    /**
     * Creates and plots the Task Bar Chart
     *
     * @constructor
     * @this {Graph}
     * @param {Object} datum The data to be mapped
     * @param {String} chartDiv ID if the div the chart is created in
     * @param {Array} authors The authors corresponding to the data,
     */
    self.graphTaskBarNVD3Chart = function (datum, chartDiv, authors) {

        var totWidth = d3.select('.taskDiv').node().clientWidth,
            totHeight = d3.select('.chartDivBubbles').node().clientWidth * 0.4;

        var chart;

        nv.addGraph(
            function () {

                d3.select(chartDiv).append("svg")
                    .attr("width", totWidth)
                    .attr("height", totHeight);

                chart = nv.models.multiBarChart()
                    .x(function (d) {
                        return d.label
                    })
                    .y(function (d) {
                        return d.value
                    })
                    .margin({left: 30, bottom: 60})
                    .showLegend(true)
                    .reduceXTicks(false)
                    .rotateLabels(-45)
                    .groupSpacing(0.2)
                    .showControls(true)
                    .stacked(true);

                /* Set the header formatter */
                chart.tooltip.headerFormatter(function(d){
                    return "Task: " + d;
                });

                d3.select(chartDiv + ' svg')
                    .datum(datum)
                    .call(chart)
                ;

                nv.utils.windowResize(function(){
                    chart.update();
                    enableMouseCallbacks(chartDiv, chart, authors);
                });
                return chart;
            }, function () {
                enableMouseCallbacks(chartDiv, chart, authors);
            }
        );
    };

    /**
     * Creates and plots the Data Type Bar Chart
     *
     * @constructor
     * @this {Graph}
     * @param {Object} datum The data to be mapped
     * @param {String} chartDiv ID if the div the chart is created in
     * @param {Array} authors The authors corresponding to the data
     */
    self.graphTypeBarNVD3Chart = function (datum, chartDiv, authors) {

        var totWidth = d3.select('.typeDiv').node().clientWidth,
            totHeight = d3.select('.chartDivBubbles').node().clientWidth * 0.4;

        var chart;

        nv.addGraph(function () {

                d3.select(chartDiv)
                    .append("svg").attr("width", totWidth)
                    .attr("height", totHeight);

                chart = nv.models.multiBarChart()
                    .x(function (d) {
                        return d.label
                    })
                    .y(function (d) {
                        return d.value
                    })
                    .showLegend(true)
                    .reduceXTicks(false)
                    .rotateLabels(-45)
                    .groupSpacing(0.2)
                    .showControls(true)
                    .margin({left: 30, bottom: 60})
                    .stacked(true);


            /* Set the header formatter */
                chart.tooltip.headerFormatter(function(d){
                    return "Data Type: " + d;
                });

                d3.select(chartDiv + ' svg')
                    .datum(datum)
                    .call(chart)
                ;

            nv.utils.windowResize(function(){
                chart.update();
                enableMouseCallbacks(chartDiv, chart, authors);
            });
                return chart;

            }, function () {
                enableMouseCallbacks(chartDiv, chart, authors);
            }
        );
    };

    /**
     * Creates and plots the Evaluation Type Bar Chart
     *
     * @constructor
     * @this {Graph}
     * @param {Object} datum The data to be mapped
     * @param {String} chartDiv ID if the div the chart is created in
     * @param {Array} authors The authors corresponding to the data
     */
    self.graphParadigmsNVD3Chart = function (datum, chartDiv, authors) {

        var totWidth = d3.select('.evalDiv').node().clientWidth,
            totHeight = d3.select('.chartDivBubbles').node().clientWidth * 0.4;

        var chart;
        nv.addGraph(function () {

                d3.select(chartDiv)
                    .append("svg").attr("width", totWidth)
                    .attr("height", totHeight);

                chart = nv.models.multiBarChart()
                    .x(function (d) {
                        return d.label
                    })
                    .y(function (d) {
                        return d.value
                    })
                    .showLegend(true)
                    .reduceXTicks(false)
                    //.rotateLabels(-45)
                    .groupSpacing(0.2)
                    .showControls(true)
                    .margin({left: 30, bottom: 70})
                    .stacked(true);

                chart.xAxis.tickFormat(function (d) {
                    if(d == "Spatial Nesting")
                        return "Spat. / Nesting";
                    else if(d == "Non-Spatial Nesting")
                        return "Non-Spat. / Nesting";
                    else if(d == "Linked Views")
                        return "Linked / Views";
                    else
                        return d;
                });

                /* Set the header formatter */
                chart.tooltip.headerFormatter(function(d){
                    return "Paradigms: " + d;
                });

                d3.select(chartDiv + ' svg')
                    .datum(datum)
                    .call(chart);

                // wrap the text of the x-axis
                d3.selectAll(chartDiv + ' svg .nv-x text')
                    .attr('transform', function() { return 'translate (-10, 10) rotate(-45 0,0)' })
                    .call(utils.wrap, chart.xRange())
                    .style({"text-anchor": "end"});

                nv.utils.windowResize(function(){
                    chart.update();
                    // wrap the text of the x-axis
                    d3.selectAll(chartDiv + ' svg .nv-x text')
                        .attr('transform', function() { return 'translate (-10, 10) rotate(-45 0,0)' })
                        .call(utils.wrap, chart.xRange())
                        .style({"text-anchor": "end"});

                    enableMouseCallbacks(chartDiv, chart, authors);

                });

                return chart;
            }, function () {
                enableMouseCallbacks(chartDiv, chart, authors);
            }
        );
    };

    /**
     * Creates and plots the Evaluation Type Bar Chart
     *
     * @constructor
     * @this {Graph}
     * @param {Object} datum The data to be mapped
     * @param {String} chartDiv ID if the div the chart is created in
     * @param {Array} authors The authors corresponding to the data
     */
    self.graphEvaluationNVD3Chart = function (datum, chartDiv, authors) {

        var totWidth = d3.select('.evalDiv').node().clientWidth,
            totHeight = d3.select('.chartDivBubbles').node().clientWidth * 0.4;

        var chart;
        nv.addGraph(function () {

                d3.select(chartDiv)
                    .append("svg")
                    .attr("width", totWidth)
                    .attr("height", totHeight);

                chart = nv.models.multiBarChart()
                    .x(function (d) {
                        return d.label
                    })
                    .y(function (d) {
                        return d.value
                    })
                    .showLegend(true)
                    .reduceXTicks(false)
                    .rotateLabels(-45)
                    .groupSpacing(0.2)
                    .showControls(true)
                    .margin({left: 30, bottom: 60})
                    .stacked(true);


            /* Set the header formatter */
                chart.tooltip.headerFormatter(function(d){
                    return "Evaluation: " + d;
                });

                chart.xAxis.tickFormat(function (d) {
                    if(d == "Quantitative Analysis")
                        return "Quantitative";
                    else if(d == "Qualitative Analysis")
                        return "Qualitative";
                    else
                        return d;
                });

                d3.select(chartDiv + ' svg')
                    .datum(datum)
                    .call(chart);

                nv.utils.windowResize(function(){
                    chart.update();
                    enableMouseCallbacks(chartDiv, chart, authors);
                });

                return chart;
            }, function () {
                enableMouseCallbacks(chartDiv, chart, authors);
            }
        );
    };

    /**
     * Creates and plots the Evaluation Type Bar Chart
     *
     * @constructor
     * @this {Graph}
     * @param {Object} datum The data to be mapped
     * @param {String} chartDiv ID if the div the chart is created in
     * @param {Array} authors The authors corresponding to the data
     */
    self.graphEvaluatorsNVD3Chart = function (datum, chartDiv, authors) {

        var totWidth = d3.select('.evalDiv').node().clientWidth,
            totHeight = d3.select('.chartDivBubbles').node().clientWidth * 0.4;

        var chart;
        nv.addGraph(function () {

                d3.select(chartDiv)
                    .append("svg").attr("width", totWidth)
                    .attr("height", totHeight);

                chart = nv.models.multiBarChart()
                    .x(function (d) {
                        return d.label
                    })
                    .y(function (d) {
                        return d.value
                    })
                    .showLegend(true)
                    .reduceXTicks(false)
                    .rotateLabels(-45)
                    .groupSpacing(0.2)
                    .showControls(true)
                    .margin({left: 30, bottom: 60})
                    .stacked(true);

                /* Set the header formatter */
                chart.tooltip.headerFormatter(function(d){
                    return "Evaluation: " + d;
                });

                d3.select(chartDiv + ' svg')
                    .datum(datum)
                    .call(chart);

                nv.utils.windowResize(function(){
                    chart.update();
                    enableMouseCallbacks(chartDiv, chart, authors);
                });

                return chart;
            }, function () {
                enableMouseCallbacks(chartDiv, chart, authors);
            }
        );
    };

    return self;
};