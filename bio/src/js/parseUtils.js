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
            'Simple Map', 'Choropleth / Heatmap', 'Ball and Stick / Mesh',
                'Isosurface / Streamlines','Volume / Images', 'Contour', 'Glyph','Animation'
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
            'Simple Map': {},
            'Choropleth / Heatmap': {},
            'Ball and Stick / Mesh': {},
            'Isosurface / Streamlines': {},
            'Volume / Images': {},
            'Contour': {},
            'Glyph': {},
            'Animation': {}
        };

        var subDomains = {
            'Simple Map': {},
            'Choropleth / Heatmap': {},
            'Ball and Stick / Mesh': {},
            'Isosurface / Streamlines': {},
            'Volume / Images': {},
            'Contour': {},
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

                    value.subDomain.forEach(function(subDomain){

                        if(subDomains[s][n][subDomain])
                        {
                            // if(subDomain == 'Both')
                            // {
                            //     subDomains[s][n]['Phys. + Nat. Science'] += 1;
                            // }
                            // else
                            // {
                            subDomains[s][n][subDomain] += 1;
                            //}
                        }
                        else
                        {
                            // if(subDomain == 'Both')
                            // {
                            //     subDomains[s][n]['Phys. + Nat. Science'] = 1;
                            // }
                            // else
                            // {
                            subDomains[s][n][subDomain] = 1;
                            // }
                        }

                    });

                });
            });

            return result;
        }, {
            'Simple Map': _.cloneDeep(nonSpatialTemplate),//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
            'Choropleth / Heatmap': _.cloneDeep(nonSpatialTemplate),//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
            'Ball and Stick / Mesh': _.cloneDeep(nonSpatialTemplate),//{ enc odings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
            'Isosurface / Streamlines': _.cloneDeep(nonSpatialTemplate),//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
            'Volume / Images': _.cloneDeep(nonSpatialTemplate),//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
            'Contour': _.cloneDeep(nonSpatialTemplate),//{ encodings: _.cloneDeep(nonSpatial), authors: _.cloneDeep(authors) },
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
            obj.yProp = k;

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
                value.forEach(function(v){
                    if(v.length > 0) result[v] = 0;
                });
                return result;
            }, {});

        var totalCounts = {},
            subDomainTemplate = {},
            template = [], templateMap = {},
            parsedSubDomains = [], j = 0;

        subDomains.forEach(function(domains){
            domains.forEach(function(domain){
                var d = domain.trim();
                if(d.length > 0 && totalCounts[d] == null)
                {
                    totalCounts[d] = 0;
                    subDomainTemplate[d] = {};

                    template.push({key: d, values: []});
                    templateMap[d] = j++;

                    parsedSubDomains.push(domain);
                }
            });
        });

        var authors = [
            _.cloneDeep(subDomainTemplate),
            _.cloneDeep(subDomainTemplate),
            _.cloneDeep(subDomainTemplate),
            _.cloneDeep(subDomainTemplate),
            {
                "Domain Experts"        : {},
                "Visualization Experts" : {}
            }
        ];

        var data = _.reduce(rows, function(result, value, key) {

            /* iterate over the domains */

                value.subDomain.forEach(function(domain) {
                    if(domain.length === 0) return;
                    totalCounts[domain] += 1;
                });

                /* Parse the User Tasks */
                value.tasks.forEach(function(task){
                    // store the corresponding authors in another array
                    value.subDomain.forEach(function(domain) {
                        if(domain.length === 0) return;
                        // increment the task count
                        result[0][task][domain] += 1;
                        authors[0][domain][task] = authors[0][domain][task] || [];
                        authors[0][domain][task].push({label: value['author'].trim(), year: value['year']});
                    });
                });

                /* Parse the data types */
                value.dataTypes.forEach(function(type){

                    type = type.trim();

                    // store the corresponding authors in another array
                    value.subDomain.forEach(function(domain) {
                        if(domain.length === 0) return;
                        // increment the data type count
                        result[1][type][domain] += 1;
                        authors[1][domain][type] = authors[1][domain][type] || [];
                        authors[1][domain][type].push({label: value['author'].trim(), year: value['year']});
                    });

                });

                /* Parse the evaluation types */
                value.evaluation.forEach(function(type){
                    type = type.trim();
                    if(type.length === 0) return;
                    value.subDomain.forEach(function(subDomain) {

                        if(subDomain.length === 0 ) return;

                        // increment the data type count
                        result[2][type][subDomain] += 1;

                        // store the corresponding authors in another array
                        authors[2][subDomain][type] = authors[2][subDomain][type] || [];
                        authors[2][subDomain][type].push({label: value['author'].trim(), year: value['year']});
                    });

                });

                value.paradigms.forEach(function(paradigm){
                    paradigm = paradigm.trim();
                    if(paradigm.length === 0) return;

                    value.subDomain.forEach(function(subDomain) {

                        if(subDomain.length === 0 ) return;
                        // increment the task count
                        result[3][paradigm][subDomain] += 1;

                        // store the corresponding authors in another array
                        authors[3][subDomain][paradigm] = authors[3][subDomain][paradigm] || [];
                        authors[3][subDomain][paradigm].push({label: value['author'].trim(), year: value['year']});
                    });

                });
                //
                // /* Parse the Evaluators */
                result[4][value.year][value.evaluators] += 1;

                /* Parse the author for the evaluator year */
                authors[4][value.evaluators][value.year] = authors[4][value.evaluators][value.year] || [];
                authors[4][value.evaluators][value.year].push({label: value['author'].trim(), year: value['year']});

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
                    "2005": {"Domain Experts" : 0, "Visualization Experts" : 0},
                    "2006": {"Domain Experts" : 0, "Visualization Experts" : 0},
                    "2007": {"Domain Experts" : 0, "Visualization Experts" : 0},
                    "2008": {"Domain Experts" : 0, "Visualization Experts" : 0},
                    "2009": {"Domain Experts" : 0, "Visualization Experts" : 0},
                    "2010": {"Domain Experts" : 0, "Visualization Experts" : 0},
                    "2011": {"Domain Experts" : 0, "Visualization Experts" : 0},
                    "2012": {"Domain Experts" : 0, "Visualization Experts" : 0},
                    "2013": {"Domain Experts" : 0, "Visualization Experts" : 0},
                    "2014": {"Domain Experts" : 0, "Visualization Experts" : 0},
                    "2015": {"Domain Experts" : 0, "Visualization Experts" : 0},
                    "2016": {"Domain Experts" : 0, "Visualization Experts" : 0}
                }
            ]);

        /** Map the data into the correct format for use **/


        var maps = [ ];
        for(var i = 0; i < 4; i++){

            maps.push(_.reduce(data[i], function (result, value, key) {
                    _.keys(value).forEach(function(k, j){
                        result[j].values.push({
                            label: key,
                            value: value[k],
                            authors: authors[i][k][key],
                            //color: options.colorMap[0][k]
                        });
                    });
                    return result;
                },
                _.cloneDeep(template)
                )
            );
        }

        var mappedEvaluators = _.reduce(data[4], function (result, value, key) {

                _.keys(value).forEach(function(k, i){

                    result[i].values.push({
                        label: key,
                        value: value[k],
                        authors: authors[4][k][key],
                        //color: options.colorMap[1][k]
                    });
                });

                return result;
            },
            [
                {key: "Domain Experts", values: [], color: "#fbb4ae"},
                {key: "Visualization Experts", values: [], color: "#b3cde3"}
            ]);

        return { tasks: maps[0], dataTypes: maps[1], evaluation: maps[2],
                evaluators: mappedEvaluators, paradigms: maps[3], groups: taskNames,
                authors: authors, count: totalCounts, subDomains: parsedSubDomains };
    };
};