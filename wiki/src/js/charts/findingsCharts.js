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

        var table_ids = table
            .columns( 0,  {page:'current'} )
            .data()
            .eq( 0 );

        console.log(authors);

        // see if there is something to select
        var current  = _.filter(table_ids, function(o) { return o });

        // // nothing to select
        // if(current.length === 0){
        //     $("#papers tbody tr")
        //         .removeClass( 'row_selected' );
        //     return;
        // }
        //
        // //find the indices of the rows that contain the evt_id's of the
        // //current rows that are highlighted
        // var indexes = table.rows().eq( 0 ).filter( function (rowIdx) {
        //     return current.indexOf(table.cell( rowIdx, 0 ).data()) > -1;
        // } );
        //
        // // Add a class to those rows using an index selector
        // table.rows( indexes )
        //     .nodes()
        //     .to$()
        //     .addClass( 'row_selected' );
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

        var authors = self.authors[row][obj.name].name;

        self.clicked = true;

        // remove the previous selection
        self.chart.selectAll('circle')
            .classed("unSelected", false);

        // grey out the circles that are not selected
        self.chart.selectAll('circle')
            .filter(
                function(d) {
                    if(d !== obj)
                        return d;
                })
            .classed("unSelected", true);

        /** modify the table to only show the entries related to the selected bubble **/

        // select the rows associated with the selected bubble
        var currentSelection  = _.filter(rows, function(o) {return _.indexOf(authors, o.Author) >= 0; });

        // clear the old rows
        table.clear();
        //add the selection to the table
        table.rows.add(currentSelection);
        //render the table
        table.draw();

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

    self.parseEncodingsData = function(rows){

        // get only the rows that have a number corresponding to their entry
        //var rows = _.reject(tabletop.sheets("Encodings").all(), function(o) { return !o.No; });
        rows = _.map(rows, function(d){
            var out =_.reduce(d, function(result, value, key) {

                result[key] = +value || value;
                return result;
            }, { });
            return out;
        });
        console.log(rows);
        // spatial columns
        var spatial = [
            'Chloropleth / Heatmap', 'Ball and Stick / Mesh','Isosurface / Streamlines','Volume / Images','Glyph','Animation'
        ];

        // non-spatial keys
        var nonEncodings = _.keys(_.omit(rows[0], _.flatten(['Author','Sub-Domain', 'Year', spatial])));

        // template for the encodings chart
        var nonSpatial = _.reduce(nonEncodings,
            function(result, value, key){
                result[value] = 0;
                return result;
            }, {});

        var authors = {
            'Chloropleth / Heatmap': {},
            'Ball and Stick / Mesh': {},
            'Isosurface / Streamlines': {},
            'Volume / Images': {},
            'Glyph': {},
            'Animation': {}
        };

        var max = 0;
        var encodings = _.reduce(rows, function(result, value, key) {

            // get the rows that are one
            var enc = _.pickBy(value, _.isNumber);

            var spat = _.pick(enc, spatial);
            var non = _.omit(enc, spatial);

            _.keys(spat).forEach(function(s){

                _.keys(non).forEach(function(n){

                    // increment the result
                    result[s][n] += 1;

                    // store the corresponding authors in another array
                    authors[s][n] = authors[s][n] || [];
                    authors[s][n].push({name: value['Author'], year: value['Year']});
                });
            });

            return result;

        }, {
            'Chloropleth / Heatmap': _.cloneDeep(nonSpatial),//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
            'Ball and Stick / Mesh': _.cloneDeep(nonSpatial),//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
            'Isosurface / Streamlines': _.cloneDeep(nonSpatial),//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
            'Volume / Images': _.cloneDeep(nonSpatial),//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
            'Glyph': _.cloneDeep(nonSpatial),//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
            'Animation': _.cloneDeep(nonSpatial)//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) }
        });

        // Finally, map to the format needed for the chart
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

        return {encodings: encodings, authors: authors, max: max, groups: nonEncodings};
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

        var totWidth = d3.select('.col-md-4').node().clientWidth * 0.9,
            totHeight = totWidth * 0.85,
            margin = {top: 100, right: 20, bottom: 25, left: 100},
            width = totWidth - (margin.left + margin.right),
            height = totHeight - (margin.top + margin.bottom);

        // attach the list of authors to the chart closure
        self.authors = authors;

        // flag to indicate if the bubble was selected or not
        self.clicked = false;

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

