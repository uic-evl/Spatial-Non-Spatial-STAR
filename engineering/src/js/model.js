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
                property: 'subDomain',
                elements: [
                    {text: "Natural Science", category: "subDomain"},
                    {text: "Physical Science", category: "subDomain" },
                    {text: "Simulation", category: "subDomain"}
                ]
            },
            {
                name: 'DataSet Types',
                property: 'dataTypes',
                elements: [
                    {text:"Table", category: "dataTypes"},
                    {text:"Network", category: "dataTypes"},
                    {text:"Field", category: "dataTypes"},
                    {text:"Geometry", category: "dataTypes"},
                    {text:"Set", category: "dataTypes"},
                    {text:"Cluster", category: "dataTypes"},
                    {text:"Path", category: "dataTypes"}
                ]
            },
            {
                name: 'Tasks',
                property: 'tasks',
                elements: [
                    {text: "Discover", category: 'tasks'},
                    {text: "Present", category: 'tasks'},
                    {text: "Annotate", category: 'tasks'},
                    {text: "Record", category: 'tasks'},
                    {text: "Derive", category: 'tasks'},
                    {text: "Browse", category: 'tasks'},
                    {text: "Locate", category: 'tasks'},
                    {text: "Explore", category: 'tasks'},
                    {text: "Lookup", category: 'tasks'},
                    {text: "Identify", category: 'tasks'},
                    {text: "Compare", category: 'tasks'},
                    {text: "Summarize", category: 'tasks'}
                ]
            },
            {
                name: 'Paradigms',
                property: 'paradigms',
                elements: [
                    {text:"Linked Views", category: "paradigms"},
                    {text:"Overlays", category: "paradigms"},
                    {text:"Spatial Nesting" , category: "paradigms"},
                    {text:"Non-Spatial Nesting", category: "paradigms"}
                ]
            },
            {
                name: 'Spatial Encodings',
                property: 'spatial',
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
                property: 'nonSpatial',
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
                property: 'nonSpatial',
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
    App.model = new Papers();
    ko.applyBindings(App.model);
})();