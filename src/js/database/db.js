var DB = DB || {};

(function() {

    var deferred = Q.defer();
    var opened = deferred.promise;

    var self = this;
    
    DB = {

        /** Helper function **/
        getVersionNo: function() { return self.db.verno; },

        initializeDB: function (name, records) {

            Dexie.exists(name).then(function(exists) {

                self.db = new Dexie(name);

                // Define your database schema
                self.db.version(1).stores({
                    papers: '++id, &title, author, *dataTypes, *encodings, *tasks, *paradigms, domain, evaluators, *evaluation'
                });

                // version 2 with the modified data
                self.db.version(2).stores({
                    papers: '++id, &title, author, *dataTypes, *encodings, *tasks, *paradigms, domain, evaluators'
                }).upgrade(function(t)
                {
                    var incomingRecords = _.cloneDeep(records);

                    // update the records that exist
                   return t.papers.toCollection().modify(function(paper) {

                       /** select the paper and remove it from the temporary list **/
                       var updatedRecord = _.find(incomingRecords, {Paper: paper.title});
                       incomingRecords = _.without(incomingRecords, updatedRecord);

                        // update the records
                        paper.title =      updatedRecord["Paper"] ;
                        paper.author  =    updatedRecord["Author"] ;
                        paper.dataTypes =  updatedRecord["Data Types"] ;
                        paper.encodings =  updatedRecord["Encodings"] ;
                        paper.tasks =      updatedRecord["Tasks"] ;
                        paper.paradigms =  updatedRecord["Paradigm"] ;
                        paper.domain =     updatedRecord["SubDomain"] ;
                        paper.evaluators = updatedRecord["Evaluators"] ;
                        paper.evaluation = updatedRecord["Evaluation Type"] ;
                        paper.expertise =  updatedRecord["Single/Mixed Expertise"] ;
                        paper.year =       updatedRecord["Year"] ;
                        paper.url =        updatedRecord["URL"];
                    });
                });

                // version 2 with the modified data
                self.db.version(3).stores({
                    papers: '++id, &title, author, *dataTypes, *encodings, *tasks, *paradigms, domain, evaluators, *evaluation'
                }).upgrade(function(t)
                {
                    var incomingRecords = _.cloneDeep(records);

                    // update the records that exist
                    return t.papers.toCollection().modify(function(paper) {

                        /** select the paper and remove it from the temporary list **/
                        var updatedRecord = _.find(incomingRecords, {Paper: paper.title});
                        incomingRecords = _.without(incomingRecords, updatedRecord);

                        // update the records
                        paper.title =      updatedRecord["Paper"] ;
                        paper.author  =    updatedRecord["Author"] ;
                        paper.dataTypes =  updatedRecord["Data Types"] ;
                        paper.encodings =  updatedRecord["Encodings"] ;
                        paper.tasks =      updatedRecord["Tasks"] ;
                        paper.paradigms =  updatedRecord["Paradigm"] ;
                        paper.domain =     updatedRecord["SubDomain"] ;
                        paper.evaluators = updatedRecord["Evaluators"] ;
                        paper.evaluation = updatedRecord["Evaluation Type"] ;
                        paper.expertise =  updatedRecord["Single/Mixed Expertise"] ;
                        paper.year =       updatedRecord["Year"] ;
                        paper.url =        updatedRecord["URL"];
                    });
                });

                // Open the DB
                self.db.open()
                    .then(function(e) {
                        // DB is open and ready to use
                        deferred.resolve();
                    })
                    .catch(function (e) {
                        console.log("Open failed: " + e);
                });

                // format the incoming data
                var items = [];
                records.forEach(function(record, idx)
                {
                    var item = {
                        title:      record["Paper"],
                        author :    record["Author"],
                        dataTypes:  record["Data Types"],
                        encodings:  record["Encodings"],
                        tasks:      record["Tasks"],
                        paradigms:  record["Paradigm"],
                        domain:     record["SubDomain"],
                        evaluators: record["Evaluators"],
                        evaluation: record["Evaluation Type"],
                        expertise:  record["Single/Mixed Expertise"],
                        year:       record["Year"],
                        url:        record["URL"]
                    };

                    items.push(item);
                });

                // if the DB doesn't exist, populate it
                if (!exists)
                {
                    // Populate the DB with data
                    /** bulk insert the items in the db **/
                    self.db.papers.bulkPut(items)
                        .catch(function(error) {
                            //
                            // Finally don't forget to catch any error
                            // that could have happened anywhere in the
                            // code blocks above.
                            //
                            console.log("Oops: " + error);
                        });
                }

                // else, add the entries that aren't in the table yet
                else {
                    opened.then(function(){

                        self.db.papers.toArray().then(function(results){

                            var newPapers = _.differenceBy(items, results, 'title');

                            /** bulk insert the items in the db **/
                            self.db.papers.bulkPut(newPapers)
                                .catch(function(error) {
                                    //
                                    // Finally don't forget to catch any error
                                    // that could have happened anywhere in the
                                    // code blocks above.
                                    //
                                    console.log("Oops: " + error);
                                });
                        });
                    });
                }

            }).catch(function (error) {
                console.error("Oops, an error occurred when trying to check database existence");
            });
        },

        /** Query for the paper by title **/
        queryPapersByTitle : function(query)
        {
            opened.then(function(){

                switch(query.op) {

                    case 'LIKE':
                        self.db.papers
                            .where(query.attr)
                            .equalsIgnoreCase(query.value)
                            .toArray(function(paper) {
                                console.log(paper);
                            });
                            break;

                    case 'EQUAL':
                        self.db.papers
                            .where(query.attr)
                            .equalsIgnoreCase(query.value)
                            .toArray(function(paper) {
                                console.log(paper);
                            });
                        break;

                    case '_LIKE':
                        self.db.papers
                            .where(query.attr)
                            .startsWithIgnoreCase(query.value)
                            .toArray(function(paper) {
                                console.log(paper);
                            });
                        break;

                    case 'NOT':
                        self.db.papers
                            .where(query.attr)
                            .notEqual(query.value)
                            .toArray(function(paper) {
                                console.log(paper);
                            });
                        break;

                    case 'NOT LIKE':
                        self.db.papers
                            .where(query.attr)
                            .noneOf(query.value)
                            .toArray(function(paper) {
                                console.log(paper);
                            });
                        break;
                }


            });
        },

        queryPapersByDataType : function(query)
        {
            opened.then(function(){

                self.db.papers
                    .where("dataTypes")
                    .anyOf(query)
                    .toArray(function(paper) {
                        console.log(paper);
                    });
            });
        },

        queryPapers : function(query, cb) {

            // Store the papers that are found
            var dataTypes = [], encodings = [], paradigms = [], evaluators = [], domain = [];
            // Promise array
            var promises = [];

            /** make sure the DB is open **/
            opened.then(function(){

                /** query the DB for each of the incoming properties **/

                // SubDomain
                promises.push(self.db.papers
                    .where("domain")
                    .anyOf(query.or.domain)
                    .toArray());

                // Data Types
                promises.push(self.db.papers
                    .where("dataTypes")
                        .anyOf(query.or.dataTypes)
                    .toArray());

                // Paradigms
                promises.push(self.db.papers
                    .where("paradigms")
                    .anyOf(query.or.paradigms)
                    .toArray());

                // Encodings
                promises.push(self.db.papers
                    .where("encodings")
                        .anyOf(query.or.encodings)
                    .toArray());

                // Evaluators
                promises.push(self.db.papers
                    .where("evaluators")
                        .anyOf(query.or.evaluators)
                    .toArray());

                // All possible
                promises.push(self.db.papers
                    .toArray());

                /** when all the queries have resolved, process the data **/
                Promise.all(promises)
                    .then(function(result){

                        var all =  result[result.length-1];
                        var results = all;

                        // /** iterate over the search fields **/
                        for(var i = 0; i < query.and[0].length; i++){

                            /* get the query parameters */
                            var attr = query.and[0][i];
                            var operator = query.and[1][i];
                            var value = query.and[2][i];

                            // Contains the queried string
                            if(operator === 'LIKE'){

                                // get the matching results
                                var output = _.filter(all, function(o) {
                                    return o[attr].toLowerCase().includes(value.toLowerCase()) ;
                                });

                                // store the results
                                results = _.intersection(output, results);
                            }
                            // equals the queried string
                            else if(operator === 'EQUALS'){

                                // get the matching results
                                var output = _.filter(all, function(o) {
                                    return o[attr].toLowerCase() === value.toLowerCase() ;
                                });

                                // store the results
                                results = _.intersection(output, results);
                            }

                            /** date selectors **/
                            else if(operator === 'ON') {

                                // get the matching results
                                var output = _.filter(all, function(o) {
                                    return parseInt(o.year) === new Date(value).getFullYear();
                                });
                                
                                // store the results
                                results = _.intersection(output, results);
                            }

                            else if(operator === 'AFTER') {

                                // get the matching results
                                var output = _.filter(all, function(o) {
                                    return parseInt(o.year) > new Date(value).getFullYear();
                                });

                                // store the results
                                results = _.intersection(output, results);

                            }

                            else if(operator === 'BEFORE') {

                                // get the matching results
                                var output = _.filter(all, function(o) {
                                    return parseInt(o.year) < new Date(value).getFullYear();
                                });

                                // store the results
                                results = _.intersection(output, results);
                            }
                        }

                        /** iterate over all the query items **/
                        _.valuesIn(query.or).forEach(function(attr, idx){

                            // the last result was the query for all records
                            if(idx === result.length-1) return;

                            // if the attribute was queried for, use its results
                            if(attr.length > 0) {
                                results = _.intersectionBy(result[idx], results, 'title');
                            }
                        });

                        /** Invoke the callback with the results **/
                        cb(results);
                    })
                    .catch(function (error) {
                        console.log(error);
                        console.log(arguments);
                    });

            });
        }
    };

})();