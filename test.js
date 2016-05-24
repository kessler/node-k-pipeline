'use strict'

const Pipeline = require('./index.js')
const expect = require('chai').expect

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
			expect(state.fn1).to.be.true
			expect(state.fn2).to.be.true
			done()
		})

		function fn1(state, cb) {
			state.fn1 = true
			cb()
		}

		function fn2(state, cb) {
			expect()
			state.fn2 = true
			cb()
		}
	})

})
