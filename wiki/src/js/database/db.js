var DB = DB || {};

(function() {

    // This works on all devices/browsers, and uses IndexedDBShim as a final fallback
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
    var self = this;

    var deferred = Q.defer();
    var init = null;

    DB = {

        initializeDB : function(name, cb)
        {
            /** create the scheme **/
            var open = indexedDB.open("BioMed", 1);
            init = deferred.promise;

            open.onerror = function(e)
            {
                alert("Database error: " + event.target.errorCode);
            };

            open.onupgradeneeded = function(event) {

                /** get the database instance **/
                var db = event.target.result;
                self.store = db.createObjectStore("papers", {keyPath: "title"});

                // Create an index to search customers by name. We may have duplicates
                // so we can't use a unique index.
                store.createIndex("title", "title", { unique: true });

            };

            open.oncomplete = function(event)
            {
                deferred.resolve();
            };

            /** when the page exits, clsoe the DB **/
            window.onbeforeunload = function (e)
            {
                self.db.close();
            };

            return open;
        },

        addRecords: function(records)
        {
            console.log(self.store);

            var paperObjStore = self.db.transaction("papers", "readwrite").objectStore("papers");

            init.then(function(){

                records.forEach(function(record, idx)
                {
                    console.log(idx);
                    paperObjStore.add({title: record['Paper Title']});
                });
            });
        }
    };

})();