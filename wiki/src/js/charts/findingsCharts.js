'use strict';
var Graph = function() {

    var self = this;

    // the hover callback to be used when the user
    // hovers over one of the circles
    var hoveringCB = function(obj, col, row){

        // show the tooptip if the circle is visible
        if(obj.value === 0)
            return;

        self.tip.show(obj, col, row);

        var authors = self.authors[row][obj.name];

        // remove the highlighting class if the selection is empty
        if(authors.length == 0){
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

            return _.find(authors, function(r) {return r.name === author && parseInt(r.year) == year }) ;
        } );

        // Add a class to those rows using an index selector
        App.table.rows( indexes )
            .nodes()
            .to$()
            .addClass( 'row_selected' );
    };

    // the hover callback to be used when the user
    // finishes their hover
    var endCB = function()
    {
        // hide the tooltip
        self.tip.hide();

        // deselect the table rows
        $("#papers tbody tr")
            .removeClass( 'row_selected' );
    };

    var clickCB = function(obj, col, row)
    {
        // if the circle is hidden, no tooltip should be shown
        if(obj.value === 0) return;

        var authors = self.authors[row][obj.name];

        // select the rows associated with the selected bubble
        var newRows = [];
        _.forEach(authors, function(a)
        {
            newRows.push(_.find(App.rows, function(r) {return r.Author.trim() == a.name.trim() && parseInt(r.Year) == a.year }));
        });

        if(_.indexOf(self.selected, obj) < 0)
        {
            // remove the previous selection
            d3.select(this)
                .classed("unSelected", false);

            self.selected.push(obj);

            // grey out the circles that are not selected
            self.chart.selectAll('circle')
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

        if(self.selected.length === 0)
        {
            // there is no click interaction
            self.clicked = false;

            // make all of the circle their original color
            self.chart.selectAll('circle')
                .classed("unSelected", false);

            // reset the table
            App.currentSelection = App.rows;
        }

        /** modify the table to only show the entries related to the selected bubble **/

        // clear the old rows
        App.table.clear();
        //add the selection to the table
        App.table.rows.add(App.currentSelection);
        //render the table
        App.table.draw();
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

    self.parseEncodings = function(rows){

        // Spatial columns
        var spatial = [
            'Chloropleth / Heatmap', 'Ball and Stick / Mesh','Isosurface / Streamlines','Volume / Images','Glyph','Animation'
        ];

        // Non-Spatial columns
        var nonSpatial = _.keys(_.omit(App.encodings[0], _.flatten(['Author','Sub-Domain', 'Year', spatial])));

        // Set up the data structure for reduce to clone
        var nonSpatialTemplate = _.reduce(nonSpatial,
            function(result, value, key){
                result[value] = 0;
                return result;
            }, {});

        /* Author / Paper Affiliation */
        var authors = {
            'Chloropleth / Heatmap': {},
            'Ball and Stick / Mesh': {},
            'Isosurface / Streamlines': {},
            'Volume / Images': {},
            'Glyph': {},
            'Animation': {}
        };

        /** iterate over the resutls to combine the encodings **/
        var encodings = _.reduce(rows, function(result, value, key) {

            /** Separate the spatial and non-spatial encodings **/
            var spat = _.intersection(value.encodings, spatial);
            var non  = _.intersection(value.encodings, nonSpatial);

             spat.forEach(function(s){
                non.forEach(function(n){

                    // increment the result
                    result[s][n] += 1;

                    // store the corresponding authors in another array
                    authors[s][n] = authors[s][n] || [];
                    authors[s][n].push({name: value['author'], year: value['year']});
                });
            });

            return result;
        }, {
            'Chloropleth / Heatmap': _.cloneDeep(nonSpatialTemplate),//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
            'Ball and Stick / Mesh': _.cloneDeep(nonSpatialTemplate),//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
            'Isosurface / Streamlines': _.cloneDeep(nonSpatialTemplate),//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
            'Volume / Images': _.cloneDeep(nonSpatialTemplate),//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
            'Glyph': _.cloneDeep(nonSpatialTemplate),//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
            'Animation': _.cloneDeep(nonSpatialTemplate)//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) }
        });

        // Finally, map to the format needed for the chart
        var max = 0;
        encodings = _.map(encodings, function(d, k, o)
        {
            // console.log(d);
            var localMax = _.max(_.values(d));
            max = Math.max(max, localMax);

            var obj = {};
            obj.groups = [];
            obj.Spatial = k;

            var pairs = _.toPairs(d);
            pairs.forEach(function(arr){
                obj.groups.push({name: arr[0], value: parseInt(arr[1])});
            });

            return obj;
        });

        return {encodings: encodings, authors: authors, max: max, groups: nonSpatial};
    };

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

    self.graphChart = function(data, chartDiv, maxValue, grpNames, authors) {

        /** Set up the chart properties **/
        var totWidth = d3.select('.chartDiv').node().clientWidth * 0.9,
            totHeight = totWidth * 0.85,
            margin = {top: 100, right: 20, bottom: 25, left: 100},
            width = totWidth - (margin.left + margin.right),
            height = totHeight - (margin.top + margin.bottom);

        // attach the list of authors to the chart closure
        self.authors = authors;

        // flag to indicate if the bubble was selected or not
        self.clicked = false;

        // list of the selected nodes
        self.selected = [];

        /* Initialize tooltip */
        self.tip = d3.tip().attr('class', 'd3-tip').html(
            function(obj, col, row) {

                var authors = self.authors[row][obj.name];
                var html = "";

                authors.forEach(function(a)
                {
                    html += "<span style='color:red'>" + String(a.name) + "</span>"+ "</br>";
                });

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

        self.chart = d3.select(chartDiv)
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

        self.chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (height) + ")")
            .call(xAxis)
            .selectAll("text")
                .style({"text-anchor": "end", "font-weight": "bold"})
                .attr("transform", "rotate(-45)")
                .attr("dx", "0.0em")
                .attr("dy", x.rangeBand()/10 + 20)
        ;

        self.chart
            .append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .selectAll(".tick text")
            .call(wrap, y.rangeBand())
            .style({"text-anchor":"end", "font-weight": "bold", "text-align": "center"})
        ;

        var grows = self.chart.selectAll(".grow")
                .data(data)
                .enter().append("g")
                .attr("class", "grow")
                .attr("transform", function (d) {
                    return "translate(25," + y(d.Spatial) + ")";
                })
            ;

        grows.call(self.tip);

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
            .on('mouseover', hoveringCB)
            .on('mouseout', endCB)
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

    return self;

};

