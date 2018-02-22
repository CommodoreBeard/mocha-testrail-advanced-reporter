const Mocha = require('mocha');

const reporter = require('../lib/reporter');

const reporterOptions = {
  reporter,
  suiteName: 'suiteName',
  domain: 'domain',
  username: 'username',
  password: 'password',
  projectId: 'projectId'
};
const mocha = new Mocha({ reporter, reporterOptions });

mocha.addFile('./test/reporter.js');

mocha.run();
