var App = App || {};

/*** KO Class ***/
function Papers() {
    var self = this;

    /* Advanced search field form data
     * Each object of the array is a check list */
    self.fields = ko.observableArray(
        [
            {
                name: 'SubDomain',
                elements: [
                    {text: "Biochemistry", category: "subDomain"},
                    {text: "Neuroscience", category: "subDomain" },
                    {text: "Biomedical", category: "subDomain"},
                    {text: "Epidemiology", category: "subDomain"},
                    {text: "Biomechanics", category: "subDomain"},
                    {text: "Animal Behavior", category: "subDomain"}
                ]
            },
            {
                name: 'Data Set Types',
                elements: [
                    {text:"Table", category: "dataTypes"},
                    {text:"Network", category: "dataTypes"},
                    {text:"Field", category: "dataTypes"},
                    {text:"Geometry", category: "dataTypes"},
                    {text:"Set", category: "dataTypes"},
                    {text:"List", category: "dataTypes"},
                    {text:"Path", category: "dataTypes"}
                ]
            },
            {
                name: 'Paradigms',
                elements: [
                    {text:"Linked Views", category: "paradigms"},
                    {text:"Overlays", category: "paradigms"},
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
                    {text:"Pie Chart", category: "encodings"},
                    {text:"Histogram", category: "encodings"}
                ]},
            {
                name: '',
                elements: [
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
            }
        ]
    );

}

/*** IFE to load the data and apply the KO bindings ***/
(function(){
    App.papers = new Papers;
    ko.applyBindings(new Papers());
})();