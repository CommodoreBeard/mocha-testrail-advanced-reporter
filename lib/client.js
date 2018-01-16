var Testrail = require('testrail-api');
 
function publish (domain, username, password, projectId, suiteName, testResults) {

  var testrail = new Testrail({
    host: 'https://' + domain, 
    user: username, 
    password: password
  });

  var suiteId = null;

  testrail.getSuites(projectId, setSuiteId);

  function setSuiteId(err, suites) {
    matchingSuites = suites.filter((suite => suite['name'] == suiteName));
    if( matchingSuites.length > 1 ) {
      throw new Error(`Suite Name Error = More than one suite exists in testrail with the name ${suiteName}`)
    }
    else if (matchingSuites.length == 0) {
      testrail.addSuite(projectId, { "name": suiteName }, setSuiteId);
    }
    else {
        suiteId = matchingSuites[0]['id']
        console.log("ID: " + suiteId);
    }
  }
}

module.exports = publish;

//   // get or gen suite id

//   // for each test
//     // get or gen section id (add to result object)
//     // get or gen test id (add to result object)

//   // Create new run with date info

//   // publish each test result (maybe as batch)

// }

// function _get(url, options, callback) {
//   needle('get', url, {}, options)
//     .then(function (resp) {
//         return callback(resp.body)
//     })
//     .catch(function(err) {
//         throw new Error(err);
//     })
// }

// function _post(url, params, callback) {
//   needle('post', url, params, options) 
//     .then(function (resp) {
//         return callback(resp.body)
//     })
//     .catch(function(err) {
//         throw new Error(err);
//     })
// }





// // function getSuiteId(callback) {
//     //       _get(baseUrl + "/api/v2/get_suites/" + projectId, 
//     //         options, 
//     //         (suites) => { 
    
//     //         matchingSuites = suites.filter(suite => suite['name'] == suiteName)
//     //         if( matchingSuites.length > 1 ) {
//     //           throw new Error(`Suite Name Error = More than one suite exists in testrail with the name ${suiteName}`)
//     //         } 
    
//     //         else if( matchingSuites.length == 1 ) {
//     //           callback(matchingSuites[0]['id']);
//     //         }
    
//     //         else {
//     //           suiteId = _post(baseUrl + "/api/v2/add_suite/" + projectId, 
//     //             { name: suiteName, description: "Auto generated" },
//     //             options,
//     //             (body) => {
//     //               callback(body['id']);
//     //             }
//     //           )
//     //         }
//     //     })
//     //   }