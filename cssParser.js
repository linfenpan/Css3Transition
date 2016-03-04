/**
 * @description 根据字符串，生成 css object 对象
 * @author da棕熊
 * @update 2015/12/22
 * @example
 *      var parser = new CssParser();
 *      parser.css("width:100px;x:20px;time:.2s;");
 *      parser.toString();  // => width:100px;-webkit-transform:translateX(20px);-webkit-transition:width .2s linear,-webkit-transform .2s linear;
 */
;(function(window){

    // 工具类
    var util = {
        // 前缀
        prefix: function(key){
            var cssPrefix = "";
            // 计算前缀
            var style = document.documentElement.style;
            var list = ["t", "webkitT", "MozT", "msT", "oT"];
            for(var i = 0, max = list.length; i < max; i++){
                if(style.hasOwnProperty(list[i] + "ransition")){
                    cssPrefix = list[i].slice(0, -1).toLowerCase();
                    break;
                }
            }
            cssPrefix && (cssPrefix = "-" + cssPrefix + "-");

            this.prefix = function(k){
                if(/transform|transition|animation/.test(k)){
                    return cssPrefix + k;
                }
                return k;
            };
            return this.prefix(key);
        },
        extend: function(obj){
            var list = [].slice.call(arguments, 1);
            var self = this;
            self.each(list, function(item, index){
                self.each(item, function(value, key){
                    var type = self.type(value);
                    switch(type) {
                        case "object":
                            obj[key] = self.extend(obj[key] || {}, value);
                            break;
                        case "array":
                            obj[key] = value.slice(0);
                            break;
                        default:
                            obj[key] = value;
                    }
                });
            });
            return obj;
        },
        each: function(obj, fn){
            for(var i in obj){
                if(obj.hasOwnProperty(i)){
                    fn.call(obj, obj[i], i);
                }
            }
        },
        type: function(obj){
            var fn = Object.prototype.toString;

            this.type = function(o){
                return fn.call(o).split(" ")[1].slice(0, -1).toLowerCase();
            };
            return this.type(obj);
        },
        //  oldValue: 90px , newValue: +10px ---> return 100px;
        plusCaculate: function(oldValue, newValue) {
            // oldValue 必须是数字开头的尺寸单位
            // newValue = +10|-10|*2|/2
            if (oldValue && /\d+/.test(oldValue) && /^[-+*/]\d+/.test(newValue)) {
                var unit = newValue.replace(/^[-+*/]*\d*/, "") || oldValue.replace(/^[-+*/]*\d*/, "");
                newValue = eval(oldValue.replace(/\D*$/, "") + newValue.replace(/\D*$/, "")) + unit;
            }
            return newValue;
        }
    };


    // 两种约定
    //      1. s: ["scale", "transform"]  =======> "s:2" --> {transform: {scale: 2}}
    //      2. x: "left"    ==========> "x: 20px" --> {top: 20px}
    var PropertyAliasMap = {
        o: "opacity",
        s:  ["scale", "transform"],
        sx: ["scaleX", "transform"],
        sy: ["scaleY", "transform"],
        r:  ["rotate", "transform"],
        rx: ["rotateX", "transform"],
        ry: ["rotateY", "transform"],
        x:  ["translateX", "transform"],
        y:  ["translateY", "transform"],
        time: ["time", "transition"],
        wait: ["wait", "transition"],
        tf: ["tf", "transition"],
        property: ["property", "transition"],
    };

    // property 转换器
    //      transition 和 transfrom 都经过converter进行转换，得到正确的值
    var PropertyConverterMap = {
        transition: function(option, all){
            if (!option.time && !option.tf && !option.wait) {
                return null;
            }

            var res = [];
            var str = [option.time || ".2s", option.tf || "linear", option.wait || ""].join(" ").trim();

            // transition-property: width,height,transfrom --> [width, height, transfrom]
            var property = option.property;
            if (!property) {
                property = [];
                util.each(all, function(value, key){
                    property.push(key);
                });
            } else {
                property = property.split(",");
            }

            util.each(property, function(key, index){
                key = key.trim();
                if (!/transition|animation/.test(key)) {
                    res.push(util.prefix(key) + " " + str);
                }
            });

            return res.length > 0 ? res.join(",") : null;
        },
        transform: function(option){
            var res = [];
            util.each(option, function(value, key){
                res.push(key + "("+ value +")");
            });
            return res.length > 0 ? res.join(" ") : null;
        }
    };

    function CssParser(css){
        this.reset();
        css && this.css(css);
    };
    CssParser.prototype = {
        reset: function(){
            this.styleProperty = {};
            return this;
        },
        css: function(css){
            var cssList = css.split(";");
            var self = this;

            util.each(cssList, function(str, i){
                var lst = str.split(":");
                var key = lst[0],
                    val = lst[1];
                key = key.trim();

                if (key){
                    if (val && val !== 'null') {
                        self.addProperty(key, val);
                    } else {
                        self.removeProperty(key);
                    }
                }
            });
            return this;
        },
        // x: 10px; y: 20px; ---> transform: {translateX: 10px, translateY: 20px;}
        // top: 10px ---> {top: 10px}
        addProperty: function(key, value){
            this.afterAlias(key, function(key, property, parentKey){
                if (!property) {
                    property = this.styleProperty[parentKey] = {};
                }

                // 支持属性的简单表达式: "width: 90px" --> +10px --> "width: 100px"
                var oldValue = property[key];
                var newValue = value;
                property[key] = util.plusCaculate(oldValue, newValue);
            });
            return this;
        },
        // 删除属性
        removeProperty: function(key) {
            this.afterAlias(key, function(key, property, parentKey){
                if (property) {
                    delete property[key];

                    var isEmptyObject = true;
                    for (var i in property) {
                        if (property.hasOwnProperty(i)) {
                            isEmptyObject = false;
                            break;
                        }
                    }

                    if (isEmptyObject) {
                        delete this.styleProperty[parentKey];
                    }
                }
            });
            return this;
        },
        //  key === undefined --> return this.styleProperty
        //  key = x;    ---> return translateX's value
        getProperty: function(key){
            if (key) {
                var value;
                this.afterAlias(key, function(key, property){
                    value = property ? property[key] : null;
                });
                return util.type(value) === "object" ? util.extend({}, value) : value;
            } else {
                return util.extend({}, this.styleProperty);
            }
        },
        // x:10px ---> callback("translateX", {transform: {}}, "transform");
        // width:100px --> callback("width", this.styleProperty, "width");
        afterAlias: function(key, callback){
            var aliasMap = PropertyAliasMap;
            var aliasOption = aliasMap[key];
            var property = this.styleProperty;
            var parentKey = key;

            if (aliasOption) {
                if (util.type(aliasOption) === "array") {
                    key = aliasOption[0];
                    parentKey = aliasOption[1];
                    property = property[parentKey];
                } else {
                    key = aliasOption;
                }
            }

            callback && callback.call(this, key, property, parentKey);
        },
        // this.styleProperty --> style string
        toString: function(){
            var res = [];
            var self = this;

            util.each(this.styleProperty, function(value, key){
                var str = self.stringifyProperty(key);
                str && res.push(str);
            });

            return res.length > 0 ? (res.join(";") + ";") : "";
        },
        // {width:100px} --> "width:100px;"
        stringifyProperty: function(key){
            var converter = PropertyConverterMap;
            var property = this.styleProperty;
            var value = property[key];

            if (value && converter[key]) {
                var res = converter[key](value, property);
                return res ? (util.prefix(key) + ":" + res) : null;
            } else if (util.type(value) === "string") {
                return util.prefix(key) + ":" + value;
            }

            return null;
        }
    };
    CssParser.addAlias = function(key, value){
        PropertyAliasMap[key] = value;
        return CssParser;
    };
    CssParser.addConverter = function(key, fn){
        PropertyConverterMap[key] = fn;
        return CssParser;
    };

    window.CssParser = CssParser;

})(window);
