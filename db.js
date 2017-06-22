const config = require('./config');
const ip = process.env.IP;
if(config.mysql.host == "") config.mysql.host = `${ip}`;
const mysql = require('mysql')
const connection = mysql.createConnection(config.mysql);

module.exports = connection;