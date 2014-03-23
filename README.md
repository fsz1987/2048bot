2048bot
=======
2048游戏的控制器
可以获取游戏状态(格子大小,每格内容,游戏是否结束)
可以控制游戏(发送移动命令)

提供了一个小工具条用来添加UI.

默认会添加例子的两个按钮,一个使用右下左上的顺序,另一个则是随机发送.

打开任意一个2048或其衍生游戏,按下F12打开命令控制台,输入
var s = document.createElement ("script");s.type="text/javascript";s.src="http://raw.github.com/fsz1987/2048bot/master/2048bot.js";document.head.appendChild(s);
后回车将会在游戏下方看到控制工具条.