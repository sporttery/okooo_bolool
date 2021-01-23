var mysql = require('mysql2/promise');
var mysql_pool = mysql.createPool({
    host: "database.com",
    user: "root",
    password: "876543219",
    database: "bolool",
    port: "3306",
    charset: 'utf8mb4',
    multipleStatements: true
});


module.exports = mysql_pool;