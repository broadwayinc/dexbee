/**
 * DexBee is a lightweight, simple indexed DB framework.
 * <li>Setup your database schema easily.</li>
 * <li>Put, Delete, Get and indexing made simple.</li>
 * <br>
 * Example:
 * <br>
 *
 * ```
 // - DexBee tutorial -

 // DexBee is a indexedDB based framework library.
 // Here, we are going to build a database about the movie 'Stardust' (Not a real movie).

 // Below, we have two array of JSON data that we would like to store in the DexBee database.
 // Then, we will index and get the data from DexBee.

 let characters = [
     {name: "DIA", birth: 3014, ethnicity: {planet: 'Earth', country: 'Korea'}},
     {name: "UNE", birth: 3025, ethnicity: {planet: 'Jupiter', country: 'Great Red Republic'}},
     {name: "Baksa", birth: 2980, ethnicity: {planet: 'Mars', country: 'Eberswalde'}},
     {name: "Abu", birth: 3025, ethnicity: {planet: 'Earth', country: 'Brazil'}}
 ];

 let soundtracks = [
     {artist: "DIA", title: 'Paradise', duration: '3:22'},
     {artist: "DIA", title: 'Sleepless Night', duration: '4:02'},
     {artist: "UNE", title: 'Aussie Boy', duration: '3:30'},
     {artist: "Coldplay", title: 'Paradise', duration: '4:37'},
 ];

 // Now, we are creating a new instance of DexBee database.
 // The constructor argument requires the database schema object.
 // First thing we should do is carefully plan the schema of the database.
 let db = new DexBee({
            // We are going to name our database, 'stardust'. (You can change it to whatever you want)
            stardust: {

                // Inside 'stardust', let's create 'act' and 'ost' tables. (You can change it to whatever you want)
                // We will use 'act' table for storing characters, and 'ost' for soundtracks.
                act: {
                    // Inside each tables, we need to specify the unique keys and the index keys.
                    // Since we know the character names are all unique, we will use that value to be the unique id of the record.
                    uniqueKey: 'name',

                    // Next, we can setup the index keys. you can set list of keys you want to be indexed within each tables.
                    // For 'act' table, we will index multiple key values - Where the character is from, birth year, and the character's name.
                    // ['ethnicity.planet', 'birth', 'name']
                    // When setting up the list of index keys, rule is to make more general keys prior to the unique keys.
                    index: ['ethnicity.planet', 'birth', 'name']
                },

                ost: {
                    // Remember, we must to set the unique key to point to the value that can be used as unique id of the record.
                    // Otherwise any new record that have a same unique id will overwrite the previous record.
                    // In our soundtracks data, we can predict neither key value will be unique.
                    // To solve this, we can make a compound key to make it unique.
                    // By setting up compound key with 'artist' and 'title' we can make the record to have a unique id.
                    // When setting up the compound key, rule is to make more general keys prior to the unique keys.
                    uniqueKey: ['artist', 'title'],

                    // For 'ost' table, we will just index the duration of the song.
                    index: 'duration'
                }
            }
        }, 16);

 // Now we have setup the database,
 // we can use db.put(<string: database name>, <string: table name>, <JSON[] | JSON>) to store our data to the corresponding tables.
 await db.put('stardust', 'act', characters);
 await db.put('stardust', 'ost', soundtracks);

 // To retrieve the data, we can use db.get(<string: database name>, <string: table name>, <object: query>).
 // When used without query argument, db.get() will fetch all the data inside the table, and it's ordered in unique id value.
 let act = await db.get('stardust', 'act');
 console.log({act});
 let ost = await db.get('stardust', 'ost');
 console.log({ost});

 // IndexedDB does not provide complex queries like SQL.
 // But DexBee provides few simple features you can use.

 // - Where -
 // Fetch all data that has certain value (case-sensitive).
 // DexBee will look through matching unique id values.
 let act_where = await db.get('stardust', 'act', {
            where: ['DIA', 'Abu']
        });
 console.log({act_where});

 // If unique id is a compound key, DexBee will compare the corresponding index of keys.
 // In soundtracks, our uniqueKey setting is ['artist', 'title']
 let ost_where_compound = await db.get('stardust', 'ost', {
            where: [['DIA'], ['Coldplay', 'Paradise']]
        });
 // Note: If index setting has a multiple key names, DexBee will use the indexed key arrays instead of unique compound key.
 console.log({ost_where_compound});

 // Fetch all data that has a certain value in certain index (case-sensitive).
 let act_where_index = await db.get('stardust', 'act', {
            where: [{'ethnicity.planet': 'Earth'}, {birth: 3025}]
        });
 console.log({act_where_index});

 // Fetch all data that matches multiple values in index array.
 let act_where_multi = await db.get('stardust', 'act', {
            where: [['Earth', 3025], ['Mars', 2980]]
        });
 console.log({act_where_multi});

 // - Only -
 //  Only returns a value in certain key.
 let act_only = await db.get('stardust', 'act', {
            where: [['Earth', 3025], ['Mars', 2980]],
            only: 'name'
        });
 console.log({act_only});

 // - Descending -
 // Returns list in descending order.
 let ost_desc = await db.get('stardust', 'ost', {
            descending: true
        });
 console.log({ost_desc});

 // - Range -
 // Range can used to fetch certain counts of records, or records between certain values.

 // List 2 records after 'Abu'
 let act_range = await db.get('stardust', 'act', {
            where: ['Abu'],
            range: 2
        });
 console.log({act_range});

 // List 2 records from end of the list
 let ost_range = await db.get('stardust', 'ost', {
            range: 2,
            descending: true
        });
 console.log({ost_range});

 // List records between certain values. Ranging between only works in same index of the 'where' value.
 let act_range_between = await db.get('stardust', 'act', {
            where: {birth: 3000},
            range: {birth: 3030},
            only: 'name',
            descending: true,
        });
 console.log({act_range_between});
 * ```
 */
