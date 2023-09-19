#!/bin/sh

mysql --defaults-file=~/recordcollection.online/scripts/resetDemoAccount.cnf -h mysql.recordcollection.online recordcollection_online < ~/recordcollection.online/scripts/resetDemoAccount.sql


