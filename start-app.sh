#!/bin/sh
cd ~/github/fsrok/src/
node --harmony app.js isProduction=false client.bulidtarget=anyang-1.0 db.mongodb.user=fs db.mongodb.password=fs2015 db.mongodb.server=localhost db.mongodb.port=27017 db.mongodb.database=fs secure.authSecret=anyang port=80
