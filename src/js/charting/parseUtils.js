'use strict';
var Parser2 = function(options) {

    var self = this;

    function formatBubbleData(data, yProp){

        // map the data to be alphabetical by the yProperty
        data = _.sortBy(_.toPairs(data), function(o){ return o[0] });

        // Finally, map to the format needed for the chart
        var max = 0;
        var output = [];
        data.forEach(function(o){

            var key = o[0];
            var values = o[1];

            var localMax = _.max(_.values(values));
            max = Math.max(max, localMax);

            var obj = {};
            obj.groups = [];
            obj.yProp = key;

            var pairs = _.toPairs(values);
            pairs.forEach(function(arr){
                obj.groups.push({label: arr[0], value: parseInt(arr[1])});
            });

            output.push(obj);
        });

        return {data : output , max: max};
    }

    self.parseArbFields = function(rows, xProp, yProp) {

        var authors = {}, subDomains = {};

        var template = {},
            xDomain = [],
            yDomain = [];

        /* Because not in the search model */
        if(yProp == "tasks")
        {
            yDomain = d3.keys(App.tasks[0]).filter(function(key) {
                return key !== "Author" && key !== "Year" && key !== "Sub-Domain";  });
        }
        else
        {
            $('#accordion').find('input[name=' + yProp + ']').each(function() {
                yDomain.push($(this).attr('value'));

            });
        }
        if(xProp == "tasks")
        {
            xDomain = d3.keys(App.tasks[0]).filter(function(key) {
                return key !== "Author" && key !== "Year" && key !== "Sub-Domain";  });
        }
        else {
            $('#accordion').find('input[name=' + xProp + ']').each(function() {
                xDomain.push($(this).attr('value'));
            });
        }

        /* construct the template for the parsing and the x/y domains */
        rows.forEach(function(row){

            if(_.isArray(row[yProp]))
            {
                row[yProp].forEach(function(y){

                    template[y] = {};
                    authors[y] = {};
                    subDomains[y] = {};

                    //if (yDomain.indexOf(y) < 0) yDomain.push(y);
                });
            }
            else
            {
                authors[row[yProp]] = {};
                template[row[yProp]] = {};
                subDomains[row[yProp]] = {};

                //if (yDomain.indexOf(row[yProp]) < 0) yDomain.push(row[yProp]);
            }
        });

        _.difference(yDomain, _.keys(subDomains)).forEach(function(y) {
            authors[y] = {};
            template[y] = {};
            subDomains[y] = {};
        });


        xDomain.sort();
        yDomain.sort();

        /** iterate over the resutls to combine the encodings **/
        var output = _.reduce(rows, function(result, value, key) {

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
                            subDomains[s][n] = subDomains[s][n] || {};
                            value.subDomain.forEach(function(sub){
                                subDomains[s][n][sub] = subDomains[s][n][sub] || 0;
                                subDomains[s][n][sub] += 1;
                            });
                        }
                    });
                });
                return result;
            },
            _.cloneDeep(template)
        );

        // Format the data to fit into the bubble chart
        output = formatBubbleData(output, yProp);

        return {pairings : output.data, authors: authors, xDomain : xDomain,
            yDomain : yDomain, subDomains: subDomains, max: output.max};

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

                        if(subDomain.length === 0) return;

                        if(subDomains[s][n][subDomain])
                        {
                            subDomains[s][n][subDomain] += 1;
                        }
                        else
                        {
                            subDomains[s][n][subDomain] = 1;
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

};