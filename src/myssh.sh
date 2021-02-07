#!/bin/sh
[ $# -eq 0 ] && {
echo 必须传递参数
exit
}
host=$1
if [ ${host:0:5} == "okooo" ] ; then
echo "$*"
ssh $*
else
#for ip in 1 2 3 4 5 6 7 8 9 10
for ip in 5 6 8
do
hostname=okooo-$ip
echo "$hostname $*"
ssh $hostname $*
done
fi