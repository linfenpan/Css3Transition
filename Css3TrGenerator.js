/**
 * 根据字符串，生成样式，根据传入的内容，自主决定是否生成相关的动画控制
 * @author da宗熊
 * @date   2015/08/14 15:30
 * @email  1071093121@qq.com
 * @example
 *      var item = Css3TrGenerator.compile("rotate(45deg), top:20px, wait|.1s over|1s tfn|ease");
 *      var style = item.toString();    // 生成上述配置的样式
 *      item.reset("rotate(0deg)");     // 把样式的角度，改为 0deg, 保留像 top 之类的样式
 *      item.reset("rotate(0deg)", true);   // 把样式，设为 rotate(0deg)，把没在字符串的样式，清理掉
 *      item.isEmpty();         // 是否有样式
*/
;!function(window, NAME){
    // 编译正则
    var GENERRATOR_REGS = [/(.+)\((.*)\)/, /(.+):(.*)/, /(.+)\|(.*)/];

    // 编译后的对象
    // 提供 改写 后的 toString 方法，提供额外的重新编译方法
    function CompileObject(item, pt){
        this.item = item;
        this.pt = pt;
        this.style = pt.generateStyle(item);
    };
    CompileObject.prototype = {
        toString: function(){
            return this.style;
        },
        isEmpty: function(){
            return !!this.style;
        },
        // 是否重置 所有 配置
        reset: function(str, isResetAll){
            // 第一个参数，如果是boolean值，强制 str 为 ""
            var type = typeof str;
            if(type === "boolean"){
                isResetAll = str;
                str = "";
            }else if( type === "undefined" ){
                isResetAll = true;
                str = "";
            }

            var item = this.pt._compile(str);
            if(isResetAll){
                this.item = item;
            }else{
                extend(this.item, item);
            }
            this.style = this.pt.generateStyle(this.item);
            return this;
        }
    };
    // 简单的深复制
    function extend(obj, other){
        for(var i in other){
            if( typeof other[i] === "object" ){
                obj[i] = obj[i] || {};
                extend(obj[i], other[i]);
            }else{
                obj[i] = other[i];
            }
        }
    };

    // translte,rotate,skew,scale等，关于transform的属性，使用()传递参数
    // 带有 | 的，是自定义参数
    // 带有 : 的，是原生属性
    // var str = "translateX(20px), rotate(10deg), skew(10deg), top:10px, left:10%, over|5s, wait|1s, tfn|linear";
    // generator.compile(str);

    // css3 样式生成
    var generator = {
        // 把字符串编译为样式
        compile: function(str){
            return new CompileObject(this._compile(str), this);
        },
        _compile: function(str){
            var words = str.split(/[;,]\s*/);
            // console.log(words)
            var ccItem = {
                transform: {},
                normal: {},
                defined: {/* wait: "0s", over: "0.5s", tfn: "ease" */}
            };
            var item;
            for(var i = 0, max = words.length; i < max; i++){
                item = this._getSwitchItem(words[i]);
                if(item.type){
                    ccItem[ item.type ][ item.key ] = item.val;
                }
            };

            return ccItem;
        },
        _getSwitchItem: function(str){
            var res = {type: "", key: "", val: ""}, list = GENERRATOR_REGS, item;
            for(var i = 0, max = list.length; i < max; i++){
                item = list[i], item = item.exec(str);
                if(item && item.length >= 3){
                    res.type = (["transform", "normal", "defined"])[i];
                    res.key = item[1];
                    res.val = item[2];
                    break;
                }
            }
            return res;
        },
        generateStyle: function(ccItem){
            if(!ccItem){return "";}
            // console.log(ccItem);
            /*
            ccItem = {
                transform: {在transform里的所有属性},
                normal: {非transform的所有样式},
                defined: {
                    wait: "等待时间", over: "持续时间", tfn: "ease"   // transition 时间、运动曲线相关参数
                }
            }*/
            var normal = ccItem.normal || {}, defined = ccItem.defined || {}, transform = ccItem.transform || {};
            // 修正时间函数
            // 把编译对象，转为样式
            var ssItem = {
                transitionDDTF: [defined.over, defined.tfn, defined.wait].join(""),
                transitionP   : [],
                transform     : [],
                normal        : []
            };
            // transform 的属性，需要遍历 ，才能获取出来
            for(var i in transform){
                transform[i] && (ssItem.transform.push(i + "(" + transform[i] + ")"));
            };
            // transition-property，需要遍历 normal 的属性，才知道
            for(var i in normal){
                if(normal[i]){
                    ssItem.transitionP.push(i);
                    ssItem.normal.push(i + ":" + normal[i]);
                }
            };
            // 修正动画的 DDTF 属性
            if( ssItem.transitionDDTF ){
                ssItem.transitionDDTF = [defined.over || ".5s", defined.tfn || "ease", defined.wait || "0s"].join(" ");
            }
            // console.log(ssItem);
            // 样式对象
            var ssObject = {
                ddtf: ssItem.transitionDDTF,
                transition: ssItem.transitionP.length > 0 ? ssItem.transitionP.join(" " + ssItem.transitionDDTF + ",") + " " + ssItem.transitionDDTF : "",
                transform: ssItem.transform.join(" "),
                normal: ssItem.normal.length > 0 ? ssItem.normal.join(";") + ";" : ""
            };
            // console.log(ssObject);
            // 创建样式
            // "-webkit-transition:-webkit-transform $0, opacity $0;transition:transform $0, opacity $0;".replace(/\$0/g, time + " " + timeFn + " " + delay);
            // "-webkit-transform:$0;-ms-transform:$0;transform:$0;".replace(/\$0/g, transition);
            var style = [
                ssObject.transform ? "-webkit-transform:${transform};-ms-transform:${transform};transform:${transform};" : "",
                (function(){
                    // 有时间设定，并且有 相关 的 transition 属性
                    var str = "";
                    if(ssObject.ddtf && (ssObject.transform || ssObject.transition)){
                        str = ssObject.transform ? "-webkit-transition:-webkit-transform $0;transition:transform $0;" : "-webkit-transition:$0;transition:$0;";
                        str = str.replace(/\$0/g, [ ssObject.transform && "${ddtf},", ssObject.transition && "${transition}" ].join("") );
                    }
                    return str;
                })(),
                ssObject.normal ? "${normal}" : ""
            ].join("").replace(/\${([^}]+)}/g, function(str, key){
                return ssObject[key] || "";
            });
            // console.log(style);
            return style;
        }
    };


    // 要不要让它符合符合 commonjs 规范呢，加一个装个逼?
    if(typeof define === "function"){
        if(define.amd){
            define(generator);
        }else if(define.cmd){
            define(function(require, module, exports){
                module.exports = generator;
            });
        }
    }else if(typeof exports === "object"){
        module.exports = generator;
    }else{
        window[NAME] = generator;
    }

}(window, window.CSS3_TR_GENERATOR_NAME || "Css3TrGenerator");
