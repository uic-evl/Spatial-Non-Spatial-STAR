var App = App || {};

/*** KO Class ***/
function Papers() {
    var self = this;

    /* Advanced search field form data
     * Each object of the array is a check list */
    self.fields = ko.observableArray(
        [
            {
                name: 'Domain',
                elements: [
                    {text: "Natural Science", category: "domain"},
                    {text: "Physical Science", category: "domain" },
                    {text: "Simulation", category: "domain"}
                ]
            },
            {
                name: 'Data Types',
                elements: [
                    {text:"Table", category: "dataTypes"},
                    {text:"Network", category: "dataTypes"},
                    {text:"Field", category: "dataTypes"},
                    {text:"Geometry", category: "dataTypes"}
                ]
            },
            {
                name: 'Paradigms',
                elements: [
                    {text:"Linked Views", category: "paradigms"},
                    {text:"Overlays", category: "paradigms"},
                    {text:"Hybrid", category: "paradigms"},
                    {text:"Spatial Nesting" , category: "paradigms"},
                    {text:"Non-Spatial Nesting", category: "paradigms"}
                ]
            },
            {
                name: 'Spatial Encodings',
                elements: [
                    {text:"Choropheth / Heatmap", category: "encodings"},
                    {text:"Ball and Stick / Mesh", category: "encodings"},
                    {text:"Isosurface / Streamlines", category: "encodings"},
                    {text:"Volume / Images", category: "encodings"},
                    {text:"Glyphs", category: "encodings"},
                    {text:"Animation", category: "encodings"}
                ]
            },
            {
                name: 'Non-Spatial Encodings',
                elements: [
                    {text:"Color", category: "encodings"},
                    {text:"Line Chart", category: "encodings"},
                    {text:"Histogram", category: "encodings"},
                    {text:"Scatterplot", category: "encodings"},
                    {text:"Node-Link", category: "encodings"},
                    {text:"Parallel Coordinates", category: "encodings"},
                    {text:"Star-Plot", category: "encodings"}
                ]
            },
            {
                name: 'Evaluators',
                elements: [
                    {text:"Domain Experts", category: "evaluators"},
                    {text:"Visualization Experts", category: "evaluators"}
                ]
            }
        ]
    );

}

/*** IFE to load the data and apply the KO bindings ***/
(function(){
    ko.applyBindings(new Papers());
})();