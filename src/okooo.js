const argv = process.argv.slice(2);

console.log(new Date(), argv);
var minId = parseInt(argv[0]);
var maxId = parseInt(argv[1]);
var noOdds = argv[2];

var useCurl=process.env.useCurl

var mysql_pool = require('./mysql_pool');
const execSync = require('child_process').execSync;

process.on('exit', async (code) => {
    try {
        await mysql_pool.end()
    } catch (e) {}
})

async function getIdFromDb() {
    const conn = await mysql_pool.getConnection();
    const [rows, fields] = await conn.execute('SELECT max(id)+1 as id FROM `t_match`');
    conn.release();
    // mysql_pool.releaseConnection(conn);
    return rows[0].id;
}


const ODDS_COLUMNS = "matchId,companyId,s,p,f,h,pan,a".split(",");
const MATCH_COLUMNS = "id,leagueId,leagueName,leagueType,seasonId,seasonName,round,homeId,homeName,awayId,awayName,playtime,fullscore,halfscore,result,goalscore".split(",");
const BOLOOL_COLUMNS = "matchId,hscore,ascore,hresult,aresult,hsection,asection,hstrong,astrong,topN,friendly".split(",");
const MATCH_HISTORY_COLUMNS = "id,matchlist".split(",");
const ODDS_SQL = "insert into t_match_odds(matchId,companyId,s,p,f,h,pan,a) values";
const MATCH_SQL = "insert into t_match(id,leagueId,leagueName,leagueType,seasonId,seasonName,round,homeId,homeName,awayId,awayName,playtime,fullscore,halfscore,result,goalscore) values ";
const BOLOOL_SQL = "insert into t_bolool(matchId,hscore,ascore,hresult,aresult,hsection,asection,hstrong,astrong,topN,friendly) values ";
const MATCH_HISTORY_SQL = "insert into t_match_history(id,matchlist) values ";

const g_providerId = 27;
let g_cache_odds = {};

// function sleep(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms))
// }

async function saveMatchOdds() {
    // console.log(new Date(),"in function saveMatchOdds");
    // var keys = [],
    // count = 0;
    var matchOdds = [];
    for (var key in g_cache_odds) {
        var odds = g_cache_odds[key];
        matchOdds.push(odds);
        // if (odds.finish == 2) {
        //     keys.push(key);
        // }
        // count++;
    }

    // for (let index = 0; index < keys.length; index++) {
    //     const key = keys[index];
    //     var odds = g_cache_odds[key];
    //     matchOdds.push(odds);
    //     delete g_cache_odds[key];
    // }

    var sql_values = [];
    for (var i = 0; i < matchOdds.length; i++) {
        var odds = matchOdds[i];
        var values = [];
        for (var j = 0; j < ODDS_COLUMNS.length; j++) {
            var value = odds[ODDS_COLUMNS[j]];
            if (typeof value == "undefined") {
                values.push("null");
            } else if (isNaN(value) || value === "") {
                values.push("'" + value + "'");
            } else {
                values.push(value);
            }
        }
        sql_values.push("(" + values.join(",") + ")")
    }
    if (sql_values.length > 0) {
        const sql = ODDS_SQL + sql_values.join(",") + " ON DUPLICATE KEY UPDATE `version` = `version` + 1 ";
        try {
            const conn = await mysql_pool.getConnection();
            const [rows, fields] = await conn.execute(sql);
            conn.release();
            // mysql_pool.releaseConnection(conn);
            console.log(new Date(), "insert into t_match_odds ", rows.info);
            g_cache_odds = {};
        } catch (e) {
            console.log(new Date(), e);
            console.log(new Date(), "saveMatchOdds:" + sql);
        }
    }
}

