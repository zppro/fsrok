/**
 * Created by zppro on 15-12-7.
 */

'use strict';

var _ = require('underscore');
var moment = require("moment");
var log4js = require('log4js');
var koa = require('koa');
var Router = require('koa-router');
var router = Router();
var koaBody = require('koa-body')();
var staticCache = require('koa-static-cache');
var path = require('path');
var fs = require('fs-extra');
var co = require('co');
var thunkify = require('thunkify');
var rfcore = require('rfcore');
var mongoose = require('mongoose');


var auth = require('./middlewares/auth.js');
//console.log(conf);

var app = koa();
app.conf = {
    isProduction: true,
    dir: {
        root: __dirname,
        log: path.join(__dirname, 'logs'),
        data: path.join(__dirname, 'data'),
        service: path.join(__dirname, 'services'),
        debugServices: path.join(__dirname, 'debug-services'),
        scheduleJobs: path.join(__dirname, 'schedule-jobs'),
        sequenceDefs: path.join(__dirname, 'sequence-defs'),
        businessComponents: path.join(__dirname, 'business-components'),
        static_develop: '../pub-client-develop/',
        static_production: '../pub-client-production/'
    },
    auth: {
        ignorePaths: ['/services/share/login']
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
        mongodb: {
            user: '数据库用户',
            password: '密码',
            server: '服务器IP',
            port: '服务器端口',
            database: '数据库名'
        }
    },
    secure: {
        authSecret: '认证密钥'
    },
    client: {
        bulidtarget: 'default'
    },
    port: 80
};

console.log('config...');
// conf
rfcore.config(app.conf,process.argv);

//去除字符对bool的影响
app.conf.isProduction = app.conf.isProduction == true || app.conf.isProduction === 'true';


//console.log(JSON.stringify(app.conf.db.mongodb));

//ensure dirs
console.log('ensure dirs...');
_.each(app.conf.dir,function(v){
    fs.ensureDir(v);
});

//load wrapper
app.wrapper = {
    cb: thunkify,
    res: {
        default: function () {
            return {success: true, code: 0, msg: null};
        },
        error: function (err) {
            return {success: false, code: err.code, msg: err.message};
        },
        ret: function (ret) {
            return {success: true, code: 0, msg: null, ret: ret};
        },
        rows: function (rows) {
            return {success: true, code: 0, msg: null, rows: rows};
        }
    }
};

//load dictionary
app.dictionary = rfcore.factory('dictionary');


//load pre-defined except dictionary.json
app.modelVariables = require('./pre-defined/model-variables.json');

//init database object
app.db = {};

//underscore
app._ = _;

//crypto
app.crypto = require('crypto');

app.clone = require('clone');

//pinyin
//app.pinyin = require('pinyin');

//moment
app.moment = moment;

//rfcore.util
app.util = rfcore.util;


//mongoose default date function
app.utcNow  = function() {
    return moment().add(8, 'h');
};

//mongoose string to objectId function
app.ObjectId = mongoose.Types.ObjectId;

//解析参数model
app.getModelOption =  function (ctx) {
    var modelName = ctx.params.model.split('-').join('_');//将 A-B改为A_B
    var modelPath = '../models/' + modelName.split('_').join('/');
    return {model_name: modelName, model_path: modelPath};
};

app.uid = require('rand-token').uid;

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


//app.data = rfcore.dataP;



console.log('co...');

