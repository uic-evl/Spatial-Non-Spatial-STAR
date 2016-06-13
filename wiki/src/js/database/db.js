var DB = DB || {};

(function() {

    // This works on all devices/browsers, and uses IndexedDBShim as a final fallback
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
    var self = this;

    DB = {

        initializeDB : function(name, cb)
        {

            /** create the scheme **/
            var open = indexedDB.open("BioMed", 1);

            open.onupgradeneeded = function() {

                var db = open.result;
                var store = db.createObjectStore("MyObjectStore", {keyPath: "title"});
                store.createIndex("TitleIndex", ["title"]);

            };
            open.onsuccess = function() {

                // Start a new transaction
                self.db = open.result;
                self.tx = self.db.transaction("MyObjectStore", "readwrite");

                self.store = self.tx.objectStore("MyObjectStore");
                self.index = self.store.index("NameIndex");

                // // Query the data
                // var getJohn = store.get(12345);
                // var getBob = index.get(["Smith", "Bob"]);
                //
                // getJohn.onsuccess = function() {
                //     console.log(getJohn.result.name.first);  // => "John"
                // };
                //
                // getBob.onsuccess = function() {
                //     console.log(getBob.result.name.first);   // => "Bob"
                // };

            };

            /** when the page exits, clsoe the DB **/
            window.onbeforeunload = function (e)
            {
                self.db.close();
            };

            return self;
        },

        addRecords: function(records)
        {

            console.log(records);
            // records.forEach(function(record, idx)
            // {
            //     //store.put({ title:  });
            // });

        }

    };

})();