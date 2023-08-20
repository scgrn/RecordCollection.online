#!/bin/sh

mysql --defaults-file=~/recordcollection.online/utils/resetDemo.cnf -h mysql.recordcollection.online recordcollection_online < ~/recordcollection.online/utils/resetDemo.sql


