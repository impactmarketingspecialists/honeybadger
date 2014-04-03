var vows = require('vows'),
	assert = require('assert'),
	honeybadger = require('../honeybadger.js').honeybadger;

vows.describe('Honey Badger').addBatch({
    'When instantiating': {
        topic: function () {
          var hb = new honeybadger();
          this.callback(null, hb);
        },
        'we get an instance': function (err, res) {
            assert.isNull(err);
            assert.instanceOf(res, honeybadger);
        }
    },
    'When loading config from the default path': {
        topic: function () {
          var hb = new honeybadger();
          var res = hb.loadConfig();

          assert.throws(hb.loadConfig, Error);
          this.callback((res) ? null : { error: 'Unable to load config' }, res);
        },
        "we get a config object": function (err, res) {
            assert.isNull(err);
            assert.isObject(res);
        }
    },
    'When running main entry point': {
        topic: function () {

          assert.throws(honeybadger.main, Error);
          honeybadger.main();
          
          this.callback(null);
        },
        "we don't crash ;)": function (err, res) {
            assert.isNull(err);
        },
        // "dnode runs properly": function(err, res) {

        // }
    },
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