co(function*() {
    //app.conf.serviceFiles = yield thunkify(fs.readdir)(app.conf.dir.service);
    //console.log('serviceFiles:'+JSON.stringify(app.conf.serviceFiles));
    console.log('load dictionary...');
    yield app.wrapper.cb(app.dictionary.readJSON.bind(app.dictionary))('pre-defined/dictionary.json');

    //配置数据库
    console.log('configure mongoose...');
    //app.db.mongoose = monoogse;
    var connectStr = 'mongodb://{0}:{1}@{2}:{3}/{4}'.format(app.conf.db.mongodb.user, app.conf.db.mongodb.password, app.conf.db.mongodb.server, app.conf.db.mongodb.port, app.conf.db.mongodb.database)
    mongoose.connect(connectStr);
    app.db = mongoose.connection.on('error', function (err) {
        console.log('mongodb error:');
        console.error(err);
    });
    mongoose.Promise =  global.Promise;


    console.log('configure models...');
    app.modelsDirStructure = yield app.util.readDictionaryStructure(path.resolve('models'),'.js');
    var ModelFactory = require('./libs/ModelFactory');
    ModelFactory.loadModel.bind(app)(app.modelsDirStructure);
    app.models = ModelFactory.models;
    app.modelFactory = ModelFactory.bind(app);

    console.log('configure business-components...');
    app.conf.businessComponentNames = _.map((yield app.wrapper.cb(fs.readdir)(app.conf.dir.businessComponents)), function (o) {
        return o.substr(0, o.indexOf('.'))
    });

    console.log('configure schedule jobs...');
    app.conf.scheduleJobNames = _.map((yield app.wrapper.cb(fs.readdir)(app.conf.dir.scheduleJobs)), function (o) {
        return o.substr(0, o.indexOf('.'))
    });

    console.log('configure schedule sequence defs...');
    app.conf.sequenceDefNames = _.map((yield app.wrapper.cb(fs.readdir)(app.conf.dir.sequenceDefs)), function (o) {
        return o.substr(0, o.indexOf('.'))
    });

    console.log('configure services...');
    app.conf.serviceNames = _.map((yield app.wrapper.cb(fs.readdir)(app.conf.dir.service)), function (o) {
        return o.substr(0, o.indexOf('.'))
    });

    if(!app.conf.isProduction){
        app.conf.debugServiceNames = _.map((yield app.wrapper.cb(fs.readdir)(app.conf.dir.debugServices)), function (o) {
            return o.substr(0, o.indexOf('.'))
        });
    }

    console.log('configure logs...');
    var configAppenders = [];
    configAppenders = _.union(configAppenders,_.map(app.conf.serviceNames, function (o) {
        return {
            type: 'dateFile',
            filename: path.join(app.conf.dir.log, o + '.js'),
            pattern: '-yyyy-MM-dd.log',
            alwaysIncludePattern: true,
            category: o + '.js'
        };
    }));

    if(!app.conf.isProduction){
        configAppenders = _.union(configAppenders,_.map(app.conf.debugServiceNames, function (o) {
            return {
                type: 'dateFile',
                filename: path.join(app.conf.dir.log, o + '.js'),
                pattern: '-yyyy-MM-dd.log',
                alwaysIncludePattern: true,
                category: o + '.js'
            };
        }));
    }

    //配置日志
    log4js.configure({
        appenders: configAppenders
    });


    console.log('configure sequences...');
    app.sequenceFactory = require('./libs/SequenceFactory').init(app.modelFactory(),app.models['pub_sequence']);
    _.each(app.conf.sequenceDefNames, function (o) {
        app.sequenceFactory.factory(o);
    });

    console.log('configure business-components... ');
    //app.CarryOverManager = require('./business-components/CarryOverManager').init(app);
    //初始化业务组件
    _.each(app.conf.businessComponentNames, function (o) {
        app[o] = require('./business-components/' + o).init(app);
    });

    console.log('configure jobs...');
    app.jobManger = rfcore.factory('jobManager');
    _.each(app.conf.scheduleJobNames, function (o) {
        var jobDef = require('./schedule-jobs/' + o);
        if (jobDef.needRegister) {
            console.log('create job use ' + o + '...');
            jobDef.register(app);
        }
    });

    console.log('register router...');
    //注册服务路由
    _.each(app.conf.serviceNames, function (o) {
        var service_module = require('./services/' + o);
        _.each(service_module.actions, function (action) {
            Router.prototype[action.verb].apply(router, [service_module.name + "_" + action.method, action.url, action.handler(app)]);
        });
    });

    if(!app.conf.isProduction){

        _.each(app.conf.debugServiceNames, function (o) {
            var service_module = require('./debug-services/' + o);
            _.each(service_module.actions, function (action) {
                Router.prototype[action.verb].apply(router, [service_module.name + "_" + action.method, action.url, action.handler(app)]);
            });
        });
    }


    console.log(app.conf.client.bulidtarget);

    //注册静态文件（客户端文件）
    if (app.conf.isProduction) {
        app.use(staticCache(app.conf.dir.static_production + app.conf.client.bulidtarget, {alias :{'/':'/index.html'}}));
    }
    else {
        app.use(staticCache(app.conf.dir.static_develop + app.conf.client.bulidtarget, {alias: {'/': '/index.html'}}));
        app.use(require('koa-livereload')());
    }


    //注册其他路由
    //router
    //    .get('/', function *(next) {
    //        this.body = 'hello guest';
    //        yield next;
    //    });

    //注意router.use的middleware有顺序
    router.use(koaBody);
    router.use('/services', auth(app), require('./middlewares/t1.js')(app));

    //router.use('/services', auth(app, _.union(app.conf.auth.ignorePaths, [])), require('./middlewares/t1.js')(app));


    app.use(router.routes())
        .use(router.allowedMethods());



    app.listen(app.conf.port);


    console.log('listening...');
    //注释掉数据服务
    //app.data.init(app.conf.dir.data,{items:app.conf.serviceNames.concat()}).then(function(){
    //    //设置data service 远程
    //    //var options = {getPath:'/data/get',setPath:'data/set',writePath:'data/write'};
    //    //注册地址
    //    app.data.remote.init(router,{middleware:koaBody});//注册
    //    app.conf.auth.ignorePaths.push(app.data.remote.settings.getPath);
    //    app.conf.auth.ignorePaths.push(app.data.remote.settings.setPath);
    //    app.conf.auth.ignorePaths.push(app.data.remote.settings.writePath);
    //
    //
    //
    //    // listen
    //
    //});

});



