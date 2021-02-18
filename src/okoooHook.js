//从http://www.okooo.com/soccer/match/610101/history/ 开始获取数据，最小id 为 610101 开始，


var g_cache,
    g_team,
    g_layer_load_idx,
    g_odds_time_flag,
    g_id_start = {},
    g_id_finish = {};

// const apiDomain = "http://42.192.75.9/api";
const apiDomain = "http://127.0.0.1:8080/api";

function safeHtml(d) {
    return d.replace(/[\r\n]/g, "").replace(/<head.+?<\/head>/g, "").replace(/<script.+?<\/script>/g, "").replace(/<img.+?>/g, "").replace(/<link.+?>/g, "").replace(/<style.+?<\/style>/g, "");
}

/*
获取所有的球队
g_team = {};

function teamCallback(teamId) {
    return function (d) {
        d = $(safeHtml(d));
        var parentName = d.find(".qdtxt span:eq(0)").text();
        var name = d.find(".team-title").text();
        g_team[teamId]={name,parentName};
        if (teamId < 2833) {
            setTimeout(getTeam, (teamId % 10) * 100, teamId + 1);
        }
    }
}

function getTeam(teamId) {
    // $.get("/soccer/team/" + teamId + "/", teamCallback(teamId));
    $.ajax({
        type: "get",
        url: "/soccer/team/" + teamId + "/",
        beforeSend: function (xhr) {
            xhr.overrideMimeType("text/plain; charset=gb2312");
        },
        success: teamCallback(teamId)
    })
}
getTeam(1);
*/


//比赛结果
function getResult(scores) {
    return scores[0] == scores[1] ? "平" : scores[0] > scores[1] ? "胜" : "负";
}
//比赛积分
function getGoalscore(scores) {
    return scores[0] > scores[1] ? 3 : scores[0] == scores[1] ? 1 : 0;
}
//比赛强弱
function getStrong(hscore, ascore) {
    return hscore > ascore ? '强' : hscore == ascore ? '平' : '弱';
}

//获取分区
function getScoreSection(score, count) {
    score = parseInt(score)
    if (count < 33) {
        return 9 - parseInt(score / 10);
    } else {
        return 10 - parseInt(score / 10);
    }
}
/**
 * 从tr中获取比赛数据
 */
function getMatchFromTr(tr) {
    var id = parseInt($(tr).attr("data-matchid"));
    tds = tr.children;
    var homeName = $(tds[2]).text();
    var homeId = parseInt($(tds[2]).attr("attr"));
    var leagueId = parseInt($(tds[0]).find("a").attr("href").split("/")[3]);
    var leagueName = $(tds[0]).find("a").text();
    var awayName = $(tds[4]).text();
    var awayId = parseInt($(tds[4]).attr("attr"));
    var fullscore = $(tds[3]).text();
    var halfscore = $(tds[5]).text();
    var leagueType = $(tr).attr("data-lt");
    if (!leagueType) {
        leagueType = "league";
    }
    var time = $(tds[1]).find(".smalltitle").text();
    if (time.length == 16) {
        time = time + ":00";
    } else if (time.length == 8) {
        time = $(tds[1]).find("a").text() + " " + time;
    }
    var playtime = parseInt(time.replace(/[^\d]/g, ""));
    var scores = fullscore.split("-");
    var result = "未开",
        goalscore = 0;
    if (scores.length == 2) {
        result = getResult(scores);
        goalscore = getGoalscore(scores);
    }
    return {
        id,
        leagueId,
        leagueName,
        leagueType,
        homeId,
        homeName,
        awayId,
        awayName,
        fullscore,
        halfscore,
        playtime,
        result,
        goalscore
    };
}

function sum(arr, key) {
    var s = 0;
    if (key) {
        for (var i = 0; i < arr.length; i++) {
            s += parseInt(arr[i][key]);
        }
    } else {
        for (var i = 0; i < arr.length; i++) {
            s += parseInt(arr[i]);
        }
    }
    return s;
}

function concat(arr, key, split) {
    var s = [];
    if (key) {
        for (var i = 0; i < arr.length; i++) {
            s.push(arr[i][key]);
        }
    } else {
        for (var i = 0; i < arr.length; i++) {
            s.push(arr[i]);
        }
    }
    if (!split) {
        split = "";
    }
    return s.join(split);
}




