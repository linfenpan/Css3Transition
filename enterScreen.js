/**
 * @author da宗熊
 * @update 2016/03/04
 * @description 检测元素列表，是否进入视区
*/
;(function(window, NAME){

    // 每次调用 checker 前，先调用 ready()，能有效减少计算
    function ViewportChecker(rootDom){
        this.rootDom = rootDom;
        this.isDocumentElement = rootDom.tagName.toLowerCase() == "html";
    };
    ViewportChecker.prototype = {
        ready: function(){
            this.viewHeight = this.getViewHeight();
            this.viewScrollY = this.getViewScrollY();
            return this;
        },
        isElemInViewport: function(elem, percent){
            return (this.isPositionFixed(elem) || this.isInViewPort(elem, percent));
        },
        isPositionFixed: function(elem){
            return elem.style.position == "fixed";
        },
        isInViewPort: function(elem, percent){
            var elemHeight = elem.offsetHeight;
            var elemTop = this.getOffset(elem).top;
            var elemBottom = elemTop + elemHeight;

            var viewHeight = this.viewHeight;
            var viewTop = this.viewScrollY;
            var viewBottom = viewTop + viewHeight;

            percent = percent || 0;

            return elemTop <= viewBottom - elemHeight * percent && elemBottom >= viewTop + elemHeight * percent;
        },
        getOffset: function(elem){
            var top = 0, left = 0;
            do {
                top += elem.offsetTop;
                // left += elem.offsetLeft;
            } while(elem = elem.offsetParent);
            return {top: top, left: left}
        },
        getViewHeight: function(){
            // rootDom 可能是 document 对象
            var rootDom = this.rootDom;
            var viewHeight = rootDom.clientHeight;
            if (this.isDocumentElement) {
                return Math.min(viewHeight, window.innerHeight);
            }
            return viewHeight;
        },
        getViewScrollY: function(){
            var rootDom = this.rootDom;
            if (this.isDocumentElement) {
                return window.pageYOffset;
            } else {
                return rootDom.scrollTop + getOffset(rootDom).top;
            }
        }
    };

    var addEventListener;
    var removeEventListener;
    if ("addEventListener" in window) {
        addEventListener = function(root, event, fn){
            root.addEventListener(event, fn, false);
        }
        removeEventListener = function(root, event, fn){
            root.removeEventListener(event, fn, false);
        }
    } else {
        addEventListener = function(root, event, fn) {
            root.attachEvent("on" + event, fn);
        }
        removeEventListener = function(root, event, fn) {
            root.detachEvent("on" + event, fn);
        }
    }

    /**
     * options:
     *  root: 检测的根元素，默认 document.documentElement || html
     *  elems: 需要检测的所有元素列表
     *  delay: 回调触发延迟，用于控制滚动太快了，所有函数一次触发的情况
     *  enter: 元素进入屏幕的回调, return true, 则把元素，在当前检测列表移除
     *  leave: 元素离开屏幕的回调, return true, 则把元素，在当前列表移除
     */
    function EnterScreen(options, autoStart){
        var noop = function(){};
        this.options = {
            root: document.documentElement || document.getElementsByTagName("html")[0],
            elems: [],
            delay: 20,
            enter: noop,
            leave: noop
        };
        this.reset(options);
    };
    EnterScreen.prototype = {
        reset: function(options, autoStart){
            var options = $.extend(this.options, options || {});
            this.checker = new ViewportChecker(options.root);
            autoStart && this.start();
        },
        getRootElem: function(){
            var root = this.options.root;
            if (root.tagName.toLowerCase() == "html") {
                root = window;
            };
            return root;
        },
        start: function(){
            var self = this;
            var root = self.getRootElem();
            var options = self.options;

            self.srollCheckTimer = null;
            self.scrollCheckFn = function(){
                clearTimeout(self.srollCheckTimer);
                self.srollCheckTimer = setTimeout(function(){
                    self.checkAll();
                }, options.delay);
            };

            // 1. 添加事件
            addEventListener(root, "scroll", this.scrollCheckFn);
            addEventListener(root, "resize", this.scrollCheckFn);
            // 2. 检查全部
            self.scrollCheckFn();
        },
        stop: function(){
            var root = this.getRootElem();
            // 移除事件监听
            clearTimeout(self.self.srollCheckTimer);
            removeEventListener(root, this.scrollCheckFn);
        },
        checkAll: function(){
            var checker = this.checker.ready();
            var options = this.options;
            var enterFn = options.enter;
            var leaveFn = options.leave;

            var list = this.options.elems;
            var dels = [];  // 记录下需要删除的元素的索引
            var isInViewKey = "is-in-view";

            var elem, res;
            for (var i = 0, max = list.length; i < max; i++) {
                elem = list[i];
                if (checker.isElemInViewport(elem)) {
                    elem.setAttribute(isInViewKey, 1);
                    if (enterFn.call(elem)) {
                        dels.push(i);
                    }
                } else if (elem.getAttribute(isInViewKey) == 1) {
                    elem.removeAttribute(isInViewKey);
                    if (leaveFn.call(elem)) {
                        dels.push(i);
                    }
                }
            };

            this.clearElems(dels);
        },
        // 清空需要删除的元素
        clearElems: function(indexList){
            var elems = this.options.elems;
            for (var i = 0, max = indexList.length; i < max; i++) {
                var delIdx = indexList[i] - i;
                elems.splice(delIdx, 1);
            };
            if (elems.length <= 0) {
                this.stop();
            }
        }
    };


    window[NAME] = EnterScreen;
})(window, window.ENTER_SCREEN || "EnterScreen");
