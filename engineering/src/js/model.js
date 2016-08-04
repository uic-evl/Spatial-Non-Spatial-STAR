var App = App || {};

/*** KO Class ***/
function Papers() {
    var self = this;

    /* Advanced search field form data
     * Each object of the array is a check list */
    self.fields = ko.observableArray(
        [
            {
                name: 'Sub-Domain',
                elements: [
                    {text: "Natural Science", category: "subDomain"},
                    {text: "Physical Science", category: "subDomain" },
                    {text: "Simulation", category: "subDomain"}
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
                    {text:"Simple Map", category: "encodings"},
                    {text:"Choropheth / Heatmap", category: "encodings"},
                    {text:"Ball and Stick / Mesh", category: "encodings"},
                    {text:"Isosurface / Streamlines", category: "encodings"},
                    {text:"Volume / Images", category: "encodings"},
                    {text:"Contour", category: "encodings"},
                    {text:"Glyphs", category: "encodings"},
                    {text:"Animation", category: "encodings"}
                ]
            },
            {
                name: 'Non-Spatial Encodings',
                elements: [
                    {text:"Color", category: "encodings"},
                    {text:"Label", category: "encodings"},
                    {text:"Bar Chart", category: "encodings"},
                    {text:"Line Chart", category: "encodings"},
                    {text:"Sequence", category: "encodings"},
                    {text:"Pie Chart", category: "encodings"}
                ]},
            {
                name: '',
                elements: [
                    {text:"Histogram", category: "encodings"},
                    {text:"Scatterplot", category: "encodings"},
                    {text:"Box Plot", category: "encodings"},
                    {text:"Node-Link", category: "encodings"},
                    {text:"Scatterplot Matrix", category: "encodings"},
                    {text:"Parallel Coordinates", category: "encodings"},
                    {text:"Matrix", category: "encodings"}
                ]
            },
            {
                name: 'Evaluators',
                elements: [
                    {text:"Domain Experts", category: "evaluators"},
                    {text:"Visualization Experts", category: "evaluators"}
                ]
            },
            {
                name: 'Evaluation',
                elements: [
                    {text:"Case Study", category: "evaluation"},
                    {text:"User Study", category: "evaluation"},
                    {text:"Feedback", category: "evaluation"},
                    {text:"Quantitative Analysis", category: "evaluation"}
                ]
            },
        ]
    );

    self.attributes = ko.observableArray(
        [
            "Tasks",
            "Paradigms",
            "DataTypes",
            "Spatial Encodings",
            "Non-Spatial Encodings"
        ]
    );
}

/*** IFE to load the data and apply the KO bindings ***/
(function(){
    ko.applyBindings(new Papers());
})();