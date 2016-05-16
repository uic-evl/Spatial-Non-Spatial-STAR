var final_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1oIxumn3O9Bu7y-yyHY-gJsf_9c-pk5PbEMsw5apmTf8/pubhtml';
var engineering_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1b5_Yy_cGvcL6Uec3rYaEgT4NSi29OgP8tU1mV43DcFE/pubhtml';

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
    var rows = tabletop.sheets("Engineering").all();

    // Reference : https://datatables.net/reference/index
    $(document).ready(function () {
        $('#papers').DataTable({
            data: rows,
            scrollY:        '50vh',
            scrollX:        false,
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
            order: [[1, 'asc'], [0, 'asc']]
        });
    });
}

function setupCharts(data, tabletop){

    var encodings = tabletop.sheets("Encodings").all();

    // get the parsed encodings
    var chartData = parseEncodingsData(encodings, tabletop);

    graphChart(chartData.encodings, "#encodings", chartData.max, chartData.groups)

}