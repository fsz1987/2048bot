2048bot
=======
可以获取游戏状态(格子大小,每格内容,游戏是否结束)
可以控制游戏(发送移动命令)
提供api可以推测下一步

提供了一个小工具条用来添加UI.

默认会添加例子的两个按钮,一个使用右下左上的顺序,另一个则是随机发送.

打开任意一个2048或其衍生游戏,按下F12打开命令控制台,输入
var s = document.createElement ("script");s.type="text/javascript";s.src="http://rawgithub.com/fsz1987/2048bot/master/2048bot.js";document.head.appendChild(s);
后回车将会在游戏下方看到控制工具条.

//bot
game2048.move (dir); 向dir方向移动up down left right
game2048.move* move的显式调用版
game2048.playable() //返回当前游戏是否可玩 (胜利或者失败)
game2048.getGameState()//获取当前的游戏状态,返回一个gameState;
game2048.getGameSize()//获取游戏的尺寸.返回一个{row:Number,col:Number},row指明行数,col指明列数,一般row和col都是相等的了


gameState.nodeCount() 返回方块总数
gameState.cell(col,row) 返回指定格子的方块,如果没有方块,返回null.等价于gameState[col][row]
gameState.toString() 生成字符串化的表格
gameState.rowMergeable(i) 统计第i行横向可合并方块数目
gameState.colMergeable(i) 统计第i列纵向可合并方块数目
gameState.merge (dir) 向指定方向计算合并结果并返回合并后的新 gameState
gameState.merge* merge的显式调用版
gameState.moved merge返回的新gameState中moved指明了是否发生了方块移动


//ui
gamebot_toolbar.moveTo(left,top) 将工具栏移动到指定位置
gamebot_toolbar.addbutton (html,handler) 向工具栏添加一个按钮,内容是html,handler为click处理函数
不太可靠的东西:
以下特性未经完整测试,值可能不准确
gameState.moved 

以及最后两个demo,经观察运行结果发现绝对是有问题的,但实在是懒得去折腾了(=ﾟωﾟ)=