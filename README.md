# DexBee

DexBee is a simple lightweight indexedDB framework for easy setup and indexing.

## Installation

### CDN
Add script tag inside &lt;head&gt;&lt;/head&gt;

```
<script src="https://cdn.jsdelivr.net/npm/dexbee@latest/dist/dexbee.js"></script>
```

### Webpack

```
npm i dexbee
```

And in your javascript:

```
import {DexBee} from 'dexbee';
```

## Basic usage

```ecmascript 6
async function main() {
    let data = [{id: 1, name: 'Tom'}, {id: 2, name: 'Jerry'}];

    // Setup database:
    let db = new DexBee({Cartoon: {TomNJerry: {uniqueKey: 'id', index: 'name'}}});

    // Write to database:
    await db.put('Cartoon', 'TomNJerry', data);

    // Get data:
    let jerry = await db.get('Cartoon', 'TomNJerry', {
        where: {name: 'Jerry'}
    });

    console.log(jerry); // logs [ [{ id: 2, name: 'Jerry'}] ]
}

main();

```

## Documentation

Check out [Getting Started](https://dexbee.io/tutorial-1_setup.html) tutorial from our
website [dexbee.io](https://dexbee.io)

### Issues

Post bugs and feature requests [Here](https://github.com/broadwayinc/dexbee/issues).
<br/>
Any Contributions are welcomed :)

### License

MIT License.
<br/>
Copyright (c) 2021-present, broadway Inc.