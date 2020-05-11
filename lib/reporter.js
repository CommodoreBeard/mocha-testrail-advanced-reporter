const { Base } = require('mocha').reporters;
const _ = require('lodash');

const publishResults = require('./testrail-publisher.js');

function validate(options, name) {
  if (options == null) {
    throw new Error('Missing --reporter-options in mocha.opts');
  }
  if (options[name] == null) {
    throw new Error(
      `Missing ${name} value. Please update --reporter-options in mocha.opts`
    );
  }
}

function prepareResults(testResults, suiteName) {
  const testRailResults = {
    suite: {
      id: null,
      name: suiteName
    },
    sections: []
  };

  _.uniq(testResults.map(x => x.section)).forEach(section => {
    testRailResults.sections.push({ id: null, name: section, tests: [] });
  });

  testResults.forEach(test => {
    _.find(
      testRailResults.sections,
      section => section.name === test.section
    ).tests.push({
      id: null,
      title: test.title,
      status_id: test.pass ? 1 : 5,
      comment: test.comment
    });
  });

  return testRailResults;
}

/**
 * Return a TAP-safe title of `test`
 *
 * @api private
 * @param {Object} test
 * @return {String}
 */
function title(test) {
  return test.fullTitle().replace(/#/g, '');
}

/**
 * Initialize a new `TestrailAdvanced` reporter.
 *
 * @param {Runner} runner
 * @param {Object} options   Options to pass to report generator
 * @api public
 */
function TestrailAdvanced(runner, options) {
  Base.call(this, runner);

  // Validate options
  validate(options.reporterOptions, 'suiteName');
  validate(options.reporterOptions, 'domain');
  validate(options.reporterOptions, 'username');
  validate(options.reporterOptions, 'password');
  validate(options.reporterOptions, 'projectId');

  const {
    domain,
    password,
    projectId,
    username,
    suiteName
  } = options.reporterOptions;
  const autoCloseRun = options.reporterOptions.autoCloseRun === 'true';

  let n = 1;
  let passes = 0;
  let failures = 0;
  const testResults = [];

  runner.on('start', () => {
    const total = runner.grepTotal(runner.suite);
    console.log('%d..%d', 1, total);
  });

  runner.on('pending', test => {
    console.log('ok %d %s # SKIP -', n, title(test));
  });

  runner.on('test end', () => {
    n += 1;
  });

  runner.on('pass', test => {
    passes += 1;
    testResults.push({
      section: test.parent.fullTitle(),
      title: test.title,
      pass: true
    });
    console.log('ok %d %s', n, title(test));
  });

  runner.on('fail', (test, err) => {
    failures += 1;
    testResults.push({
      section: test.parent.fullTitle(),
      title: test.title,
      pass: false,
      comment: err.stack
    });
    console.log('not ok %d %s', n, title(test));
    if (err.stack) {
      console.log(err.stack.replace(/^/gm, '  '));
    }
  });

  runner.on('pending', test => {
    console.log('ok %d %s # SKIP -', n, title(test));
  });

  runner.on('end', () => {
    console.log(`# tests ${passes + failures}`);
    console.log(`# pass ${passes}`);
    console.log(`# fail ${failures}`);

    console.log('Formatting Test Results for TestRail...');
    const testRailResults = prepareResults(testResults, suiteName);

    publishResults(
      domain,
      username,
      password,
      projectId,
      suiteName,
      autoCloseRun,
      testRailResults
    );
  });
}

module.exports = TestrailAdvanced;
