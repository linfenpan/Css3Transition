CssParser.js 是一款 string --> css 的工具类脚本。
使用者可以随意配置转换规则，以方便自己使用。

简单用例：
``` javascript
	var parser = new CssParser("width: 100px; x: 20px;");
	parser.toString(); // width:100px; transform: translateX(20px);
```

其中，脚本会根据当前的浏览器，给 transform 添加不同的前缀(只针对 transform/transition/animation)。

其中，如果 parser，不调用 reset 方法，每次设置css时，都会基于以前的样式，进行生成，如:

``` javascript
	parser.css("width: 100px;");
	parser.toString(); // width: 100px;
	parser.css("height: 100px;");
	parser.toString(); // width: 100px; height: 100px;

	parser.reset();
	parser.toString(); // ""
```

如果需要删除某个一个属性，则把该属性，设为 null 或 空:

``` javascript
	parser.css("width: 10px; height: 10px");
	parser.css("width:;"); // or "width: null;"
	parser.toString(); // height: 100px;
```

---------

在 CssParser.js 中，预置了几个”别名“ 的属性:

``` javascript
	parser.css("x: 10px");
	parser.toString(); // transform:translateX( 10px);
```

别名表如下:

	1. o --> opacity
    2. s --> scale
    3. sx --> scaleX
    4. sy --> scaleY
    5. r --> rotate
    6. rx --> rotateX
    7. ry --> rotateY
    8. x --> translateX
    9. y --> translateY
    10. time --> transition-duration
    11. wait --> transition-delay
    12. property --> transition-property
    13. tf --> transition-timing-function


如果要新增别名，可调用下面方法:

``` javascript
	CssParser.addAlias("posX", "left"); // 配置别名 posX --> left
	CssParser.addAlias("posY", "top");  // 配置别名 posY --> top
	CssParser.addAlias("sk", ["skew", "transform"]);  // 配置别名 sk --> transform: skew(xxx)
```

其中 ``` CssParser.addAlias("sk", ["skew", "transform"]) ``` 第二个参数，之所以可以是数组，是因为 CssParser 内置了 ``` transfrom ``` 和 ``` transition ``` 两个参数的转换器。

转换器负责的工作，就是对特殊属性，进行字符串的转换，如我们定义一个 ``` animation ``` 的转换器:

``` javascript
	// 声明哪些属性，是属于 animation 的
	CssParser.addAlias("aname", ["name", "animation"]);
    CssParser.addAlias("atime", ["time", "animation"]);

	// 声明转换器
    CssParser.addConverter("animation", function(options){
        // {"name":" jump","time":" 1s"}
        return options.name + " " + options.time + " ease";
    });

    var parser2 = new CssParser("aname: jump; atime: 1s;");
    parser2.toString();  // animation: jump  1s ease;
```
