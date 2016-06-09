var App = App || {};

var final_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1oIxumn3O9Bu7y-yyHY-gJsf_9c-pk5PbEMsw5apmTf8/pubhtml';
var engineering_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1b5_Yy_cGvcL6Uec3rYaEgT4NSi29OgP8tU1mV43DcFE/pubhtml';

App.table = null;
App.rows = null;
App.curreltSelection = null;

$(document).ready(function() {
    $menuLeft = $('.pushmenu-left');
    $nav_list = $('#nav_list');

    $nav_list.click(function() {
        $(this).toggleClass('active');
        $('.pushmenu-push').toggleClass('pushmenu-push-toright');
        $menuLeft.toggleClass('pushmenu-open');
    });
});

d3.selection.prototype.first = function() {
    return d3.select(this[0][0]);
};
d3.selection.prototype.last = function() {
    var last = this.size() - 1;
    return d3.select(this[0][last]);
};

function init() {
    Tabletop.init({
        key: final_spreadsheet_url,
        callback: setupTable,
        wanted: ["Engineering", "Tasks"],
        debug: true
    });

    Tabletop.init({
        key: engineering_spreadsheet_url,
        callback: setupCharts,
        wanted: ["Tasks", "Encodings"],
        debug: true
    });
}

function setupTable(data, tabletop) {

    // get only the rows that have a number corresponding to their entry
    App.curreltSelection = App.rows = tabletop.sheets("Engineering").all();

    // Reference : https://datatables.net/reference/index
    $(document).ready(function () {
        App.table = $('#papers').DataTable({
            data: App.rows,
            scrollY:  '50vh',
            scrollX:  false,
            sScrollY: null,
            columns: [
                {title: "Author", data: "Author"},
                {title: "Year", data: "Year"},
                {title: "Paper Title", data: "Paper Title"},
                // {title: "Url", data: "URL"},
                {title: "Domain", data: "Domain"},
                {title: "Sub-Domain", data: "Sub-Domain"},
                {title: "No. of Users", data: "# of Users"},
                {title: "Users", data: "Users"},
                {title: "Level of Expertise", data: "Level of Expertise"},
                {title: "Data Types", data: "Data Types"},
                {title: "Paradigm", data: "Paradigm"},
                {title: "Number of Overlays", data: "Number of Overlays"},
                {title: "Evaluation type", data: "Evaluation type"}
            ],
            order: [[1, 'asc'], [0, 'asc']],
            stateSave: true
        });
    });
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