function saveMatch(matches) {
    $.post(apiDomain + "/saveMatch", JSON.stringify(matches), function (d) {
        console.log(d);
    });
}


function saveBolool(bolools) {
    $.post(apiDomain + "/saveBolool", {
        "bolools": JSON.stringify(bolools)
    }, function (d) {
        console.log(d);
    });
}


function saveMatchHistory(matches) {
    $.post(apiDomain + "/saveMatchHistory", {
        "matches": JSON.stringify(matches)
    }, function (d) {
        console.log(d);
    });
}

function saveMatchOdds(matchOdds) {
    $.post(apiDomain + "/saveMatchOdds", {
        "matchOdds": JSON.stringify(matchOdds)
    }, function (d) {
        console.log(d);
    });
}


function saveTeam() {
    var teams = [];
    for (var id in g_team) {
        var team = g_team[id];
        team.id = id;
        teams.push(team);
    }
    $.post(apiDomain + "/saveTeam", {
        "teams": JSON.stringify(teams)
    }, function (d) {
        console.log(d);
    });
}

function saveAll(match, boloolData, matchListHistory) {

    $.post(apiDomain + "/saveAll", {
        "match": JSON.stringify(match),
        "bolools": JSON.stringify(Object.values(boloolData)),
        "matchListHistory": JSON.stringify(matchListHistory)
    }, function (d) {
        console.log(d);

    });
}

/**
 * 
 * @param {*} arr 要计算的matchlist(历史对阵)
 * @param {*} topN 前N条数据进行计算
 * @param {*} friend 0 没有友谊赛 1 全部比赛 2 只有友谊赛
 */

function calcBolool(arr, topN, friend) {
    var calcArr = [];
    if (friend == 1) { //全部比赛
        calcArr = arr.slice(0, topN);
    } else if (friend == 0) { //没有友谊赛
        for (var i = 0; i < arr.length; i++) {
            var match = arr[i];
            if (match.leagueType != "friend") {
                calcArr.push(match);
            }
            if (calcArr.length == topN) {
                break;
            }
        }
    } else { // 只有友谊赛 
        for (var i = 0; i < arr.length; i++) {
            var match = arr[i];
            if (match.leagueType == "friend") {
                calcArr.push(match);
            }
            if (calcArr.length == topN) {
                break;
            }
        }
    }

    score = sum(calcArr, "hgoalscore");
    section = getScoreSection(score, topN);
    result = concat(calcArr, "hresult");
    // var s=0,p=0,f=0;
    // for(var i=0;i<result.length;i++){
    //     if(result[i] == "胜"){
    //         s++;
    //     }else if(result[i] == "平"){
    //         p++;
    //     }else{
    //         f++;
    //     }
    // }
    // result = s+"胜"+p+"平"+f+"负";
    return {
        score,
        section,
        result
    };

}

function getBolool(hbolool, abolool) {
    var bolool = {};
    for (var key in hbolool) {
        bolool["h" + key] = hbolool[key];
    }
    for (var key in abolool) {
        bolool["a" + key] = abolool[key];
    }
    return bolool;
}

