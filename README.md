# DexBee
DexBee is a simple lightweight indexedDB framework for easy setup and indexing.
<br/>
<br/>

### Installation
Add script tag inside &lt;head&gt;&lt;/head&gt;

```
<script src="https://broadwayinc.dev/jslib/dexbee/0.1.0/dexbee.js"></script>
```
<br/>
For webpack based projects:

```
npm i dexbee
```
And in your javascript:
```
import {DexBee} from 'dexbee';
```
<br/>

### Basic usage

```
let data = [
    { id: 1, name: 'Tom'},
    { id: 2, name: 'Jerry'}
];

let db = new DexBee(
    {
        Cartoon: {
            TomNJerry: {
                uniqueKey: 'id',
                index: 'name'
            }
        }
    });

async runDatabase() {
    await db.put('Cartoon', 'TomNJerry', data); // Write to data base
    
    let jerry = await db.get('Cartoon', 'TomNJerry', {
        where: {name: 'Jerry'}
    });
    
    console.log(jerry); // logs [ [{ id: 2, name: 'Jerry'}] ]
}

runDatabase();

```
<br/>

### License
[MIT](https://opensource.org/licenses/MIT)
