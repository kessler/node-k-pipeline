'use strict'

const Pipeline = require('./index.js')
const expect = require('chai').expect
const cma = require('cumulative-moving-average')

describe('Pipeline', () => {
	it('constructor throws an error when an pipeline parameter is not an array', () => {
		expect(() => {
			Pipeline.create('123')
		}).to.throw('missing or invalid pipeline parameter')
	})

	it('works with an empty array of functions', (done) => {
		let pipeline = new Pipeline()
		pipeline.run(done)
	})

	it('runs a bunch of callback styled functions serially', (done) => {
		let invoked1 = false
		let invoked2 = false

		let pipeline = new Pipeline([fn1, fn2])

		pipeline.run((err, state) => {
			if (err) return done(err)

			expect(invoked1).to.be.true
			expect(invoked2).to.be.true

			done()
		})

		function fn1(state, cb) {
			invoked1 = true
			cb()
		}

		function fn2(state, cb) {
			invoked2 = true
			cb()
		}
	})

	it('shares a state object between invoked functions and passes it to the final callback', (done) => {
		let pipeline = new Pipeline([fn1, fn2])

		pipeline.run((err, state) => {
			expect(state).to.have.property('fn1', true)
			expect(state).to.have.property('fn2', true)
			done()
		})

		function fn1(state, cb) {
			state.fn1 = true
			cb()
		}

		function fn2(state, cb) {
			expect(state).to.have.property('fn1', true)
			state.fn2 = true
			cb()
		}
	})

	it('throws an error if step callback is invoked twice', (done) => {
		let pipeline = new Pipeline([fn1])

		pipeline.run(done)

		function fn1(state, cb) {
			cb()
			expect(() => {
				cb()
			}).to.throw('callback was already invoked, check err.cause for the offending function')
		}
	})

	it('stops the execution if a function calls the step callback with an error', (done) => {
		let pipeline = new Pipeline([fn1, fn2])
		let e = new Error()
		pipeline.run((err, state) => {
			expect(err).to.be.an('error')
			expect(err).to.equal(e)
			done()
		})

		function fn1(state, cb) {
			cb(e)
		}

		function fn2(state, cb) {
			done(new Error('fn2 should not have been executed'))
		}
	})

	it.skip('bench', function(done) {
		this.timeout(10000)

		let iterations = 100
		const functionCount = 10000

		let functions = [(state, cb) => { state.x = 0; cb() }]
		let pipeline = Pipeline.create(functions)

		for (var i = functionCount; i >= 0; i--) {
			functions.push((state, cb) => { state.x = state.x + 1; cb() })
		}

		
		let avg = cma()

		// console.log(avg.value) // 1
		// console.log(avg.length) // 1

		iteration()

		function iteration() {
			let start = Date.now()

			pipeline.run((err, state) => {
				avg.push(Date.now() - start)
				
				if (--iterations === 0) {
					finish()
				} else {
					iteration()
				}
			})
		}

		function finish() {
			console.log(avg.value / functionCount, avg.length)
			done()
		}
	})
})
