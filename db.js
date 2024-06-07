var mysql = require('mysql2');
var db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'ehdgns362',
    database: 'user_info'
});
db.connect();

module.exports = db;