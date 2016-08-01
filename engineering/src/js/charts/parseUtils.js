'use strict';
var Parser = function() {

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
            'Chloropleth / Heatmap', 'Ball and Stick / Mesh','Isosurface / Streamlines','Volume / Images','Glyph','Animation'
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
            'Chloropleth / Heatmap': {},
            'Ball and Stick / Mesh': {},
            'Isosurface / Streamlines': {},
            'Volume / Images': {},
            'Glyph': {},
            'Animation': {}
        };

        var subDomains = {
            'Chloropleth / Heatmap': {},
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

                    if(subDomains[s][n][value.domain] && value.domain != 'Both')
                    {
                        if(value.domain == 'Both')
                        {
                            subDomains[s][n]['Natural Science'] += 1;
                            subDomains[s][n]['Physical Science'] += 1;
                        }
                        else
                        {
                            subDomains[s][n][value.domain] += 1;
                        }
                    }
                    else
                    {
                        if(value.domain == 'Both')
                        {
                            subDomains[s][n]['Natural Science'] = 1;
                            subDomains[s][n]['Physical Science'] = 1;
                        }
                        else
                        {
                            subDomains[s][n][value.domain] = 1;
                        }
                    }

                });
            });

            return result;
        }, {
            'Chloropleth / Heatmap': _.cloneDeep(nonSpatialTemplate),//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
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
            // console.log(d);
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
                "Domain Experts" : {},
                "Visualization Experts" : {}
            }
        ];

        var data = _.reduce(rows, function(result, value, key) {

            /* Parse the User Tasks */
            value.tasks.forEach(function(task){

                    if(value.domain === 'Both'){

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
                        result[0][task][value.domain] += 1;

                        // store the corresponding authors in another array
                        authors[0][value.domain][task] = authors[0][value.domain][task] || [];
                        authors[0][value.domain][task].push({label: value['author'].trim(), year: value['year']});
                    }
                });

            /* Parse the data types */
            value.dataTypes.forEach(function(type){

                    if(value.domain === 'Both'){

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
                        result[1][type][value.domain] += 1;

                        // store the corresponding authors in another array
                        authors[1][value.domain][type] = authors[1][value.domain][type] || [];
                        authors[1][value.domain][type].push({label: value['author'].trim(), year: value['year']});
                    }
                });

            /* Parse the evaluation types */
            value.evaluation.forEach(function(type){

                    type = type.trim();

                    if(value.domain === 'Both'){

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
                        result[2][type][value.domain] += 1;

                        // store the corresponding authors in another array
                        authors[2][value.domain][type] = authors[2][value.domain][type] || [];
                        authors[2][value.domain][type].push({label: value['author'].trim(), year: value['year']});
                    }
                });

            /* Parse the Evaluators */
            result[3][value.year][value.evaluators] += 1;

            /* Parse the author for the evaluator year */
            authors[3][value.evaluators][value.year] = [value.evaluators][value.year] || [];
            authors[3][value.evaluators][value.year].push({label: value['author'].trim(), year: value['year']});

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

        /** Map the data into the correct format for use **/
        var mappedTasks = [];
        _.map(data[0], function(obj, task) {

            var map = {Task: task, tasks: []};

            _.forIn(obj, function(value, key) {

                map[key] = value;
                map.tasks.push({label: key, value: value})
            });

            mappedTasks.push(map);
        });

        var mappedTypes = [];
        _.map(data[1], function(obj, task) {

            var map = {DataType: task, dataType: []};

            _.forIn(obj, function(value, key) {

                map[key] = value;
                map.dataType.push({label: key, value: value})
            });

            mappedTypes.push(map);
        });

        var mappedEval = [];
        _.map(data[2], function(obj, task) {

            var map = {Evaluation: task, evaluation: []};

            _.forIn(obj, function(value, key) {
                map[key] = value;
                map.evaluation.push({label: key, value: value})
            });

            mappedEval.push(map);
        });

        var mappedEvaluators = [];
        _.toPairs(data[3]).forEach(function(pair) {

            var map = {Year: pair[0], evaluators: []};
            _.forIn(pair[1], function(value, key) {
                map[key] = value;
                map.evaluators.push({label: key, value: value})
            });

            mappedEvaluators.push(map);
        });

        return {tasks: mappedTasks, dataTypes: mappedTypes, evaluation: mappedEval, evaluators: mappedEvaluators,
            groups: taskNames, authors: authors};
    };
};