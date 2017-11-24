var index = require('./index');
var admin = require('./admin');

module.exports = function(app){
  app.use('/',index);
  app.use('/admin',admin);
};
