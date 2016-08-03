'use strict';
var Parser = function(options) {

    var self = this;

    /**
     * Parses the data from the Google Sheets for use in the charts
     *
     * @constructor
     * @this {Graph}
     * @param {Object} rows The data to be parsed
     * @returns {Object} The mapped encodings and their properties
     **/

    self.parseEncodings = function(rows){

        // Spatial columns
        var spatial = [
            'Choropleth / Heatmap', 'Ball and Stick / Mesh','Isosurface / Streamlines','Volume / Images','Glyph','Animation'
        ];

        // Non-Spatial columns
        var nonSpatial = _.keys(_.omit(App.encodings[0], _.flatten(['Author','Sub-Domain', 'Year', spatial])));

        // Set up the data structure for reduce to clone
        var nonSpatialTemplate = _.reduce(nonSpatial,
            function(result, value, key){
                result[value] = 0;
                return result;
            }, {});

        /* Author / Paper Affiliation */
        var authors = {
            'Choropleth / Heatmap': {},
            'Ball and Stick / Mesh': {},
            'Isosurface / Streamlines': {},
            'Volume / Images': {},
            'Glyph': {},
            'Animation': {}
        };

        var subDomains = {
            'Choropleth / Heatmap': {},
            'Ball and Stick / Mesh': {},
            'Isosurface / Streamlines': {},
            'Volume / Images': {},
            'Glyph': {},
            'Animation': {}
        };

        /** iterate over the resutls to combine the encodings **/
        var encodings = _.reduce(rows, function(result, value, key) {

            /** Separate the spatial and non-spatial encodings **/
            var spat = _.intersection(value.encodings, spatial);
            var non  = _.intersection(value.encodings, nonSpatial);

            spat.forEach(function(s){
                non.forEach(function(n){

                    // increment the result
                    result[s][n] += 1;

                    // store the corresponding authors in another array
                    authors[s][n] = authors[s][n] || [];
                    authors[s][n].push({label: value['author'].trim(), year: value['year']});

                    // create a count of the sub domains per encoding pair
                    subDomains[s][n] = subDomains[s][n] || {};

                    if(subDomains[s][n][value.subDomain])
                    {
                        if(value.subDomain == 'Both')
                        {
                            subDomains[s][n]['Phys. + Nat. Science'] += 1;
                        }
                        else
                        {
                            subDomains[s][n][value.subDomain] += 1;
                        }
                    }
                    else
                    {
                        if(value.subDomain == 'Both')
                        {
                            subDomains[s][n]['Phys. + Nat. Science'] = 1;
                        }
                        else
                        {
                            subDomains[s][n][value.subDomain] = 1;
                        }
                    }
                });
            });

            return result;
        }, {
            'Choropleth / Heatmap': _.cloneDeep(nonSpatialTemplate),//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
            'Ball and Stick / Mesh': _.cloneDeep(nonSpatialTemplate),//{ enc odings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
            'Isosurface / Streamlines': _.cloneDeep(nonSpatialTemplate),//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
            'Volume / Images': _.cloneDeep(nonSpatialTemplate),//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
            'Glyph': _.cloneDeep(nonSpatialTemplate),//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
            'Animation': _.cloneDeep(nonSpatialTemplate)//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) }
        });

        // Finally, map to the format needed for the chart
        var max = 0;
        encodings = _.map(encodings, function(d, k, o)
        {
            var localMax = _.max(_.values(d));
            max = Math.max(max, localMax);

            var obj = {};
            obj.groups = [];
            obj.Spatial = k;

            var pairs = _.toPairs(d);
            pairs.forEach(function(arr){
                obj.groups.push({label: arr[0], value: parseInt(arr[1])});
            });

            return obj;
        });

        return {encodings: encodings, authors: authors, subDomains: subDomains, max: max, groups: nonSpatial};
    };

    /**
     * Parses the data from the Google Sheets for use in the charts
     *
     * @constructor
     * @this {Graph}
     * @param {Object} rows The data to be parsed
     * @returns {Object} The mapped encodings and their properties
     **/

    self.parseHybridParadigms = function(rows){

        /** iterate over the resutls to combine the encodings **/
        var hybrid = _.reduce(rows, function(result, value, key) {

            if(value.paradigms.length > 1)
            {
                value.paradigms.sort().reverse();

                for(var i = 0; i < value.paradigms.length -1; i++)
               {
                   var para1 = value.paradigms[i];
                   for(var j = i+1; j < value.paradigms.length; j++)
                   {
                       var para2 = value.paradigms[j];

                       result[para1][para2] += 1;
                   }
               }
            }

            return result;
        },
        {
            "Spatial Nesting" : {"Overlays": 0, "Linked Views": 0, "Non-Spatial Nesting" : 0},
            "Overlays" : {"Linked Views": 0, "Non-Spatial Nesting": 0, "Spatial Nesting" : 0},
            "Non-Spatial Nesting" : {"Linked Views": 0, "Overlays": 0, "Spatial Nesting" : 0}
        }
        );

        // Finally, map to the format needed for the chart
        var max = 0;
        hybrid = _.map(hybrid, function(d, k, o)
        {
            var localMax = _.max(_.values(d));
            max = Math.max(max, localMax);

            var obj = {};
            obj.groups = [];

            switch(k){
                case "Spatial Nesting": obj.Paradigm      =  "4. Spatial Nesting"; break;
                case "Non-Spatial Nesting": obj.Paradigm  =  "3. Non-Spatial Nesting"; break;
                case "Overlays": obj.Paradigm             =  "2. Overlays"; break;
            }

            var pairs = _.toPairs(d);
            pairs.forEach(function(arr){

                var label = "";
                switch(arr[0]){
                    case "Spatial Nesting":      label =  "4. Spatial Nesting"; break;
                    case "Non-Spatial Nesting":  label =  "3. Non-Spatial Nesting"; break;
                    case "Overlays":             label =  "2. Overlays"; break;
                    case "Linked Views":         label =  "1. Linked Views"; break;
                }
                obj.groups.push({label: label, value: parseInt(arr[1])});
            });

            return obj;
        });

        return {hybrids: hybrid, max: max};

    };

    /**
     * Parses the data from the Google Sheets for use in the charts
     *
     * @constructor
     * @this {Graph}
     * @param {Object} rows The data to be parsed
     * @param {Array} subDomains The list of sub-domains to map the data
     * @returns {Object} The mapped tasks, data types, and task types
     */

    self.parseFields = function(rows, subDomains) {

        var taskNames = d3.keys(App.tasks[0]).filter(function(key) {
            return key !== "Author" && key !== "Year" && key !== "Sub-Domain";  });

        /* creates a template for parsing the data */
        var taskTemplate = _.reduce(subDomains,
            function(result, value, key){
                result[value] = 0;
                return result;
            }, {});

        var totalCounts = {
            "Natural Science": 0,
            "Physical Science": 0,
            "Simulation": 0
        };

        var authors = [
            {
                'Simulation': {},
                'Physical Science': {},
                'Natural Science': {}
            },
            {
                'Simulation': {},
                'Physical Science': {},
                'Natural Science': {}
            },
            {
                'Simulation': {},
                'Physical Science': {},
                'Natural Science': {}
            },
            {
                'Simulation': {},
                'Physical Science': {},
                'Natural Science': {}
            },
            {
                "Domain Experts" : {},
                "Visualization Experts" : {}
            }
        ];

        var data = _.reduce(rows, function(result, value, key) {

            if(value.subDomain === 'Both'){
                totalCounts["Natural Science"] += 1;
                totalCounts["Physical Science"] += 1;
            }
            else{
                totalCounts[value.subDomain] += 1;
            }

            /* Parse the User Tasks */
            value.tasks.forEach(function(task){

                    if(value.subDomain === 'Both'){

                        // increment the task count
                        result[0][task]["Physical Science"] += 1;
                        result[0][task]["Natural Science"] += 1;

                        // store the corresponding authors in another array
                        authors[0]["Physical Science"][task] = authors[0]["Physical Science"][task] || [];
                        authors[0]["Natural Science"][task] = authors[0]["Natural Science"][task] || [];

                        authors[0]["Natural Science"][task].push({label: value['author'].trim(), year: value['year']});
                        authors[0]["Physical Science"][task].push({label: value['author'].trim(), year: value['year']});

                    }
                    else{
                        // increment the task count
                        result[0][task][value.subDomain] += 1;

                        // store the corresponding authors in another array
                        authors[0][value.subDomain][task] = authors[0][value.subDomain][task] || [];
                        authors[0][value.subDomain][task].push({label: value['author'].trim(), year: value['year']});
                    }
                });

            /* Parse the data types */
            value.dataTypes.forEach(function(type){

                    if(value.subDomain === 'Both'){

                        // increment the data type count
                        result[1][type]["Physical Science"] += 1;
                        result[1][type]["Natural Science"] += 1;

                        // store the corresponding authors in another array
                        authors[1]["Physical Science"][type] = authors[1]["Physical Science"][type] || [];
                        authors[1]["Natural Science"][type] = authors[1]["Natural Science"][type] || [];

                        authors[1]["Natural Science"][type].push({label: value['author'].trim(), year: value['year']});
                        authors[1]["Physical Science"][type].push({label: value['author'].trim(), year: value['year']});
                    }
                    else {

                        // increment the data type count
                        result[1][type][value.subDomain] += 1;

                        // store the corresponding authors in another array
                        authors[1][value.subDomain][type] = authors[1][value.subDomain][type] || [];
                        authors[1][value.subDomain][type].push({label: value['author'].trim(), year: value['year']});
                    }
                });

            /* Parse the evaluation types */
            value.evaluation.forEach(function(type){

                    type = type.trim();

                    if(value.subDomain === 'Both'){

                        // increment the data type count
                        result[2][type]["Physical Science"] += 1;
                        result[2][type]["Natural Science"] += 1;

                        // store the corresponding authors in another array
                        authors[2]["Physical Science"][type] = authors[2]["Physical Science"][type] || [];
                        authors[2]["Natural Science"][type] = authors[2]["Natural Science"][type] || [];

                        authors[2]["Natural Science"][type].push({label: value['author'].trim(), year: value['year']});
                        authors[2]["Physical Science"][type].push({label: value['author'].trim(), year: value['year']});
                    }
                    else {
                        // increment the data type count
                        result[2][type][value.subDomain] += 1;

                        // store the corresponding authors in another array
                        authors[2][value.subDomain][type] = authors[2][value.subDomain][type] || [];
                        authors[2][value.subDomain][type].push({label: value['author'].trim(), year: value['year']});
                    }
                });

            /* Parse the Evaluators */
            result[4][value.year][value.evaluators] += 1;

            /* Parse the author for the paradigms year */
            authors[4][value.evaluators][value.year] = authors[4][value.evaluators][value.year] || [];
            authors[4][value.evaluators][value.year].push({label: value['author'].trim(), year: value['year']});

            value.paradigms.forEach(function(paradigm){

                if(value.subDomain === 'Both'){

                    // increment the task count
                    result[3][paradigm]["Physical Science"] += 1;
                    result[3][paradigm]["Natural Science"] += 1;

                    // store the corresponding authors in another array
                    authors[3]["Physical Science"][paradigm] = authors[3]["Physical Science"][paradigm] || [];
                    authors[3]["Natural Science"][paradigm] = authors[3]["Natural Science"][paradigm] || [];

                    authors[3]["Natural Science"][paradigm].push({label: value['author'].trim(), year: value['year']});
                    authors[3]["Physical Science"][paradigm].push({label: value['author'].trim(), year: value['year']});

                }
                else{
                    // increment the task count
                    result[3][paradigm][value.subDomain] += 1;

                    // store the corresponding authors in another array
                    authors[3][value.subDomain][paradigm] = authors[3][value.subDomain][paradigm] || [];
                    authors[3][value.subDomain][paradigm].push({label: value['author'].trim(), year: value['year']});
                }
            });

            return result;
            },
            [
                {
                    "Discover"  : _.cloneDeep(taskTemplate),
                    "Present"   : _.cloneDeep(taskTemplate),
                    "Annotate"  : _.cloneDeep(taskTemplate),
                    "Record"    : _.cloneDeep(taskTemplate),
                    "Derive"    : _.cloneDeep(taskTemplate),
                    "Browse"    : _.cloneDeep(taskTemplate),
                    "Explore"   : _.cloneDeep(taskTemplate),
                    "Lookup"    : _.cloneDeep(taskTemplate),
                    "Locate"    : _.cloneDeep(taskTemplate),
                    "Identify"  : _.cloneDeep(taskTemplate),
                    "Compare"   : _.cloneDeep(taskTemplate),
                    "Summarize" : _.cloneDeep(taskTemplate)
                },
                {
                    "Table"     : _.cloneDeep(taskTemplate),
                    "Network"   : _.cloneDeep(taskTemplate),
                    "Field"     : _.cloneDeep(taskTemplate),
                    "Geometry"  : _.cloneDeep(taskTemplate)
                },
                {
                    "Case Study"            : _.cloneDeep(taskTemplate),
                    "Quantitative Analysis" : _.cloneDeep(taskTemplate),
                    "Feedback"              : _.cloneDeep(taskTemplate),
                    "User Study"            : _.cloneDeep(taskTemplate)
                },
                {
                    "Overlays"              : _.cloneDeep(taskTemplate),
                    "Linked Views"          : _.cloneDeep(taskTemplate),
                    "Spatial Nesting"       : _.cloneDeep(taskTemplate),
                    "Non-Spatial Nesting"   : _.cloneDeep(taskTemplate)
                },
                {
                    "2006": {"Domain Experts" : 0, "Visualization Experts" : 0},
                    "2007": {"Domain Experts" : 0, "Visualization Experts" : 0},
                    "2008": {"Domain Experts" : 0, "Visualization Experts" : 0},
                    "2009": {"Domain Experts" : 0, "Visualization Experts" : 0},
                    "2010": {"Domain Experts" : 0, "Visualization Experts" : 0},
                    "2011": {"Domain Experts" : 0, "Visualization Experts" : 0},
                    "2012": {"Domain Experts" : 0, "Visualization Experts" : 0},
                    "2013": {"Domain Experts" : 0, "Visualization Experts" : 0},
                    "2014": {"Domain Experts" : 0, "Visualization Experts" : 0},
                    "2015": {"Domain Experts" : 0, "Visualization Experts" : 0}
                }
            ]);

        var maps = [ ];
        for(var i = 0; i < 4; i++){

            maps.push(_.reduce(data[i], function (result, value, key) {

                    _.keys(value).forEach(function(k, j){

                        result[j].values.push({
                            label: key,
                            value: value[k],
                            authors: authors[i][k][key],
                            color: options.colorMap[0][k]
                        });

                    });

                    return result;
                },
                [
                    {key: "Natural Science", values: [], color: "#beaed4"},
                    {key: "Physical Science", values: [], color: "#fdc086"},
                    {key: "Simulation", values: [], color: "#7fc97f"}
                ])
            );
        }

        var mappedEvaluators = _.reduce(data[4], function (result, value, key) {

            _.keys(value).forEach(function(k, i){

                result[i].values.push({
                    label: key,
                    value: value[k],
                    authors: authors[4][k][key],
                    color: options.colorMap[1][k]
                });
            });

                return result;
            },
            [
                {key: "Domain Experts", values: [], color: "#fbb4ae"},
                {key: "Visualization Experts", values: [], color: "#b3cde3"}
            ]);

        return {
            tasks: maps[0], dataTypes: maps[1], evaluation: maps[2], evaluators: mappedEvaluators, paradigms: maps[3],
            groups: taskNames, authors: authors, count: totalCounts
        };
    };
};