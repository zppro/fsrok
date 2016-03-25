/**
 * Created by zppro on 15-12-14.
 */
var mongoose = require('mongoose');

var ModelFactory = function(conn) {
    if (conn == null) {
        conn = mongoose.connection;
    }
    ModelFactory.context = this;
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
        totals: function (name, path, data) {
            return ModelFactory._query(ModelFactory.getModel(conn, name, path), {where: data, select: '_id'});
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

    return conn.model(name, require(path)(this.context, name));
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
    var rows;
    if (data) {
        var options = {};
        if (data.page && data.page.size) {
            options.limit = data.page.size;
        }
        if (data.page && data.page.no) {
            options.skip = (data.page.no - 1) * data.page.size;
        }

        if (data.sort) {
            rows = model.find(data.where, data.select, options).sort(data.sort);
        }
        else {
            rows = model.find(data.where, data.select, options);
        }
    }
    else {
        rows = model.find();
    }

    return rows;
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