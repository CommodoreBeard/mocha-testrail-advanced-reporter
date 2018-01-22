const Testrail = require('testrail-api');
const _ = require('lodash');

const client = (
  domain,
  username,
  password,
  projectId,
  suiteName,
  testResults
) => {
  const testrail = new Testrail({
    host: `https://${domain}`,
    user: username,
    password
  });

  const getSuiteId = mochaSuiteName =>
    new Promise((resolve, reject) => {
      testrail
        .getSuites(projectId)
        .then(suites => {
          const existingTestRailSuite = _.find(
            suites,
            suite => suite.name === mochaSuiteName
          );
          if (existingTestRailSuite) {
            return new Promise(res => {
              res(existingTestRailSuite);
            });
          }
          return testrail.addSuite(projectId, { name: suiteName });
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
            sections,
            section => section.name === mochaSectionName
          );
          if (existingTestRailSection) {
            return new Promise(res => {
              res(existingTestRailSection);
            });
          }
          return testrail.addSection(projectId, {
            suite_id: suiteId,
            name: mochaSectionName
          });
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
            cases,
            test => test.title === mochaTestTitle
          );
          if (existingTestRailCase) {
            return new Promise(res => {
              res(existingTestRailCase);
            });
          }
          return testrail.addCase(sectionId, { title: mochaTestTitle });
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
      console.log(JSON.stringify(testRailResults, undefined, 2));
    })
    .catch(err => {
      console.log(err);
    });
};

module.exports = client;
