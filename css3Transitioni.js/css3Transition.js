// 担心报错的同学，请替换掉 document.querySelectorAll 为 jquery 的选择，则OK
;~function(window, NAME){

    var DOM_ELEM = document.documentElement, ID = 100;

    /**
     * @param cf {Object} 配置文件
     *  dom: 根元素，默认 document.documentElement
     *  key: 需要遍历的dom，保存数据的属性，默认 data-ctr
     *  default: 默认动画配置，默认: enter x|10% opacity 0 over .5s wait 0s tf ease
     */
    function buildTransition(cf){
        this.init(cf);
    };
    buildTransition.prototype = {
        // 重设配置
        init: function(cf){
            cf = cf || {};

            this.dom = cf.dom || DOM_ELEM;

            if( !("querySelectorAll" in this.dom) ){
                return;
            }

            this.key = cf.key || "data-ctr";
            this.keyId = this.key + "-id";      // 动画class的名字

            // 默认动画配置，一般，必须配置齐全咧~
            this.def_config = analysisUtil.lexicalAnalysis(cf["default"] || "enter x|10% opacity 0 over .5s wait 0s tf ease");

            // 元素列表
            this.domList = this.dom.querySelectorAll("[" + this.key + "]");

            // 开始对所有元素，进行词法分析
            this._analysisiDomList();
        },
        // 返回 dom 列表
        getDomList: function(){
            return this.domList;
        },
        // 对元素进行词法分析
        _analysisiDomList: function(){
            var domList = this.domList, keyId = this.keyId, key = this.key;

            var style = "", elem, obj, item;
            for(var i = 0, max = domList.length; i < max; i++){
                elem = domList[i];
                // 防止重复初始化
                if( !elem.getAttribute(keyId) ){
                    // 词法分析
                    obj = analysisUtil.lexicalAnalysis( elem.getAttribute(key) );
                    // 与默认值合并
                    this._combineWithDefault(obj);
                    // 生成样式
                    item = styleUtil.createInfo(obj);
                    // 给元素设置相关属性
                    this._setElemInfo(elem, item);
                    // 记录样式
                    style += item.style;
                }
            }

            // 样式插入 dom 中
            if(style){
                var css = document.createElement("style");
                css.innerHTML = style;
                document.getElementsByTagName("head")[0].appendChild(css);
            }
        },
        // 设置元素相关的属性
        _setElemInfo: function(elem, item){
            // 记录下样式ID
            elem.setAttribute(this.keyId, item.id);
            // 给元素添加默认 class
            classUtil.add(elem, getClass(item.id, "pre"));
        },
        // 当前配置对象，与 def_config 对象，进行合并
        _combineWithDefault: function(obj){
            var map = this.def_config;
            for(var i in map){
                // 因为都是字符串，所以，不用担心
                obj[i] = obj[i] || map[i];
            }
            // 修正所有透明度
            obj["pre_opacity"]   = obj["pre_opacity"] || "0";
            obj["enter_opacity"] = obj["enter_opacity"] || "1";
            obj["leave_opacity"] = obj["leave_opacity"] || obj["pre_opacity"] || "0";

            // 如果 leave 不存在，则使用 enter 的所有
            // enter 就复制所有 pre 的属性
            var list = ["_wait", "_over", "_tf"];
            for(var i = 0, max = list.length; i < max; i++){
                var item = list[i], val = obj["enter" + item];
                if( !obj["leave" + item] ){
                    obj["leave" + item] = val;
                }
            }
            obj["leave"] = obj["leave"] || obj["pre"];

        },
        // 某个孩子，执行动画
        enter: function(list){
            this._aEach(list, function(elem, id){
                 this._enter(elem, getClass(id, "enter"), getClass(id, "leave"));
            });
        },
        // 某个孩子，执行动画
        leave: function(list){
            this._aEach(list, function(elem, id){
                this._leave(elem, getClass(id, "leave"), getClass(id, "enter"));
            });
        },
        // 立刻归为
        reset: function(list){
            this._aEach(list, function(elem, id){
                classUtil.remove(elem, getClass(id, "enter"));
                classUtil.remove(elem, getClass(id, "leave"));
            });
        },
        // 这个乱调用，会出错哦~
        _aEach: function(list, cb){
            if(typeof list === "undefined"){
                list = this.domList;
            }else if( !("length" in list) ){
                list = [list];
            }
            for(var i = 0, max = list.length, elem, id; i < max; i++){
                elem = list[i], id = elem.getAttribute(this.keyId);
                if( id ){
                    cb.call(this, elem, id);
                }
            }
        },
        // 元素添加 _enter 类
        _enter: function (elem, cl1, cl2){
            classUtil.remove(elem, cl2);
            classUtil.add(elem, cl1);
        },
        // 元素添加 _leave 类
        _leave: function(elem, leave, enter, delay){
            if( !classUtil.has(elem, leave) ){
                classUtil.add(elem, leave);
                classUtil.remove(elem, enter);
            }
        }
    };
    window[NAME] = buildTransition;


    // 进入、离开、预设，3个类
    function getClass(key, suffix){
        return key + "_" + suffix;
    };

    // 构建样式
    var styleUtil = {
        // 生成 pre, enter, leave 三中样式
        createInfo: function(obj){
            var style = "", id = "scroll_reveal_" + ID++;
            // obj: {pre, enter, leave, pre_wait, pre_over, pre_tf, leave_wait, leave_over, leave_tf}
            var preStyle = this.getContext(obj, id, "pre", false, true);
            var leaveStyle = this.getContext(obj, id, "leave", true);
            var enterStyle = this.getContext(obj, id, "enter", true);

            // 数序不要乱了哈~
            style = [preStyle, enterStyle, leaveStyle].join("\n") + "\n\n";
            return {
                style  : style,
                id     : id
            };
        },
        // 获取 class 内容
        getContext: function(obj, id, name, needTransition, isPre){
            var str = obj[name] ? [
                "." + getClass(id, name) + "{",
                    isPre ? "-webkit-transform-style:preserve-3d;transform-style:preserve-3d;" : "",
                    needTransition ? this.getTransition(obj[name + "_over"], obj[name + "_tf"], obj[name + "_wait"]) : "",
                    this.getTransform( obj[name] ),
                    "opacity:" + ( obj[name + "_opacity"] || 0 ) + ";",
                "}"
            ].join("") : "";
            return str;
        },
        // 动画执行函数
        getTransition: function(time, timeFn, delay){
            return "-webkit-transition:-webkit-transform $0, opacity $0;transition:transform $0, opacity $0;".replace(/\$0/g, time + " " + timeFn + " " + delay);
        },
        // 变换函数
        getTransform: function(transition){
            return "-webkit-transform:$0;-ms-transform:$0;transform:$0;".replace(/\$0/g, transition);
        }
    };

    // 分析工具
    var analysisUtil = {
        // 词法 替换字符串
        lexicalReplace: function(str, arr){
            return str.replace(/\$(\d+)/g, function(str, num){
                return arr[num];
            });
        },
        // 词法表
        lexicalAnalysisMap: {
            x: "translateX($1)",
            y: "translateY($1)",
            z: "translateZ($1)",
            rx: "rotateX($1)",
            ry: "rotateY($1)",
            rz: "rotateZ($1)",
            r: "rotate($1)",
            sx: "scaleX($1)",
            sy: "scaleY($1)",
            sz: "scaleZ($1)",
            s: "scale($1)"
        },
        // 词法分析
        // "enter x|10% y|20% rx|10deg ry|10deg rz|10deg s|1.2, over 2s, wait .6s, tf ease, leave x|20%, wait .2s, over .5s"
        lexicalAnalysis: function(str){
            var words = str.split(/[ ,]+/),
                obj = {enter: "", pre: "", leave: ""},  // 进入、预设，离开 3 部分的样式
                curKey = "enter";

            var map = this.lexicalAnalysisMap, key = "";
            for(var i = 0, max = words.length; i < max; i++){
                key = words[i];
                if(key){
                    switch(key){
                        case "enter":
                            // 进入，其实在预处理样式里
                            curKey = "enter";
                            break;
                        case "opacity": // 透明度
                            if(curKey == "enter"){
                                obj["pre_opacity"] = words[++i];
                                break;
                            }
                        case "wait":    // 延迟时间
                        case "over":    // 持续时间
                        case "tf":  // 动画时间函数
                            obj[curKey + "_" + key] = words[++i];
                            break;
                        case "leave":
                            curKey = "leave";
                            break;
                        default:
                            var arr = key.split("|"), key = map[arr[0]];
                            if(key){
                                if( curKey == "enter" ){
                                    // 进入时，应该把所有预处理的样式清空，所以，进入的样式，都是初始值
                                    obj[curKey] += " " + this.lexicalReplace(key, [0, /^s[xyz]?/.test(key) ? 1 : 0]);
                                    obj["pre"] += " " + this.lexicalReplace(key, arr);
                                }else{
                                    obj[curKey] += " " + this.lexicalReplace(key, arr);
                                }
                            };
                    }
                }
            };
            // 生成的 object是:
            // {enter: "", pre: "", pre_opacity: "", pre_wait: "", pre_over: "", pre-tf: "", leave: "", leave_opacity: "", leave_wait: "", leave_over: "", leave_tf: ""}
            return obj;
        }
    };

    // 类相关的处理
    var classUtil = {
        add: function(elem, cl){
            if(elem.classList){
                elem.classList.add(cl);
            }else{
                elem.className += " " + cl;
            }
        },
        // 移除 css class
        remove: function(elem, cl){
            if(elem.classList){
                elem.classList.remove(cl);
            }else{
                elem.className = elem.className.replace(new RegExp("\\b" + cl + "\\b", "g"), "");
            }
        },
        has: function(elem, cl){
            if(elem.classList){
                return elem.classList.contains(cl);
            }else{
                return (new RegExp("\\b" + cl + "\\b")).test(elem.className);
            }
        }
    }
}(window, window.CSS3_TRANSITION_NAME || "Css3Transition");