function getMatchCallback(id, maxId) {
    return function (d) {
        g_id_finish["_" + id] = 1;
        d = $(safeHtml(d));
        var tr = d.find(".jsThisMatch");

        var tds = tr.find("td");
        var leagueUrl = $(tds[0]).find("a").attr("href").split("/");
        var seasonId = parseInt(leagueUrl[5]);
        var lunci = d.find("#lunci");
        if (tr.length == 0 || lunci.length == 0) {
            console.log("id=" + id + " 这场比赛没有数据");
            return;
        }
        var spans = lunci.find("span");
        var seasonName = $(spans[0]).find("a:last").text();
        var round = $(spans[1]).text().trim();
        if (spans.length == 3) {
            round += $(spans[2]).text().trim();
        }
        if (!round) {
            round = "0";
        }

        var match = getMatchFromTr(tr[0]);

        if (!match.leagueId) {
            console.log("id=" + id + " 这场比赛没有数据");
            setTimeout(getMatch, (id % 10) * 100, id + 1, maxId);
            return;
        }

        match.seasonId = seasonId;
        match.seasonName = seasonName;
        match.round = round;

        var time = d.find(".time").text();
        if (time.length == 13) {
            time = time.substring(0, 8) + " " + time.substring(8);
        }
        var playtime = "20" + time + ":00";
        match.playtime = parseInt(playtime.replace(/[^\d]/g, ""));

        var now = new Date().getTime() + 1000 * 60 * 60 * 24 * 7; //1周之后

        playtime = playtime.split(/[- :]/);
        playtime[1] = parseInt(playtime[1]) - 1;

        matchtime = new Date(playtime[0], playtime[1], playtime[2], playtime[3], playtime[4], playtime[5]);

        if (now < matchtime.getTime()) {
            console.log(match.playtime + " 日期已经大于今天1周了，结束程序");
            console.log(match);
            finish();
            return;
        }


        var all_h = [],
            all_a = [];

        d.find(".homecomp").find("tr:gt(2)").each((idx, el) => {
            var matchHistory = getMatchFromTr(el);
            if (matchHistory.id == match.id) {
                return true;
            }
            var scores = matchHistory.fullscore.split("-");

            if (scores.length == 2) {
                if (matchHistory.homeId != match.homeId) { //如果这场比赛的客队是查询比赛的主队，则将比分替换下获取比赛结果和积分
                    tmp = scores[0];
                    scores[0] = scores[1];
                    scores[1] = tmp;
                }
                var result = getResult(scores);
                var goalscore = getGoalscore(scores);
                matchHistory.hresult = result;
                matchHistory.hgoalscore = goalscore;

                all_h.push(matchHistory);

            }
        });

        d.find(".awaycomp").find("tr:gt(2)").each((idx, el) => {
            var matchHistory = getMatchFromTr(el);
            if (matchHistory.id == match.id) {
                return true;
            }
            var scores = matchHistory.fullscore.split("-");

            if (scores.length == 2) {
                if (matchHistory.homeId != match.awayId) { //如果这场比赛的客队是查询比赛的主队，则将比分替换下获取比赛结果和积分
                    tmp = scores[0];
                    scores[0] = scores[1];
                    scores[1] = tmp;
                }
                var result = getResult(scores);
                var goalscore = getGoalscore(scores);
                matchHistory.hresult = result;
                matchHistory.hgoalscore = goalscore;

                all_a.push(matchHistory);

            }
        });

        //俱乐部最近33场比赛，要去掉友谊赛
        //国家队比赛保留友谊赛


        var isCountryTeamA = false,
            isCountryTeamH = false;
        if (typeof g_team == "object") {
            var team = g_team[match.awayId];
            var pname;
            if (team) {
                pname = team.parentName;
                isCountryTeamA = pname.indexOf("友谊赛") != -1 || pname.indexOf("国家") != -1 || pname.indexOf("奥运") != -1 || pname.indexOf("欧洲") != -1 || pname.indexOf("亚洲") != -1 ||
                    pname.indexOf("亚运") != -1 || pname.indexOf("美洲") != -1 || pname.indexOf("非洲") != -1 || pname.indexOf("世欧预") != -1 || pname.indexOf("世亚预") != -1 || pname.indexOf("世南美预") != -1;
            }
            team = g_team[match.homeId];
            if (team) {
                pname = team.parentName;
                isCountryTeamH = pname.indexOf("友谊赛") != -1 || pname.indexOf("国家") != -1 || pname.indexOf("奥运") != -1 || pname.indexOf("欧洲") != -1 || pname.indexOf("亚洲") != -1 ||
                    pname.indexOf("亚运") != -1 || pname.indexOf("美洲") != -1 || pname.indexOf("非洲") != -1 || pname.indexOf("世欧预") != -1 || pname.indexOf("世亚预") != -1 || pname.indexOf("世南美预") != -1;
            }
        }


        var boloolData = {};
        var topN = 33;
        var hbolool = calcBolool(all_h, topN, isCountryTeamH ? 1 : 0);
        var abolool = calcBolool(all_a, topN, isCountryTeamA ? 1 : 0);
        hbolool.strong = getStrong(hbolool.score, abolool.score);
        abolool.strong = getStrong(abolool.score, hbolool.score);

        var bolool = getBolool(hbolool, abolool);
        bolool.topN = topN;
        bolool.friendly = 0;
        bolool.matchId = match.id;
        bolool.id = match.id;
        boloolData["top" + topN] = bolool;


        topN = 30;
        hbolool = calcBolool(all_h, topN, 1);
        abolool = calcBolool(all_a, topN, 1);
        hbolool.strong = getStrong(hbolool.score, abolool.score);
        abolool.strong = getStrong(abolool.score, hbolool.score);
        bolool = getBolool(hbolool, abolool);
        bolool.topN = topN;
        bolool.friendly = 1;
        bolool.matchId = match.id;
        bolool.id = match.id;
        boloolData["top" + topN] = bolool;

       


        var matchListHistory = {
            id: match.id,
            matchlist: JSON.stringify({
                "h": all_h,
                "a": all_a
            })
        };

        saveAll(match, boloolData, matchListHistory);

        if (g_cache) {
            var tr = [];
            tr.push('<tr id="m' + match.id + '" class="noOdds">');
            tr.push('<td><a href="http://www.okooo.com/soccer/league/' + match.leagueId + '/" target="_blank">' + match.leagueName + '</a></td>');
            tr.push('<td><a href="http://www.okooo.com/soccer/league/' + match.leagueId + '/schedule/' + match.seasonId + '/" target="_blank">' + match.seasonName + '</a></td>');
            tr.push('<td>' + match.round + '</td>');
            tr.push('<td><a href="http://www.okooo.com/soccer/match/' + match.id + '/history/" target="_blank">' + match.playtime + '</a></td>');
            tr.push('<td><a href="http://www.okooo.com/soccer/team/' + match.homeId + '/" target="_blank">' + match.homeName + '</a></td>');
            tr.push('<td><a href="http://www.okooo.com/soccer/match/' + match.id + '/" target="_blank">' + (match.result != "未开" ? match.fullscore + '<br/>(' + match.halfscore + ")" : "") + '</a></td>');
            tr.push('<td><a href="http://www.okooo.com/soccer/team/' + match.awayId + '/" target="_blank">' + match.awayName + '</a></td>');
            tr.push('<td class="odds1_' + match.id + '">--</td><td class="odds1_' + match.id + '">--</td><td class="odds1_' + match.id + '">--</td><td class="odds2_' + match.id + '">--</td><td class="odds2_' + match.id + '">--</td><td class="odds2_' + match.id + '">--</td>');
            tr.push('<td><span class="top33" title="' + boloolData["top33"].hresult + '">' + boloolData["top33"].hscore + '</span><span class="top30" title="' + boloolData["top30"].hresult + '">' + boloolData["top30"].hscore + '</span></td>');
            tr.push('<td><span class="top33" title="' + boloolData["top33"].aresult + '">' + boloolData["top33"].ascore + '</span><span class="top30" title="' + boloolData["top30"].aresult + '">' + boloolData["top30"].ascore + '</span></td>');
            tr.push('<td><span class="top33">' + boloolData["top33"].hsection + '</span><span class="top30">' + boloolData["top30"].hsection + '</span></td>');
            tr.push('<td><span class="top33">' + boloolData["top33"].asection + '</span><span class="top30">' + boloolData["top30"].asection + '</span></td>');
            tr.push('<td><span class="top3">' + boloolData["top3"].hresult + '</span><span class="top6">' + boloolData["top6"].hresult + '</span></td>');
            tr.push('<td><span class="top3">' + boloolData["top3"].aresult + '</span><span class="top6">' + boloolData["top6"].aresult + '</span></td>');
            tr.push('<td><span class="top3">' + boloolData["top3"].hstrong + '</span><span class="top6">' + boloolData["top6"].hstrong + '</span></td>');
            tr.push('<td><span class="top3">' + boloolData["top3"].astrong + '</span><span class="top6">' + boloolData["top6"].astrong + '</span></td>');
            tr.push('</tr>');
            g_cache.append(tr.join(''));
        } else {
            console.log({
                match,
                matchListHistory,
                boloolData
            });
        }

        if (id < maxId) {
            console.log("id=" + id + "已经获取完成，即将获取下一个");
            setTimeout(getMatch, (id % 10) * 100, id + 1, maxId);
        } else {
            console.log("当前id=" + id + ",已经到了最大id=" + maxId + "，结束程序");
            finish();
        }
    }
}

