# Css3Transition.js

这个脚本，是用于在移动端，或支持 transition 动画的设备上，创建进入、离开的css3动画。
配套有 scrollEnter.js 和 scrollTransition.js 用于制作支持滚动页面，自动加载动画和自动卸载动画。

## 简单例子

实现一个简单的进入、离开动画

``` html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>移动端测试</title>
    <style>
        #title{
            width:200px;
            height:200px;
            margin:100px auto;
            font-size:32px;
            line-height:200px;
            text-align: center;
            background: #f90;
        }
    </style>
</head>
<body>
    <div>
        <a href="javascript:;" onclick="replay()">重试</a>
        <!-- 通过 data-sr 配置动画 -->
        <h1 id="title" data-sr="enter s|2 r|45deg over .5s">测试</h1>
    </div>
</body>
<script src="css3Transition.js"></script>
<script type="text/javascript">
	// 就这么几行代码，初始化组件
    var c3 = new Css3Transition({
        key: "data-sr"
    });

    var timer1;
    function replay(){
        clearTimeout(timer1);
        // 重置动画状态
        c3.reset();

		// 播放进入动画
        c3.enter();
        timer1 = setTimeout(function(){
	        // 播放离开动画
            c3.leave();
        }, 510);
    }
</script>
</html>

```

## 元素属性决定动画

脚本通过配置的属性，来识别需要添加动画的元素:

``` html
<h1 data-ctr="">da宗熊</h1>
```
默认识别的属性，是 data-ctr，可通过key配置，将之指定为其它属性:

``` javascript
var ct = new Css3Transition({
		key: "data-sr"  // 将配置，指定从 data-sr 的属性中读取
});
```
所有拥有指定 属性 的元素，都会被选择出来，添加动画。

## 动画支持

支持透明、translate、scale、rotate 4种动画，可通过 enter 和 leave 配置 进入、退出 对应的动画。

## 动画属性配置

动画，是通过配置属性的值(String)，来进行动画的生成，其中，配置的格式必须如下：
``` text
enter(或 leave) 属性|参数 额外属性 额外参数
如:
enter x|20px wait 2s
表示：一个进入的动画，从 translateX(20px) 的位置，等待2s后，进入视窗
```
注意的有几点:

 1. 不同的属性，可用空格，或逗号相隔开。
 2. 如果没有配置leave，则默认使用 enter 的相反的动画

有如下可以配置的参数:

 1. enter 后续的字符，是用于配置进入动画
 2. leave 后续的字符，是用于配置离开动画
 3. x        对应的是translateX,   如 x|10%, x|100px
 4. y        对应的是translateY,   如 y|10%,  y|100px
 5. z        对应的是translateZ,   如 z|10%,  z|100px
 6. sx      对应的是scaleX,   如 sx|2,  sx|.5
 7. sy      对应的是scaleY,    如 sy|2,  sy|.5
 8. sz      对应的是scaleZ,    如 sz|2,  sz|.5
 9. s        对应的是scale,      如 s|2,   s|.5
 10. rx    对应的是rotateX,  如 rx|10deg
 11. ry    对应的是rotateY,  如 ry|10deg
 12. rz    对应的是rotateZ,  如 rz|10deg
 13. r    对应的是rotate,  如 r|10deg
 14. wait  动画等待几面后执行，如: wait 2s
 15. over 动画的执行时间，如: over 1s
 16. tf 动画执行的线性函数，如: tf ease-in-out
 17. opacity 动画的透明度，如: opacity .5 [不推荐使用这个]

## 函数的构造配置

构造函数，一共提供3个参数，分别是: dom、key、default

dom:
动画dom元素的共同父级dom元素，默认是document.documentElement

key:
动画dom元素的动画配置属性，默认是 data-ctr

default:
默认动画的配置，默认是: "enter x|10% opacity 0 over .5s wait 0s tf ease"
此参数非常重要，如无必要，请不要更改，如有更改，请一定要设置 enter/opacity/wait/over/tf

构造一个实例，非常简单：
``` javascript
var c3t = new Css3Transition({
	key: "data-sr",
	dom: document.getElementById("content")
});
```
当然咯，也可以忽略掉全部参数~

## 实例方法

每一个实例，只建议使用 3 个方法：enter、leave、reset
故名思意，enter就是执行进入动画，leave就是执行离开动画，reset就是重置元素为动画执行前的状态

其中，enter和leave可接受1个参数，或没有参数
``` javascript
var c3t = new Css3Transition();
c3t.enter();	// 让该实例的所有 元素，执行动画
c3t.enter(dom元素);	// 让该dom元素，单独执行动画
c3t.enter([dom1, dom2, dom3...]); // 让这个列表内的元素，执行动画

// leave、reset 跟 enter 一致
```


# 最后

by: da宗熊
date: 2015/08/14
version: 0.0.3
