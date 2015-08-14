/**
* 一个中间控件，没啥卵用..
* 参数说明: new ScrollTransition({ckey: 记录动画配置的属性, skey: 记录滚动配置的属性, percent: 默认的滚动百分比, delay: 延迟多少，才检测滚动, dom: dom元素呗});
*/
;!function(window, NAME){
    // __inline("css3Transition.js");
    // __inline("scrollEnter.js");

    // cf {ckey: 动画的属性key, skey: 滚动的百分比key, percent: 滚动的百分比, dom: 滚动元素}
    function scrollTransition(cf){
        cf = cf || {};
        cf.ckey = cf.ckey || "data-sr";
        cf.skey = cf.skey || "data-sd";
        cf.percent = cf.percent || .5;
        cf.delay = cf.delay || 0; // 动画执行延迟
        cf.dom = cf.dom || document.documentElement;

        // 只有支持动画的，才往下执行，不然，就没必要了
        if(!("transition" in cf.dom.style) && !("webkitTransition" in cf.dom.style)){
            return;
        }

        var c3 = this.c3 = new Css3Transition({
            key: cf.ckey,
            dom: cf.dom
        });
        var se = this.se = new ScrollEnter({
            dom: cf.dom,
            list: c3.getDomList(),
            key: cf.skey,
            delay: cf.delay,
            enter: function(elem){
                c3.enter(elem);
            },
            leave: function(elem){
                c3.leave(elem);
            }
        });

        // 修正滚动百分比
        var list = c3.getDomList();
        if( cf.percent && list ){
            for( var i = 0, max = list.length; i < max; i++ ){
                var elem = list[i];
                if( !elem.getAttribute(cf.skey) ){
                    elem.setAttribute(cf.skey, cf.percent);
                }
            }
        }
    }
    scrollTransition.prototype = {
        stop: function(){
            this.se.stop();
        },
        restart: function(){
            this.se.restart();
        },
        enter: function(){
            this.c3.enter();
        },
        leave: function(){
            this.c3.leave();
        }
    };

    window[NAME] = scrollTransition;

}(window, window.SCROLL_TRANSITION_NAME || "ScrollTransition");
