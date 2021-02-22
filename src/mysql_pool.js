var mysql = require('mysql2/promise');
var mysql_pool = mysql.createPool({
    host: "www.database.com",
    user: "root",
    password: "876543219",
    database: "bolool",
    port: "17816",
    charset: 'utf8mb4',
    multipleStatements: true
});


module.exports = mysql_pool;