async function getOddsCallback(data) {
    console.log(new Date(), " in function getOddsCallback", data.toString().substring(0, 50));
    if (typeof data == "string" && data[0] == '{' && data[data.length - 1] == '}') {
        data = JSON.parse(data);
        for (var key in data) {
            var oddsArr = data[key];
            var odds = g_cache_odds[key];
            if (!odds) {
                odds = {};
                odds.matchId = key;
                odds.companyId = g_providerId;
                odds.finish = 0;
                g_cache_odds[key] = odds;
            }
            if (oddsArr.length == 3) { //歐盤
                odds.s = oddsArr[0];
                odds.p = oddsArr[1];
                odds.f = oddsArr[2];
                odds.finish += 1;
            } else if (oddsArr.length == 4) { //亚盘
                odds.h = oddsArr[0];
                odds.pan = oddsArr[1];
                odds.a = oddsArr[2];
                odds.finish += 1;
            }
        }

    } else {
        console.log("程序出错了，获取了错误的数据，即将退出，请技术人员核查");
        console.log(new Date(), "getOddsCallback ", data);
        await process.exit();
        return;
    }

}
const oddsSql = "select m.id  from t_match m left join t_match_odds o on m.id = o.matchId where o.matchId is null and m.id limit 100";
async function getOdds(isFinish) {
    if (noOdds) {
        console.log(new Date(), "set noOdds ...");
        return;
    }
    
    var matchIds = [];
    try {
        const conn = await mysql_pool.getConnection();
        const [rows, fields] = await conn.execute(oddsSql);
        conn.release();
        // mysql_pool.releaseConnection(conn);
        for (var i = 0; i < rows.length; i++) {
            matchIds.push(rows[i].id);
        }
    } catch (e) {
        console.log(new Date(), e);
        console.log(new Date(), "getOdds:", oddsSql);
    }
    if (matchIds.length > 50 || (matchIds.length > 0 && isFinish)) {
        if(useCurl){
            var cmd = '/data/scripts/curl_odds.sh 1 ' + matchIds.join(",") ;
            var data = execSync(cmd);
            if(data[0]=='{'){
                await getOddsCallback(data);
            }else{console.log("程序出错了，获取了错误的数据，即将退出，请技术人员核查");
                console.log(new Date(),{cmd,data});
                await process.exit();
                return;
            }
            cmd = '/data/scripts/curl_odds.sh 2 ' + matchIds.join(",") ;
            data = execSync(cmd);
            if(data[0]=='{'){
                await getOddsCallback(data);
            }else{
                console.log("程序出错了，获取了错误的数据，即将退出，请技术人员核查");
                console.log(new Date(),{cmd,data});
                await process.exit();
                return;
            }
            await saveMatchOdds();
        }else{
            await hook_page.evaluate((matchIds, g_providerId) => {
                var postData = {
                    bettingTypeId: 1,
                    providerId: g_providerId,
                    matchIds: matchIds.join(",")
                };
                $.ajaxSetup({
                    async: false
                });
                $.post("/ajax/?method=data.match.odds", postData, getOddsCallback);
                postData.bettingTypeId = 2;
                $.post("/ajax/?method=data.match.odds", postData, getOddsCallback);
                $.ajaxSetup({
                    async: true
                });
            }, matchIds, g_providerId);
        }
        // if (isFinish) {
            // const oddsData = await page.waitForResponse(async response => {
            //     var url = await response.url();
            //     if (url.indexOf("/ajax/?method=data.match.odds") != -1) {
            //         // var text = await response.text();
            //         // return text.indexOf("-") !=-1  || text.indexOf("球") !=-1 || text.indexOf("0.") !=-1 || text.indexOf("/") !=-1;
            //         return await response.text();
            //     }
            // });
            // getOddsCallback(oddsData);
            // var yapan = oddsData.indexOf("-") != -1 || oddsData.indexOf("球") != -1 || oddsData.indexOf("0.") != -1 || oddsData.indexOf("/") != -1;
            // if (yapan) {
            await saveMatchOdds();
            // }
        // }
        setTimeout(getOdds, (new Date().getTime() % 50) * 1000); //随机时间，防止被屏蔽
    } else {
        setTimeout(getOdds, (new Date().getTime() % 20) * 1000); //随机时间，防止被屏蔽
    }
    // const finalResponse = await page.waitForResponse(response => response.url() .indexOf( '/ajax/?method=data.match.odds') !=-1 && response.status() === 200);
}



