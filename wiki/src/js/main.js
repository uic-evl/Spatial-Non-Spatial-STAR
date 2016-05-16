
var public_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1oIxumn3O9Bu7y-yyHY-gJsf_9c-pk5PbEMsw5apmTf8/pubhtml';

function init() {
    Tabletop.init({
        key: public_spreadsheet_url,
        callback: showInfo,
        wanted: ["Engineering", "Tasks"],
        debug: true
    });
}

function showInfo(data, tabletop) {

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


    // var encodings = _.reject(tabletop.sheets("Encodings").all(), function (o) {
    //     return !o.No;
    // });
    //parseData(encodings, tabletop);

}

