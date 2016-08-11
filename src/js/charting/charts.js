'use strict';
var App = App || {};

var Graph = function (options) {

    var self = this;

    // Charting utilities: Hover, Click, and Text Parsing
    var utils = new ChartUtils({selectors: ['.nv-bar', '.nv-point']});

    // Color map for the charts
    var colorMap = options.colorMap;

    /**
     * Creates and plots the Bubble Scatter Plot
     *
     * @constructor
     * @this {Graph}
     * @param {Object} data The data to be mapped
     * @param {String} chartDiv ID if the div the chart is created in
     * @param {number} maxValue The count of that the largest circle will possess
     * @param {Array} grpNames The values for the x-axis
     * @param {Array} authors The authors corresponding to the data
     * @param {Array} subDomains Subdomains mapped to the encoding pairings
     */
    self.graphEncodingBubbleNVD3Chart = function (data, chartDiv, maxValue, grpNames, authors, subDomains) {

        // $("#cogEnc a")
        //     .popover({
        //         container: "body",
        //         title: 'Chart Settings',
        //         placement: 'auto',
        //         html: true,
        //         delay: {"show": 100 },
        //         content: "<div id='attributeSelector' class='container'>" +
        //                     "<div class = row>" +
        //                         "<div class='col-md-4'>" +
        //                             "<div class='row'>" +
        //                                 "<div class='col-md-12 col-md-offset-3'>" +
        //                                     "<h5>X Axis</h5>" +
        //                                 "</div>" +
        //                                 "<div class='col-md-12'>" +
        //                                     "<select>" +
        //                                         "<option>Tasks</option>" +
        //                                         "<option>Datasets</option>" +
        //                                         "<option>Paradigms</option>" +
        //                                         "<option>Evaluation</option>" +
        //                                         "<option>Evaluator</option>" +
        //                                         "</select>"+
        //                                 "</div>" +
        //                             "</div>" +
        //                         "</div>" +
        //                         "<div class='col-md-4 col-md-offset-3'>" +
        //                             "<div class='row'>" +
        //                                 "<div class='col-md-12 col-md-offset-3'>" +
        //                                     "<h5>Y Axis</h5>" +
        //                                 "</div>" +
        //                                 "<div class='col-md-12'>" +
        //                                     "<select>" +
        //                                         "<option>Tasks</option>" +
        //                                         "<option>Datasets</option>" +
        //                                         "<option>Paradigms</option>" +
        //                                         "<option>Evaluation</option>" +
        //                                         "<option>Evaluator</option>" +
        //                                     "</select>"+
        //                                 "</div>" +
        //                             "</div>" +
        //                         "</div>" +
        //                     "</div>" +
        //                     "<div class='row'><br></div>" +
        //                     "<div class='row'>" +
        //                         "<div class='col-md-4 col-md-offset-3'>" +
        //                             "<button type='button' class='btn btn-primary'>Render Chart</button>" +
        //                         "</div>" +
        //                     "</div>" +
        //                 "</div>"
        //     })
        //     .on('shown.bs.popover', function(){
        //     });

        // $('body').on('click', function (e) {
        //     $('[data-original-title]').each(function () {
        //         //the 'is' for buttons that trigger popups
        //         //the 'has' for icons within a button that triggers a popup
        //         if (!$(this).is(e.target) && $(this).has(e.target).length === 0
        //                 && $('.popover').has(e.target).length === 0)
        //         {
        //             $(this).popover('hide');
        //         }
        //     });
        // });

        /* define the maps that will be used for the labels of the scatter plot bubble */
        var nonSpatialMap = {}, spatialMap = {}, i = 0;

        // create the non-spatial map
        grpNames.forEach(function (grp) {
            nonSpatialMap[grp] = i++;
        });

        // reset the iterator and create the spatial map
        i = 0;
        var datum = _.reduce(data, function (result, value) {
            spatialMap[value.yProp] = i++;
            value.groups.forEach(function (obj) {
                result.values.push({
                    size: obj.value * 100,
                    y: spatialMap[value.yProp],
                    x: nonSpatialMap[obj.label],
                    domains: subDomains[value.yProp][obj.label],
                    authors: authors[value.yProp][obj.label],
                    property: obj.property
                });
            });
            return result;

        }, {
            key: "Group 1", values: []
        });

        /* the width and height of the chart */
        var totWidth = d3.select('.chartDivBubbles').node().clientWidth,
            totHeight = totWidth * 0.9,
            margins = { top : 20, bottom: 150, left: 150, right: 30},
            chart = null;

        var nonSpat = _.toPairs(nonSpatialMap);
        var spat = _.toPairs(spatialMap);

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
                    if (_.isInteger(d))  return nonSpat[d][0];
                });

                // y-axis
                chart.yAxis.tickFormat(function (d) {
                    if (_.isInteger(d))  return spat[d][0];
                });

                // add the data to the chart
                d3.select(chartDiv + ' svg')
                    .datum([datum])
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

                        utils.hoveringCB.call(
                            {
                                groups: grpNames,
                                chart: d3.select("#results"), selector: '.nv-point'
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
     * @param {number} maxValue The count of that the largest circle will possess
     * @param {Array} grpNames The values for the x-axis
     * @param {Array} subDomains The values for the y-axis
     * @param {Array} authors The authors corresponding to the data,
     */
    self.graphTaskBarNVD3Chart = function (datum, chartDiv, maxValue, grpNames, subDomains, authors) {

        // $("#cogTask a")
        //     .popover({
        //         container: "body",
        //         title: 'Chart Settings',
        //         placement: 'left',
        //         html: true,
        //         content: "<input id='normalizeTask' type='checkbox' name='normalize' value='task'> Normalize Data"
        //     })
        //     .on('shown.bs.popover', function(){
        //
        //         $("#normalizeTask").change(function() {
        //
        //             // normalize the data
        //             if(this.checked) {
        //
        //                 datum.forEach(function(o){
        //
        //                     o.values.forEach(function(v){
        //                         v.value /= count[v.key];
        //                     });
        //                 });
        //             }
        //             // un-normalize the data
        //             else {
        //                 datum.forEach(function(o){
        //
        //                     o.values.forEach(function(v){
        //                         v.value *= count[v.key];
        //                     });
        //                 });
        //             }
        //
        //             // redraw the chart
        //             d3.select(chartDiv + ' svg')
        //                 .datum(datum)
        //                 .call(chart);
        //
        //             $(chartDiv + " svg .nv-bar").each(function (i, elem) {
        //
        //                 $(elem).hover(function () {
        //
        //                     utils.hoveringCB.call({
        //                         authors: authors, groups: grpNames,
        //                         chart: d3.select("#results"), selector: '.nv-bar'
        //                     }, d3.select(elem).data()[0], 0, i)
        //
        //                 }, function () {
        //
        //                     utils.endCB.call({authors: authors});
        //
        //                 });
        //             });
        //
        //             d3.select(chartDiv).selectAll(".nv-bar")
        //                 .on('click', utils.clickCB);
        //
        //             chart.legend.updateState(false);
        //         });
        //
        //     });

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

                nv.utils.windowResize(chart.update);

                return chart;
            }, function () {

                $(chartDiv + " svg .nv-bar").each(function (i, elem) {

                    $(elem).hover(function () {

                        utils.hoveringCB.call({
                            authors: authors, groups: grpNames,
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
        );
    };

    /**
     * Creates and plots the Data Type Bar Chart
     *
     * @constructor
     * @this {Graph}
     * @param {Object} datum The data to be mapped
     * @param {String} chartDiv ID if the div the chart is created in
     * @param {number} maxValue The count of that the largest circle will possess
     * @param {Array} grpNames The values for the x-axis
     * @param {Array} subDomains The values for the y-axis
     * @param {Array} authors The authors corresponding to the data
     */
    self.graphTypeBarNVD3Chart = function (datum, chartDiv, maxValue, grpNames, subDomains, authors) {

        // $("#cogType a")
        //     .popover({
        //         container: "body",
        //         title: 'Chart Settings',
        //         placement: 'left',
        //         html: true,
        //         content: "<input id='normalizeType' type='checkbox' name='normalize' value='task'>Normalize Data"
        //     })
        //     .on('shown.bs.popover', function(){
        //         console.log(this);
        //         $("#normalizeType").change(function() {
        //             // normalize the data
        //             if(this.checked) {
        //                 datum.forEach(function(o){
        //                     o.values.forEach(function(v){
        //                         v.value /= count[v.key];
        //                     });
        //                 });
        //             }
        //             // un-normalize the data
        //             else {
        //                 datum.forEach(function(o){
        //                     o.values.forEach(function(v){
        //                         v.value *= count[v.key];
        //                     });
        //                 });
        //             }
        //
        //             // redraw the chart
        //             d3.select(chartDiv + ' svg')
        //                 .datum(datum)
        //                 .call(chart);
        //
        //             $(chartDiv + " svg .nv-bar").each(function (i, elem) {
        //                 $(elem).hover(function () {
        //                     utils.hoveringCB.call({
        //                         groups: grpNames,
        //                         chart: d3.select("#results"), selector: '.nv-bar'
        //                     }, d3.select(elem).data()[0], 0, i)
        //
        //                 }, function () {
        //                     utils.endCB.call({authors: authors});
        //                 });
        //             });
        //
        //             d3.select(chartDiv).selectAll(".nv-bar")
        //                 .on('click', utils.clickCB);
        //         });
        //     })
        // ;

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

                nv.utils.windowResize(chart.update);

                return chart;

            }, function () {
            $(chartDiv + " svg .nv-bar").each(function (i, elem) {
                $(elem).hover(function () {
                    utils.hoveringCB.call({
                        authors: authors, groups: grpNames,
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
        );
    };

    /**
     * Creates and plots the Evaluation Type Bar Chart
     *
     * @constructor
     * @this {Graph}
     * @param {Object} datum The data to be mapped
     * @param {String} chartDiv ID if the div the chart is created in
     * @param {number} maxValue The count of that the largest circle will possess
     * @param {Array} grpNames The values for the x-axis
     * @param {Array} subDomains The values for the y-axis
     * @param {Array} authors The authors corresponding to the data
     */
    self.graphParadigmsNVD3Chart = function (datum, chartDiv, maxValue, grpNames, subDomains, authors) {

        // $("#cogPara a")
        //     .popover({
        //         container: "body",
        //         title: 'Chart Settings',
        //         placement: 'left',
        //         html: true,
        //         content: "<input id='normalizePara' type='checkbox' name='normalize' value='task'> Normalize Data"
        //     })
        //     .on('shown.bs.popover', function(){
        //
        //         $("#normalizePara").change(function() {
        //             // normalize the data
        //             if(this.checked) {
        //                 datum.forEach(function(o){
        //                     o.values.forEach(function(v){
        //                         v.value /= count[v.key];
        //                     });
        //                 });
        //             }
        //             // un-normalize the data
        //             else {
        //                 datum.forEach(function(o){
        //                     o.values.forEach(function(v){
        //                         v.value *= count[v.key];
        //                     });
        //                 });
        //             }
        //
        //             // redraw the chart
        //             d3.select(chartDiv + ' svg')
        //                 .datum(datum)
        //                 .call(chart);
        //
        //             $(chartDiv + " svg .nv-bar").each(function (i, elem) {
        //                 $(elem).hover(function () {
        //                     utils.hoveringCB.call({
        //                         authors: authors, groups: grpNames,
        //                         chart: d3.select("#results"), selector: '.nv-bar'
        //                     }, d3.select(elem).data()[0], 0, i)
        //                 }, function () {
        //                     utils.endCB.call({authors: authors});
        //                 });
        //             });
        //
        //             d3.select(chartDiv).selectAll(".nv-bar")
        //                 .on('click', utils.clickCB);
        //
        //             // wrap the text of the x-axis
        //             d3.selectAll(chartDiv + ' svg .nv-x text')
        //                 .attr('transform', function(d,i,j) { return 'translate (-10, 10) rotate(-45 0,0)' })
        //                 .call(utils.wrap, chart.xRange())
        //                 .style({"text-anchor": "end"});
        //
        //         });
        //     });
        // $('a#cogPara').on('click', function(e) {e.preventDefault(); return true;});

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

                nv.utils.windowResize(chart.update);

                return chart;
            }, function () {

                // wrap the text of the x-axis
                d3.selectAll(chartDiv + ' svg .nv-x text')
                    .attr('transform', function() { return 'translate (-10, 10) rotate(-45 0,0)' })
                    .call(utils.wrap, chart.xRange())
                    .style({"text-anchor": "end"});

                $(chartDiv + " svg .nv-bar").each(function (i, elem) {

                    $(elem).hover(function () {
                        utils.hoveringCB.call({
                            authors: authors, groups: grpNames,
                            chart: d3.select("#results"), selector: '.nv-bar'
                        }, d3.select(elem).data()[0], 0, i)
                    }, function () {
                        utils.endCB.call({authors: authors});
                    });
                });

                d3.select(chartDiv).selectAll(".nv-bar")
                    .on('click', utils.clickCB);

                // disable legend actions
                chart.legend.updateState(false);

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
     * @param {number} maxValue The count of that the largest circle will possess
     * @param {Array} grpNames The values for the x-axis
     * @param {Array} subDomains The values for the y-axis
     * @param {Array} authors The authors corresponding to the data
     */
    self.graphEvaluationNVD3Chart = function (datum, chartDiv, maxValue, grpNames, subDomains, authors) {

        // $("#cogEval a")
        //     .popover({
        //         container: "body",
        //         title: 'Chart Settings',
        //         placement: 'left',
        //         html: true,
        //         content: "<input id='normalizeEval' type='checkbox' name='normalize' value='task'> Normalize Data"
        //     })
        //     .on('shown.bs.popover', function(){
        //
        //         $("#normalizeEval").change(function() {
        //             // normalize the data
        //             if(this.checked) {
        //                 datum.forEach(function(o){
        //                     o.values.forEach(function(v){
        //                         v.value /= count[v.key];
        //                     });
        //                 });
        //             }
        //             // un-normalize the data
        //             else {
        //                 datum.forEach(function(o){
        //                     o.values.forEach(function(v){
        //                         v.value *= count[v.key];
        //                     });
        //                 });
        //             }
        //
        //             // redraw the chart
        //             d3.select(chartDiv + ' svg')
        //                 .datum(datum)
        //                 .call(chart);
        //
        //             $(chartDiv + " svg .nv-bar").each(function (i, elem) {
        //                 $(elem).hover(function () {
        //                     utils.hoveringCB.call({
        //                         authors: authors, groups: grpNames,
        //                         chart: d3.select("#results"), selector: '.nv-bar'
        //                     }, d3.select(elem).data()[0], 0, i)
        //                 }, function () {
        //                     utils.endCB.call({authors: authors});
        //                 });
        //             });
        //
        //             d3.select(chartDiv).selectAll(".nv-bar")
        //                 .on('click', utils.clickCB);
        //         });
        //     });
        // $('a#cogEval').on('click', function(e) {e.preventDefault(); return true;});

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

                nv.utils.windowResize(chart.update);

                return chart;
            }, function () {
                $(chartDiv + " svg .nv-bar").each(function (i, elem) {

                    $(elem).hover(function () {
                        utils.hoveringCB.call({
                            authors: authors, groups: grpNames,
                            chart: d3.select("#results"), selector: '.nv-bar'
                        }, d3.select(elem).data()[0], 0, i)
                    }, function () {
                        utils.endCB.call({authors: authors});
                    });
                });

                d3.select(chartDiv).selectAll(".nv-bar")
                    .on('click', utils.clickCB);

                // disable legend actions
                chart.legend.updateState(false);
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
     * @param {number} maxValue The count of that the largest circle will possess
     * @param {Array} grpNames The values for the x-axis
     * @param {Array} subDomains The values for the y-axis
     * @param {Array} authors The authors corresponding to the data
     */
    self.graphEvaluatorsNVD3Chart = function (datum, chartDiv, maxValue, grpNames, subDomains, authors) {

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

                nv.utils.windowResize(chart.update);

                return chart;
            }, function () {
                $(chartDiv + " svg .nv-bar").each(function (i, elem) {

                    $(elem).hover(function () {

                        utils.hoveringCB.call({
                            authors: authors, groups: grpNames,
                            chart: d3.select("#results"), selector: '.nv-bar'
                        }, d3.select(elem).data()[0], 0, i)
                    }, function () {
                        utils.endCB.call({authors: d3.select(elem).data()[0].authors});
                    });
                });

                d3.select(chartDiv).selectAll(".nv-bar")
                    .on('click', utils.clickCB);

                // disable legend actions
                chart.legend.updateState(false);
            }
        );
    };

    return self;
};