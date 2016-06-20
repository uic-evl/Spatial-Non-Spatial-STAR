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
        $this = $(this),
            $next = $this.next();

        $next.slideToggle();
        $this.parent().toggleClass('open');

        if (!e.data.multiple) {
            $el.find('.submenu').not($next).slideUp().parent().removeClass('open');
        };
    };

    var accordion = new Accordion($('#accordion'), false);
});

(function() {

    var final_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1oIxumn3O9Bu7y-yyHY-gJsf_9c-pk5PbEMsw5apmTf8/pubhtml';
    var engineering_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1b5_Yy_cGvcL6Uec3rYaEgT4NSi29OgP8tU1mV43DcFE/pubhtml';

    App.table = null;
    App.rows = null;
    App.curreltSelection = null;

    App.db = null;

    function setupDB(data, tabletop) {

        /** Add the rows to the database  **/
        App.curreltSelection = App.rows = tabletop.sheets("Papers").all();

        /** Parse the data before inserting it into the database **/
        _.map(App.rows, function (o, i, a) {

            // delete the bibtex entry attribute
            delete o["Bibtex Entry"];

            // split the fields that are lists
            o["Data Types"] = o["Data Types"].split(" / ");
            _.map(o["Data Types"], _.trimEnd);

            o["Encodings"] = o["Encodings"].split(", ");
            _.map(o["Encodings"], _.trimEnd);

            o["Tasks"] = o["Tasks"].split(", ");
            _.map(o["Tasks"], _.trimEnd);
        });

        /** create the new database for the session **/
        App.db = DB.initializeDB('BioMed', App.rows);
    }

    function setupCharts(data, tabletop){

        // get the data from the table sheet
        var encodings = tabletop.sheets("Encodings").all();

        // extract natural science
        var natural = _.filter(encodings, function(o) {
            return o['Sub-Domain'] === "Natural Science" || o['Sub-Domain'] === "Both";
        });

        // extract physical science
        var physical = _.filter(encodings, function(o) {
            return o['Sub-Domain'] === "Physical Science" || o['Sub-Domain'] === "Both";
        });

        App.engGraph = new Graph();
        App.natGraph = new Graph();
        App.phyGraph = new Graph();

        // get the parsed encodings
        var engineeringData = App.engGraph.parseEncodingsData(encodings);
        var naturalData = App.natGraph.parseEncodingsData(natural);
        var physicalData = App.phyGraph.parseEncodingsData(physical);

        // plot the bubble scatter plots
        App.engGraph.graphChart(engineeringData.encodings, "#engineering", engineeringData.max, engineeringData.groups, _.values(engineeringData.authors));
        App.natGraph.graphChart(naturalData.encodings, "#natural", naturalData.max, naturalData.groups, _.values(naturalData.authors));
        App.phyGraph.graphChart(physicalData.encodings, "#physical", physicalData.max, physicalData.groups, _.values(physicalData.authors));
    }

    function setupTable(data) {

        //Reference : https://datatables.net/reference/index
        $(document).ready(function () {

            /** display the results **/
            d3.select('#results')
                .style("display", "block");

            App.table = $('#papers').DataTable({
                data: data,
                scrollY:  '50vh',
                scrollX:  false,
                sScrollY: null,
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
                    {title: "Sub-Domain", data: "domain", className: "dt-center",  "targets": [ 0 ]},
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

            /** formatter for the sub-rows **/
            function format ( d ) {

                /** construct the sub row details **/
                var details =
                    '<div class="details-container">'+
                        '<table cellpadding="5" cellspacing="0" border="0" class="details-table">'+

                            '<tr>'+
                                '<td class="title">Paper:</td>'+
                                '<td><a href="' + d.url +'">' + d.title + '</a></td>'+
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

                        '</table>'+
                    '</div>';

                return details;
            }

            // Array to track the ids of the details displayed rows
            var detailRows = [];

            $('#papers tbody').on( 'click', 'tr td.details-control', function () {
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

            /** remove the spinner **/
            d3.select('#loading')
                .style("display", "none");

            /** move the searchbar to the top **/
            d3.select("#search")
                .classed("vcenter", false);

        });
    }

    App.initDB = function() {

        Tabletop.init({
            key: engineering_spreadsheet_url,
            callback: setupDB,
            wanted: ["Papers", "Tasks"],
            debug: true
        });

        // Tabletop.init({
        //     key: engineering_spreadsheet_url,
        //     callback: setupCharts,
        //     wanted: ["Tasks", "Encodings"],
        //     debug: true
        // });
    };

    App.getResults = function(e) {

        /** put up the lading spinner **/
        d3.select('#loading')
            .style("display", "block");

        var input = [], operator = [], values = [],
            advanced = {
                domain: [],
                dataTypes: [],
                paradigms: [],
                encodings: [],
                evaluators: []
            };

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
        $('#accordion input:checked').each(function() {
            advanced[ $(this).attr('name')].push( $(this).attr('value'));
        });

        /** query the for the papers that meet the criteria **/
        DB.queryPapers({and: [input, operator], or:advanced}, setupTable);

        // we don't want the page to reload
        return false;
    };

})();



