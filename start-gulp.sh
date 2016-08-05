#!/bin/sh
cd ~/github/fsrok/

if [ $1 == "anyang-1.0" ]
    then
        echo 'target='${1}
    else
        echo 'invalid target!!'
        exit
fi

gulp --target=$1 --level=$2
