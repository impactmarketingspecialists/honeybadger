var vows = require('vows'),
	assert = require('assert'),
	honeybadger = require('../honeybadger.js').honeybadger;

vows.describe('Honey Badger').addBatch({
    'When instantiating': {
        topic: function () {
          
          try {
            var hb = new honeybadger();
            var err = (hb) ? null : { error: 'Unable to instantiate' };
          } catch (e) {
            var err = e;
          }

          this.callback(err, hb);
        },
        'we get an instance': function (err, res) {
            assert.instanceOf(res, honeybadger);
        }
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
