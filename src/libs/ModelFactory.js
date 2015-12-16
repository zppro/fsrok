/**
 * Created by zppro on 15-12-14.
 */
var mongoose = require('mongoose');

var ModelFactory = function(conn) {
    if (conn == null) {
        conn = mongoose.connection;
    }

    return {
        create: function (name, path, data) {
            return ModelFactory._create(ModelFactory.getModel(conn, name, path), data);
        },
        read: function (name, path, id) {
            return ModelFactory._read(ModelFactory.getModel(conn, name, path), id);
        },
        update: function (name, path, id, data) {
            return ModelFactory._update(ModelFactory.getModel(conn, name, path), id, data);
        },
        delete: function (name, path, id) {
            return ModelFactory._delete(ModelFactory.getModel(conn, name, path), id);
        },
        query: function (name, path, data) {
            return ModelFactory._query(ModelFactory.getModel(conn, name, path), data);
        },
        one: function (name, path, data) {
            return ModelFactory._one(ModelFactory.getModel(conn, name, path), data);
        }
    };
};

ModelFactory.getModel = function (conn,name,path) {
    if (conn == null) {
        conn = mongoose.connection;
    }
    return conn.model(name, require(path)(name));
};

ModelFactory._create =function (model,data) {
    return model.create(new model(data));
};

ModelFactory._read =function (model,id) {
    return model.findById(id);
};

ModelFactory._update =function (model,id,data) {
    return model.update({_id: id}, {$set: data});
};

ModelFactory._delete =function (model,id) {
    return model.remove({_id: id});
};

ModelFactory._query =function (model,data) {

    if (data) {
        var options = {};
        if (data.rows) {
            options.limit = data.rows;
        }
        if (data.rows && data.page) {
            options.skip = (data.page - 1) * data.rows;
        }
        if (data.sort) {
            return model.find(data.where, data.select, options).sort(data.sort);
        }
        else {
            return model.find(data.where, data.select, options);
        }
    }
    else {
        return model.find();
    }
};

ModelFactory._one =function (model,data) {
    if (data) {
        return model.findOne(data.where, data.select, data.options);
    }
    else {
        return model.findOne();
    }
};

module.exports = ModelFactory;