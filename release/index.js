var HoneyBadger = require('./honeybadger').Service;
// var select = require('./data-select'); // This will soon follow the model above
var admin = require('./admin/admin'); // This will stay the same; no intent for folks to include admin in their sources

HoneyBadger.main();