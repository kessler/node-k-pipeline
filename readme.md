# k-pipeline

**Executes a bunch of callback styled functions serially**

[![npm status](http://img.shields.io/npm/v/k-pipeline.svg?style=flat-square)](https://www.npmjs.org/package/k-pipeline) [![Travis build status](https://img.shields.io/travis/kessler/node-k-pipeline.svg?style=flat-square&label=travis)](http://travis-ci.org/kessler/node-k-pipeline) [![Dependency status](https://img.shields.io/david/kessler/node-k-pipeline.svg?style=flat-square)](https://david-dm.org/kessler/node-k-pipeline)

## example

`npm i k-pipeline`

```js
const Pipeline = require('k-pipeline')
let pipeline = Pipeline.create([
    (state, cb) => { cb() },
    (state, cb) => { cb(); cb() }, // throws an error because this callback was called twice
    (state, cb) => { cb() }
])

pipeline.run((err, state) => {
    // it's perfectly fine to rerun the pipeline after its finished
    pipeline.run((err, state) => {

    })
})

// throws an error
pipeline.run((err) => {})
```

## install

With [npm](https://npmjs.org) do:

```
npm install k-pipeline
```

## license

[MIT](http://opensource.org/licenses/MIT) © yaniv kessler
