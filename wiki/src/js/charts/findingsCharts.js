'use strict';
var Graph = function () {

    var self = this;

    // flag to indicate if the bubble was selected or not
    self.clicked = false;
    // list of the selected nodes
    self.selected = [];

    self.selectors = ['.nv-bar', '.nv-point'];

    var colorMap =
    {
        "Natural Science": "#beaed4",
        "Physical Science": "#fdc086",
        "Simulation": "#7fc97f"
    };

    // the hover callback to be used when the user
    // hovers over one of the circles
    var hoveringCB = function (obj, col, row) {

        // show the tooptip if the circle is visible
        if (obj.value === 0)
            return;

        // set the authors and chart to be used
        self.authors = (this.authors)
            ? this.authors[obj.key][obj.label] : obj.authors;

        self.chart = this.chart;
        self.selector = this.selector;

        if (this.tooltip) {
            this.tooltip.show(obj, self.authors);
        }

        // remove the highlighting class if the selection is empty
        if (self.authors.length == 0) {
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

            // grey out the circles that are not selected
            self.chart.selectAll(self.selector)
                .filter(
                    function (d) {
                        if (_.indexOf(self.selected, d) < 0)
                            return d;
                    })
                .classed("unSelected", true);

            /* grey out all other points from other charts that aren't selected */
            self.chart.selectAll(_.difference(self.selectors,[self.selector])[0])
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
                        if (dy)
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
        /* define the maps that will be used for the labels of the scatter plot bubble */
        var nonSpatialMap = {}, spatialMap = {}, i = 0;

        // create the non-spatial map
        grpNames.forEach(function (grp) {
            nonSpatialMap[grp] = i++;
        });

        // reset the iterator and create the spatial map
        i = 0;
        var datum = _.reduce(data, function (result, value, key) {

            spatialMap[value.Spatial] = i++;
            value.groups.forEach(function (obj) {
                result.values.push({
                    size: obj.value * 100,
                    y: spatialMap[value.Spatial],
                    x: nonSpatialMap[obj.label],
                    domains: subDomains[value.Spatial][obj.label],
                    authors: authors[value.Spatial][obj.label]
                });
            });
            return result;

        }, {
            key: "Group 1", values: []
        });

        /* the width and height of the chart */
        var totWidth = d3.select('.chartDivBubbles').node().clientWidth,
            totHeight = totWidth * 0.9,
            chart = null;

        var nonSpat = _.toPairs(nonSpatialMap);
        var spat = _.toPairs(spatialMap);

        nv.addGraph(function () {

                d3.select(chartDiv).append("svg")
                    .attr("width", totWidth)
                    .attr("height", totHeight);

                chart = nv.models.scatterChart()
                    // .reduceXTicks(false)
                    .showLegend(false)
                    .margin({bottom: 100, left: 150, right: 20})
                    .pointRange([0, (parseInt(totWidth * 0.06) * 50)])
                    .useVoronoi(false)
                ;

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
                    return nonSpat[d][0];
                });

                // y-axis
                chart.yAxis.tickFormat(function (d) {
                    if (_.isInteger(d)) return spat[d][0];
                });

                // add the data to the chart
                d3.select('#encodings svg')
                    .datum([datum])
                    .call(chart);

                return chart;
        },
            function () {

                // wrap the text of the y-axis
                d3.selectAll('#encodings svg .nv-y text')
                    .call(wrap, chart.yRange())
                    .attr('transform', 'translate(' + -75 + ',' + '0)')
                    .style({"text-anchor": "end", "font-weight": "bold"});

                // move the text of the x-axis down and rotate it
                d3.select('#encodings svg .nv-x .nv-axis')
                    .attr('transform', 'translate(' + -10 + ',' + chart.margin().bottom / 3.0 + ')')
                    .selectAll('text')
                    .style({"text-anchor": "end", "font-weight": "bolder"})
                    .attr("transform", "rotate(-45)");

                $("#encodings svg .nv-point").each(function (i, elem) {

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

                // d3.select(chartDiv).selectAll(".nv-groups .nv-point")
                //     .on('click', clickCB);

            }
        );
    };

    /**
     * Creates and plots the Task Bar Chart
     *
     * @constructor
     * @this {Graph}
     * @param {Object} data The data to be mapped
     * @param {String} chartDiv ID if the div the chart is created in
     * @param {number} maxValue The count of that the largest circle will possess
     * @param {Array} grpNames The values for the x-axis
     * @param {Array} subDomains The values for the y-axis
     * @param {Array} authors The authors corresponding to the data
     */
    self.graphTaskBarNVD3Chart = function (data, chartDiv, maxValue, grpNames, subDomains, authors) {

        var totWidth = d3.select('.taskDiv').node().clientWidth,
            totHeight = d3.select('.chartDivBubbles').node().clientWidth * 0.4;

        var chart;

        var datum = _.reduce(data, function (result, value, key) {

                result[0].values.push({label: value.Task, value: value["Natural Science"], color: "#beaed4"});
                result[1].values.push({label: value.Task, value: value["Physical Science"], color: "#fdc086"});
                result[2].values.push({label: value.Task, value: value["Simulation"], color: "#7fc97f"});

                return result;

            },
            [
                {key: "Natural Science", values: [], color: "#beaed4"},
                {key: "Physical Science", values: [], color: "#fdc086"},
                {key: "Simulation", values: [], color: "#7fc97f"}
            ]);

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
                    .showLegend(totHeight > 300)
                    .reduceXTicks(false)
                    .rotateLabels(-45)
                    .groupSpacing(0.2)
                    .showControls(false);

                /* Set the header formatter */
                chart.tooltip.headerFormatter(function(d,i){
                    return "Task: " + d;
                });

                d3.select('#tasks svg')
                    .datum(datum)
                    .call(chart)
                ;

                nv.utils.windowResize(chart.update);

                return chart;
            }, function () {

                $("#tasks svg .nv-bar").each(function (i, elem) {

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
            }
        );
    };

    /**
     * Creates and plots the Data Type Bar Chart
     *
     * @constructor
     * @this {Graph}
     * @param {Object} data The data to be mapped
     * @param {String} chartDiv ID if the div the chart is created in
     * @param {number} maxValue The count of that the largest circle will possess
     * @param {Array} grpNames The values for the x-axis
     * @param {Array} subDomains The values for the y-axis
     * @param {Array} authors The authors corresponding to the data
     */
    self.graphTypeBarNVD3Chart = function (data, chartDiv, maxValue, grpNames, subDomains, authors) {

        var totWidth = d3.select('.typeDiv').node().clientWidth,
            totHeight = d3.select('.chartDivBubbles').node().clientWidth * 0.4;

        var chart;

        var datum = _.reduce(data, function (result, value, key) {

                result[0].values.push({
                    label: value.DataType,
                    value: value["Natural Science"],
                    authors: authors["Natural Science"][value.DataType],
                    color: "#beaed4"
                });

                result[1].values.push({
                    label: value.DataType,
                    value: value["Physical Science"],
                    authors: authors["Physical Science"][value.DataType],
                    color: "#fdc086"
                });

                result[2].values.push({
                    label: value.DataType,
                    value: value["Simulation"],
                    authors: authors["Simulation"][value.DataType],
                    color: "#7fc97f"
                });

                return result;
            },
            [
                {key: "Natural Science", values: [], color: "#beaed4"},
                {key: "Physical Science", values: [], color: "#fdc086"},
                {key: "Simulation", values: [], color: "#7fc97f"}
            ]);

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
                    .showLegend(totHeight > 300)
                    .reduceXTicks(false)
                    .rotateLabels(-45)
                    .groupSpacing(0.2)
                    .showControls(false)
                    .margin({left: 30, bottom: 60});

                /* Set the header formatter */
                chart.tooltip.headerFormatter(function(d,i){
                    return "Data Type: " + d;
                });

                d3.select('#dataTypes svg')
                    .datum(datum)
                    .call(chart)
                ;

                nv.utils.windowResize(chart.update);

                return chart;

            }, function () {
                $("#dataTypes svg .nv-bar").each(function (i, elem) {

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
            }
        );
    };

    self.graphEvaluationNVD3Chart = function (data, chartDiv, maxValue, grpNames, subDomains, authors) {

        var totWidth = d3.select('.evalDiv').node().clientWidth,
            totHeight = d3.select('.chartDivBubbles').node().clientWidth * 0.4;

        var chart;

        var datum = _.reduce(data, function (result, value, key) {

                result[0].values.push({
                    label: value.Evaluation,
                    value: value["Natural Science"],
                    authors: authors["Natural Science"][value.Evaluation],
                    color: "#beaed4"
                });

                result[1].values.push({
                    label: value.Evaluation,
                    value: value["Physical Science"],
                    authors: authors["Physical Science"][value.Evaluation],
                    color: "#fdc086"
                });

                result[2].values.push({
                    label: value.Evaluation,
                    value: value["Simulation"],
                    authors: authors["Simulation"][value.Evaluation],
                    color: "#7fc97f"
                });

                return result;
            },
            [
                {key: "Natural Science", values: [], color: "#beaed4"},
                {key: "Physical Science", values: [], color: "#fdc086"},
                {key: "Simulation", values: [], color: "#7fc97f"}
            ]);

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
                    .showLegend(totHeight > 300)
                    .reduceXTicks(false)
                    .rotateLabels(-45)
                    .groupSpacing(0.2)
                    .showControls(false)
                    .margin({left: 30, bottom: 60});

                /* Set the header formatter */
                chart.tooltip.headerFormatter(function(d,i){
                    return "Evaluation: " + d;
                });

                chart.xAxis.tickFormat(function (d) {
                    if(d == "Quantitative Analysis")
                        return "Quantitative";
                    else
                        return d;
                });

                d3.select('#evaluation svg')
                    .datum(datum)
                    .call(chart)
                ;

                nv.utils.windowResize(chart.update);

                return chart;

            }, function () {
                $("#evaluation svg .nv-bar").each(function (i, elem) {

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
            }
        );
    };

    return self;
};