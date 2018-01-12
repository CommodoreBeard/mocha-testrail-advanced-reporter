/**
 * Module dependencies.
 */

var Base, log

if (typeof window === 'undefined') {
  // running in Node
  Base = require('mocha').reporters.Base
  log = console.log
} else if(window.Mocha && window.Mocha.reporters && window.Mocha.reporters.Base) {
  // running in browser (possibly phantomjs) but without require
  Base = window.Mocha.reporters.Base
  log = console.log
} else {
  // running in mocha-phantomjs
  Base = require('./base')
  log = function(msg) { process.stdout.write(msg + '\n') }
}

/**
 * Expose `TestrailAdvanced`.
 */

if (typeof window !== 'undefined' && window.Mocha && window.Mocha.reporters) {
  window.Mocha.reporters.testrailAdanced = TestrailAdvanced
}else{
  exports = module.exports = TestrailAdvanced
}

/**
 * Initialize a new `TestrailAdvanced` reporter.
 *
 * @param {Runner} runner
 * @api public
 */
function TestrailAdvanced(runner) {
  Base.call(this, runner)
  var stats = this.stats

  runner.on('test', function(test) {
    console.log("here")
  })
}