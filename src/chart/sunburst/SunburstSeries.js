import * as zrUtil from 'zrender/src/core/util';
import SeriesModel from '../../model/Series';
import Tree from '../../data/Tree';
import {wrapTreePathInfo} from '../treemap/helper';

export default SeriesModel.extend({

    type: 'series.sunburst',

    /**
     * @type {module:echarts/data/Tree~Node}
     */
    _viewRoot: null,

    getInitialData: function (option, ecModel) {
        // Create a virtual root.
        var root = { name: option.name, children: option.data };

        completeTreeValue(root);

        var levels = option.levels || [];

        // levels = option.levels = setDefault(levels, ecModel);

        var treeOption = {};

        treeOption.levels = levels;

        // Make sure always a new tree is created when setOption,
        // in TreemapView, we check whether oldTree === newTree
        // to choose mappings approach among old shapes and new shapes.
        return Tree.createTree(root, this, treeOption).data;
    },

    optionUpdated: function () {
        this.resetViewRoot();
    },

    /*
     * @override
     */
    getDataParams: function (dataIndex) {
        var params = SeriesModel.prototype.getDataParams.apply(this, arguments);

        var node = this.getData().tree.getNodeByDataIndex(dataIndex);
        params.treePathInfo = wrapTreePathInfo(node, this);

        return params;
    },

    defaultOption: {
        zlevel: 0,
        z: 2,
        legendHoverLink: true,

        hoverAnimation: true,
        // 默认全局居中
        center: ['50%', '50%'],
        radius: [0, '75%'],
        // 默认顺时针
        clockwise: true,
        startAngle: 90,
        // 最小角度改为0
        minAngle: 0,

        percentPrecision: 2,

        // If still show when all data zero.
        stillShowZeroSum: true,

        // Policy of highlighting pieces when hover on one
        // Valid values: 'none' (for not downplay others), 'descendant',
        // 'ancestor', 'self'
        highlightPolicy: 'descendant',

        label: {
            normal: {
                // could be: 'radial', 'tangential', or 'none'
                rotate: 'radial',
                show: true,
                // could be 'inner', 'outside', 'left' or 'right'
                // 'left' is for inner side of inside, and 'right' is for outter
                // side for inside
                position: 'inner',
                padding: 5,
                silent: true
            },
            emphasis: {}
        },
        itemStyle: {
            normal: {
                borderWidth: 1,
                borderColor: 'white'
            },
            emphasis: {},
            highlight: {
                opacity: 1
            },
            downplay: {
                opacity: 0.6
            }
        },

        // Animation type canbe expansion, scale
        animationType: 'expansion',
        animationDuration: 1000,
        animationUpdateDuration: 300,
        animationEasing: 'sinusoidalInOut',

        data: [],

        levels: [],

        // null for not sorting,
        // 'desc' and 'asc' for descend and ascendant order
        sortOrder: 'desc'
    },

    getViewRoot: function () {
        return this._viewRoot;
    },

    /**
     * @param {module:echarts/data/Tree~Node} [viewRoot]
     */
    resetViewRoot: function (viewRoot) {
        viewRoot
            ? (this._viewRoot = viewRoot)
            : (viewRoot = this._viewRoot);

        var root = this.getData().tree.root;

        if (!viewRoot
            || (viewRoot !== root && !root.contains(viewRoot))
        ) {
            this._viewRoot = root;
        }
    }
});



/**
 * @param {Object} dataNode
 */
function completeTreeValue(dataNode) {
    // Postorder travel tree.
    // If value of none-leaf node is not set,
    // calculate it by suming up the value of all children.
    var sum = 0;

    zrUtil.each(dataNode.children, function (child) {

        completeTreeValue(child);

        var childValue = child.value;
        zrUtil.isArray(childValue) && (childValue = childValue[0]);

        sum += childValue;
    });

    var thisValue = dataNode.value;
    if (zrUtil.isArray(thisValue)) {
        thisValue = thisValue[0];
    }

    if (thisValue == null || isNaN(thisValue)) {
        thisValue = sum;
    }
    // Value should not less than 0.
    if (thisValue < 0) {
        thisValue = 0;
    }

    zrUtil.isArray(dataNode.value)
        ? (dataNode.value[0] = thisValue)
        : (dataNode.value = thisValue);
}
