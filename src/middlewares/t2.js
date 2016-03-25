/**
 * Created by zppro on 15-12-11.
 */
module.exports = function t2(app){
    return function * (next) {

        //console.log(JSON.stringify(this.request.body));
        //console.log("middleware t2");
        yield next;
    };
};