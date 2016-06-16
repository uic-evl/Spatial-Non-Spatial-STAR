var DB = DB || {};

(function() {

    var deferred = Q.defer();
    var opened = deferred.promise;

    var self = this;

    DB = {

        initializeDB: function (name, records) {

            Dexie.exists(name).then(function(exists) {

                self.db = new Dexie(name);

                // Define your database schema
                self.db.version(1).stores({
                    papers: '++id, &title, author, *dataTypes, *encodings, *tasks'
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

                // if the DB doesn't exist, populate it
                if (!exists)
                {
                    // Populate the DB with data
                    var items = [];
                    records.forEach(function(record, idx)
                    {
                        var item = {
                            title:      record['Paper'],
                            author :    record['Author'],
                            dataTypes:  record["Data Types"],
                            encodings:  record["Encodings"],
                            tasks:      record["Tasks"]
                        };

                        items.push(item);
                    });

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

            }).catch(function (error) {
                console.error("Oops, an error occurred when trying to check database existance");
            });
        },

        /** Query for the paper by title **/
        queryPapersByTitle: function(query)
        {
            opened.then(function(){

                self.db.papers
                    .where("title")
                    .equalsIgnoreCase(query)
                    .toArray(function(paper) {
                        console.log(paper);
                    });
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

        }
    };

})();