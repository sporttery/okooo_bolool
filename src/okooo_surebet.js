//打开比赛的 查看欧洲指数 页面，即 https://www.okooo.com/soccer/match/1122496/odds/change/50/
//点欧亚析的"欧"，再点任一家赔率公司进去，查看欧洲指数 
//此脚本将分析所有欧盘公司，赛前进行对冲的可能性
var timearr = {}, data = {}, cname = {};
$("#qq").find("a").each((idx, a) => {
	var cid = a.href.split("change/")[1].split("/")[0];
	var name = $(a).text().trim();
	cname[cid] = name;
	$.get(a.href, (d) => {
		var a = $(d).find(".table_title1").find(".bluetxt")[0];
		var cid = a.href.split("change/")[1].split("/")[0]
		if (!data[cname[cid]]) {
			data[cname[cid]] = [];
		}
		$(d).find("table").find("tr:gt(3)").each((idx, tr) => {
			var tds = $(tr).find("td");
			var time = $(tds[0]).text().trim().replace(/[^/:\s\d]/g, "");
			var odds0 = $(tds[2]).text().trim().replace(/[^.\d]/g, "");
			var odds1 = $(tds[3]).text().trim().replace(/[^.\d]/g, "");
			var odds2 = $(tds[4]).text().trim().replace(/[^.\d]/g, "");
			data[cname[cid]].push({ time, odds: { s: odds0, p: odds1, f: odds2 } })
		});
		var arr = data[cname[cid]];
		for (var i = 0; i < arr.length; i++) {
			var oddsInfo = arr[i];
			if (!timearr[oddsInfo.time]) {
				timearr[oddsInfo.time] = [];
			}
			timearr[oddsInfo.time].push({ cid:cname[cid], odds: oddsInfo.odds });
		}
	})
})

for (var time in timearr) {
	var arr = timearr[time];
	var odds = { s: { value: arr[0].odds.s, cid: arr[0].cid }, p: { value: arr[0].odds.p, cid: arr[0].cid }, f: { value: arr[0].odds.f, cid: arr[0].cid } };
	for (var i = 1; i < arr.length; i++) {
		if (arr[i].odds.s > odds.s.value) {
			odds.s.value = arr[i].odds.s;
			odds.s.cid = arr[i].cid;
		}
		if (arr[i].odds.p > odds.p.value) {
			odds.p.value = arr[i].odds.p;
			odds.p.cid = arr[i].cid;
		}
		if (arr[i].odds.f > odds.f.value) {
			odds.f.value = arr[i].odds.f;
			odds.f.cid = arr[i].cid;
		}
	}
	var returnRace = 1 / (1 / odds.s.value + 1 / odds.p.value + 1 / odds.f.value);
	if (returnRace > 1)
		console.info(time, returnRace, odds);
}