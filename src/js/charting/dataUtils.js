'use strict';
var Parser = function(options) {

    var self = this;

    function formatBubbleData(data, yProp){

        // map the data to be alphabetical by the yProperty
        data = _.toPairs(data);//_.sortBy(_.toPairs(data), function(o){ return o[0] });

        // Finally, map to the format needed for the chart
        var output = [];
        data.forEach(function(o){

            var key = o[0];
            var values = o[1];

            var obj = {};
            obj.groups = [];
            obj.yProp = key;

            var pairs = _.toPairs(values);
            pairs.forEach(function(arr){
                obj.groups.push({label: arr[0], value: parseInt(arr[1]), property: yProp});
            });

            output.push(obj);
        });

        return {data : output};
    }

    function formatNVD3Bubble(data, xDomain, yDomain, elementCounts, authors) {

        /* define the maps that will be used for the labels of the scatter plot bubble */
        var xDomainMap = {}, yDomainMap = {}, i = 0, j= 0;

        xDomain.forEach(function(x) {
            xDomainMap[x] = i++;
        });

        yDomain.forEach(function(y) {
            yDomainMap[y] = j++;
        });

        var datum = _.reduce(data, function (result, value) {
            value.groups.forEach(function (obj) {
                result.values.push({
                    size: obj.value * 100,
                    y: yDomainMap[value.yProp],
                    x: xDomainMap[obj.label],
                    domains: elementCounts[value.yProp][obj.label],
                    authors: authors[value.yProp][obj.label],
                    // the property corresponding to the DB
                    property: obj.property,
                    // the x and y paring
                    pairing: [obj.label, value.yProp]
                });
            });
            return result;
        }, {
            key: "Group 1", values: []
        });
        return {data: datum, xLabelMap: xDomainMap, yLabelMap: yDomainMap};
    }

    self.parseArbFields = function(rows, xProp, yProp) {

        var authors = {}, elementSubDomains = {};

        var template = {},
            xDomain = [],
            yDomain = [];

        yDomain = _.map(_.find(App.model.fields(), {property: yProp} ).elements, 'text' );
        xDomain = _.map(_.find(App.model.fields(), {property: xProp} ).elements, 'text' );

        /* construct the template for the parsing and the x/y domains */
        rows.forEach(function(row){

            if(_.isArray(row[yProp]))
            {
                row[yProp].forEach(function(y){

                    template[y] = {};
                    authors[y] = {};
                    elementSubDomains[y] = {};
                });
            }
            else
            {
                authors[row[yProp]] = {};
                template[row[yProp]] = {};
                elementSubDomains[row[yProp]] = {};
            }
        });

        _.difference(yDomain, _.keys(options.subDomains)).forEach(function(y) {
            authors[y] = {};
            template[y] = {};
            elementSubDomains[y] = {};
        });

        // sort the domains
        xDomain.sort();
        yDomain.sort();

        /** iterate over the resutls to combine the encodings **/
        var output = _.reduce(rows, function(result, value) {

                yDomain.forEach(function(s){
                    xDomain.forEach(function(n){

                        // increment the result
                        result[s][n] = result[s][n] || 0;

                        // if the row has these values
                        if(value[yProp].indexOf(s) > -1 && value[xProp].indexOf(n) > -1){

                            result[s][n] += 1;
                            // store the corresponding authors in another array
                            authors[s][n] = authors[s][n] || [];
                            authors[s][n].push({label: value['author'].trim(), year: value['year']});

                            // create a count of the sub domains per encoding pair
                            elementSubDomains[s][n] = elementSubDomains[s][n] || {};
                            options.subDomains.forEach(function(sub){
                                elementSubDomains[s][n][sub] = elementSubDomains[s][n][sub] || 0;
                                elementSubDomains[s][n][sub] += 1;
                            });
                        }
                    });
                });
                return result;
            },
            _.cloneDeep(template)
        );

        // Format the data to fit into the bubble chart
        output = formatBubbleData(output, elementSubDomains, authors);

        return {pairings : output.data, authors: authors, xDomain : xDomain,
            yDomain : yDomain, xLabelMap: output.xDomainMap, yLabelMap: output.yDomainMap};
    };

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
            function(result, value){
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

        var elementSubDomains = {
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
        var encodings = _.reduce(rows, function(result, value) {

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
                    elementSubDomains[s][n] = elementSubDomains[s][n] || {};

                    value.subDomain.forEach(function(subDomain){
                        // no subDomain, skip
                        if(subDomain.length === 0) return;

                        if(elementSubDomains[s][n][subDomain])
                        {
                            elementSubDomains[s][n][subDomain] += 1;
                        }
                        else
                        {
                            elementSubDomains[s][n][subDomain] = 1;
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

        // format the data to be used in NVD3's scatterChart
        encodings = formatBubbleData(encodings, 'encodings');
        encodings = formatNVD3Bubble(encodings.data, nonSpatial, spatial, elementSubDomains, authors);

        return {encodings: encodings.data, authors: authors, subDomainCount: elementSubDomains,
                xLabelMap: encodings.xLabelMap, yLabelMap: encodings.yLabelMap};
    };

    /**
     * Parses the data from the Google Sheets for use in the charts
     *
     * @constructor
     * @this {Graph}
     * @param {Object} rows The data to be parsed
     * @returns {Object} The mapped tasks, data types, and tasks
     */

    self.parseFields = function(rows) {

        /* creates a template for parsing the data */
        var taskTemplate = _.reduce(options.subDomains,
            function(result, value){
                if(value.length > 0) result[value] = 0;
                return result;
            }, {});

        var subDomainTemplate = {},
            template = [], templateMap = {}, j = 0;

        var order = ['tasks', 'dataTypes', 'evaluation', 'paradigms', 'evaluators'];

        options.subDomains.forEach(function(subDomain){
            var d = subDomain.trim();
            if(d.length > 0)
            {
                subDomainTemplate[d] = {};

                template.push({key: d, values: [], color: options.colorMap[0][d]});
                templateMap[d] = j++;
            }
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

        var data = _.reduce(rows, function(result, value) {
                /* Parse the User Tasks */
                value.tasks.forEach(function(task){
                    // store the corresponding authors in another array
                    value.subDomain.forEach(function(domain) {
                        if(domain.length === 0) return;
                        // increment the task count
                         result[0][task][domain] += 1;
                        authors[0][domain][task] = authors[0][domain][task] || [];
                        authors[0][domain][task].push({label: value['author'].trim(),
                            year: value['year'], property: 'tasks'});
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
                        authors[1][domain][type].push({label: value['author'].trim(),
                            year: value['year'], property: 'dataTypes'});
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
                        authors[2][subDomain][type].push({label: value['author'].trim(),
                            year: value['year'], property: 'evaluation'});
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
                        authors[3][subDomain][paradigm].push({label: value['author'].trim(),
                            year: value['year'], property: 'paradigms'});
                    });
                });
                //
                // /* Parse the Evaluators */
                result[4][value.year][value.evaluators] += 1;

                /* Parse the author for the evaluator year */
                authors[4][value.evaluators][value.year] = authors[4][value.evaluators][value.year] || [];
                authors[4][value.evaluators][value.year].push({label: value['author'].trim(),
                    year: value['year'], property: 'evaluators'});

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
                    "Qualitative Analysis" : _.cloneDeep(taskTemplate),
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
                            color: options.colorMap[0][k],
                            property: order[i]
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
                        color: options.colorMap[1][k],
                        property: order[4]
                    });
                });
                return result;
            },
            [
                {key: "Domain Experts", values: [], color: "#fbb4ae"},
                {key: "Visualization Experts", values: [], color: "#b3cde3"}
            ]);

        return { tasks: maps[0], dataTypes: maps[1], evaluation: maps[2],
            evaluators: mappedEvaluators, paradigms: maps[3], authors: authors };
    };

};