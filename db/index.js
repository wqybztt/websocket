var mysql = require('mysql');
var config = require('../config').mysql;

module.exports = function(query,callback){
	var connection = mysql.createConnection(config);
	connection.connect();
	connection.query(query,callback);
	connection.end();
};