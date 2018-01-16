var Base = require('mocha').reporters.Base
var testrailClient = require('./client.js');

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
 * @param {Object} options   Options to pass to report generator
 * @api public
 */
function TestrailAdvanced(runner, options) {
  Base.call(this, runner)
  var stats = this.stats

  // Validate options
  validate(options.reporterOptions, 'suiteName')
  validate(options.reporterOptions, 'domain')
  validate(options.reporterOptions, 'username')
  validate(options.reporterOptions, 'password')
  validate(options.reporterOptions, 'projectId')
  var suiteName = options.reporterOptions.suiteName;
  var domain = options.reporterOptions.domain;
  var username = options.reporterOptions.username;
  var password = options.reporterOptions.password;
  var projectId = options.reporterOptions.projectId;

  var n = 1;
  var passes = 0;
  var failures = 0;
  var suiteId = null
  var testResults = [];

  runner.on('start', function () {
    var total = runner.grepTotal(runner.suite);
    console.log('%d..%d', 1, total);
  });

  runner.on('test end', function () {
    ++n;
  });

  runner.on('pass', function(test) {
    passes++;
    testResults.push({
      section: test.parent.fullTitle(),
      title: test.title,
      result: "pass"
    })
    console.log('ok %d %s', n, title(test));
  });

  runner.on('fail', function(test, err) {
    failures++;
    testResults.push({
      section: test.parent.fullTitle(),
      title: test.title,
      result: "fail"
    })
    console.log('not ok %d %s', n, title(test));
    if (err.stack) {
      console.log(err.stack.replace(/^/gm, '  '));
    }
  });

  runner.on('pending', function (test) {
    console.log('ok %d %s # SKIP -', n, title(test));
  });

  runner.on('end', function() {
    console.log('# tests ' + (passes + failures));
    console.log('# pass ' + passes);
    console.log('# fail ' + failures);

    console.log('Writing to TestRail...')
    testrailClient(domain, username, password, projectId, suiteName, testResults)
  });
}

function validate(options, name) {
  if (options == null) {
      throw new Error("Missing --reporter-options in mocha.opts");
  }
  if (options[name] == null) {
      throw new Error(`Missing ${name} value. Please update --reporter-options in mocha.opts`);
  }
}

/**
 * Return a TAP-safe title of `test`
 *
 * @api private
 * @param {Object} test
 * @return {String}
 */
function title (test) {
  return test.fullTitle().replace(/#/g, '');
}
