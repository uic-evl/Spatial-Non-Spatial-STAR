'use strict';
var App = App || {};

var ChartUtils = function (options) {

    var self = this;

    // flag to indicate if the bubble was selected or not
    self.clicked = false;
    // list of the selected nodes
    self.selected = null;

    // the hover callback to be used when the user
    // hovers over one of the circles
    self.hoveringCB = function (obj) {

        // show the tooltip if the circle is visible
        if (obj.value === 0){
            self.authors = [];
            return;
        }

        // set the authors and chart to be used
        self.authors = (this.authors)
            ? this.authors[obj.key][obj.label] : obj.authors;

        self.chart = this.chart;
        self.selector = this.selector;

        // remove the highlighting class if the selection is empty
        if (self.authors && self.authors.length == 0) {
            $("#papers").find("tbody tr")
                .removeClass('row_selected');
            return;
        }

        // get the table ids of the papers corresponding to the
        // item that is being hovered on
        var table_ids = App.table
            .columns(0, {page: 'current'})
            .data()
            .eq(0);

        // see if there is something to select
        var current = _.filter(table_ids, function (o) {
            return o
        });

        // nothing to select
        if (current.length === 0) {
            $("#papers").find("tbody tr")
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
    self.endCB = function () {

        // deselect the table rows
        $("#papers").find("tbody tr")
            .removeClass('row_selected');
    };

    self.clickCB = function (obj, i) {

        // bubble chart data
        if(_.isArray(obj)) obj = obj[0];

        // if the circle is hidden, no tooltip should be shown
        if (obj.value === 0) return;

        /** select the rows associated with the selected bubble **/
        var newRows = [];
        _.forEach(self.authors, function (a) {
            // add the rows corresponding to the authors/year of the clicked item
            newRows.push(_.find(App.queryResults, function (r) {
                return r.author.trim() == a.label.trim() && parseInt(r.year) == a.year;
            }));
        });

        /** unselect everything **/
        self.chart.selectAll(self.selector + ', ' + _.difference(options.selectors,[self.selector])[0])
            .classed({"unSelected": false, 'linked': false, 'selected': false});

        /** if the item has not been selected yet **/
        if (self.selected !== obj) {

            // remove the previous selection
            d3.select(this)
                .classed({"selected": true});

            // save the selected object
            self.selected = obj;

            /** grey out the circles/bars that are not selected
             * by adding the unselected class to all other items */
            self.chart.selectAll(self.selector + ', ' + _.difference(options.selectors, [self.selector])[0])
                .filter(
                    function (d) {
                        if(_.isArray(d)) d = d[0];
                        if (self.selected != d)
                            return d;
                    })
                .classed("unSelected", true);

            /** Iterate through the selected charts and mark the items that
             *  share the selected attribute */
            self.chart.selectAll(self.selector + ', ' + _.difference(options.selectors, [self.selector])[0])
                .filter(
                    function (d) {

                        // for the bubble chart
                        if(_.isArray(d)) d = d[0];

                        // no visual item / chart place holder
                        if(d.value === 0 || d.size === 0) return;

                        /** iterate over the rows of the selection and find the corresponding
                         * bars / circles in the other graphs to select */
                        var include = false;
                        var rows = [];

                        /** find the data rows corresponding to the selected row **/
                        d.authors.forEach(function(a){
                            var row = _.find(App.queryResults, {author: a.label, year: a.year});
                            if (row) rows.push(row);
                        });

                        /** check to see if any item in the bar has the selected property **/
                        rows.forEach(function(r){

                            //  if the bubble chart was selected
                            if(self.selected.pairing) {
                                // check to see if the paper has both of the attribute pairings
                                if( _.intersection(r[self.selected.property], self.selected.pairing).length > 1)
                                {
                                    include = true;
                                }

                            }
                            else
                            {
                                if( r[self.selected.property].indexOf(self.selected.label) > -1
                                        && r.subDomain == self.selected.key)
                                {
                                    include = true;
                                }
                            }
                        });

                        // if not the current selection, not the current chart, and shares the same
                        // property as the selected item, highlight it
                        if (self.selected != d  && include)
                            return d;
                    })
                .classed({"linked": true, "unSelected": false});

            self.clicked = true;

            App.currentSelection = newRows;
        }
        // clicked on the same item again
        else {
            // reset the selection
            self.selected = null;
        }

        /** modify the table to only show the entries related to the selected bubble **/
        if (self.selected == null) {
            // there is no click interaction
            self.clicked = false;

            // make all of the circle their original color
            self.chart.selectAll(self.selector + ', ' + _.difference(options.selectors,[self.selector])[0])
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

    self.wrap = function (text, width) {

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
    };

    self.truncate = function (text, width) {

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
    };

    return self;
};