const g_cache_data = {
    matches: [],
    boloolDatas: [],
    matchListHistories: []
};
async function saveAll(match, boloolData, matchListHistory) {
    var values, sql, sql_values;
    if (g_cache_data.matches.length < 10 && match) {
        g_cache_data.matches.push(match);
        g_cache_data.boloolDatas.push(boloolData);
        g_cache_data.matchListHistories.push(matchListHistory);
    } else {
        const conn = await mysql_pool.getConnection();
        await conn.beginTransaction();
        let needCommit = false;
        sql_values = [];
        var matchlist = g_cache_data.matches;
        for (var i = 0; i < matchlist.length; i++) {
            match = matchlist[i];
            values = [];
            for (var j = 0; j < MATCH_COLUMNS.length; j++) {
                var value = match[MATCH_COLUMNS[j]];
                if (isNaN(value) || value === "") {
                    values.push("'" + value + "'");
                } else {
                    values.push(value);
                }
            }
            sql_values.push("(" + values.join(",") + ")")
        }
        if (sql_values.length > 0) {
            sql = MATCH_SQL + sql_values.join(",") + "  ON DUPLICATE KEY UPDATE `version`=`version` + 1 , `fullscore`=values(`fullscore`),`goalscore`=values(`goalscore`),`result`=values(`result`),`halfscore`=values(`halfscore`) ";
            try {
                const [rows, fields] = await conn.execute(sql);
                console.log(new Date(), "insert into t_match ", rows.info);
                g_cache_data.matches = [];
                needCommit = true;
            } catch (e) {
                conn.rollback();
                console.log(new Date(), '事务回滚', e.sqlMessage, e);
                console.log(new Date(), "saveAll:", sql);
            }
        }

        sql_values = [];
        var boloolDatas = g_cache_data.boloolDatas;
        for (var idx = 0; idx < boloolDatas.length; idx++) {
            boloolData = boloolDatas[idx];
            for (var key in boloolData) {
                var bolool = boloolData[key];
                values = [];
                for (var j = 0; j < BOLOOL_COLUMNS.length; j++) {
                    var value = bolool[BOLOOL_COLUMNS[j]];
                    if (isNaN(value) || value === "") {
                        values.push("'" + value + "'");
                    } else {
                        values.push(value);
                    }
                }
                sql_values.push("(" + values.join(",") + ")")
            }
        }
        if (sql_values.length > 0) {

            sql = BOLOOL_SQL + sql_values.join(",") + " ON DUPLICATE KEY UPDATE `version` = `version` + 1,hscore = values(hscore),ascore = values(ascore),hresult = values(hresult),aresult = values(aresult),hsection = values(hsection),asection = values(asection),hstrong = values(hstrong),astrong = values(astrong)";
            try {
                const [rows, fields] = await conn.execute(sql);
                console.log(new Date(), "insert into t_bolool ", rows.info);
                g_cache_data.boloolDatas = [];
                needCommit = true;
            } catch (e) {
                conn.rollback();
                console.log(new Date(), '事务回滚', e.sqlMessage, e);
                console.log(new Date(), "saveAll:", sql);
            }
        }

        sql_values = [];
        var matchListHistories = g_cache_data.matchListHistories;
        for (var idx = 0; idx < matchListHistories.length; idx++) {
            matchListHistory = matchListHistories[idx];
            values = [];
            for (var j = 0; j < MATCH_HISTORY_COLUMNS.length; j++) {
                var value = matchListHistory[MATCH_HISTORY_COLUMNS[j]];
                if (isNaN(value) || value === "") {
                    values.push("'" + value + "'");
                } else {
                    values.push(value);
                }
            }
            sql_values.push("(" + values.join(",") + ")")
        }

        if (sql_values.length > 0) {
            sql = MATCH_HISTORY_SQL + sql_values.join(",") + "  ON DUPLICATE KEY UPDATE `version`=`version` + 1  ";
            try {
                const [rows, fields] = await conn.execute(sql);
                console.log(new Date(), " insert into t_match_history " + rows.info);
                g_cache_data.matchListHistories = [];
                needCommit = true;
            } catch (e) {
                conn.rollback();
                console.log(new Date(), '事务回滚', e.sqlMessage, e);
                console.log(new Date(), "saveAll :", sql);
            }
        }
        if (needCommit) {
            try {
                await conn.commit();
                conn.release();
                // mysql_pool.releaseConnection(conn);
            } catch (e) {
                console.log(new Date(), e);
            }
        }
    }
}

async function getMatchCallback(d) {
    var data = await hook_page.evaluate((d, id) => {
        return getMatchDataFromHistoryHtml(d, id);
    }, d, minId);
    if (data) {
        saveAll(data.match, data.boloolData, data.matchListHistory);
    }

    if (minId < maxId) {
        console.log(new Date(), "id=" + minId + "已经获取完成，还剩 " + (maxId - minId) + " 个");
        minId += 1;
        setTimeout(getMatch, (minId % 10) * 100);
    } else {
        console.log(new Date(), "当前id=" + minId + ",已经到了最大id=" + maxId + "，结束程序");
        await doFinish();
    }
}

async function doFinish() {
    console.log(new Date(), "缓存match数据入库开始");
    await saveAll();
    console.log(new Date(), "缓存match入库完成");
    console.log(new Date(), "缓存odds数据入库开始");
    await getOdds(true);
    console.log(new Date(), "缓存odds入库完成");
    console.log(new Date(), "程序正常退出");
    await process.exit();
}