function getMatch(id, maxId) {
    if (!g_id_start["_" + id]) {
        g_id_start["_" + id] = 1;
        console.log("正在获取id " + id + ",最大id是 " + maxId);
        $.ajax({
            type: "get",
            url: "/soccer/match/" + id + "/history/",
            beforeSend: function (xhr) {
                xhr.overrideMimeType("text/plain; charset=gb2312");
            },
            success: getMatchCallback(id, maxId)
        })
    } else {
        console.log("id " + id + " 已经获取过了 ");
    }
}

function getOddsCallback(ids, startIndex, count, bettingTypeId) {
    return function (d) {
        json = JSON.parse(d);
        for (var key in json) {
            var arr = json[key];
            if (!g_odds_data[key]) {
                g_odds_data[key] = [key];
            }
            g_odds_data[key][bettingTypeId] = arr;
            $(".odds" + bettingTypeId + "_" + key).each((idx, el) => {
                el.innerHTML = arr[idx];
            });
            $("#m" + key).removeClass("noOdds");
        }
        get_odds_is_running["" + bettingTypeId] = false;
        if (!get_odds_is_running["1"] && !get_odds_is_running["2"]) {
            var matchOdds = [];
            for (var key in g_odds_data) {
                var arr = g_odds_data[key];
                if (arr.length == 3) {
                    var odds = {};
                    odds.matchId = key;
                    odds.s = arr[1][0];
                    odds.p = arr[1][1];
                    odds.f = arr[1][2];
                    odds.h = arr[2][0];
                    odds.pan = arr[2][1];
                    odds.a = arr[2][2];
                    odds.companyId = 27;
                    matchOdds.push(odds);
                }
            }
            saveMatchOdds(matchOdds);
        }
        var newStartIndex = startIndex + count;
        if (ids.length > newStartIndex) {
            clearTimeout(g_odds_time_flag);
            g_odds_time_flag = setTimeout(getOdds, (newStartIndex % 9) * 100, ids, newStartIndex, count);
        } else {
            clearTimeout(g_odds_time_flag);
            g_odds_time_flag = setTimeout(getOdds, (new Date().getTime() % 20) * 1000, null, 0, count);
        }
    };
}

