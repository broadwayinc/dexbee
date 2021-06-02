Query object is used when .get() or .delete() method is used.
<br/>
Although indexedDB does not provide complex queries like SQL, DexBee provides few simple features that are useful:

* [Where](#where)
* [Only](#only)
* [Descending](#descending)
* [Range](#range)

<br/>
  
We will be using the same data schema from [Setting up](./tutorial-1_setup.html):

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

await db.put('stardust', 'act', character);
await db.put('stardust', 'ost', soundtrack);
```

<br/>

## <a name="where"></a>Where

By using 'where' on query argument, we can target specific unique ID of the record.

Since unique ID of the 'act' table are the names of the characters,
<br/>
you can fetch the data of the character named 'DIA' from the table:

```ecmascript 6
let dia = await db.get('stardust', 'act', {where: ['DIA']});

/* returns
    [ 
        [
            {name: "DIA", birth: 3014, ethnicity: {planet: 'Earth', country: 'Korea'}}
        ]
    ]
 */
```

We can target value in indexed key:

```ecmascript 6
let earthlings =
    await db.get('stardust', 'act', {
        where: [{'ethnicity.planet': 'Earth'}]
    });

/* returns
    [
        [
            {name: "Abu", birth: 3025, ethnicity: {planet: 'Earth', country: 'Brazil'}},
            {name: "DIA", birth: 3014, ethnicity: {planet: 'Earth', country: 'Korea'}}
        ]
    ]
 */
```

You can also do multiple 'where' at once:

```ecmascript 6
let dia_and_earthlings =
    await db.get('stardust', 'act', {
        where: ['DIA', {'ethnicity.planet': 'Earth'}]
    });

/* returns
    [
        [
            {name: "DIA", birth: 3014, ethnicity: {planet: 'Earth', country: 'Korea'}}
        ],
        [
            {name: "Abu", birth: 3025, ethnicity: {planet: 'Earth', country: 'Brazil'}},
            {name: "DIA", birth: 3014, ethnicity: {planet: 'Earth', country: 'Korea'}}
        ]
    ]
 */
```

You can also match multiple values based on array of index key values:

```ecmascript 6
let adultEarthling =
    await db.get('stardust', 'act', {
        where: [['Earth', 3025]]
    });

/* returns
    [
        [
            {name: "Abu", birth: 3025, ethnicity: {planet: 'Earth', country: 'Brazil'}}
        ]
    ]
 */
```

<br/>

If the unique ID is a compound key, use array value that match the compound key.
DexBee will try to match the values even if the value array length does not match the compound key length.

Note:
<br/>
If multiple index keys are set in the table, DexBee will always use that index keys to match the given array values of '
where'
<br/>
regardless whether uniqueKey is a compound key or not.
<br/>
Since table 'ost' only have one index key, DexBee will try to match the compound key values of unique ID.

```ecmascript 6
let theTrack =
    await db.get('stardust', 'ost', {
        where: [['DIA', 'Paradise']]
    });

/* returns
    [
        [
            {artist: "DIA", title: 'Paradise', duration: '3:22'}
        ]
    ]
 */

let theTracks =
    await db.get('stardust', 'ost', {
        where: [['DIA']]
    });

/* returns
    [
        [
            {artist: "DIA", title: 'Paradise', duration: '3:22'},
            {artist: "DIA", title: 'Sleepless Night', duration: '4:02'}
        ]
    ]
 */
```

<br/>

## <a name="only"></a>Only

Retrieve value in specific key from the record:

```ecmascript 6
let only = await db.get('stardust', 'ost', {
    only: 'title'
});
/* returns
    ["Paradise", "Paradise", "Sleepless Night", "Aussie Boy"]
 */

// Any combination of query options can be used
let onlyWhere = await db.get('stardust', 'ost', {
    only: 'title',
    where: [['DIA']]
});
/* returns
    [ 
        ["Paradise", "Sleepless Night"]
    ]
 */
```

<br/>

## <a name="descending"></a>Descending

Retrieves value in descending order.
<br/>
Order of the records are in lexicographic order of the unique id,
<br/>
(When index keys are used in 'where', records are ordered in index key values)

```ecmascript 6
let desc = await db.get('stardust', 'ost', {
    only: 'artist',
    descending: true
});
/* returns
    ["UNE", "DIA", "DIA", "Coldplay"]
 */
```

<br/>

## <a name="range"></a>Range

Get 2 records preceding from character 'Abu':

```ecmascript 6
let range = await db.get('stardust', 'act', {
    where: 'Abu',
    range: 2
});
/* returns
    [
        [
            {name: "Abu", birth: 3025, ethnicity: {planet: 'Earth', country: 'Brazil'}},
            {name: "Baksa", birth: 2980, ethnicity: {planet: 'Mars', country: 'Eberswalde'}}
        ]
    ]
 */
```

Get 2 records preceding from character 'UNE' in descending order:

```ecmascript 6
let range = await db.get('stardust', 'act', {
    where: 'UNE',
    only: 'name',
    range: 2,
    descending: true
});
/* returns
    [
        [ 'UNE', 'DIA' ]
    ]
 */
```
 
Get all records matching from 'where' to 'range':

```ecmascript 6
let range = await db.get('stardust', 'ost', {
    where: {duration: '3:00'},
    range: {duration: '4:00'}
});
/* returns
    [
        [
            {artist: "DIA", title: 'Paradise', duration: '3:22'},
            {artist: "UNE", title: 'Aussie Boy', duration: '3:30'}
        ]
    ]
 */
```
