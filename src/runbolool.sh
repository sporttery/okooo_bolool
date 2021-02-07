#!/bin/sh
if [ $# -eq 0 ] ; then
        echo 必须传递2个参数，一个是开始id，一个是结束id
        exit
fi
logFile=/root/okooo_bolool.log
cd /root/okooo_bolool
echo "nohup npm run main $1 $2 $3 2>&1 > $logFile &"
nohup npm run main $1 $2 $3 2>&1 > $logFile &
sleep 2 
tail -n 10 $logFile