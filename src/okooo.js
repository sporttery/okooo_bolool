const argv = process.argv.slice(2);

// console.log(new Date(),argv);
var minId = parseInt(argv[0]);
var maxId = parseInt(argv[1]);

var mysql_pool = require('./mysql_pool');

process.on('exit', async (code) => {
    try {
        await mysql_pool.end()
    } catch (e) {}
})

async function getIdFromDb() {
    const conn = await mysql_pool.getConnection();
    const [rows, fields] = await conn.execute('SELECT max(id)+1 as id FROM `t_match`');
    conn.release();
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

const g_cache_odds = {};
const g_providerId = 27;


async function saveMatchOdds() {
    var keys = [];
    for (var key in g_cache_odds) {
        var odds = g_cache_odds[key];
        if (odds.finish == 2) {
            keys.push(key);
        }
    }
    var matchOdds = [];
    for (let index = 0; index < keys.length; index++) {
        const key = keys[index];
        var odds = g_cache_odds[key];
        matchOdds.push(odds);
        delete g_cache_odds[key];
    }

    var sql_values = [];
    for (var i = 0; i < matchOdds.length; i++) {
        var odds = matchOdds[i];
        var values = [];
        for (var j = 0; j < ODDS_COLUMNS.length; j++) {
            var value = odds[ODDS_COLUMNS[j]];
            if (isNaN(value) || value == "") {
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
            conn.release()
            console.log(new Date(), "insert into t_match_odds ", rows.info);
        } catch (e) {
            console.log(new Date(), e);
            console.log(new Date(), "saveMatchOdds:" + sql);
        }
    }
}

async function getOddsCallback(data) {
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
        await saveMatchOdds();
    } else {
        console.log(new Date(), "getOddsCallback ", data);
    }

}
async function getOdds(nosettimeout) {
    const sql = "select m.id  from t_match m left join t_match_odds o on m.id = o.matchId where o.matchId is null";
    var matchIds = [];
    try {
        const conn = await mysql_pool.getConnection();
        const [rows, fields] = await conn.execute(sql);
        conn.release()
        for (var i = 0; i < rows.length; i++) {
            matchIds.push(rows[i].id);
        }
    } catch (e) {
        console.log(new Date(), e);
        console.log(new Date(), "getOdds:", sql);
    }
    if (nosettimeout) {
        if (matchIds.length > 0) {
            await hook_page.evaluate((matchIds, g_providerId) => {
                var postData = {
                    bettingTypeId: 1,
                    providerId: g_providerId,
                    matchIds: matchIds.join(",")
                };
                $.post("/ajax/?method=data.match.odds", postData, getOddsCallback);
                postData.bettingTypeId = 2;
                $.post("/ajax/?method=data.match.odds", postData, getOddsCallback);
            }, matchIds, g_providerId);
            await hook_page.waitFor(3000);
        }
    } else {
        if (matchIds.length > 50) {
            await hook_page.evaluate((matchIds, g_providerId) => {
                var postData = {
                    bettingTypeId: 1,
                    providerId: g_providerId,
                    matchIds: matchIds.join(",")
                };
                $.post("/ajax/?method=data.match.odds", postData, getOddsCallback);
                postData.bettingTypeId = 2;
                $.post("/ajax/?method=data.match.odds", postData, getOddsCallback);
            }, matchIds, g_providerId);
            setTimeout(getOdds, (new Date().getTime() % 120) * 1000); //随机时间，防止被屏蔽
        } else {
            setTimeout(getOdds, (new Date().getTime() % 50) * 1000); //随机时间，防止被屏蔽
        }
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
    if (g_cache_data.matches.length < 50 && match) {
        g_cache_data.matches.push(match);
        g_cache_data.boloolDatas.push(boloolData);
        g_cache_data.matchListHistories.push(matchListHistory);
    } else {
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
                const conn = await mysql_pool.getConnection();
                const [rows, fields] = await conn.execute(sql);
                conn.release()
                console.log(new Date(), "insert into t_match ", rows.info);
                g_cache_data.matches = [];
            } catch (e) {
                console.log(new Date(), e);
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
                const conn = await mysql_pool.getConnection();
                const [rows, fields] = await conn.execute(sql);
                conn.release()
                console.log(new Date(), "insert into t_bolool ", rows.info);
                g_cache_data.boloolDatas = [];
            } catch (e) {
                console.log(new Date(), e);
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
                const conn = await mysql_pool.getConnection();
                const [rows, fields] = await conn.execute(sql);
                conn.release()
                console.log(new Date(), " insert into t_match_history " + rows.info);
                g_cache_data.matchListHistories = [];
            } catch (e) {
                console.log(new Date(), e);
                console.log(new Date(), "saveAll :", sql);
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
        console.log(new Date(), "id=" + minId + "已经获取完成，即将获取下一个");
        minId += 1;
        setTimeout(getMatch, (minId % 10) * 100);
    } else {
        console.log(new Date(), "当前id=" + minId + ",已经到了最大id=" + maxId + "，结束程序");
        await finish();
    }
}

async function finish() {
    console.log(new Date(), "缓存odds数据入库开始");
    await getOdds(true);
    console.log(new Date(), "缓存odds入库完成\n缓存match数据入库开始");
    await saveAll();
    console.log(new Date(), "缓存match入库完成");
    // await hook_page.browser().close();
    await process.exit();
}

async function getMatch() {
    if (minId <= maxId) {
        console.log(new Date(), "正在获取id " + minId + ",最大id是 " + maxId);
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
//从http://www.okooo.com/soccer/match/610101/history/ 开始获取数据，最小id 为 610101 开始，
var hook_page = null;
(async () => {
    if (!minId || !maxId || isNaN(minId) || isNaN(maxId)) {
        minId = parseInt(await getIdFromDb());
        if (isNaN(minId)) {
            minId = 610101;
        }
        maxId = minId + 1000;
    }
    console.log(new Date(), {
        minId,
        maxId
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