async function getMatch() {
    if (minId <= maxId) {
        console.log(new Date(), "正在获取id " + minId + ",最大id是 " + maxId);
        if(useCurl){
            var cmd = '/data/scripts/curl_history.sh ' + minId;
            var data = execSync(cmd);
            if(data.indexOf('vscomp')!=-1){
                await getMatchCallback(data);
            }else{
                console.log("程序出错了，获取了错误的数据，即将退出，请技术人员核查");
                console.log(new Date(),{cmd,data});
                await process.exit();
                return;
            }
        }else{
            await hook_page.evaluate((id, maxId) => {
                $.ajax({
                    type: "get",
                    url: "/soccer/match/" + id + "/history/",
                    beforeSend: function (xhr) {
                        xhr.overrideMimeType("text/plain; charset=gb2312");
                    },
                    success: getMatchCallback
                })
            }, minId, maxId);
        }
        

    }
}
//从http://www.okooo.com/soccer/match/610101/history/ 开始获取数据，最小id 为 610101 开始，
var hook_page = null;

(async () => {
    if (!minId || !maxId || isNaN(minId) || isNaN(maxId)) {
        let step = minId; //当只传一个参数时，从数据库里获取id,然后+argv[0] 为最大id,如果没有传参数，则+1000
        minId = parseInt(await getIdFromDb());
        if (isNaN(minId)) {
            minId = 610101;
        }
        if (isNaN(step)) {
            step = 1000;
        }
        maxId = minId + parseInt(step);
    }
    if (maxId < minId) {
        maxId = minId + 1000;
    }
    console.log(new Date(), {
        minId,
        maxId,
        noOdds,
        useCurl
    })

    const Puppeteer = require('puppeteer');
    await Puppeteer.launch({
        headless: true,
        defaultViewport: {
            width: 1920,
            height: 966
        },
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
        ignoreHTTPSErrors: true
        //ignoreDefaultArgs: ["--enable-automation"]
        // devtools: true

    }).then(async browser => {

        let pages = await browser.pages();
        let page = pages[0];

        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36");
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'plugins', {
                get: () => [{
                        0: {
                            type: "application/x-google-chrome-pdf",
                            suffixes: "pdf",
                            description: "Portable Document Format",
                            enabledPlugin: Plugin
                        },
                        description: "Portable Document Format",
                        filename: "internal-pdf-viewer",
                        length: 1,
                        name: "Chrome PDF Plugin"
                    },
                    {
                        0: {
                            type: "application/pdf",
                            suffixes: "pdf",
                            description: "",
                            enabledPlugin: Plugin
                        },
                        description: "",
                        filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
                        length: 1,
                        name: "Chrome PDF Viewer"
                    },
                    {
                        0: {
                            type: "application/x-nacl",
                            suffixes: "",
                            description: "Native Client Executable",
                            enabledPlugin: Plugin
                        },
                        1: {
                            type: "application/x-pnacl",
                            suffixes: "",
                            description: "Portable Native Client Executable",
                            enabledPlugin: Plugin
                        },
                        description: "",
                        filename: "internal-nacl-plugin",
                        length: 2,
                        name: "Native Client"
                    }
                ],
            });

            window.chrome = {
                runtime: {},
                loadTimes: function () {},
                csi: function () {},
                app: {}
            };
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });
            Object.defineProperty(navigator, 'platform', {
                get: () => "Win32",
            });
        });





        await page.goto("http://www.okooo.com/jingcai/");
        await page.on('console', msg => console.log(new Date(), 'PAGE LOG:', msg.text()));
        await page.addScriptTag({
            url: 'https://cdn.bootcdn.net/ajax/libs/jquery/2.2.4/jquery.min.js'
        });
        await page.exposeFunction("saveMatchOdds", saveMatchOdds);
        await page.exposeFunction("saveAll", saveAll);
        await page.exposeFunction("getOddsCallback", getOddsCallback);
        await page.exposeFunction("getMatchCallback", getMatchCallback);
        const fs = require("fs");
        var teamJson = fs.readFileSync("src/team.json").toString();
        await page.addScriptTag({
            content: 'const g_team=' + teamJson
        });
        var hookJs = fs.readFileSync("src/okoooHook_headless.js").toString();
        await page.addScriptTag({
            content: hookJs
        });
        hook_page = page;
        // await page.evaluate((minId, maxId) => {
        //     getMatch(minId, maxId);
        // }, minId, maxId);
        await getOdds();
        await getMatch();
        // await inject(page);

    });
})();