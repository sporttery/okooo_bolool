#!/bin/sh
[ $# -eq 0 ] && {
echo 必须传递参数，文件或者目录
exit
}
[ ! -d "$1" -a ! -f "$1" ] && {
echo $1 并不是文件也不是目录
exit
}
destFile=$2
[ "A${destFile}" == "A" ] && {
destFile=$1
}
#for ip in 1 2 3 4 5 6 7 8 9 10
for ip in 5 6 7 8 9 10
do
hostname=okooo-$ip
echo $hostname
if [ -d "$1" ] ; then
echo "scp -r $1 $hostname:$destFile"
scp -r $1 $hostname:$destFile
else
echo "scp  $1 $hostname:$destFile"
scp  $1 $hostname:$destFile
fi
done