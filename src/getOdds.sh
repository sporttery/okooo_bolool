#!/bin/sh
[ ! -x src/curl_odds.sh -o ! -f src/saveOdds.js ] && {
  echo "找不到可执行文件`pwd`/src/curl_odds.sh 或者  `pwd`/src/saveOdds.js 文件"
  exit
}
[ ! -d ../odds ] && mkdir ../odds
echo $(date +"%F %T")执行中
ids=""
count=0
for id in $(mysql -uroot -h database.com -s -p876543219 -Dbolool -e "select m.id from t_match m left join t_match_odds o  on m.id = o.matchId where o.matchId is null order by m.id asc limit 100;")
do
expr $id "+" 10 &> /dev/null
if [ $? -eq 0 ];then
  ids=$ids","$id
  count=$((count + 1))
fi
done
echo "共获取$count条数据等待处理"


data1file=../odds/${ids:1:30}-1.js
echo "获取欧盘数据"
src/curl_odds.sh 1 ${ids:1} > $data1file
firstId=${ids:1:6}
sleep 0.$((firstId % 10))
data2file=../odds/${ids:1:30}-2.js
echo "获取亚盘数据"
src/curl_odds.sh 2 ${ids:1} > $data2file
echo "处理数据并入库"
src/saveOdds.js $data1file $data2file ${ids:1}
if [ $count -eq 100 ] ; then
  sleep 0.$((firstId % 10))
  echo "继续后一轮数据处理"
  $0 $*
fi