# k-pipeline

**Executes a bunch of callback styled functions serially**

This is an adhoc/opinionated version of the popular async.\<waterfall|serial\>

[![npm status](http://img.shields.io/npm/v/k-pipeline.svg?style=flat-square)](https://www.npmjs.org/package/k-pipeline) [![Travis build status](https://img.shields.io/travis/kessler/node-k-pipeline.svg?style=flat-square&label=travis)](http://travis-ci.org/kessler/node-k-pipeline) [![Dependency status](https://img.shields.io/david/kessler/node-k-pipeline.svg?style=flat-square)](https://david-dm.org/kessler/node-k-pipeline)

## install

With [npm](https://npmjs.org) do:

```
npm install k-pipeline
```

### example - flow control

```js
const Pipeline = require('k-pipeline')
const assert = require('assert')

let pipeline = Pipeline.create([
    
    // state is just a new javascript object
    (state, ops) => { 
        state.foo = 'bar'
        ops.next() 
    },

    // stop the execution in the middle -> jump directly to final callback
    (state, ops) => { 
        assert(state.foo === 'bar')
        ops.stop() 
    }, 
    
    // this will not be executed
    (state, ops) => { ops.next() }
])

pipeline.run((err, state, isStop) => {
    assert(isStop)
})
```

### example - pipeline callback api is available as both functions or methods of the first parameter

```js
const Pipeline = require('k-pipeline')

let pipeline = Pipeline.create([
    (state, ops) => { 
        ops.next() // === ops()
        // ops.stop()
        // ops.loop()
        // ops.save('foo')
    },
    (state, next, stop, loop, save) => { 
        next()
    }
])

// override constructor state
pipeline.run((err, state) => {})
```

### example - custom state

```js
const Pipeline = require('k-pipeline')

let aState = { foo: 'bar' }
let pipeline = Pipeline.create([
    (state, next) => { 
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
    (state, next) => { next() }
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
    (state, next) => { next(error) },
    (state, next) => { next() } // will not be executed
])

pipeline.run((err, state) => {
    console.log(error === err) //true
})
```

### example - stopping the pipeline

```js
const Pipeline = require('k-pipeline')
const assert = require('assert')

let aState = { foo: 'bar' }
let pipeline = Pipeline.create([
    (state, ops) => { ops.next() },
    (state, ops) => { ops.stop() },
    (state, ops) => { ops.next() } // will never get executed
])

// state will reset to a new javascript object each run()
pipeline.run((err, state, isStop) => {
    assert(isStop)
})
```

### example - loops inside the pipeline

```js
const Pipeline = require('k-pipeline')
const assert = require('assert')

let aState = { foo: 'bar' }
let pipeline = Pipeline.create([
    (state, ops) => { 
        state.count = 0 
        ops.next() 
    },
    (state, ops) => { 
        if (++state.count === 10) return ops.loop()
        ops.next()
    },
    (state, next) => { next() }
])

// state will reset to a new javascript object each run()
pipeline.run((err, state, isStop) => {
    assert(state.count === 10)
})
```

### example - save results of an operation to the pipeline state

```js
const Pipeline = require('k-pipeline')
const assert = require('assert')

function foo(callback) {
    callback(null, 1, 2, 3)
}

let pipeline = Pipeline.create([
    (state, ops) => { 
        foo(ops.save('foo'))
    }
])

// state will reset to a new javascript object each run()
pipeline.run((err, state, isStop) => {
    assert.deepStrictEqual([1, 2, 3], state.foo)
})
```

### stuff you can't do

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

## Changelog
### 3.3.0
- add save() to callback api
- expose all callback functions as method of the first parameter: `(state, next, stop, loop, save) => {}` can now be written as `(state, ops) => { ops.save(); ops.stop() ...}`

## license

[MIT](http://opensource.org/licenses/MIT) © yaniv kessler
