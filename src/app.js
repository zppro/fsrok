/**
 * Created by zppro on 15-12-7.
 */

'use strict';

var _ = require('underscore');
var log4js = require('log4js');
var koa = require('koa');
var router = require('koa-router')();
var koaBody = require('koa-body')();
var statelessauth = require('koa-statelessauth');
var jwt = require('jsonwebtoken');
var path = require('path');
var fs = require('fs-extra');
var co = require('co');
var thunkify = require('thunkify');
var rfcore = require('rfcore');

var auth = require('./libs/auth-mongo.js');
//console.log(conf);

var app = koa();
app.conf = {
    dir: {
        root: __dirname,
        log: path.join(__dirname, 'logs'),
        data: path.join(__dirname, 'data'),
        service: path.join(__dirname, 'services')
    },
    auth: {
        ignorePaths: ['/auth']
    },
    db: {
        //mssql数据库配置
        sqlserver: {
            user: '数据库用户',
            password: '密码',
            server: '服务器IP',
            port: '服务器端口',
            database: '数据库名'
        },
        mongodb:{
            user: '数据库用户',
            password: '密码',
            server: '服务器IP',
            port: '服务器端口',
            database: '数据库名'
        }
    },
    secure:{
        authSecret:'认证密钥'
    }
};


// conf
rfcore.config(app.conf,process.argv);
//console.log(JSON.stringify(app.conf.db.mongodb));

//ensure dirs
console.log('ensure dirs...');
_.each(app.conf.dir,function(v){
    fs.ensureDir(v);
});




// logger
//app.use(function *(next){
//    var start = new Date;
//    yield next;
//    var ms = new Date - start;
//    console.log('logger    %s %s - %s', this.method, this.url, ms);
//});

//Session
//app.keys = ['leblue'];
//app.use(session(app));


app.data = rfcore.dataP;
app.dictionary = rfcore.dictionary;
console.log('co...')

co(function*(){
    //app.conf.serviceFiles = yield thunkify(fs.readdir)(app.conf.dir.service);
    //console.log('serviceFiles:'+JSON.stringify(app.conf.serviceFiles));

    app.conf.serviceNames = _.map((yield thunkify(fs.readdir)(app.conf.dir.service)),function(o){ return o.substr(0,o.indexOf('.'))});

    //配置日志
    log4js.configure({ appenders: _.map(app.conf.serviceNames,function(o){
      return {
          type: 'dateFile',
          filename:  path.join(app.conf.dir.log,o+'.js'),
          pattern: '-yyyy-MM-dd.log',
          alwaysIncludePattern: true,
          category: o+'.js'
      };
    })});

    //注册服务路由
    _.each(app.conf.serviceNames,function(o){
        router.post('/services/'+o.split('_').join('/'), koaBody, require('./services/' + o+'.js')(app));
    });



    //需要登录访问控制
    app.use(statelessauth({
            validate: function (token) {
                //This should go to a DB etc to get your user based on token
                //token to user
                try{
                    this.user = jwt.verify(token, app.conf.secure.authSecret);

                }catch(e){
                    this.status = 401;
                }

                return this.user;
            }},
        {
            ignorePaths: _.union(app.conf.auth.ignorePaths,_.map(app.conf.serviceNames,function(o){ return '/services/'+o.split('_').join('/');}))
        }
    ));

    //注册其他路由
    router
        .get('/', function *(next) {
            this.body = 'hello guest';
            yield next;
        })
        .post('/auth', koaBody, auth(app));

    app.use(router.routes())
        .use(router.allowedMethods());

    app.data.init(app.conf.dir.data,{items:app.conf.serviceNames.concat()}).then(function(){
        //设置data service 远程
        //var options = {getPath:'/data/get',setPath:'data/set',writePath:'data/write'};
        //注册地址
        app.data.remote.init(router);//注册
        app.conf.auth.ignorePaths.push(app.data.remote.settings.getPath);
        app.conf.auth.ignorePaths.push(app.data.remote.settings.setPath);
        app.conf.auth.ignorePaths.push(app.data.remote.settings.writePath);



        // listen
        app.listen(3000);
    });

});



