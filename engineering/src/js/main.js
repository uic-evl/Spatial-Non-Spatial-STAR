var App = App || {};

/** Initialize the advanced menu accordian **/
$(function() {
    var Accordion = function(el, multiple) {
        this.el = el || {};
        this.multiple = multiple || false;

        // Variables privadas
        var links = this.el.find('.link');
        // Evento
        links.on('click', {el: this.el, multiple: this.multiple}, this.dropdown)
    };

    Accordion.prototype.dropdown = function(e) {
        var $el = e.data.el;
        var $this = $(this);
        var $next = $this.next();

        $next.slideToggle();
        $this.parent().toggleClass('open');

        if (!e.data.multiple) {
            $el.find('.submenu').not($next).slideUp().parent().removeClass('open');
        }
    };

    App.accordion = new Accordion($('#accordion'), false);
});

(function() {

    var engineering_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1b5_Yy_cGvcL6Uec3rYaEgT4NSi29OgP8tU1mV43DcFE/pubhtml';

    App.table = null;
    App.rows = null;
    App.curreltSelection = null;

    App.db = null;

    function setupDB(data, tabletop) {

        /** Add the rows to the database  **/
        App.rows = tabletop.sheets("Papers").all();
        App.encodings = tabletop.sheets("Encodings").all();
        App.tasks = tabletop.sheets("Tasks").all();

        /** Parse the data before inserting it into the database **/
        _.map(App.rows, function (o) {

            // delete the bibtex entry attribute
            delete o["Bibtex Entry"];

            // split the fields that are lists
            o["Data Types"] = o["Data Types"].split(" / ");
            _.map(o["Data Types"], _.trimEnd);

            o["Encodings"] = o["Encodings"].split(", ");
            _.map(o["Encodings"], _.trimEnd);

            o["Tasks"] = o["Tasks"].split(", ");
            _.map(o["Tasks"], _.trimEnd);

            o["Evaluation Type"] = o["Evaluation Type"].split(", ");
            _.map(o["Evaluation Type"], _.trimEnd);

            o["Paradigm"] = o["Paradigm"].split(" / ");
            _.map(o["Paradigm"], _.trimEnd);

            o["SubDomain"] = o["SubDomain"].split(", ");
            _.map(o["SubDomain"], _.trim);

        });

        /** create the new database for the session **/
        App.db = DB.initializeDB('Engineering', App.rows);
    }

    App.initDB = function() {

        /** Access the Google Doc and select grab the  data **/
        Tabletop.init({
            key: engineering_spreadsheet_url,
            callback: setupDB,
            wanted: ["Papers", "Tasks", "Encodings"],
            debug: true
        });
    };

    function setupCharts(data){

        /** initialize a new bubble graph **/
        App.engGraph = new Graph({
                colorMap: {
                    "Natural Science": "#beaed4",
                    "Physical Science": "#fdc086",
                    "Simulation": "#7fc97f"
                }
            });

        App.dataParser = new Parser({
                colorMap:
                    [{
                        "Natural Science": "#beaed4",
                        "Physical Science": "#fdc086",
                        "Simulation": "#7fc97f"
                    },
                    {
                        "Domain Experts" : "#fbb4ae",
                        "Visualization Experts" : "#b3cde3"
                    }
                ]
        });

        /* get the sub-domains from the model */
        var subDomains = _.map(_.find(App.model.fields(), {property: 'subDomain'} ).elements, 'text' );

        // get the parsed encodings and paradigms
        var encodingData = App.dataParser.parseEncodings(data);
        //var hybridData = App.dataParser.parseHybridParadigms(data);

        // get the task, data set, and evaluations fields
        var taskData = App.dataParser.parseFields(data, subDomains);

        var testParsing = App.dataParser.parseArbFields(data, "dataTypes", "tasks");

        //App.engGraph.graphEncodingBubbleNVD3Chart(testParsing.pairings, "#encodings",
        //    testParsing.max, testParsing.xDomain, testParsing.authors, testParsing.subDomains);

        // plot the bubble scatter plots
        App.engGraph.graphEncodingBubbleNVD3Chart(encodingData.encodings, "#encodings",
            encodingData.max, encodingData.groups, encodingData.authors, encodingData.subDomains);

        //if($('.col-md-6').width() > 600)
        //{
            //d3.select('.chartDivBubbles').classed({'col-md-6': false, 'col-md-5': true});
            //d3.select('.barCharts').classed({'col-md-6': false, 'col-md-8': true});
        //}

        // plot the task analysis
        App.engGraph.graphTaskBarNVD3Chart(taskData.tasks, "#tasks", 0, taskData.groups,
            subDomains, taskData.authors[0], taskData.count);

        // plot the data type analysis
        App.engGraph.graphTypeBarNVD3Chart(taskData.dataTypes, "#dataTypes", 0,
            ["Table", "Field", "Network", "Geometry"], subDomains, taskData.authors[1], taskData.count);

        // plot the data type analysis
        App.engGraph.graphParadigmsNVD3Chart(taskData.paradigms, "#paradigms", 0,
            ["Table", "Field", "Network", "Geometry"], subDomains, taskData.authors[3], taskData.count);

        // plot the data type analysis
        App.engGraph.graphEvaluationNVD3Chart(taskData.evaluation, "#evaluation", 0,
            ["Table", "Field", "Network", "Geometry"], subDomains, taskData.authors[2], taskData.count);

        // plot the data type analysis
        App.engGraph.graphEvaluatorsNVD3Chart(taskData.evaluators, "#evaluators", 0,
            ["Table", "Field", "Network", "Geometry"], subDomains, taskData.authors[4], taskData.count);

    }

    function setupTable(data) {

        // TODO Check if there was a previous query and clear the old results

        App.curreltSelection = [];
        App.queryResults = data;

        // jQuery selector to avoid redundant calls
        var tableSelector = $('#papers');

        //Reference : https://datatables.net/reference/index
        $(document).ready(function () {

            /** display the results **/
            d3.select('#results')
                .style("display", "block");

            // if the table was already created, refresh it with new data
            if(App.table)
            {
                /* clear the old click events */
                tableSelector.find('tbody').off("click", 'tr td.details-control');

                /* clear the table and charts */
                App.table.clear().draw();
                // remove the chart svgs
                d3.select("#dataTypes svg").remove();
                d3.select("#tasks svg").remove();
                d3.select("#encodings svg").remove();
                d3.select("#evaluation svg").remove();
                d3.select("#evaluators svg").remove();
                d3.select("#paradigms svg").remove();

                /* Add new data */
                App.table.rows.add(data);
                /* Draw the DataTable */
                App.table.columns.adjust().draw();
            }
            /* else, create the table */
            else
            {
                App.table = tableSelector.DataTable({
                    data: data,
                    scrollY:  '50vh',
                    scrollX:  false,
                    sScrollY: null,
                    "bFilter": false,
                    columns: [
                        {
                            "class":          "details-control",
                            "orderable":      false,
                            "data":           null,
                            "defaultContent": ""
                        },
                        {title: "Author", data: "author", className: "dt-center",  "targets": [ 0 ] },
                        {title: "Year", data: "year", className: "dt-center",  "targets": [ 0 ]},
                        {title: "Paper Title", data: "title", className: "dt-center",  "targets": [ 0 ]},
                        // {title: "Url", data: "url"},
                        // {title: "Domain", data: "domain", className: "dt-center",  "targets": [ 0 ]},
                        {title: "Sub-Domain", data: "subDomain", className: "dt-center",  "targets": [ 0 ]},
                        // {title: "No. of Users", data: "# of Users"},
                        // {title: "Users", data: "Users"},
                        {title: "Level of Expertise", data: "expertise", className: "dt-center",  "targets": [ 0 ]},
                        // {title: "Data Types", data: "dataTypes"},
                        {title: "Paradigm", data: "paradigms", className: "dt-center",  "targets": [ 0 ]},
                        // {title: "Number of Overlays", data: "Number of Overlays"},
                        {title: "Evaluation type", data: "evaluation", className: "dt-center",  "targets": [ 0 ]},
                        {title: "Evaluators", data: "evaluators", className: "dt-center",  "targets": [ 0 ]}
                    ],
                    order: [[1, 'asc'], [0, 'asc']]
                    // stateSave: true
                });
            }

            /** formatter for the sub-rows **/
            function format ( d ) {

                /** construct the sub row details **/
                var details =
                    '<div class="details-container">'+
                        '<table cellpadding="5" cellspacing="0" border="0" class="details-table">'+

                            '<tr>'+
                                '<td class="title">Paper:</td>'+
                                '<td><a href="' + d.url +'" target="_blank">' + d.title + '</a></td>'+
                            '</tr>'+

                            '<tr>'+
                                '<td class="title">Encodings :</td>'+
                                '<td>' + d.encodings.join(', ') +'</td>'+
                            '</tr>'+

                            '<tr>'+
                                '<td class="title">Data Types :</td>'+
                                '<td>' + d.dataTypes.join(', ') +'</td>'+
                            '</tr>'+

                            '<tr>'+
                                '<td class="title">Tasks :</td>'+
                                '<td>' + d.tasks.join(', ') +'</td>'+
                            '</tr>'+
                            '<tr>'+
                                '<td class="title">Paradigms :</td>'+
                                '<td>' + d.paradigms.join(', ') +'</td>'+
                            '</tr>'+
                        '</table>'+
                    '</div>';

                return details;
            }

            // Array to track the ids of the details displayed rows
            var detailRows = [];

            /** Setup the sub-row click events **/
            tableSelector.find('tbody').on( 'click', 'tr td.details-control', function () {

                var tr = $(this).closest('tr');
                var row = App.table.row( tr );
                var idx = $.inArray( tr.attr('id'), detailRows );

                if ( row.child.isShown() ) {
                    tr.removeClass( 'details' );
                    row.child.hide();

                    // Remove from the 'open' array
                    detailRows.splice( idx, 1 );
                }
                else {
                    tr.addClass( 'details' );
                    row.child( format( row.data() ) ).show();

                    // Add to the 'open' array
                    if ( idx === -1 ) {
                        detailRows.push( tr.attr('id') );
                    }
                }
            } );

            // On each draw, loop over the `detailRows` array and show any child rows
            App.table.on( 'draw', function () {
                $.each( detailRows, function ( i, id ) {
                    $('#'+id+' td.details-control').trigger( 'click' );
                } );
            } );

            /** setup the charts **/
            if(App.queryResults.length > 0){
                setupCharts(data);

                d3.selectAll('.resultCharts')
                    .style("display", "block");
            }
            // no results to show
            else{
                d3.selectAll('.resultCharts')
                    .style("display", "none");
            }

            /** remove the spinner **/
            d3.select('#loading')
                .style("display", "none");

            /** move the searchbar to the top **/
            d3.select("#search")
                .classed("vcenter", false);

        });
    }

    App.getResults = function(e) {

        /** put up the loading spinner **/
        d3.select('#loading')
            .style("display", "block");

        var input = [], operator = [], values = [],
            advanced = {
                domain: [],
                subDomain: [],
                dataTypes: [],
                paradigms: [],
                encodings: [],
                evaluators: []
            };

        /** Check to see if a previous search was performed. If so,
         *  clear the old charts and table */

        /** Get the search values **/

        // search variable
        $('[name="my_fields[]"]').each(function(){
            input.push($(this).val().split()[0]);
        });

        // operator
        $('[name="operator[]"]').each(function(){
            operator.push($(this).val().split()[0]);
        });

        // value
        $('[name="my_value[]"]').each(function(){
            values.push($(this).val().split()[0]);
        });

        /** Get the advanced values **/
        $('#accordion').find('input:checked').each(function() {
            advanced[ $(this).attr('name')].push( $(this).attr('value'));
        });

        /* minimize the accordion if open */
        if(d3.select('#accordion li').classed('open')) {
            App.accordion.dropdown({data: {el: App.accordion.el, multiple: App.accordion.multiple}});
        }

        /** query the for the papers that meet the criteria **/
        DB.queryPapers({and: [input, operator, values], or: advanced}, setupTable);

        // we don't want the page to reload
        return false;
    };

    /** clears the advanced search menu checkboxes **/
    App.resetFields = function() {

        $('#accordion').find('input:checked').each(function() {
            $(this).attr('checked', false);
        });
    }

})();