'use strict';
var Graph = function (options) {

    var self = this;

    // flag to indicate if the bubble was selected or not
    self.clicked = false;
    // list of the selected nodes
    self.selected = [];

    // the two types of elements that can be selected
    self.selectors = ['.nv-bar', '.nv-point'];

    // Color map for the charts
    var colorMap = options.colorMap;

    // the hover callback to be used when the user
    // hovers over one of the circles
    var hoveringCB = function (obj, col, row) {

        // show the tooptip if the circle is visible
        if (obj.value === 0){
            self.authors = [];
            return;
        }

        // set the authors and chart to be used
        self.authors = (this.authors)
            ? this.authors[obj.key][obj.label] : obj.authors;

        self.chart = this.chart;
        self.selector = this.selector;

        if (this.tooltip) {
            this.tooltip.show(obj, self.authors);
        }

        // remove the highlighting class if the selection is empty
        if (self.authors && self.authors.length == 0) {
            $("#papers tbody tr")
                .removeClass('row_selected');
            return;
        }

        var table_ids = App.table
            .columns(0, {page: 'current'})
            .data()
            .eq(0);

        // console.log(table_ids);

        // see if there is something to select
        var current = _.filter(table_ids, function (o) {
            return o
        });

        // nothing to select
        if (current.length === 0) {
            $("#papers tbody tr")
                .removeClass('row_selected');
            return;
        }

        //find the indices of the rows that contain the evt_id's of the
        //current rows that are highlighted
        var indexes = App.table.rows().eq(0).filter(function (rowIdx) {

            var author = App.table.cell(rowIdx, 0).data();
            var year = App.table.cell(rowIdx, 1).data();

            return _.find(self.authors, function (r) {
                return r.name === author && parseInt(r.year) == year
            });
        });

        // Add a class to those rows using an index selector
        App.table.rows(indexes)
            .nodes()
            .to$()
            .addClass('row_selected');
    };

    // the hover callback to be used when the user
    // finishes their hover
    var endCB = function () {

        // hide the tooltip
        if (this.tooltip) {
            this.tooltip.hide();
        }

        // deselect the table rows
        $("#papers tbody tr")
            .removeClass('row_selected');
    };

    var clickCB = function (obj, i) {

        // if the circle is hidden, no tooltip should be shown
        if (obj.value === 0) return;

        // select the rows associated with the selected bubble
        var newRows = [];
        _.forEach(self.authors, function (a) {

            newRows.push(_.find(App.queryResults, function (r) {
                return r.author.trim() == a.label.trim() && parseInt(r.year) == a.year;
            }));
        });

        if (_.indexOf(self.selected, obj) < 0) {
            // remove the previous selection
            d3.select(this)
                .classed("unSelected", false);

            self.selected.push(obj);

            // grey out the circles/bars that are not selected
            self.chart.selectAll(self.selector)
                .filter(
                    function (d) {
                        if (_.indexOf(self.selected, d) < 0)
                            return d;
                    })
                .classed("unSelected", true);

            /* grey out all other points from other charts that aren't selected */
            self.chart.selectAll(_.difference(self.selectors, [self.selector])[0])
                .filter(
                    function (d) {
                        if (_.indexOf(self.selected, d) < 0)
                            return d;
                    })
                .classed("unSelected", true);

            self.clicked = true;

            App.currentSelection = _.union(App.currentSelection, newRows);
        }
        else {
            // remove the bubble from the array
            var idx = self.selected.indexOf(obj);
            self.selected.splice(idx, 1);

            // remove the previous selection
            d3.select(this)
                .classed("unSelected", true);

            App.currentSelection = _.difference(App.currentSelection, newRows);
        }

        /** modify the table to only show the entries related to the selected bubble **/
        if (self.selected.length === 0) {
            // there is no click interaction
            self.clicked = false;

            // make all of the circle their original color
            self.chart.selectAll(self.selector)
                .classed("unSelected", false);

            self.chart.selectAll(_.difference(self.selectors,[self.selector])[0])
                .classed("unSelected", false);

            // clear the old rows
            App.table.clear();
            //add the selection to the table
            App.table.rows.add(App.queryResults);
            //render the table
            App.table.draw();
        }
        else {
            // clear the old rows
            App.table.clear();
            //add the selection to the table
            App.table.rows.add(App.currentSelection);
            //render the table
            App.table.draw();
        }
    };

    function wrap(text, width) {

        if(!width)
            width = 20;

        text.each(function () {
            var text = d3.select(this),
                words = text.text().split(/\//).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null)
                    .append("tspan")
                    .attr("x", -15)
                    .attr("y", y)
                    .attr("dy", function (dy) {
                        if (_.isNumber(dy))
                            return dy + "em"
                    })
                    .attr("text-anchor", "middle");

            var flag = false;

            while (word = words.pop()) {

                line.push(word);
                tspan.text(line.join(" "));

                if (tspan.node().getComputedTextLength() > width) {

                    line.pop();
                    tspan.text(line.join(" "));

                    if (line.length > 0 && !flag) {
                        lineNumber++;
                        flag = true;
                    }

                    line = [word];
                    tspan = text.append("tspan")
                        .attr("x", -15).attr("y", y).attr("dy", lineNumber * lineHeight + dy + "em")
                        .attr('text-anchor', "middle")
                        .text(word);

                    if (words.length > 0 && !flag) {
                        lineNumber++;
                        flag = true;
                    }
                }
            }
        });
    }

    function truncate(text, width) {

        text.each(function(d){

            var text = d3.select(this);
            var label = text.text();
            if(label.length < 1) return;

            var textSize = text.style('font-size').split('px')[0];
            var numLetters = width / textSize;

            if(text.node().getComputedTextLength() > (width-25)){
                text.text(label.substring(0, parseInt(numLetters))+'...');

                d3.select(text.node().parentNode).append("svg:title")
                    .text(label);
            }
        });
    }

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

        $("#cogEnc a")
            .popover({
                container: "body",
                title: 'Chart Settings',
                placement: 'auto',
                html: true,
                delay: {"show": 100 },
                content: "<div id='attributeSelector' class='container'>" +
                            "<div class = row>" +
                                "<div class='col-md-4'>" +
                                    "<div class='row'>" +
                                        "<div class='col-md-12 col-md-offset-3'>" +
                                            "<h5>X Axis</h5>" +
                                        "</div>" +
                                        "<div class='col-md-12'>" +
                                            "<select>" +
                                                "<option>Tasks</option>" +
                                                "<option>Datasets</option>" +
                                                "<option>Paradigms</option>" +
                                                "<option>Evaluation</option>" +
                                                "<option>Evaluator</option>" +
                                                "</select>"+
                                        "</div>" +
                                    "</div>" +
                                "</div>" +
                                "<div class='col-md-4 col-md-offset-3'>" +
                                    "<div class='row'>" +
                                        "<div class='col-md-12 col-md-offset-3'>" +
                                            "<h5>Y Axis</h5>" +
                                        "</div>" +
                                        "<div class='col-md-12'>" +
                                            "<select>" +
                                                "<option>Tasks</option>" +
                                                "<option>Datasets</option>" +
                                                "<option>Paradigms</option>" +
                                                "<option>Evaluation</option>" +
                                                "<option>Evaluator</option>" +
                                            "</select>"+
                                        "</div>" +
                                    "</div>" +
                                "</div>" +
                            "</div>" +
                            "<div class='row'><br></div>" +
                            "<div class='row'>" +
                                "<div class='col-md-4 col-md-offset-3'>" +
                                    "<button type='button' class='btn btn-primary'>Render Chart</button>" +
                                "</div>" +
                            "</div>" +
                        "</div>"
            })
            .on('shown.bs.popover', function(){
                //ko.applyBindings(new Papers(), document.getElementById('attributeSelector'));
            });

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
                    authors: authors[value.yProp][obj.label]
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
                chart.tooltip.headerFormatter(function(d,i){
                    return "";
                });

                /* Set the value formatter to output the number of papers*/
                chart.tooltip.valueFormatter(function(d,i){
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
                    .call(wrap)
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

                        hoveringCB.call(
                            {
                                groups: grpNames,
                                chart: d3.select("#results"), selector: '.nv-point'
                            }, d3.select(elem).data()[0][0], 0, i)
                    },
                        function () {
                            endCB.call({authors: authors});
                    })
                        .click(function(){
                            clickCB.call(elem, d3.select(elem).data()[0]);
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
     * @param {Array} count number of papers in each sub-domain
     */
    self.graphTaskBarNVD3Chart = function (datum, chartDiv, maxValue, grpNames, subDomains, authors, count) {

        $("#cogTask a")
            .popover({
                container: "body",
                title: 'Chart Settings',
                placement: 'left',
                html: true,
                content: "<input id='normalizeTask' type='checkbox' name='normalize' value='task'> Normalize Data"
            })
            .on('shown.bs.popover', function(){

                $("#normalizeTask").change(function() {

                    // normalize the data
                    if(this.checked) {

                        datum.forEach(function(o){

                            o.values.forEach(function(v){
                                v.value /= count[v.key];
                            });
                        });
                    }
                    // un-normalize the data
                    else {
                        datum.forEach(function(o){

                            o.values.forEach(function(v){
                                v.value *= count[v.key];
                            });
                        });
                    }

                    // redraw the chart
                    d3.select(chartDiv + ' svg')
                        .datum(datum)
                        .call(chart);

                    $(chartDiv + " svg .nv-bar").each(function (i, elem) {

                        $(elem).hover(function () {

                            hoveringCB.call({
                                authors: authors, groups: grpNames,
                                chart: d3.select("#results"), selector: '.nv-bar'
                            }, d3.select(elem).data()[0], 0, i)

                        }, function () {

                            endCB.call({authors: authors});

                        });
                    });

                    d3.select(chartDiv).selectAll(".nv-bar")
                        .on('click', clickCB);

                    chart.legend.updateState(false);
                });

            });

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
                chart.tooltip.headerFormatter(function(d,i){
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

                        hoveringCB.call({
                            authors: authors, groups: grpNames,
                            chart: d3.select("#results"), selector: '.nv-bar'
                        }, d3.select(elem).data()[0], 0, i)

                    }, function () {

                        endCB.call({authors: authors});

                    });
                });

                d3.select(chartDiv).selectAll(".nv-bar")
                    .on('click', clickCB);

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
     * @param {Array} count number of papers in each sub-domain
     */
    self.graphTypeBarNVD3Chart = function (datum, chartDiv, maxValue, grpNames, subDomains, authors, count) {

        $("#cogType a")
            .popover({
                container: "body",
                title: 'Chart Settings',
                placement: 'left',
                html: true,
                content: "<input id='normalizeType' type='checkbox' name='normalize' value='task'>Normalize Data"
            })
            .on('shown.bs.popover', function(){
                console.log(this);
                $("#normalizeType").change(function() {
                    // normalize the data
                    if(this.checked) {
                        datum.forEach(function(o){
                            o.values.forEach(function(v){
                                v.value /= count[v.key];
                            });
                        });
                    }
                    // un-normalize the data
                    else {
                        datum.forEach(function(o){
                            o.values.forEach(function(v){
                                v.value *= count[v.key];
                            });
                        });
                    }

                    // redraw the chart
                    d3.select(chartDiv + ' svg')
                        .datum(datum)
                        .call(chart);

                    $(chartDiv + " svg .nv-bar").each(function (i, elem) {
                        $(elem).hover(function () {
                            hoveringCB.call({
                                groups: grpNames,
                                chart: d3.select("#results"), selector: '.nv-bar'
                            }, d3.select(elem).data()[0], 0, i)

                        }, function () {
                            endCB.call({authors: authors});
                        });
                    });

                    d3.select(chartDiv).selectAll(".nv-bar")
                        .on('click', clickCB);
                });
            })
        ;

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
                chart.tooltip.headerFormatter(function(d,i){
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
                    hoveringCB.call({
                        authors: authors, groups: grpNames,
                        chart: d3.select("#results"), selector: '.nv-bar'
                    }, d3.select(elem).data()[0], 0, i)
                }, function () {
                    endCB.call({authors: authors});
                });
            });

            d3.select(chartDiv).selectAll(".nv-bar")
                .on('click', clickCB);

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
     * @param {Array} count number of papers in each sub-domain
     */
    self.graphParadigmsNVD3Chart = function (datum, chartDiv, maxValue, grpNames, subDomains, authors, count) {

        $("#cogPara a")
            .popover({
                container: "body",
                title: 'Chart Settings',
                placement: 'left',
                html: true,
                content: "<input id='normalizePara' type='checkbox' name='normalize' value='task'> Normalize Data"
            })
            .on('shown.bs.popover', function(){

                $("#normalizePara").change(function() {
                    // normalize the data
                    if(this.checked) {
                        datum.forEach(function(o){
                            o.values.forEach(function(v){
                                v.value /= count[v.key];
                            });
                        });
                    }
                    // un-normalize the data
                    else {
                        datum.forEach(function(o){
                            o.values.forEach(function(v){
                                v.value *= count[v.key];
                            });
                        });
                    }

                    // redraw the chart
                    d3.select(chartDiv + ' svg')
                        .datum(datum)
                        .call(chart);

                    $(chartDiv + " svg .nv-bar").each(function (i, elem) {
                        $(elem).hover(function () {
                            hoveringCB.call({
                                authors: authors, groups: grpNames,
                                chart: d3.select("#results"), selector: '.nv-bar'
                            }, d3.select(elem).data()[0], 0, i)
                        }, function () {
                            endCB.call({authors: authors});
                        });
                    });

                    d3.select(chartDiv).selectAll(".nv-bar")
                        .on('click', clickCB);

                    // wrap the text of the x-axis
                    d3.selectAll(chartDiv + ' svg .nv-x text')
                        .attr('transform', function(d,i,j) { return 'translate (-10, 10) rotate(-45 0,0)' })
                        .call(wrap, chart.xRange())
                        .style({"text-anchor": "end"});

                });
            });


        $('a#cogPara').on('click', function(e) {e.preventDefault(); return true;});

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
                chart.tooltip.headerFormatter(function(d,i){
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
                    .attr('transform', function(d,i,j) { return 'translate (-10, 10) rotate(-45 0,0)' })
                    .call(wrap, chart.xRange())
                    .style({"text-anchor": "end"});

                $(chartDiv + " svg .nv-bar").each(function (i, elem) {

                    $(elem).hover(function () {
                        hoveringCB.call({
                            authors: authors, groups: grpNames,
                            chart: d3.select("#results"), selector: '.nv-bar'
                        }, d3.select(elem).data()[0], 0, i)
                    }, function () {
                        endCB.call({authors: authors});
                    });
                });

                d3.select(chartDiv).selectAll(".nv-bar")
                    .on('click', clickCB);

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
     * @param {Array} count number of papers in each sub-domain
     */
    self.graphEvaluationNVD3Chart = function (datum, chartDiv, maxValue, grpNames, subDomains, authors, count) {

        $("#cogEval a")
            .popover({
                container: "body",
                title: 'Chart Settings',
                placement: 'left',
                html: true,
                content: "<input id='normalizeEval' type='checkbox' name='normalize' value='task'> Normalize Data"
            })
            .on('shown.bs.popover', function(){

                $("#normalizeEval").change(function() {
                    // normalize the data
                    if(this.checked) {
                        datum.forEach(function(o){
                            o.values.forEach(function(v){
                                v.value /= count[v.key];
                            });
                        });
                    }
                    // un-normalize the data
                    else {
                        datum.forEach(function(o){
                            o.values.forEach(function(v){
                                v.value *= count[v.key];
                            });
                        });
                    }

                    // redraw the chart
                    d3.select(chartDiv + ' svg')
                        .datum(datum)
                        .call(chart);

                    $(chartDiv + " svg .nv-bar").each(function (i, elem) {
                        $(elem).hover(function () {
                            hoveringCB.call({
                                authors: authors, groups: grpNames,
                                chart: d3.select("#results"), selector: '.nv-bar'
                            }, d3.select(elem).data()[0], 0, i)
                        }, function () {
                            endCB.call({authors: authors});
                        });
                    });

                    d3.select(chartDiv).selectAll(".nv-bar")
                        .on('click', clickCB);
                });
            });
        $('a#cogEval').on('click', function(e) {e.preventDefault(); return true;});

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
                chart.tooltip.headerFormatter(function(d,i){
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
                        hoveringCB.call({
                            authors: authors, groups: grpNames,
                            chart: d3.select("#results"), selector: '.nv-bar'
                        }, d3.select(elem).data()[0], 0, i)
                    }, function () {
                        endCB.call({authors: authors});
                    });
                });

                d3.select(chartDiv).selectAll(".nv-bar")
                    .on('click', clickCB);

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
     * @param {Array} count number of papers in each sub-domain
     */
    self.graphEvaluatorsNVD3Chart = function (datum, chartDiv, maxValue, grpNames, subDomains, authors, count) {

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
                chart.tooltip.headerFormatter(function(d,i){
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

                        hoveringCB.call({
                            authors: authors, groups: grpNames,
                            chart: d3.select("#results"), selector: '.nv-bar'
                        }, d3.select(elem).data()[0], 0, i)
                    }, function () {
                        endCB.call({authors: d3.select(elem).data()[0].authors});
                    });
                });

                d3.select(chartDiv).selectAll(".nv-bar")
                    .on('click', clickCB);

                // disable legend actions
                chart.legend.updateState(false);
            }
        );
    };

    return self;
};