var get_odds_is_running = {};
var g_odds_data = {};
/**
 * 获取比赛id的bet365的欧盘和亚盘 （初盘）
 * @param {*} ids 数组
 * @param {*} startIndex  开始的下标
 * @param {*} count 一次获取多少个
 */
function getOdds(ids, startIndex, count) {
    if (get_odds_is_running["1"] || get_odds_is_running["2"]) {
        console.log(get_odds_is_running, " 1秒后再次运行", new Date());
        clearTimeout(g_odds_time_flag);
        g_odds_time_flag = setTimeout(getOdds, 1000, ids, startIndex, count);
        return;
    }

    if (!ids) {
        ids = [];
        $(".noOdds").each((idx, el) => {
            ids.push(el.id.substring(1));
        });
    }
    if (ids.length <= startIndex) {
        var waitSeconds = (new Date().getTime() % 21);
        console.log("startIndex" + startIndex + " ,ids :" + ids.length + " ," + waitSeconds + "秒后再次运行", new Date());
        clearTimeout(g_odds_time_flag);
        g_odds_time_flag = setTimeout(getOdds, waitSeconds * 1000, null, 0, count);
        return;
    }

    var matchIds = ids.slice(startIndex, startIndex + count);
    var postData = {
        bettingTypeId: 1,
        providerId: 27,
        matchIds: matchIds.join(",")
    };
    get_odds_is_running["1"] = true;
    $.post("/ajax/?method=data.match.odds", postData, getOddsCallback(ids, startIndex, count, postData.bettingTypeId));
    postData.bettingTypeId = 2;
    get_odds_is_running["2"] = true;
    $.post("/ajax/?method=data.match.odds", postData, getOddsCallback(ids, startIndex, count, postData.bettingTypeId));
}

function finish() {
    if (typeof layer != "undefined") {
        layer.close(g_layer_load_idx);
    }
    $('#clickme').show();
    $('#controlTop').show();
    getOdds(null, 0, 100);
}

function getIdFromDb() {
    $.get(apiDomain + "/getId", function (d) {
        $("#value").val(d + "-" + (parseInt(d) + 100));
    })
}

function doit() {
    var arr = $("#value").val().split(/[^\d]+/g);
    if (arr.length == 2) {
        if (typeof layer != "undefined") {
            g_layer_load_idx = layer.load(1);
        }
        $('#clickme').hide();
        getMatch(parseInt(arr[0]), parseInt(arr[1]));
    } else {
        alert("格式错误，请参照 1-1000");
    }
}

function ckchange(obj) {
    var topN = obj.id.replace("show", "");
    if (obj.checked) {
        $("." + topN).show();
    } else {
        $("." + topN).hide();
    }
}

