# k-pipeline

**Executes a bunch of callback styled functions serially**

[![npm status](http://img.shields.io/npm/v/k-pipeline.svg?style=flat-square)](https://www.npmjs.org/package/k-pipeline) [![Travis build status](https://img.shields.io/travis/kessler/node-k-pipeline.svg?style=flat-square&label=travis)](http://travis-ci.org/kessler/node-k-pipeline) [![Dependency status](https://img.shields.io/david/kessler/node-k-pipeline.svg?style=flat-square)](https://david-dm.org/kessler/node-k-pipeline)

## example - flow control

`npm i k-pipeline`

```js
const Pipeline = require('k-pipeline')

let pipeline = Pipeline.create([
    
    // state is just a new javascript object
    (state, next, stop) => { next() },

    // stop the execution in the middle -> jump directly to final callback
    (state, next, stop) => { stop() }, 
    
    // this will not be executed
    (state, next, stop) => { next() } 
])

pipeline.run((err, state) => {
})
```

### example - custom state

```js
const Pipeline = require('k-pipeline')

let aState = { foo: 'bar' }
let pipeline = Pipeline.create([
    (state, next, stop) => { 
        console.log(state === aState) // true
        next()
    }
])

// override constructor state
pipeline.run(aState, (err, state) => {
    console.log(state === aState) // true
})
```

### example - reuse the pipeline

```js
const Pipeline = require('k-pipeline')

let aState = { foo: 'bar' }
let pipeline = Pipeline.create([
    (state, next, stop) => { next() }
])

// state will reset to a new javascript object each run()
pipeline.run((err, state) => {
    pipeline.run((err, state) => { 
    })
})
```

### example - error in the pipe
```js
const Pipeline = require('k-pipeline')

let error = new Error()
let pipeline = Pipeline.create([
    (state, next, stop) => { next(error) },
    (state, next, stop) => { next() } // will not be executed
])

pipeline.run((err, state) => {
    console.log(error === err) //true
})
```

### example - stuff you can't do

##### call a callback twice

```js
const Pipeline = require('k-pipeline')

let pipeline = Pipeline.create([
    (state, next, stop) => { 
        next()
        next() // throws an error
    }
])

pipeline.run((err, state) => {})
```

##### call run() twice in the same tick

```js
const Pipeline = require('k-pipeline')

let pipeline = Pipeline.create([
    (state, next, stop) => { next() }
])

pipeline.run((err, state) => {})
pipeline.run((err, state) => {}) // throws an error
```

## install

With [npm](https://npmjs.org) do:

```
npm install k-pipeline
```

## license

[MIT](http://opensource.org/licenses/MIT) © yaniv kessler
