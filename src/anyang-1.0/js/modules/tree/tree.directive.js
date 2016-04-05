/**
 * utils.directive Created by zppro on 16-3-24.
 */

(function() {
    'use strict';

    angular
        .module('app.tree')
        .directive('supportPreSelectOrCheck', supportPreSelectOrCheck);

    supportPreSelectOrCheck.$inject = ['$rootScope'];
    function supportPreSelectOrCheck($rootScope) {
        var directive = {
            link: link,
            restrict: 'A'
        };
        return directive;

        function link(scope, element, attrs) {
            var tree = scope.vm.trees[attrs.treeIndex];
            var currentNodeId = attrs.nodeId;
            var currentNodeIndex = attrs.nodeIndex;
            if (tree.mode != 'check') {

                if (tree.selectedNode && tree.selectedNode._id == currentNodeId) {
                    //选中样式
                    element.addClass('tree-node-selected');

                    //保证展开
                    tree.expand(currentNodeIndex);

                    //触发事件
                    $rootScope.$broadcast('tree:node:select', tree);

                }
            }
            else {
                //console.log(tree.checkedNodes);
                for (var i = 0; i < tree.checkedNodes.length; i++) {

                    if (tree.checkCascade && tree.checkedNodes[i].children && tree.checkedNodes[i].children.length > 0) {
                        //在级联情况下只选择叶子节点下，将这些带有字节点的node去掉
                        tree.checkedNodes.splice(i,1);
                    }
                    else {
                        if (currentNodeId === tree.checkedNodes[i]._id) {
                            //设置check
                            tree.toggleCheck(currentNodeIndex, null, true);

                            //保证展开
                            tree.expand(currentNodeIndex);
                        }
                    }
                }
            }

        }
    }


})();