function doHook() {
    if (location.href.indexOf("42.192.75.9") == -1) {
        if (location.href != "http://www.okooo.com/jingcai/") {
            if (document.getElementById("second")) {
                second = parseInt(document.getElementById("second").innerHTML);
                if (isNaN(second)) {
                    second = 5;
                } else {
                    second = second - 1;
                }
                if (second < 0) {
                    location.href = "http://www.okooo.com/jingcai/";
                } else {
                    document.getElementById("second").innerHTML = second;
                }
            } else {
                document.writeln('这个页面不能处理脚本，<font id="second" style="color:red">5</font>即将跳到正确的页面。<a href="http://www.okooo.com/jingcai/">跳转</a>');
            }
            setTimeout(doHook, 1000);
            return;
        }

        if (typeof jQuery == "undefined" || jQuery.fn.jquery < '2.2.4') {
            if (!document.getElementById("hasJquery")) {
                console.log("开始注入标准库1");
                var sc = document.createElement("script");
                sc.src = 'https://cdn.bootcdn.net/ajax/libs/jquery/2.2.4/jquery.min.js';
                sc.id = "hasJquery";
                document.head.append(sc);
            }
            console.log(new Date() + " 标准库1注入未完成，等待中....");
            setTimeout(doHook, 1000);
            return;
        }
        console.log("标准库1已经完成注入");
        console.log("标准库1已经完成注入");
        if (typeof layer == "undefined") {
            if (!document.getElementById("hasLayer")) {
                console.log("开始注入标准库2");
                $("head").append('<script id="hasLayer" src="https://cdn.bootcdn.net/ajax/libs/layer/2.3/layer.js"></script>');
            }
            console.log(new Date() + " 标准库2注入未完成，等待中....");
            setTimeout(doHook, 1000);
            return;
        }
        console.log("标准库2已经完成注入");
        var msg = "<link href=\"https://cdn.bootcdn.net/ajax/libs/layer/2.3/skin/layer.css\" rel=\"stylesheet\"><style>table td{text-align:center}.top33,.top3{padding:5px 5px;}.top30,.top6{display:none;color:green;padding:5px 5px;margin-right:10px;}</style>";
        msg += "<h1>请输入开始的id和结束的id，用\"-\"减号分开，比如 1000-1001: <input id='value' value='' />&nbsp;<a href='javascript:getIdFromDb()' id='getIdFromDb'>从系统中获取</a></h1>";
        msg += "<h3 id='clickme'><a href='javascript:doit()' style='color:red'>点我开始</a></h3>"
        msg += "<h2 id='controlTop' style='display:none;'><label for='showtop33'><input type=checkbox checked='true' id='showtop33' onchange='ckchange(this)'/>近33场</label><label for='showtop30'><input type=checkbox id='showtop30' onchange='ckchange(this)'/>近30场</label>"
        msg += "<label for='showtop3'><input type=checkbox checked='true' id='showtop3' onchange='ckchange(this)'/>近3场</label><label for='showtop6'><input type=checkbox id='showtop6' onchange='ckchange(this)'/>近6场</label></h2>"
        msg += "<table width=\"100%\" border=\"1\" cellspacing=\"0\" cellpadding=\"0\">";
        msg += "<thead><tr><th rowspan=2>赛事</th><th rowspan=2>赛季</th><th rowspan=2>轮次</th><th rowspan=2>时间</th><th rowspan=2>主队</th><th rowspan=2>比分</th><th rowspan=2>客队</th>";
        msg += "<th colspan=3>bet365欧盘</th><th colspan=3>bet365亚盘</th><th colspan=2>积分</th><th colspan=2>分区</th><th colspan=2>近n场</th><th colspan=2>强弱</th></tr>";
        msg += "<tr><th>胜</th><th>平</th><th>负</th><th>主</th><th>盘口</th><th>客</th><th>主</th><th>客</th><th>主</th><th>客</th><th>主</th><th>客</th><th>主</th><th>客</th></tr></thead>";
        msg += "<tbody id=g_cache>";
        msg += "</tbody></table>"
        document.writeln(msg);
    }
    g_cache = $("#g_cache");
    g_layer_load_idx = layer.load();
    $.getJSON(apiDomain + "/team.json", function (d) {
        layer.close(g_layer_load_idx);
        g_team = d;
    })
    getOdds(null, 0, 100);
}
doHook();