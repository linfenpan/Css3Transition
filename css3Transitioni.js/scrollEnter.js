/**
* 一个中间控件，是否在屏幕内的检测
* 需要兼容 ie8，就重写 document.querySelectorAll 吧
* 参数说明: new ScrollEnter({
*       dom: 检测滚动的根元素，默认 document.documentElement
*       list : 所有要检测的元素，有 list , 则会无视掉 key 的初始化选择哦~
*       key  : 需要监听滚动的所有元素的属性，此属性决定，该元素，距离屏幕多长的位置开始，就开始滚动，仅支持小数，默认: data-sd
*       delay: 不滚动时，执行的延迟，用于控制某些滚动太快的情况发生
*       enter: 进入屏幕的回调
*       leave: 离开屏幕的回调
*  });
*/
;!function(window, NAME, SCROLL_TIME){

    var callbackMap = {
        // key: {fn: 回调函数 , ctx: 执行上下文}
    };
    // 执行所有callback函数
    function executeCallbackFn(){
        var map = callbackMap, item;
        for(var i in callbackMap){
            item =  map[i];
            if( item ){
                item["fn"].call(item["ctx"]);
            }
        }
    };
    // 添加scroll的回调函数
    var CALLBACK_ID = +new Date;
    function addCallback(fn, ctx){
        callbackMap[CALLBACK_ID++] = {
            fn: fn,
            ctx: ctx
        };
    };
    if("addEventListener" in window){
        window.addEventListener("scroll", executeCallbackFn, false);
        window.addEventListener("resize", executeCallbackFn, false);
    }

    /**
     * 屏幕进入检测
     * @param cf {Object}
     *  dom: 检测滚动的根元素，默认 document.documentElement
     *  list : 所有要检测的元素，有 list , 则会无视掉 key 的初始化选择哦~
     *  key  : 需要监听滚动的所有元素的属性，此属性决定，该元素，距离屏幕多长的位置开始，就开始滚动，仅支持小数，默认: data-sd
     *  delay: 不滚动时，执行的延迟，用于控制某些滚动太快的情况发生
     *  enter: 进入屏幕的回调
     *  leave: 离开屏幕的回调
     */
    function scrollEnter(){
        this.init.apply(this, arguments);
    };
    scrollEnter.prototype = {
        init: function(cf){
            this.dom = cf.dom || document.documentElement;
            this.domList = cf.list;
            // 检测位置配置
            this.key = cf.key || "data-sd";

            // 兼容验证
            if( !("querySelectorAll" in this.dom) ){
                return;
            }

            if( !this.domList ){
                this.domList = this.dom.querySelectorAll("[" + this.key + "]");
            }

            this.enter_cb = cf.enter || this.noop;
            this.leave_cb = cf.leave || this.leave;
            this.delay = cf.delay || 0;
            this._delayTimer = null;

            // 监听 滚动 的回调
            addCallback(this._handler, this);
            this.restart();

            var self = this;
            setTimeout(function(){
                self._handler();
            }, this.delay);
        },
        noop: function(){},
        restart: function(){
            this.checked = true;
        },
        stop: function(){
            this.checked = false;
        },
        // 屏幕进入的处理函数
        _handler: function(){
            if( !this.checked ){return;}
            // 加入延迟控制
            if( this.delay > 0 ){
                window.clearTimeout(this._delayTimer);
                var self = this;
                this._delayTimer = window.setTimeout(function(){
                    self._callback();
                }, this.delay);
            }else{
                this._callback();
            }
        },
        _callback: function(){
            this._scrollY = this.getScrollY();
            this._viewH = this.getViewportH();

            var key = "isEnterScreen";

            for( var i = 0, max = this.domList.length; i < max; i++ ){
                var elem = this.domList[i];
                if( this.isElemInViewport(elem)){
                    if(!elem.getAttribute(key)){
                        // 只有经历过离开，才算是 进入 吧~
                        elem.setAttribute(key, true);
                        this.enter_cb(elem);
                    }
                }else if(elem.getAttribute(key)){
                    // 只有进入过，才可能离开；如果进入都没尝试过，还算是，进入吗？
                    elem.removeAttribute(key);
                    this.leave_cb(elem);
                }
            }
        },
        // 元素是否在 viewport 中
        isElemInViewport: function(el){
            // 如果是position:fixed，绝对就在屏幕内了
            return (this.isPositionFixed(el) || this.isInViewPort(el));
        },
        // 是 fixed 定位
        isPositionFixed: function(el){
            return el.style.position === "fixed";
        },
        // 在屏幕内
        isInViewPort: function(el, elTop, elBottom){
            var elHeight   = el.offsetHeight;
            var viewH      = this._viewH;
            var top        = this.getOffset(el).top;
            var bottom     = top + elHeight;
            var viewTop    = this._scrollY;
            var viewBottom = viewTop + viewH;
            var percent    = parseFloat(el.getAttribute(this.key)) || 0;

            // 两种情况
            return top <= viewBottom - elHeight * percent && bottom >= viewTop + elHeight * percent;
        },
        // 获取 offset
        getOffset: function(el){
            var top = 0, left = 0;
            do{
                top += el.offsetTop;
                left += el.offsetLeft;
            }while(el = el.offsetParent);
            return {top: top, left: left};
        },
        // 获取滚动屏的高度
        getViewportH: function(){
            // 考虑到，dom可能不是 document 对象，也可能是有滚动轴的元素
            var client = this.dom["clientHeight"],
                inner = window["innerHeight"];
            if( this.dom === window.document.documentElement ){
                return Math.min(client, inner);
            }
            return client;
        },
        // 获取滚动的距离
        getScrollY: function(){
            if(this.dom === window.document.documentElement){
                return window.pageYOffset;
            }else{
                return this.dom.scrollTop + getOffset(this.dom).top;
            }
        }
    };

    window[NAME] = scrollEnter;
}(window, window.SCROLL_ENTER || "ScrollEnter", window.SCROLL_ENTER_TIME || 200);