export class DexBee {
    /**
     * Setup schema for indexed DB.
     * @param {object} schema - Database schema.
     * @param {array[] | string[]} schema[db_name][table_name].uniqueKey - Key names of unique value in data. Corresponds the same index of table array.<br>Can be set as compound key name arrays. [general ...unique]
     * @param {array[] | string[]} schema[db_name][table_name].index - Generate indexes. [general ...unique]
     * @param {number} [version=1] - Specify database version number.<br>If the database version is higher than the previous version, The database will reinitialize the table and the data inside.
     */
    constructor(schema, version = 1) {
        if (typeof window === 'undefined') {
            // this is nodejs
            return;
        }

        if (!schema)
            throw 'NO_SCHEMA';

        this.version = version;
        this.db = {};

        this.ready = (() => {
            return new Promise((res, rej) => {
                for (let n in schema) {
                    let dbset = schema[n];
                    if ((!Array.isArray(dbset.table) && dbset.table?.length))
                        throw 'INVALID_TABLE_SETTING';
                }

                let open = {};
                let eventListener = {};
                for (let dbname in schema) {
                    if (!schema.hasOwnProperty(dbname))
                        continue;

                    open[dbname] = window.indexedDB.open(dbname, version);

                    eventListener[dbname] = {};
                    eventListener[dbname].success = (function (e) {
                        if (!this.db[dbname])
                            this.db[dbname] = e.target.result;
                        res(true);
                    }).bind(this);
                    eventListener[dbname].error = (function (e) {
                        rej(e);
                    }).bind(this);
                    eventListener[dbname].upgradeneeded = (function (e) {
                        let newdb = e.target.result;
                        let o = e.oldVersion, n = e.newVersion || newdb.version;

                        this.db[dbname] = newdb;
                        for(let table in schema[dbname]) {
                            let keyPath = schema[dbname][table].uniqueKey,
                                index = schema[dbname][table].index;
                            let chk = {table, keyPath, index};
                            for (let v in chk)
                                if (!chk[v])
                                    rej(`MISSING_SCHEMA: ${v}`);

                            if (newdb.objectStoreNames.contains(table))
                                newdb.deleteObjectStore(table);

                            let store = newdb.createObjectStore(table, {keyPath});
                            if (index) {
                                if (Array.isArray(index)) {
                                    let indexParse = [];
                                    for (let i of index) {
                                        if (Array.isArray(i))
                                            indexParse.push(i[0]);
                                        else indexParse.push(i);
                                    }
                                    store.createIndex(table + '_index', indexParse, {unique: false});
                                    for (let i of index)
                                        store.createIndex(Array.isArray(i) ? i[0] : i, i, {unique: false});

                                } else
                                    store.createIndex(index, index, {unique: false});
                            }
                        }

                        let transaction = e.target.transaction;
                        transaction.oncomplete = (e) => {
                            res(true);
                        };

                    }).bind(this);

                    open[dbname].addEventListener('success', eventListener[dbname].success);
                    open[dbname].addEventListener('error', eventListener[dbname].error);
                    open[dbname].addEventListener('upgradeneeded', eventListener[dbname].upgradeneeded);
                }
            });
        })();
    }

