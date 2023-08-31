#!/bin/sh

mysql --defaults-file=~/recordcollection.online/utils/resetDemoAccount.cnf -h mysql.recordcollection.online recordcollection_online < ~/recordcollection.online/utils/resetDemoAccount.sql


