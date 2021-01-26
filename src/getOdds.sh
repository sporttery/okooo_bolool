ids=""
for id in $(mysql -uroot -s -p876543219 -Dbolool -e "select m.id from t_match m left join t_match_odds o  on m.id = o.matchId where o.matchId is null order by m.id asc limit 100;")
do
expr $id "+" 10 &> /dev/null
if [ $? -eq 0 ];then
  ids=$ids","$id
fi
done

data1file=/data/odds/$ids-1.js
/data/scripts/curl_odds.sh 1 ${ids:1} > $data1file
data2file=/data/odds/$ids-2.js
/data/scripts/curl_odds.sh 2 ${ids:1}) > $data2file

node /data/scripts/saveOdds.js $data1file $data2file $ids