    /**
     * Delete data from database.
     * @param {string} dbname - Database name.
     * @param {string} table - Target table.
     * @param {object} query - Query.
     * @param {string | string[] | array[]} [query.key] - Target key. If omitted, deletes all data from the table. [[key1, key2]] for multiple key index.
     * @param {number | string | string[]} [query.range] - Number of data to delete after key. (positive = descending, negative = ascending). String | array of key name to fetch between.
     * @returns {Promise<any>}
     */
    async delete(dbname, table, query) {
        return await this._exec(dbname, table, query, 'delete');
    }

    /**
     * Get data from database.
     * @param {string} dbname - Database name.
     * @param {string} table - Target table.
     * @param {object} [query] - Query.
     * @param {string[] | array[]} [query.key] - Target key. If omitted, Fetches all data from the table. [[key1, key2]] for multiple key index.
     * @param {number | string | string[]} [query.range] - Number of data to fetch after key. (positive = descending, negative = ascending). string | array of key name to fetch between.
     * @param {boolean} [query.descending] - Descending when true.
     * @param {string} [query.only] - Key value to fetch.
     * @returns {Promise<array>} - Fetched data.
     */
    async get(dbname, table, query) {
        return await this._exec(dbname, table, query, 'get');
    }

    /**
     * Write data to database.
     * @param {string} dbname - Database name.
     * @param {string} table - Target table.
     * @param {object | object[]} data - Data to write.
     * @returns {Promise<boolean>}
     */
    put(dbname, table, data) {
        if (!Array.isArray(data))
            data = [data];

        return new Promise(async (res) => {
            let tx = await this._set(dbname, table);
            tx.oncomplete = () => {
                res(true);
            };

            let put = tx.objectStore(table);
            // add data
            for (let d of data)
                put.put(d);
        });
    }

