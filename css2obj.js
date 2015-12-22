/**
 * @description 根据字符串，生成 css object 对象
 * @author da棕熊
 * @update 2015/12/22
 * @example
 *      
 */
;(function(window){

    // 工具类
    var util = {
        // 前缀
        prefix: function(key){
            var cssPrefix = "";
            // 计算前缀
            var style = document.documentElement.style;
            var list = ["webkitT", "MozT", "msT", "oT", "t"];
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
        }
    };

    // 具体类
    var Css2Obj = {
        // 把 css string -> obj
        build: function(css){
            var obj = {};
            var list = css.split(";");

            var self = this;
            util.each(list, function(item, index){
                var item = item.split(":");
                var key = item[0].trim();
                var val = item[1];
                // 如果 key 是空，不需要设置
                if(key){
                    self.keyParse(obj, key, val.trim());
                    // obj[key] = val.trim();
                }
            });

            return obj;
        },
        // key 转换
        _keyParseMap: {
            s:  ["scale", "transform"],
            sx: ["scaleX", "transform"],
            sy: ["scaleY", "transform"],
            r:  ["rotate", "transform"],
            rx: ["rotateX", "transform"],
            ry: ["rotateY", "transform"],
            x:  ["translateX", "transform"],
            y:  ["translateY", "transform"],
            time: "transition",
            wait: "transition",
            tf: "transition",
        },
        // x: 10px; y: 20px; ---> transform: {translateX: 10px, translateY: 20px;}
        keyParse: function(obj, key, val){
            var map = this._keyParseMap;
            var item = map[key];
            if(item){
                var ptKey = item;
                if(util.type(item) === "array"){
                    key  = item[0];
                    ptKey = item[1];
                }
                if(!obj[ptKey]){
                    obj[ptKey] = {};
                }

                if(ptKey){
                    obj[ptKey][key] = val;
                }else{
                    obj[key] = val;
                }
            }else{
                obj[key] = val;
            }
        },
        setKeyParseMap: function(key, value){
            var map = this._keyParseMap;
            if(util.type(key) === "object"){
                util.each(key, function(v, k){
                    map[k] = v;
                });
            }else{
                map[key] = value;
            }
        }
    };

    // 对象转样式
    var Obje2Css = {
        // {width: 10px, height: 20px} --> width:10px; height:20px;
        parse: function(obj){
            var self = this;
            var res = [];
            util.each(obj, function(item, key){
                var tmp = self.toCss(obj, key, item);
                tmp && res.push(tmp);
            });
            return res.join(";") + ";";
        },
        // 样式提前处理的 map
        _toCssMap: {
            transition: function(option, all){
                var res = [];
                var str = [option.time || ".2s", option.tf || "linear", option.wait || ""].join(" ").trim();

                util.each(all, function(value, key){
                    if(!/transition|animation/.test(key)){
                        res.push(key + " " + str);
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
        },
        // width, 10px ---> width: 10px;
        toCss: function(obj, key, value){
            var map = this._toCssMap;
            if(map[key] && value){
                var res = map[key](value, obj);
                return res ? (util.prefix(key) + ":" + res) : null;
            }else if(util.type(value) === "string"){
                return util.prefix(key) + ":" + value;
            }
            return null;
        },
        setToCssMap: function(key, fn){
            var map = this._toCssMap;
            if(util.type(key) === "object"){
                util.each(key, function(v, k){
                    map[k] = v;
                });
            }else{
                map[key] = fn;
            }
        }
    };

    // 样式管理对象
    function CssParseObject(css){
        // _data 用于备份
        this.reset(css);
    };
    CssParseObject.prototype = {
        toCss: function(){
            return this.toString();
        },
        toString: function(){
            return Obje2Css.parse(this.data);
        },
        reset: function(css){
            if(arguments.length > 0){
                this.data = Css2Obj.build(css);
                this._data = util.extend({}, this.data);
            }else{
                this.data = util.extend({}, this._data);
            }
            return this;
        },
        combine: function(css){
            var obj = Css2Obj.build(css);
            util.extend(this.data, obj);
            return this;
        }
    };

    // var obj11 = new CssParseObject( Css2Obj.build("width: 20px; height: 30px; x: 20px; y: 30px; wait: 1s; time: 2s;") );
    // console.log( obj11.toCss() );
    var parser = window.cssParser = function(css){
        return new CssParseObject(css);
    };
    // x, [translateX, transform]
    parser.setSyntax = function(){
        Obje2Css.setToCssMap.apply(Obje2Css, arguments);
    }
    // transition 对象 如何解析
    parser.setParseRule = function(){
        Css2Obj.setKeyParseMap.apply(Css2Obj, arguments);
    }

})(window);
