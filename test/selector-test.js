var vows = require('vows'),
	assert = require('assert'),
  querystring = require('querystring'),
  http = require('http');

vows.describe('Honey Badger Data Selectors').addBatch({
    'When making a basic selection': {
        topic: function () {
          var opts = {
            host: 'localhost',
            port: 8092,
            path: '/qrymdAnnualSalePricePercentChangeGeo2Geo1'
          }
          var post = querystring.stringify({
            limit: 30,
            PropGeo1: '92660,92661,92662,92663'
          })
          var req = http.request(opts, this.callback);
          req.write();
          req.end(post);
        },
        'No errors': function(res) {

            console.log(res);
            assert.isString(res);
        },
        'We get a string': function (res) {
            assert.isString(res);
        }
    }
}).export(module);

   // 'and passing some options': {
   //      topic: function () { return 0 / 0 },

   //      'we get a value which': {
   //          'is not a number': function (topic) {
   //              assert.isNaN (topic);
   //          },
   //          'is not equal to itself': function (topic) {
   //              assert.notEqual (topic, topic);
   //          }
   //      }
   //  }
