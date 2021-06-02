We are going to build indexedDB database using DexBee.
<br/>
To create a new instance of DexBee, we should plan the schema of the database based on the data we plan to store.
<br/>
<br/>

#### JSON data to store in indexedDB:

```ecmascript 6
let character = [
    {name: "DIA", birth: 3014, ethnicity: {planet: 'Earth', country: 'Korea'}},
    {name: "UNE", birth: 3025, ethnicity: {planet: 'Jupiter', country: 'Great Red Republic'}},
    {name: "Baksa", birth: 2980, ethnicity: {planet: 'Mars', country: 'Eberswalde'}},
    {name: "Abu", birth: 3025, ethnicity: {planet: 'Earth', country: 'Brazil'}}
];

let soundtrack = [
    {artist: "DIA", title: 'Paradise', duration: '3:22'},
    {artist: "DIA", title: 'Sleepless Night', duration: '4:02'},
    {artist: "UNE", title: 'Aussie Boy', duration: '3:30'},
    {artist: "Coldplay", title: 'Paradise', duration: '4:37'}
];
```
<br/>

### The schema:
```ecmascript 6
let schema = {
    stardust: {
        act: {
            uniqueKey: 'name',
            index: ['ethnicity.planet', 'birth']
        },
        ost: {  
            uniqueKey: ['artist', 'title'],
            index: 'duration'
        }
    }
}
```

The parent key name 'stardust' is the name of the indexedDB database we will create.
<br/>
Inside, the key name 'act' and 'ost' are the name of tables we will create.

Each of these tables are going to be used to store our
character and soundtrack data.
<br/>
<br/>

#### Table Settings for 'act':

```ecmascript 6
/*
let character = [
    {name: "DIA", birth: 3014, ethnicity: {planet: 'Earth', country: 'Korea'}},
    ...
];

let schema = {
    ...
        act: {
            uniqueKey: 'name',
            index: ['ethnicity.planet', 'birth']
        },
    ...
}
*/
```
To store the character data inside table 'act', we should set the 'uniqueKey' and 'index'.
<br/>
Since we know each character names are unique,
we will use the key name 'name' as the unique ID of the record.

For indexing, key name of the character's planet and birth year is used.
<br/>
By setting up these index keys, DexBee will be able to query these data afterward.
<br/>
<br/>

#### Table Settings for 'ost':
```ecmascript 6
/*
let soundtrack = [
    ...
    {artist: "DIA", title: 'Paradise', duration: '3:22'},
    {artist: "Coldplay", title: 'Paradise', duration: '4:37'}
];

let schema = {
    ...
        ost: {  
            uniqueKey: ['artist', 'title'],
            index: 'duration'
        }
    ...
}
*/
```

Table 'ost' will be used to store our soundtrack data.
<br/>
Notice the setting of uniqueKey on 'ost' table is an array.

Remember, we must set the 'uniqueKey' that can be used as unique id of the record.
<br/>
Otherwise, any new record that has a same unique id will overwrite the previous record.

In our soundtracks data,
we can predict neither of the key values will have a unique value.
<br/>
To solve this, setting up a compound key with 'artist' and 'title'
can make a unique id.

For indexing, we will use the duration value.
<br/>
<br/>

### Starting DexBee instance:

```ecmascript 6
let schema = {
    stardust: {
        act: {
            uniqueKey: 'name',
            index: ['ethnicity.planet', 'birth']
        },
        ost: {  
            uniqueKey: ['artist', 'title'],
            index: 'duration'
        }
    }
}
let db = new DexBee(schema);
```

#### Read and write data to indexedDB:
```ecmascript 6
// Write data
await db.put('stardust', 'act', character);
await db.put('stardust', 'ost', soundtrack);

// Read data
let act = await db.get('stardust', 'act');
let ost = await db.get('stardust', 'ost');
```
<br/>

Next: [Queries](./tutorial-2_query.html)