# TestRail Reporter for Mocha
Another reporter for mocha that publishes to TestRail. However, this reporter will create suites, sections, cases, runs and results where necessary, by matching strings from Mocha.

## Motivation
I had a need to publish test results from Mocha in TestRail, I could not find a reporter that would match `test.name` from Mocha with `case.title` in TestRail and create one if needed, so out of frustration this reporter was born.

## Installation
```bash
$ npm install mocha-testrail-advanced-reporter --save-dev
```

## Usage
Ensure that your TestRail installation API is enabled and generate your API keys. See http://docs.gurock.com/

Run mocha with mocha-testrail-advanced-reporter:
```bash
$ mocha test --reporter mocha-testrail-adanced-reporter --reporter-options domain=instance.testrail.net,username=test@example.com,password=12345678,projectId=1,suiteName="A Suite"
```

or use a mocha.options file
```bash
mocha --opts mocha-testrail.opts build/test
--recursive
--reporter mocha-testrail-advanced-reporter
--reporter-options domain=instance.testrail.net,username=test@example.com,password=12345678,projectId=1,suiteName="A Suite"
--no-exit
```

Console log for tests will be in [TAP format](http://testanything.org). Once tests have complete a url link to the new test run will be printed. E.G.

```bash
1..4
ok 1 - Input file opened
not ok 2 - First line of the input valid
ok 3 - Read the rest of the file
not ok 4 - Summarized correctly
# tests 4
# pass 2
# fail 2
Formatting Test Results for TestRail...
Creating necessary Testrail artifacts...
Finished publishing
Test Run: https://instance.testrail.net/index.php?/runs/view/1
```
**Skipped tests will NOT be included in the results published to Testrail.**

## Options

**domain**: string domain name of your TestRail instance (e.g. for a hosted instance instance.testrail.net)

**username**: string user under which the test run will be created (e.g. Jenkins o CI)

**password**: string password or API token for user

**projectId**: number project number with which the tests are associated

**suiteName**: string suite name with which the tests are associated

**autoCloseRun**: (boolean) whether to close the test run once the results have been submitted. Defaults to false.
