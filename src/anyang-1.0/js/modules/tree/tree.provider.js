/**
 * tree.service Created by zppro on 16-3-26.
 * Target:用途
 */
(function() {
    'use strict';

    angular
        .module('app.tree')
        .provider('treeFactory', treeFactory)
    ;

    function treeFactory() {

        function filter(nodes,fn) {
            if(!fn)
                return nodes;

            for (var i = 0; i < nodes.length; i++) {
                if(fn(nodes[i])) {

                    if(nodes[i].children && nodes[i].children.length>0) {
                        filter(nodes[i].children, fn);
                    }
                }
                else {
                    nodes.splice(i, 1);
                    i--;
                }
            }
        }

        return {

            // controller access level
            $get: ['$q', '$rootScope', function ($q, $rootScope) {

                return {
                    filter: filter,
                    sTree: sTree
                };

                function sTree(id, treeData, option) {
                    var self = this;
                    this.id = id;
                    this.treeData = treeData;
                    option = option || {};
                    this._compare = option.compare || function (node1, node2) {
                            return node1._id === node2._id;
                        };

                    this.mode = option.mode || 'default';
                    this.levelSplitChar = option.levelSplitChar || '-';
                    this.expandLevel = option.expandLevel || 1;
                    if(angular.isUndefined(option.checkCascade)){
                        this.checkCascade = true;
                    }
                    else {
                        this.checkCascade = option.checkCascade;
                    }

                    this.expandedIndexes = {};
                    this.checkedIndexes = {};
                    this.inputCheckedIndex = {};
                    this.selectedNode;
                    this.checkedNodes = [];
                    this.checkState = {none: 'none', checked: 'checked', undetermined: 'undetermined'};

                    this.addIndex = function ($index) {
                        //console.log('addIndex:'+$index);
                        //console.log(this.expandedIndexes);
                        var level = ($index + '').split(this.levelSplitChar).length;
                        var levelExpanded = level <= this.expandLevel
                        this.expandedIndexes[$index] = levelExpanded;
                        if (this.mode == 'check') {
                            this.checkedIndexes[$index] = this.checkState.none;
                            this.inputCheckedIndex[$index] = false;
                            //console.log(this.checkedIndexes);
                        }
                    }

                    this.isExpanded = function ($index) {
                        //console.log('isExpandedByIndex:'+$index);
                        return this.expandedIndexes[$index];
                    }

                    this.isChecked = function ($index) {
                        return this.checkedIndexes[$index] == this.checkState.checked;
                    }

                    this.isUndetermined = function ($index) {
                        return this.checkedIndexes[$index] == this.checkState.undetermined;
                    }

                    this.isNone = function ($index) {
                        return this.checkedIndexes[$index] == this.checkState.none;
                    }

                    this.inputCheckState = function ($index) {
                        return this.inputCheckedIndex[$index];
                    }

                    this.toggle = function ($index, $event) {
                        //console.log('toggleExpand:'+$index);
                        if (angular.isDefined(this.expandedIndexes[$index])) {
                            this.expandedIndexes[$index] = !this.expandedIndexes[$index];

                            if(this.mode != 'check') {
                                this.collapseAllBut($index);
                            }
                        }
                        $event.stopPropagation();
                        return false;
                    }

                    this.expand = function($index) {
                        this._expand($index);
                    }

                    this._expand = function ($index) {
                        var arr = $index.split(this.levelSplitChar);
                        if (angular.isDefined(this.expandedIndexes[$index])) {
                            this.expandedIndexes[$index] = true;
                            //this.collapseAllBut($index);
                        }
                        if (arr.length > 1) {
                            var parentIndex = arr.slice(0, arr.length - 1).join(this.levelSplitChar);
                            this._expand(parentIndex);
                        }
                    }

                    this.collapseAllBut = function ($index) {
                        $index += '';
                        for (var i in this.expandedIndexes) {
                            if ($index < 0 || $index.indexOf(i) < 0)
                                this.expandedIndexes[i] = false;
                        }
                    }

                    this.select = function (node, $event) {
                        if (this.mode == 'check' || this._compare(node, this.selectedNode || {})) {
                            $event && $event.stopPropagation();
                            return;
                        }
                        //console.log(angular.element('#' + id + ' .tree-node-selected').size());
                        angular.element('#' + id + ' .tree-node-selected').removeClass('tree-node-selected');
                        this.selectedNode = node;
                        var target= $event && $event.currentTarget;
                        angular.element(target).addClass('tree-node-selected');
                        $rootScope.$broadcast('tree:node:select', this);
                        $event && $event.stopPropagation();
                    }


                    this.toggleCheck = function ($index, $event,inDirective) {
                        $index += '';
                        if (angular.isDefined(this.checkedIndexes[$index])) {
                            var toState, inputToCheck;
                            var arr = $index.split(this.levelSplitChar);
                            //var $elem = angular.element($event.currentTarget);
                            //console.log($elem);
                            if (this.checkedIndexes[$index] == this.checkState.checked) {
                                toState = this.checkState.none;
                                inputToCheck = false;
                            }
                            else {
                                toState = this.checkState.checked;
                                inputToCheck = true;
                            }
                            //设置自身
                            this.checkedIndexes[$index] = toState;
                            this.inputCheckedIndex[$index] = inputToCheck;


                            //级联则需要影响子孙和祖先
                            if (this.checkCascade) {
                                //设置子孙为checked
                                for (var k in this.checkedIndexes) {
                                    if (k.split(this.levelSplitChar).length >= (arr.length + 1) && k.indexOf($index) == 0) {
                                        this.checkedIndexes[k] = toState;
                                        this.inputCheckedIndex[k] = inputToCheck;
                                    }
                                }

                                //更新祖先
                                if (arr.length > 1) {

                                    var parentIndex = arr.slice(0, arr.length - 1).join(this.levelSplitChar);
                                    this._UpdateUndeterminedChecked(parentIndex);
                                }
                            }


                            //重新设置checked节点
                            if (!inDirective) {
                                this.checkedNodes = this._getCheckedNodes();
                            }
                        }

                        $event && $event.stopPropagation();
                        return false;
                    }


                    //this.setNodeChecked = function (nodes) {
                    //    if (!nodes)
                    //        return;
                    //    //var $indexes = [];
                    //    for (var i = 0; i < nodes.length; i++) {
                    //        if (this.checkCascade && nodes.children && nodes.children.length > 0) {
                    //            //在只选择叶子节点下，将这些带有字节点的node去掉
                    //        }
                    //        else {
                    //            //$indexes.push();
                    //
                    //            var $index = this.findNodeIndexById(nodes[i]._id);
                    //            this.toggleCheck($index);
                    //            console.log(this.checkedIndexes);
                    //        }
                    //    }
                    //}

                    this._UpdateUndeterminedChecked = function ($index) {
                        //console.log('_UpdateUndeterminedChecked:' + $index);
                        $index += '';
                        var arr = $index.split(this.levelSplitChar);

                        var checkedCount = 0, noneCount = 0, matchedCount = 0;
                        for (var k in this.checkedIndexes) {
                            //查找当前节点的直接字节点计算
                            if (k.split(this.levelSplitChar).length == (arr.length + 1) && (k).indexOf($index) == 0) {
                                matchedCount++;
                                if (this.checkedIndexes[k] == this.checkState.undetermined) {
                                    matchedCount = noneCount = checkedCount = 0;
                                    //直接存在undetermined状态
                                    this.checkedIndexes[$index] = this.checkState.undetermined;
                                    this.inputCheckedIndex[$index] = true;
                                    break;
                                }
                                else if (this.checkedIndexes[k] == this.checkState.none) {
                                    noneCount++;
                                }
                                else {
                                    checkedCount++;
                                }
                            }
                        }

                        if (matchedCount > 0) {
                            if (checkedCount > 0 && noneCount > 0) {
                                //有checked 又有none,则更新为undetermined状态
                                this.checkedIndexes[$index] = this.checkState.undetermined;
                                this.inputCheckedIndex[$index] = true;

                            }
                            else {
                                this.checkedIndexes[$index] = checkedCount == matchedCount ? this.checkState.checked : this.checkState.none;
                                this.inputCheckedIndex[$index] = checkedCount == matchedCount;
                            }
                        }
                        //console.log('this.checkedIndexes['+$index+']:'+this.checkedIndexes[$index]);
                        //console.log('matchedCount:'+matchedCount+' checkedCount:'+checkedCount+' noneCount:'+noneCount);
                        //console.log(this.checkedIndexes);
                        //递归
                        if (arr.length == 1) {
                            return;
                        }
                        else {
                            var parentIndex = arr.slice(0, arr.length - 1).join(this.levelSplitChar);
                            this._UpdateUndeterminedChecked(parentIndex);
                        }
                    }



                    this.getCheckedNodes = function() {
                        this.checkedNodes = this._getCheckedNodes();
                    }

                    this._getCheckedNodes = function (nodes, parentIndex) {
                        if (!nodes)
                            nodes = angular.isArray(this.treeData) ? this.treeData : [this.treeData];

                        var arrChecked = [];
                        var checkIndexPrefix = (parentIndex ? parentIndex + this.levelSplitChar : parentIndex) || '';

                        for (var i = 0; i < nodes.length; i++) {
                            var checkIndex = checkIndexPrefix + i;

                            if (this.checkedIndexes[checkIndex] != 'none') {
                                var hasChildren = nodes[i].children && nodes[i].children.length > 0;
                                if (this.checkedIndexes[checkIndex] == 'checked') {

                                    if (this.checkCascade) {
                                        //级联的check只允许获得叶子节点
                                        if (!hasChildren) {
                                            arrChecked.push(nodes[i]);
                                        }
                                    }
                                    else {
                                        arrChecked.push(nodes[i]);
                                    }
                                }
                                if (hasChildren) {
                                    arrChecked = arrChecked.concat(this._getCheckedNodes(nodes[i].children, checkIndex))
                                }
                            }
                        }

                        return arrChecked
                    }

                    this.findNode = function($index) {
                        return this._findNode(this.treeData, $index);
                    }

                    this._findNode = function(nodes,$index) {
                        if (!nodes)
                            return null;
                        var arr = $index.split(this.levelSplitChar);
                        var currentLevelIndex = arr[0];
                        for (var i = 0; i < nodes.length; i++) {
                            if (currentLevelIndex == i) {
                                if (arr.length == 1) {

                                    return nodes[i];
                                }
                                else {
                                    if (nodes[i].children && nodes[i].children.length > 0) {
                                        return this._findNode(nodes[i].children, arr.slice(1).join(this.levelSplitChar));
                                    }
                                    else {
                                        return null;
                                    }
                                }
                            }
                        }
                        return null;
                    }

                    this.findNodeById = function(_id) {
                        return this._findNodeById(_id, this.treeData);
                    }

                    this._findNodeById = function(_id,nodes,$parentIndex) {
                        //$parentIndex = $parentIndex || '';
                        for (var i = 0; i < nodes.length; i++) {
                            if (_id === nodes[i]._id) {
                                return nodes[i];
                            }

                            if (nodes[i].children && nodes[i].children.length > 0) {
                                var currentIndex = $parentIndex ? $parentIndex + this.levelSplitChar + i : i + '';
                                var resultInChildren = this._findNodeById(_id, nodes[i].children, currentIndex);
                                if (resultInChildren) {
                                    return resultInChildren;
                                }
                            }
                        }
                        return null;
                    }

                    this.findNodeIndexById = function(_id) {
                        return this._findNodeIndexById(_id, this.treeData);
                    }

                    this._findNodeIndexById = function(_id,nodes,$parentIndex) {

                        for (var i = 0; i < nodes.length; i++) {
                            var currentIndex = $parentIndex ? $parentIndex + this.levelSplitChar + i : i + '';

                            if (_id === nodes[i]._id) {
                                return currentIndex;
                            }

                            if (nodes[i].children && nodes[i].children.length > 0) {
                                var resultInChildren = this._findNodeIndexById(_id, nodes[i].children, currentIndex);
                                if (resultInChildren) {
                                    return resultInChildren;
                                }
                            }
                        }
                        return null;
                    }


                    //function isSelected(node) {
                    //
                    //    if (!node) return;
                    //
                    //    if (!item.sref || item.sref === '#') {
                    //        var foundActive = false;
                    //        angular.forEach(item.submenu, function (value) {
                    //            if (isSelected(value)) foundActive = true;
                    //        });
                    //        return foundActive;
                    //    }
                    //    else
                    //        return $state.is(item.sref) || $state.includes(item.sref);
                    //}


                    //
                    //this.collapseNode = function(node){
                    //    node.expanded = false;
                    //};
                    //
                    //this.expandNode = function(node){
                    //    node.expanded = true;
                    //};
                    //
                    //this.toggleNode = function(node,$event) {
                    //    console.log(node.name);
                    //    node.expanded = !node.expanded;
                    //    $event.stopPropagation();
                    //}
                    //
                    //this.isNodeExpanded = function(node) {
                    //    return !!node.expanded
                    //}
                    //
                    //this.findNode = function(node,nodes) {
                    //    if (!nodes)
                    //        nodes = _.isArray(this.treeData) ? this.treeData : [this.treeData];
                    //
                    //    for (var i = 0; i < nodes.length; ++i) {
                    //        var child = nodes[i];
                    //        // 如果找到了则直接返回
                    //        if (self._compare(child, node))
                    //            return child;
                    //        // 否则递归查找
                    //        var finded = self.find(node, child.children);
                    //        if (finded)
                    //            return finded;
                    //    }
                    //    return null;
                    //}
                    //
                    //this.hasChildren = function(parent, child) {
                    //    var children = _.isArray(child) ? child : [child];
                    //    return !!_.find(children, function (child) {
                    //        return _this.find(child, parent.children);
                    //    });
                    //};
                }
            }]
        };
    }

})();