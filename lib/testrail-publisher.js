const Testrail = require('testrail-api');
const _ = require('lodash');
const Bottleneck = require('bottleneck/es5');

const publishResultsToTestRail = (
  domain,
  username,
  password,
  projectId,
  suiteName,
  autoCloseRun,
  testResults
) => {
  // TestRail has a 180 requests per minute limit: http://docs.gurock.com/testrail-api2/errors#rate_limit
  // We'll be conservative and only allow 120.
  const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 500
  });

  const internalTestRail = new Testrail({
    host: `https://${domain}`,
    user: username,
    password
  });

  // Wrap the TestRail functions we use in the limiter
  const testrail = {
    getSuites: limiter.wrap(internalTestRail.getSuites.bind(internalTestRail)),
    addSuite: limiter.wrap(internalTestRail.addSuite.bind(internalTestRail)),
    getSections: limiter.wrap(
      internalTestRail.getSections.bind(internalTestRail)
    ),
    addSection: limiter.wrap(
      internalTestRail.addSection.bind(internalTestRail)
    ),
    getCases: limiter.wrap(internalTestRail.getCases.bind(internalTestRail)),
    addCase: limiter.wrap(internalTestRail.addCase.bind(internalTestRail)),
    addRun: limiter.wrap(internalTestRail.addRun.bind(internalTestRail)),
    addResultsForCases: limiter.wrap(
      internalTestRail.addResultsForCases.bind(internalTestRail)
    ),
    closeRun: limiter.wrap(internalTestRail.closeRun.bind(internalTestRail))
  };

  const getSuiteId = mochaSuiteName =>
    new Promise((resolve, reject) => {
      testrail
        .getSuites(projectId)
        .then(suites => {
          const existingTestRailSuite = _.find(
            suites.body,
            suite => suite.name === mochaSuiteName
          );
          if (existingTestRailSuite) {
            return new Promise(res => {
              res(existingTestRailSuite);
            });
          }
          return testrail
            .addSuite(projectId, { name: suiteName })
            .then(resp => resp.body);
        })
        .then(suite => resolve(suite.id))
        .catch(err => reject(err));
    });

  const getSectionId = (suiteId, mochaSectionName) =>
    new Promise((resolve, reject) => {
      testrail
        .getSections(projectId, { suite_id: suiteId })
        .then(sections => {
          const existingTestRailSection = _.find(
            sections.body,
            section => section.name === mochaSectionName
          );
          if (existingTestRailSection) {
            return new Promise(res => {
              res(existingTestRailSection);
            });
          }
          return testrail
            .addSection(projectId, {
              suite_id: suiteId,
              name: mochaSectionName
            })
            .then(resp => resp.body);
        })
        .then(section => resolve(section.id))
        .catch(err => reject(err));
    });

  const getAllSectionIds = (suiteId, sections) => {
    const promises = [];
    sections.forEach(section => {
      promises.push(
        new Promise((resolve, reject) => {
          getSectionId(suiteId, section.name)
            .then(sectionId => {
              resolve({
                id: sectionId,
                name: section.name,
                tests: section.tests
              });
            })
            .catch(err => reject(err));
        })
      );
    });
    return Promise.all(promises);
  };

  const getTestId = (suiteId, sectionId, mochaTestTitle) =>
    new Promise((resolve, reject) => {
      testrail
        .getCases(projectId, { suite_id: suiteId, section_id: sectionId })
        .then(cases => {
          const existingTestRailCase = _.find(
            cases.body,
            test => test.title === mochaTestTitle
          );
          if (existingTestRailCase) {
            return new Promise(res => {
              res(existingTestRailCase);
            });
          }
          return testrail
            .addCase(sectionId, { title: mochaTestTitle })
            .then(resp => resp.body);
        })
        .then(test => resolve(test.id))
        .catch(err => reject(err));
    });

  const getAllTestIdsForSection = (suiteId, section) => {
    const promises = [];
    section.tests.forEach(test => {
      promises.push(
        new Promise((resolve, reject) => {
          getTestId(suiteId, section.id, test.title)
            .then(testId => {
              resolve({
                id: testId,
                title: test.title,
                status_id: test.status_id
              });
            })
            .catch(err => reject(err));
        })
      );
    });
    return Promise.all(promises);
  };

  const getAllTestIds = (suiteId, sections) => {
    const promises = [];
    sections.forEach(section => {
      promises.push(
        new Promise((resolve, reject) => {
          getAllTestIdsForSection(suiteId, section)
            .then(tests => {
              resolve({
                id: section.id,
                name: section.name,
                tests
              });
            })
            .catch(err => reject(err));
        })
      );
    });
    return Promise.all(promises);
  };

  console.log('Creating necessary Testrail artifacts...');
  const testRailResults = { ...testResults };
  getSuiteId(testResults.suite.name)
    .then(suiteId => {
      testRailResults.suite.id = suiteId;
      return getAllSectionIds(suiteId, testResults.sections);
    })
    .then(sections => {
      testRailResults.sections = sections;
      return getAllTestIds(testRailResults.suite.id, sections);
    })
    .then(sections => {
      testRailResults.sections = sections;
      return testrail.addRun(projectId, {
        suite_id: testRailResults.suite.id,
        name: `${
          testRailResults.suite.name
        } Automated test run created ${new Date().toISOString()}`
      });
    })
    .then(run => {
      console.log(`Test Run: ${run.body.url}`);
      const results = [];
      testRailResults.sections.forEach(section => {
        section.tests.forEach(test => {
          results.push({
            case_id: test.id,
            status_id: test.status_id,
            comment: test.comment
          });
        });
      });
      const addResultsForCases = testrail.addResultsForCases(
        run.body.id,
        results
      );
      if (autoCloseRun) {
        return addResultsForCases.then(() => {
          console.log('Auto-closing the run');
          return testrail.closeRun(run.body.id);
        });
      }

      return addResultsForCases;
    })
    .then(() => console.log('Finished publishing'))
    .catch(err => {
      console.log(err);
    });
};

module.exports = publishResultsToTestRail;
