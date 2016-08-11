'use strict';
var App = App || {};

var ChartUtils = function (options) {

    var self = this;

    // flag to indicate if the bubble was selected or not
    self.clicked = false;

    // list of the selected nodes and the corresponding data
    self.selectedElements = [];
    self.selectedData = [];
    App.currentSelection = [];

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

    self.clickCB = function (obj) {

        // bubble chart data
        if(_.isArray(obj)) obj = obj[0];

        // if the circle is hidden, no tooltip should be shown
        if (obj.value === 0) return;

        // reset the selections
        App.currentSelection = [];

        /** restore default styling **/
        self.chart.selectAll(self.selector + ', ' + _.difference(options.selectors,[self.selector])[0])
            .classed({"unSelected": false, 'linked': false, 'selected': false});

        /* if unselect, remove the item from the selections */
        if(self.selectedData.indexOf(obj) > -1){
            // if ctrl unclick, remove the element and data from the arrays
            if(App.ctrl) {
                // remove the clicked items
                self.selectedData = _.difference(self.selectedData, [obj]);
                self.selectedElements = _.difference(self.selectedElements, [this]);
            }
            else
            {
                // reset the selection
                self.selectedData = [];
                self.selectedElements = [];
            }
        }
        else{
            // save the selected object
            if(App.ctrl) {
                self.selectedData.push(obj);
                self.selectedElements.push(this);
            }
            // new single selection
            else {
                self.selectedData = [obj];
                self.selectedElements = [this];
            }
        }

        /** determine which papers make up the current selection */
        /** select the rows associated with the selected bubble **/
        var newRows = [], authors = [];

        /* get the list of authors of the selected papers */
        self.selectedData.forEach(function(data){
            data.authors = _.map(data.authors, function(a) { return {label: a.label, year: a.year} } );
            authors = (authors.length === 0) ? data.authors :_.union(authors, data.authors);
        });
        authors = _.uniqWith(authors, _.isEqual);

        /* using the authors, find the papers corresponding to the selection */
        _.forEach(authors, function (a) {
            // add the rows corresponding to the authors/year of the clicked item
            newRows.push(_.find(App.queryResults, function (r) {
                return r.author.trim() == a.label.trim() && parseInt(r.year) == a.year;
            }));
        });

        /** color the elements **/
        if(self.selectedData.length > 0) {
            // highlight the selected elements
            self.selectedElements.forEach(function(element){
                d3.select(element)
                    .classed({"selected": true, "linked": false, 'unSelected': false});
            });

            /** grey out the circles/bars that are not selected
             * by adding the unselected class to all other items */
            self.chart.selectAll(self.selector + ', ' + _.difference(options.selectors, [self.selector])[0])
                .filter(
                    function (d) {
                        if(_.isArray(d)) d = d[0];
                        if (self.selectedData.indexOf(d) < 0) return d;
                    })
                .classed({"unSelected": true});

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

                            self.selectedData.forEach(function(s) {
                                //  if the bubble chart was selected
                                if(s.pairing) {
                                    // check to see if the paper has both of the attribute pairings
                                    if( _.intersection(r[s.property], s.pairing).length > 1)
                                        { include = true; }
                                }
                                else
                                {
                                    if( r[s.property].indexOf(s.label) > -1 && r.subDomain == s.key)
                                    { include = true; }
                                }
                            });
                        });

                        // if not the current selection, not the current chart, and shares the same
                        // property as the selected item, highlight it
                        if (self.selectedData.indexOf(d) < 0  && include) return d;
                    })
                .classed({"linked": true, "unSelected": false});

            // set the current selection to be the selected papers
            App.currentSelection = newRows;
        }

        /** modify the table to only show the entries related to the selected bubble **/
        // clear the old rows
        App.table.clear();
        //add the selection to the table
        App.table.rows.add( (App.currentSelection.length > 0) ? App.currentSelection : App.queryResults);
        //render the table
        App.table.draw();
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

        text.each(function(){

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