    async _exec(dbname, table, query, exec) {
        await this.ready;

        let {where = null, range, unique, only, descending} = query || {};

        let _descending = typeof descending === 'boolean' ? descending : (typeof range === 'number' ? (range < 0) : false);

        return new Promise(async (res, rej) => {
            let tx = await this._set(dbname, table, exec === 'get' ? 'readonly' : 'readwrite');
            let fetch = tx.objectStore(table), index = fetch;

            if (fetch.indexNames.contains(table + '_index'))
                index = fetch.index(table + '_index');

            tx.oncomplete = e => {
                res(e.target.result);
            };

            where = Array.isArray(where) ? where : where ? [where] : null;

            let mode = range ? 'RANGE' : where ? 'KEYS' : null;

            let debug = {
                where: JSON.parse(JSON.stringify(where))
            };

            let locateIndex = (where, range) => {
                // locate index
                let database = fetch;

                if (Array.isArray(where))
                    database = index;

                else if (where && typeof where === 'object') {
                    if (Object.keys(where).length === 1 && fetch.indexNames.contains(Object.keys(where)[0])) {
                        // index name is the key of the where object
                        database = fetch.index(Object.keys(where)[0]);

                        // 'where' is the value inside the where object
                        where = where[Object.keys(where)[0]];
                    } else
                        throw 'NO_INDEX';
                }

                let query = where;
                let keyFill = (k, isRange) => {
                    if (Array.isArray(k)) {
                        for (let b of k)
                            if (!b)
                                throw `INVALID_${isRange ? 'RANGE' : 'WHERE'}_VALUE: ${JSON.stringify(debug.where)}`;
                    } else if (typeof k === 'object' && isRange)
                        k = k[Object.keys(k)[0]];

                    // else if (!k)
                    //     throw `INVALID_${isRange ? 'RANGE' : 'WHERE'}_VALUE: ${JSON.stringify(debug.where)}`;

                    let rangeIter =
                        (Array.isArray(database.keyPath) ? database.keyPath.length : 1) -
                        (Array.isArray(k) ? k.length : 1);

                    if (rangeIter > 0) {
                        let upperBound = null;
                        while (rangeIter--) {
                            if (!Array.isArray(upperBound))
                                upperBound = Array.isArray(k) ? [...k] : k ? [k] : _descending ? ['\uffff'] : [null];
                            upperBound.push('\uffff');
                        }
                        return {where: k, upperBound};
                    }
                    return k;
                };

                let keyRange = keyFill(where);
                if (range) {
                    if (typeof range === 'number') {
                        let bound = _descending ? (keyRange?.upperBound || where) : where;
                        if (bound || _descending)
                            query = window.IDBKeyRange[(_descending ? 'upper' : 'lower') + 'Bound'](bound || (_descending ? '\uffff' : null), true);
                        else
                            query = descending ? '\uffff' : null;
                    } else {
                        let rangeKey = keyFill(range, true);
                        query = window.IDBKeyRange.bound(where, rangeKey.upperBound || rangeKey);
                    }
                } else if (typeof keyRange === 'object' && keyRange.where)
                    query = window.IDBKeyRange.bound(where, keyRange.upperBound);

                return {database, query};
            };

            switch (mode) {
                case 'KEYS': {
                    // get keys
                    let list = [];
                    for (let k of where)
                        list.push(new Promise((res, rej) => {
                            let reIndex = locateIndex(k);
                            let {database, query} = reIndex;
                            if (exec === 'get') {
                                if (unique) {
                                    let get = database.openCursor(query, 'nextunique');
                                    let data_push = [];
                                    get.onsuccess = e => {
                                        let data = e.target.result;
                                        if (data) {
                                            let value = data.value;
                                            if (only)
                                                value = value[only];
                                            data_push.push(value);
                                            data.continue();
                                        } else {
                                            if (descending)
                                                data_push.reverse();

                                            res(data_push);
                                        }
                                    };
                                    get.onerror = e => {
                                        rej(e.target.error);
                                    };
                                } else {
                                    let get = database.getAll(query);
                                    get.onerror = e => {
                                        rej(e.target.error);
                                    };
                                    get.onsuccess = e => {
                                        let data = e.target.result;
                                        if (descending)
                                            data.reverse();
                                        let onlyData = [];

                                        if (only) {
                                            for (let d of data)
                                                onlyData.push(d[only]);
                                        }

                                        res(onlyData.length ? onlyData : data);
                                    };
                                }
                            } else if (exec === 'delete') {
                                let del = database.delete(query);
                                del.onerror = e => {
                                    rej(e);
                                };
                            }
                        }));
                    res(Promise.all(list));
                    break;
                }
                case 'RANGE': {
                    // get range

                    if (where)
                        where = _descending ? where[where.length - 1] : where[0];

                    let index = locateIndex(where, range);

                    if (typeof range === 'number' || unique) {
                        let count = typeof range === 'number' ? Math.abs(range) : true;

                        let r = index.database.openCursor(index.query, (_descending ? 'prev' : 'next') + (unique ? 'unique' : ''));
                        let data_push = [];
                        r.onsuccess = e => {
                            let data = e.target.result;

                            if (data && count) {
                                let value = data.value;
                                if (exec === 'get') {
                                    if (only)
                                        value = value[only];
                                    data_push.push(value);
                                } else if (exec === 'delete')
                                    data.delete();

                                if (typeof count === 'number')
                                    count--;
                                data.continue();
                            } else
                                res(exec === 'get' ? data_push : true);
                        };
                        r.onerror = e => {
                            rej(e.target.error);
                        };
                    } else {
                        let r = exec === 'get' ? index.database.getAll(index.query) : index.database.delete(index.query);
                        r.onerror = e => {
                            rej(e.target.error);
                        };
                        r.onsuccess = e => {
                            let data = e.target.result;
                            if (exec === 'get' && _descending)
                                data.reverse();

                            let onlyData = [];
                            if (only) {
                                for (let d of data)
                                    onlyData.push(d[only]);
                            }
                            res(onlyData.length ? onlyData : data);
                        };
                    }
                    break;
                }
                default:
                    // get all
                    let a = fetch.getAll();
                    a.onerror = e => {
                        rej(e.target.error);
                    };
                    a.onsuccess = e => {
                        let data = e.target.result;
                        if (_descending)
                            data.reverse();
                        res(data);
                    };
            }
        });
    }

    async _set(dbname, table, mode = 'readwrite') {
        await this.ready;
        let tx = this.db[dbname].transaction(table, mode);
        tx.onerror = e => {
            console.error(e.target.error);
        };
        return tx;
    }
}