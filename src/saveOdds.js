const argv = process.argv.slice(2)
console.log(argv)
const fs = require("fs");
const data1 = fs.readFileSync(argv[0]).toString();
const data2 = fs.readFileSync(argv[1]).toString();
var ids = argv[2].split(",")

let oddsData = {};

for (var i = 0; i < ids.length; i++) {
    oddsData[ids[i]] = [0, 0, 0, 0, 0, 0];
}

if (data1 != "false") {
    var tmpData = JSON.parse(data1);
    for (let key in tmpData) {
        var odds = tmpData[key];
        oddsData[key][0] = odds[0];
        oddsData[key][1] = odds[1];
        oddsData[key][2] = odds[2];
    }
}

if (data2 != "false") {
    var tmpData = JSON.parse(data2);
    for (let key in tmpData) {
        var odds = tmpData[key];
        oddsData[key][3] = odds[0];
        oddsData[key][4] = odds[1];
        oddsData[key][5] = odds[2];
    }
}

const ODDS_SQL = "insert into t_match_odds(matchId,companyId,s,p,f,h,pan,a) values";
var sql_values = [];
for (var key in oddsData) {
    var odds = oddsData[key];
    sql_values.push("(" + [key, 27, odds[0], odds[1], odds[2], odds[3], "'" + odds[4] + "'", odds[5]].join(",") + ")");
}



async function main() {

    var mysql_pool = require('./mysql_pool');
    const sql = ODDS_SQL + sql_values.join(",") + " ON DUPLICATE KEY UPDATE `version` = `version` + 1 ";
    try {
        const conn = await mysql_pool.getConnection();
        const [rows, fields] = await conn.execute(sql);
        try {
            await conn.release();
            await mysql_pool.end()
        } catch (e1) { 
            console.log(new Date(), e1,"mysql_pool end");
        }
        // mysql_pool.releaseConnection(conn);
        console.log(new Date(), "insert into t_match_odds ", rows.info);
        fs.unlinkSync(argv[0]);
        fs.unlinkSync(argv[1]);
    } catch (e) {
        console.log(new Date(), e);
        console.log(new Date(), "saveMatchOdds:" + sql);
    }
}


main();
