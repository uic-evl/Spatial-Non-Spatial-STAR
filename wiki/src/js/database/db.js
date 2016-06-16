var DB = DB || {};

(function() {

    // This works on all devices/browsers, and uses IndexedDBShim as a final fallback
    App.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
    var self = this;

    var deferred = Q.defer()
    var opened = deferred.promise;

    DB = {

        initializeDB : function(name, records)
        {
            /** create the scheme **/
            open = indexedDB.open("BioMed");

            open.onerror = function(e)
            {
                alert("Database error: " + e.target.errorCode);
                console.log(e.target);
            };

            open.onupgradeneeded = function(event) {

                /** get the database instance **/
                self.db = event.target.result;

                var store = self.db.createObjectStore("papers", {keyPath: "title"});

                // Create an index to search papers by title.
                store.createIndex("title", "title", { unique: true });

                // Create an index to search papers by dataTypes, encodings, and tasks
                var advancedKeyPath = ['dataTypes', 'encodings', 'tasks'];
                store.createIndex("advanced", advancedKeyPath, {multiEntry:true});

                store.transaction.oncomplete  = function(event)
                {
                    var paperObjStore = self.db.transaction("papers", "readwrite").objectStore("papers");
                    records.forEach(function(record, idx)
                    {
                        var item = {
                            title:      record['Paper'],
                            author :    record['Author'],
                            dataTypes:  record["Data Types"],
                            encodings:  record["Encodings"],
                            tasks:      record["Tasks"]
                        };

                        paperObjStore.add(item);
                    });
                };

                store.transaction.onerror = function()
                {
                    window.indexedDB.deleteDatabase('BioMed');
                };
            };

            /** The DB is open and ready to use **/
            open.onsuccess = function(event)
            {
                /** get the database instance **/
                self.db = event.target.result;

                var transaction = event.target.result.transaction("papers");
                var objectStore = transaction.objectStore("papers");

                /* get the indexes to search on */
                self.titleIndex = objectStore.index("title");

                /* resolve the promise that the DB is open */
                deferred.resolve();
            };

            /** when the page exits, clsoe the DB **/
            window.onbeforeunload = function (e)
            {
                self.db.close();
            };

            return self.open;
        },

        queryPapersByTitle: function(query)
        {
            opened.then(function(){

                var trans = self.db.transaction('papers', IDBTransaction.READ_ONLY);
                var store = trans.objectStore('papers');

                var request = store.get(query);

                request.onerror = function(event) {
                    console.log(event.target.errorCode);
                };

                request.onsuccess = function(event) {
                    console.log(event.target.result);
                };
            });
        },

        queryPapersByDataType: function(query, callback) {

            opened.then(function(){

                var trans = self.db.transaction('papers', IDBTransaction.READ_ONLY);
                var store = trans.objectStore('papers');
                var index = store.index('advanced');

                var items = [];

                trans.oncomplete = function(evt) {
                    console.log(items);
                    //callback(items);
                };

                var request = index.openCursor(IDBKeyRange.only(['Field', 'Line Chart', 'Explore']));

                request.onerror = function(event) {
                    console.log(event.target.errorCode);
                };

                request.onsuccess = function(event) {

                    var cursor = event.target.result;

                    if (cursor) {
                        items.push(cursor.value);
                        cursor.continue();
                    }
                };

            });

        },

        /** Helper function to get all the records **/
        getAllItems : function (callback) {

            opened.then(function(){

                var trans = self.db.transaction('papers', IDBTransaction.READ_ONLY);
                var store = trans.objectStore('papers');
                var items = [];

                trans.oncomplete = function(evt) {
                    console.log(items);
                    //callback(items);
                };

                var cursorRequest = store.openCursor();

                cursorRequest.onerror = function(error) {
                    console.log(error);
                };

                cursorRequest.onsuccess = function(evt) {
                    var cursor = evt.target.result;
                    if (cursor) {
                        items.push(cursor.value);
                        cursor.continue();
                    }
                };
            });

        },

        closeDB : function()
        {
            self.db.close();
        }
    };

})();