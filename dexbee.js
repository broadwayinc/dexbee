class DexBee {
    /**
     * See [Getting Started]{@tutorial 1_setup}
     * @param {object} schema - Database schema.
     * @param {array[] | string[] | string} schema[db_name][table_name].uniqueKey - Key names of unique value in data.
     * @param {array[] | string[] | string} schema[db_name][table_name].index - Key names to generate indexes.
     * @param {number} [version=1] - Specify database version number.<br>If the database version is higher than the previous version, DexBee will initialize the table and the data inside.
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
                        for (let table in schema[dbname]) {
                            let keyPath = schema[dbname][table].uniqueKey,
                                index = schema[dbname][table].index;
                            let chk = { table, keyPath, index };
                            for (let v in chk)
                                if (!chk[v])
                                    rej(`MISSING_SCHEMA: ${v}`);

                            if (newdb.objectStoreNames.contains(table))
                                newdb.deleteObjectStore(table);

                            let store = newdb.createObjectStore(table, { keyPath });
                            if (index) {
                                if (Array.isArray(index)) {
                                    let indexParse = [];
                                    for (let i of index) {
                                        if (Array.isArray(i))
                                            indexParse.push(i[0]);
                                        else indexParse.push(i);
                                    }
                                    store.createIndex(table + '_index', indexParse, { unique: false });
                                    for (let i of index)
                                        store.createIndex(Array.isArray(i) ? i[0] : i, i, { unique: false });

                                } else
                                    store.createIndex(index, index, { unique: false });
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
     * <br/>
     * See [Queries]{@tutorial 2_query}
     *
     * ```
     * // let db = new DexBee(schema);
     * // ...
     * db.delete('database_name', 'table_name'}).then(() => {
     *      // Delete success
     * });
     * ```
     * @param {string} dbname - Database name.
     * @param {string} table - Target table.
     * @param {object} [query] - Query.
     * @param {any[]} [query.where] - Target key. If omitted, deletes all data from the table. [ [key1, key2, ...] ] for multiple matches.
     * @param {any[] | number} [query.range] - Number of data to delete after key. (positive = descending, negative = ascending).<br/>Or key values to fetch in between.
     * @returns {Promise<boolean>}
     */
    async delete(dbname, table, query) {
        return await this._exec(dbname, table, query, 'delete');
    }

    /**
     * Get data from database.
     * <br/>
     * See [Queries]{@tutorial 2_query}
     * ```
     * // let db = new DexBee(schema);
     * // ...
     * db.get('database_name', 'table_name').then(data => {
     *      // data
     * });
     * ```
     * @param {string} dbname - Database name.
     * @param {string} table - Target table.
     * @param {object} [query] - Query.
     * @param {any[]} [query.where] - Target key. If omitted, Fetches all data from the table. [ [key1, key2] ] for multiple matches.
     * @param {any[] | number} [query.range] - Number of data to fetch after key. (positive = descending, negative = ascending).<br/>Or key values to fetch in between.
     * @param {boolean} [query.descending] - Descending when true.
     * @param {string} [query.only] - Key value to fetch.
     * @param {string} [query.unique] - Fetch only unique indexes.
     * @returns {Promise<array[]>} - Fetched data.
     */
    async get(dbname, table, query) {
        return await this._exec(dbname, table, query, 'get');
    }

    /**
     * Write data to database.
     * ```
     * // let db = new DexBee(schema);
     * // ...
     * db.put('database_name', 'table_name', data).then(() => {
     *      // Write success
     * });
     * ```
     * @param {string} dbname - Database name.
     * @param {string} table - Target table.
     * @param {object[] | object} data - Data to write.
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

        let { where = null, range, unique, only, descending } = query || {};

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
                        return { where: k, upperBound };
                    }
                    return k;
                };

                let keyRange = keyFill(where);
                if (range) {
                    if (typeof range === 'number') {
                        let bound = _descending ? (keyRange?.upperBound || where) : where;
                        if (bound || _descending)
                            query = window.IDBKeyRange[(_descending ? 'upper' : 'lower') + 'Bound'](bound || (_descending ? '\uffff' : null)); //, true
                        else
                            query = descending ? '\uffff' : null;
                    } else {
                        let rangeKey = keyFill(range, true);
                        query = window.IDBKeyRange.bound(where, rangeKey.upperBound || rangeKey);
                    }
                } else if (typeof keyRange === 'object' && keyRange.where)
                    query = window.IDBKeyRange.bound(where, keyRange.upperBound);

                return { database, query };
            };

            switch (mode) {
                case 'KEYS': {
                    // get keys
                    let list = [];
                    for (let k of where)
                        list.push(new Promise((res, rej) => {
                            let reIndex = locateIndex(k);
                            let { database, query } = reIndex;
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
                            let onlyData = [];

                            if (exec === 'delete')
                                data.delete();
                            else {
                                if (exec === 'get' && _descending)
                                    data.reverse();

                                if (only) {
                                    for (let d of data)
                                        onlyData.push(d[only]);
                                }
                            }
                            res(exec === 'get' ? (onlyData.length ? onlyData : data) : true);
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
                        let only_arr;
                        if (only)
                            only_arr = data.map(o => {
                                return o?.[only];
                            });

                        res(only_arr || data);
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

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.jsonCrawler = factory();
    }
}(this, function () {
    // Your function here
    return DexBee;
}));