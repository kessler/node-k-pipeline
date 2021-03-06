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

		this._state = undefined
		this._currentIndex = 0
		this._isRunning = false
		this._isUserStop = false

		debug('creating a pipeline with %d functions', this._pipeline.length)
	}

	static create(pipeline) {
		return new Pipeline(pipeline)
	}

	run(state, userCallback) {
		debug('run()')

		if (typeof state === 'function') {
			userCallback = state
			state = undefined
		}

		if (typeof userCallback !== 'function') {
			throw new TypeError('missing a callback parameter')
		}

		if (this._isRunning) {
			throw new Error('already running')
		}

		// reset state or use user provided one
		this._state = state || {}
		this._currentIndex = 0
		this._isRunning = true
		this._isUserStop = false

		// shortcut		
		if (this._pipeline.length === 0) {
			this._isRunning = false
			return setImmediate(() => {
				userCallback(null, this._state, this._isUserStop)
			})
		}

		return this._run((err, state) => {
			this._isRunning = false

			setImmediate(() => {
				userCallback(err, this._state, this._isUserStop)
			})
		})
	}

	_run(internalCallback) {
		debug('_run() function %d', this._currentIndex)

		// run will not call _run with an empty array
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

		let stop = () => {
			debug('stopping')
			this._currentIndex = this._pipeline.length
			this._isUserStop = true
			nextCallback()
		}

		let loop = (err) => {
			debug('looping')
			if (err) {
				debug('error')
				return internalCallback(err)
			}

			fn(this._state, nextCallback, stop, loop)
		}

		let save = (name) => {

			return (err, ...params) => {
				debug('saving')

				if (err) {
					debug('error')
					return internalCallback(err)
				}

				this._state[name] = params
				nextCallback()
			}
		}

		nextCallback.next = nextCallback
		nextCallback.stop = stop
		nextCallback.loop = loop
		nextCallback.save = save

		fn(this._state, nextCallback, stop, loop, save)
	}
}

module.exports = Pipeline