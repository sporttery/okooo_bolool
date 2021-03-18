#!/bin/sh
echo 通过模拟打开网站获取数据，定时，每2小时执行一次
dir=`dirname $0`
dir=`dirname $dir`
[ ! -f $dir/package.json ] && {
    echo 找不到文件$dir/package.json，请确认代码是否完整
    exit
}
cd $dir
echo 获取今天数据
npm run openUrl http://www.bolool.com:8080/bolool.html
echo 获取昨天数据
npm run openUrl http://www.bolool.com:8080/bolool.html?date=`date -d 'yesterday' +"%F"`
echo 获取前天数据
npm run openUrl http://www.bolool.com:8080/bolool.html?date=`date -d '2 days ago' +"%F"`

echo 执行完成
