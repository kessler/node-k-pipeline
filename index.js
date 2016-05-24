'use strict'

const isArray = require('util').isArray
const debug = require('debug')('k-pipeline')

/**
 *	Executes a bunch of callback styled functions serially
 *
 *	let pipeline = Pipeline.create([
 *		(cb) => { cb() },
 *		(cb) => { cb() }
 *	])
 *
 *	pipeline.run((err) => {})
 *
 *	pipeline is reusable
 *
 */
class Pipeline {
	constructor(pipeline) {
		debug('constructor()')
		this._pipeline = pipeline || []

		if (!isArray(this._pipeline)) {
			throw new TypeError('missing or invalid pipeline parameter')
		}

		this._state = {}
		this._currentIndex = 0
		this._isRunning = false

		debug('creating a pipeline with %d functions', this._pipeline.length)
	}

	static create(pipeline) {
		return new Pipeline(pipeline)
	}

	run(userCallback) {
		debug('run()')
		
		if (this._isRunning) {
			throw new Error('already running')
		}

		this._state = {}
		this._currentIndex = 0
		this._isRunning = true

		// shortcut		
		if (this._pipeline.length === 0) {
			this._isRunning = false
			return setImmediate(userCallback)
		}

		return this._run((err, state) => {
			this._isRunning = false

			setImmediate(() => { 
				userCallback(err, this._state)
			})
		})
	}

	_run(internalCallback) {
		debug('_run() function %d', this._currentIndex)
		
		// this will work for sure because run make sure we never _run with an empty array
		let fn = this._pipeline[this._currentIndex++]
		let callbackWasInvoked = false

		// invoke the function and provide a callback
		let nextCallback = (err) => {
			debug('next callback')

			if (callbackWasInvoked) {
				debug('callbackWasInvoked')
				let e = new Error('callback was already invoked, check err.cause for the offending function')
				e.cause = fn
				throw e
			}

			callbackWasInvoked = true

			if (err) {
				debug('error')
				return internalCallback(err)
			}

			if (this._currentIndex === this._pipeline.length) {
				debug('_run() finished')
				return internalCallback()
			}

			setImmediate(() => {
				debug('next...')
				this._run(internalCallback)
			})
		}

		// 
		let stop = () => {
			this._currentIndex = this._pipeline.length
			nextCallback()
		}

		fn(this._state, nextCallback, stop)
	}
}

module.exports = Pipeline
