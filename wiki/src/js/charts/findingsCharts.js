'use strict';
var Graph = function() {

    var self = this;

    // the hover callback to be used when the user
    // hovers over one of the circles
    var hoveringCB = function(obj, col, row){

        // show the tooptip if the circle is visible
        if(obj.value === 0)
            return;

        // set the authors and chart to be used
        self.authors = (_.isObject(this.authors[row]))
            ? this.authors[row][obj.label] : this.authors[obj.key][obj.label];

        self.chart = this.chart;
        self.selector = this.selector;

        if(this.tooltip)
        {
            this.tooltip.show(obj, self.authors);
        }

        // remove the highlighting class if the selection is empty
        if(self.authors.length == 0){
            $("#papers tbody tr")
                .removeClass( 'row_selected' );
            return;
        }

        var table_ids = App.table
            .columns( 0,  {page:'current'} )
            .data()
            .eq( 0 );

        // console.log(table_ids);

        // see if there is something to select
        var current  = _.filter(table_ids, function(o) { return o });

        // nothing to select
        if(current.length === 0){
            $("#papers tbody tr")
                .removeClass( 'row_selected' );
            return;
        }

        //find the indices of the rows that contain the evt_id's of the
        //current rows that are highlighted
        var indexes = App.table.rows().eq( 0 ).filter( function (rowIdx) {

            var author = App.table.cell( rowIdx, 0 ).data();
            var year = App.table.cell( rowIdx, 1 ).data();

            return _.find(self.authors, function(r) {return r.name === author && parseInt(r.year) == year }) ;
        } );

        // Add a class to those rows using an index selector
        App.table.rows( indexes )
            .nodes()
            .to$()
            .addClass( 'row_selected' );
    };

    // the hover callback to be used when the user
    // finishes their hover
    var endCB = function() {

        // hide the tooltip
        if(this.tooltip)
        {
            this.tooltip.hide();
        }

        // deselect the table rows
        $("#papers tbody tr")
            .removeClass( 'row_selected' );
    };

    var clickCB = function(obj) {
        // if the circle is hidden, no tooltip should be shown
        if(obj.value === 0) return;

        // select the rows associated with the selected bubble
        var newRows = [];
        _.forEach(self.authors, function(a) {

            newRows.push(_.find(App.queryResults, function(r) {
                return r.author.trim() == a.label.trim() && parseInt(r.year) == a.year;
            }));
        });

        if(_.indexOf(self.selected, obj) < 0)
        {
            // remove the previous selection
            d3.select(this)
                .classed("unSelected", false);

            self.selected.push(obj);

            // grey out the circles that are not selected
            self.chart.selectAll(self.selector)
                .filter(
                    function(d) {
                        if(_.indexOf(self.selected, d) < 0)
                            return d;
                    })
                .classed("unSelected", true);

            self.clicked = true;

            App.currentSelection = _.union(App.currentSelection, newRows);
        }
        else
        {
            // remove the bubble from the array
            var idx = self.selected.indexOf(obj);
            self.selected.splice(idx, 1);

            // remove the previous selection
            d3.select(this)
                .classed("unSelected", true);

            App.currentSelection = _.difference(App.currentSelection, newRows);
        }

        /** modify the table to only show the entries related to the selected bubble **/
        if(self.selected.length === 0)
        {
            // there is no click interaction
            self.clicked = false;

            // make all of the circle their original color
            self.chart.selectAll(self.selector)
                .classed("unSelected", false);

            // clear the old rows
            App.table.clear();
            //add the selection to the table
            App.table.rows.add(App.queryResults);
            //render the table
            App.table.draw();
        }
        else
        {
            // clear the old rows
            App.table.clear();
            //add the selection to the table
            App.table.rows.add(App.currentSelection);
            //render the table
            App.table.draw();
        }
    };

    function wrap(text, width) {

        text.each(function() {
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
                    .attr("x", -15).attr("y", y).attr("dy", dy + "em")
                    .attr("text-anchor", "middle");

            var flag = false;

            while (word = words.pop()) {

                line.push(word);
                tspan.text(line.join(" "));

                if (tspan.node().getComputedTextLength() > width) {

                    line.pop();
                    tspan.text(line.join(" "));

                    if(line.length > 0 && !flag){
                        lineNumber++;
                        flag = true;
                    }

                    line = [word];
                    tspan = text.append("tspan")
                        .attr("x", -15).attr("y", y).attr("dy", lineNumber * lineHeight + dy + "em")
                        .attr('text-anchor', "middle")
                        .text(word);

                    if(words.length > 0 && !flag){
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
     */
    self.graphEncodingBubbleChart = function(data, chartDiv, maxValue, grpNames, authors) {
        /** Set up the chart properties **/
        var totWidth = d3.select('.chartDiv8').node().clientWidth * 0.95,
            totHeight = totWidth * 0.9,
            margin = {top: 100, right: 20, bottom: 25, left: 100},
            width = totWidth - (margin.left + margin.right),
            height = totHeight - (margin.top + margin.bottom);

        // flag to indicate if the bubble was selected or not
        self.clicked = false;

        // list of the selected nodes
        self.selected = [];

        /* Initialize tooltip */
        var bubbleTip = d3.tip().attr('class', 'd3-tip').html(
            function(obj, authors ) {

                var html = "";

                html += "Number of Papers: <span style='color:red'>" + obj.value + "</span> </br>";
                html += "Authors: <span style='color:red'>" + _.map(authors, _.property('label')).join(', ') + "</span>";

                return html;

            }.bind(self) );

        var x = d3.scale.ordinal()
            .rangeRoundBands([0, width]);

        var y = d3.scale.ordinal()
            .rangeRoundBands([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var chart = d3.select(chartDiv)
            .append("svg")
            .attr("width", totWidth)
            .attr("height", totHeight)
            .append("g")
                .attr("width", totWidth)
                .attr("height", totHeight)
                .attr("transform", "translate(" + margin.left + ",0)");

        x.domain(grpNames);
        y.domain(data.map(function (d) {
            return d.Spatial;
        }));

        chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (height) + ")")
            .call(xAxis)
            .selectAll("text")
                .style({"text-anchor": "end", "font-weight": "bold"})
                .attr("transform", "rotate(-45)")
                .attr("dx", "0.0em")
                .attr("dy", x.rangeBand()/10 + 20)
        ;

        chart
            .append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .selectAll(".tick text")
            .call(wrap, y.rangeBand())
            .style({"text-anchor":"end", "font-weight": "bold", "text-align": "center"})
        ;

        var grows = chart.selectAll(".grow")
                .data(data)
                .enter().append("g")
                .attr("class", "grow")
                .attr("transform", function (d) {
                    return "translate(25," + y(d.Spatial) + ")";
                })
            ;

        grows.call(bubbleTip);

        var gcells = grows.selectAll(".gcell")
                .data(function (d) {
                    return d.groups;
                })
                .enter().append("g")
                .attr("transform", function (d, i, j) {
                    return "translate(" + (i * x.rangeBand()) + ",0)";
                })
                .attr("class", "gcell")
            ;

        var rmax = Math.min(y.rangeBand() / 2 - 4, x.rangeBand() / 1.5);

        gcells.append("circle")
            .attr("cy", y.rangeBand() / 2)
            .attr("cx", x.rangeBand() / 2)
            .attr("r",
                function (d) {
                    var rind = d.value;
                    return rmax / ((-1) * (rind - (maxValue + 1) ));
                })
            .on('mouseover', hoveringCB.bind({tooltip: bubbleTip, authors:  authors, chart: chart, selector: 'circle'}))
            .on('mouseout', endCB.bind({tooltip: bubbleTip, authors: authors}))
            .on('click', clickCB)
            .style("fill",
                function (d) {
                    var gbval = 1 + Math.floor(255 - (255 / 4 * (d.value)));
                    return "rgb(" + 255 + "," + gbval + "," + gbval + ")";
                })
            .style("")
        ;

        d3.selectAll('.container').style("visibility", "visible");
    };


    self.graphEncodingBubbleNVD3Chart = function(data, chartDiv, maxValue, grpNames, authors)
    {
        console.log(grpNames);

        var nonSpatialMap = {}, spatialMap = {}, i = 0;

        grpNames.forEach(function(grp){
            nonSpatialMap[grp] = i++;
        });

        i = 0;
        var datum = _.reduce(data, function(result, value, key) {

            spatialMap[value.Spatial] = i++;
            value.groups.forEach(function(obj)
            {
                result.values.push({size: obj.value * 10, y: spatialMap[value.Spatial], x: nonSpatialMap[obj.label]});
            });

            return result;

            },

                { key: "Group 1", values: []}
        );


        var totWidth = d3.select('.chartDiv12').node().clientWidth,
            totHeight = totWidth * 0.85;

        console.log(datum);

        var chart;

        nv.addGraph(function() {

            d3.select(chartDiv).append("svg")
                .attr("width", totWidth)
                .attr("height", totHeight);

            chart = nv.models.scatterChart()
                .showDistX(true)    //showDist, when true, will display those little distribution lines on the axis.
                .showDistY(true)
                .showLegend(false)
                .margin({bottom: 60, left: 100})
                .pointRange([0, 5000]);

                //.transitionDuration(350)
                //.color(d3.scale.category10().range());

            //Axis settings
            //chart.xAxis.tickFormat(d3.format('.02f'));
            //chart.yAxis.tickFormat(d3.format('.02f'));

            d3.select('#encodings svg')
                .datum([datum])
                .call(chart);

            nv.utils.windowResize(chart.update);

            return chart;
        });

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
    self.graphTaskBarNVD3Chart = function(data, chartDiv, maxValue, grpNames, subDomains, authors) {

        var totWidth = d3.select('.chartDiv4').node().clientWidth,
            totHeight = totWidth * 0.85;

        var chart;

        var datum = _.reduce(data, function(result, value, key) {

            result[0].values.push({label: value.Task, value: value["Natural Science"], color: "#beaed4"});
            result[1].values.push({label: value.Task, value: value["Physical Science"], color: "#fdc086"});
            result[2].values.push({label: value.Task, value: value["Simulation"], color: "#7fc97f"} );

            return result;

            },
            [
                { key: "Natural Science",   values: [], color: "#beaed4"},
                { key: "Physical Science",  values: [], color: "#fdc086" },
                { key: "Simulation",        values: [], color: "#7fc97f" }
            ]);

        nv.addGraph(function() {

            d3.select(chartDiv).append("svg")
                .attr("width", totWidth)
                .attr("height", totHeight);

            chart = nv.models.multiBarChart()
                .x(function(d) { return d.label })
                .y(function(d) { return d.value })
                .margin({bottom: 60})
                .showLegend(true)
                .reduceXTicks(false)
                .rotateLabels(-45)
                .groupSpacing(0.2)
                .showControls(false)
                ;

            d3.select('#tasks svg')
                .datum(datum)
                .call(chart)
            ;

            nv.utils.windowResize(chart.update);


            return chart;

        }, function(){

            $("#tasks svg .nv-bar").each(function(i, elem) {

                $(elem).hover(function() {

                    hoveringCB.call({authors: authors, groups: grpNames,
                        chart: d3.select("#results"), selector: '.nv-bar'}, d3.select(elem).data()[0], 0, i)

                }, function() {

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
    self.graphTypeBarNVD3Chart = function(data, chartDiv, maxValue, grpNames, subDomains, authors) {

        var totWidth = d3.select('.chartDiv4').node().clientWidth,
            totHeight = totWidth * 0.85;

        var chart;

        var datum = _.reduce(data, function(result, value, key) {

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
                { key: "Natural Science",   values: [], color: "#beaed4" },
                { key: "Physical Science",  values: [], color: "#fdc086" },
                { key: "Simulation",        values: [], color: "#7fc97f" }
            ]);

        nv.addGraph(function() {

            d3.select(chartDiv)
                .append("svg").attr("width", totWidth)
                .attr("height", totHeight);

            chart = nv.models.multiBarChart()
                    .x(function(d) { return d.label })
                    .y(function(d) { return d.value })
                    .margin({bottom: 60})
                    .showLegend(true)
                    .reduceXTicks(false)
                    .rotateLabels(-45)
                    .groupSpacing(0.2)
                    .showControls(false);

            d3.select('#dataTypes svg')
                .datum(datum)
                .call(chart)
            ;

            nv.utils.windowResize(chart.update);

            return chart;

        }, function(){

                $("#dataTypes svg .nv-bar").each(function(i, elem) {

                    $(elem).hover(function() {

                        hoveringCB.call({authors: authors, groups: grpNames,
                            chart: d3.select("#results"), selector: '.nv-bar'}, d3.select(elem).data()[0], 0, i)

                    }, function() {

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