/**=========================================================
 * Module: settings.service.js
 * 读写设置
 =========================================================*/

(function() {
    'use strict';

    angular
        .module('app.settings')
        .service('SettingsManager', SettingsManager)
    ;

    SettingsManager.$inject = ['$rootScope','SETTING_KEYS'];
    function SettingsManager($rootScope,SETTING_KEYS) {
        var self = this;
        this.instances = {};
        this.currentInstance;
        return {
            getInstance: function (id) {
                if(!id) {
                    return this.currentInstance;
                }
                if (!self.instances[id]) {
                    self.instances[id] = new SettingsInstance($rootScope);
                }
                return self.instances[id];
            },
            setCurrentInstance : function (settingsInstance) {
                this.currentInstance = settingsInstance;
            },
            buildInstance: function (id, options) {
                if (!self.instances[id]) {
                    self.instances[id] = new SettingsInstance($rootScope, options);
                }
            },
            getSubsystemInstance: function (sref) {
                var id;
                if (SETTING_KEYS.SREF_ORGANIZATION_PFTA == sref) {
                    id = SETTING_KEYS.STORAGE_ID_ORGANIZATION_PFTA;
                }
                else if (SETTING_KEYS.SREF_MANAGE_CENTER == sref) {
                    id = SETTING_KEYS.STORAGE_ID_MANAGE_CENTER;
                }

                if (id) {
                    this.buildInstance(id, {storage: $rootScope.app.subsystem[id]});
                }
                return self.instances[id];
            }
        }
    }

    function SettingsInstance(options) {
        this.storage = options.storage||{};
        this.write = write;
        this.read = read;

        function write(key,val) {
            this.storage[key] = val;
        }

        function read(key,defaultVal) {
            return this.storage[key] || defaultVal;
        }
    }





})();
