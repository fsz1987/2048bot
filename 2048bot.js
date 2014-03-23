/*
//bot
game2048.move (dir); 向dir方向移动up down left right
game2048.move* move的显式调用版
game2048.playable() //返回当前游戏是否可玩 (胜利或者失败)
game2048.getGameState()//获取当前的游戏状态,返回一个gameState;
game2048.getGameSize()//获取游戏的尺寸.返回一个{row:Number,col:Number},row指明行数,col指明列数


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
*/
//////////////////////////////game bot////////////////////////////////////
var game2048;

(function (){
	if (game2048)
		return;
	game2048 = {};
	var keys = {
		UP:38, // Up
	    RIGHT:39, // Right
	    DOWN:40, // Down
	    LEFT:37 // Left
	};
	var keyNameMap = {
		"up" : keys.UP,
		"right" : keys.RIGHT,
		"down" : keys.DOWN,
		"left" : keys.LEFT
	}
	function emitKey (key){
		var evt = new Event ("keydown");
		evt.srcElement = document;
		evt.which = key;
		document.dispatchEvent (evt);

	}

	function $ (selector, el) {
	     if (!el) {el = document;}
	     return el.querySelector(selector);
	}
	function $$ (selector, el) {
	     if (!el) {el = document;}
	     return el.querySelectorAll(selector);
	}

	var gameSize;
	var titleContainer;
	function getTitleContainer(){
		if (titleContainer)
			return titleContainer;

		titleContainer = $ (".game-container .tile-container");
		return titleContainer;
	}
//////////////////////////////squareInfo////////////////////////
	function squareInfo (elem){
		if (!elem)
			return this;
		this.e = elem;
		var classNames = elem.className;//.split(' ');
		var val = /\s?tile-(\d+)\s?/g;
		var pos = /\s?tile-position-(\d+)-(\d+)\s?/;

		var result = val.exec (classNames);
		if (result)
			this.val = parseInt (result[1]);

		result = pos.exec (classNames);
		if (result)
		{
			this.col = parseInt (result[1]) - 1;
			this.row = parseInt (result[2]) - 1;
		}

		if (classNames.indexOf ("tile-new") > -1)
			this.isNew = true;
		if (classNames.indexOf ("tile-merged") > -1)
			this.isMerged = true;

		return this;
	}
	squareInfo.prototype = {
		dup:function (){
			var ret = new squareInfo();
			ret.e = this.e;
			ret.val = this.val;
			ret.col = this.col;
			ret.row = this.row;
			return ret;
		}
	};
/////////////////////game state////////////////////////////
	function gameState (c,r){
		for(var i = 0;i < c;++i){
			this [i] = [];
			for (var j = 0; j < r;++j)
				this[i].push (null);
		}
		this.rows = r;
		this.cols = c;
		this._nc = 0;
		return this;
	}

	function iterator () {
		return this;
	}
	iterator.prototype = {
		quit : function(){
			this.stopIterate = true;
		},
		skiprow : function(){
			this.skip = true;
		}
	};
	function getSectionInfo (foreach){
		var ret = [];
		var lastItm;
		var itemc = 0;
		var lastIdx;
		foreach (function (itm,haveValue,idx){
			lastIdx = idx;
			if (!itemc){
				if (haveValue){
					itemc = 1;
					lastItm = itm;
					return;
				}
			}else{
				if (haveValue){
					if (lastItm == itm){
						itemc++;
						return;
					}

					ret.push (itemc);
					lastItm = itm;
					itemc = 1;
				}else{
					ret.push (itemc);
					itemc = 0;
				}
			}
		});
		if (itemc > 0)
			ret.push(itemc);
		return ret;
	}

	gameState.prototype = {
		nodeCount : function (){

			// var ret = 0;
			// foreachNode (function (){
			// 	ret ++;
			// })
			return this._nc;
		},
		cell : function(col,row){
			return this[col][row];
		},
		foreachCell : function(callback) {
			var itor = new iterator();
			for (var r = 0; r < this.rows;++r){
				itor.skip = false;
				for (var c =0;c < this.cols;++c){
					itor.item = this[c][r];
					callback.call (this[c][r],itor);

					if (itor.stopIterate)
						return;

					if (itor.skip)
						break;
				}
			}
		},
		foreachNode : function(callback){
			this.foreachCell (function(itor) {
				if (itor.item)
					callback.call(this,itor);
			});
		},
		setCell : function(col,row,cell) {
			var oldNode = this[col][row];

			this[col][row] = cell;
			if (!oldNode && cell)
				this._nc++;

			if (!this.min || (cell.val < this.min.val))
				this.min = cell;

			if (!this.max || (cell.val > this.max.val))
				this.max = cell;
		},
		toString : function(){
			var ret = "";
			for (var r = 0; r < this.rows;++r){
				for (var c =0;c < this.cols;++c){
					var cell = this[c][r];
					ret += cell?cell.val:"-";
					ret += "\t\t";
				}
				ret += "\n";
			}
			return ret;
		},
		rowMergeable: function  (r) {
			var self = this;
			var rslt = getSectionInfo (function (callback){
				for (var c = 0;c < self.cols;++c){
					var node = self[c][r];
					if (node)
						callback (node.val,true,c);
				}
			});
			var ret = 0;
			for (var i = 0; i < rslt.length ;++ i){
				var c = rslt[i];
				if (c % 2)
					c--;
				ret += c;
			}
			return ret;
		},
		colMergeable: function  (c) {
			var self = this;
			var rslt = getSectionInfo (function (callback){
				for (var r = 0;r < self.rows;++r){
					var node = self[c][r];
					if (node)
						callback (node.val,true,r);
				}
			});
			var ret = 0;
			for (var i = 0; i < rslt.length ;++ i){
				var c = rslt[i];
				if (c % 2)
					c--;
				ret += c;
			}
			return ret;
		},
		mergeDown : function (){
			var ret = this.mergeMove(function (handler){
				for (var r = this.rows-1;r > -1;--r){
					for (var c = 0;c < this.cols;++c){
						handler (c,r);
					}
				}
			},function moveNode (node){
				if (++node.row >= this.rows){
					node.row = this.rows-1;
					return false;
				}
			});
			return ret;
		},
		mergeUp : function (){
			return this.mergeMove(function (handler){
				for (var r = 0; r < this.rows;++r){
					for (var c = 0;c < this.cols;++c){
						handler (c,r);
					}
				}
			},function moveNode (node){
				if (--node.row <= 0){
					node.row = 0;
					return false;
				}
			});	
		},
		mergeLeft : function (){
			return this.mergeMove(function (handler){
				for (var c = 0; c < this.cols;++c){
					for (var r = 0;r < this.rows;++r){
						handler (c,r);
					}
				}
			},function moveNode (node){
				if (--node.col <= 0){
					node.col = 0;
					return false;
				}
			});	
		},
		mergeRight : function (){
			return this.mergeMove(function (handler){
				for (var c = this.cols-1; c > -1;--c){
					for (var r = 0;r < this.rows;++r){
						handler (c,r);
					}
				}
			},function moveNode (node){
				if (++node.col >= this.cols){
					node.col = this.cols-1;
					return false;
				}
			});	
		},
		merge:function (dir){
			dir = dir.substr(0,1).toUpperCase() + dir.substr (1);
			return this["merge"+dir]();
		},
		mergeMove : function (foreachNode,movNode){
			var ret = new gameState(this.cols,this.rows);
			ret.moved = false;
			var self = this;
			// for (var r = this.rows-1;r > -1;--r){
			// 	for (var c = 0;c < this.cols;++c){
			foreachNode.call(this,function (c,r){
				var itm = self[c][r];
				if (itm == null)
					return;

				var newItm = itm.dup ();
				
				var lastPos;
				var i = 0;
				while (i++ < 100){
					lastPos = {col:newItm.col,row:newItm.row};
					var moved = movNode.call(self,newItm);
					var node = ret[newItm.col][newItm.row]
					if (!node){
						if (moved==undefined || moved){
							continue;//move to next pos
						}else{
							ret.setCell (newItm.col,newItm.row,newItm);
							break;
						}
					}

					if (node.val == newItm.val && !node.isMerged){
						newItm.val += node.val;
						newItm.isMerged = true;
					}else{
						newItm.col = lastPos.col;
						newItm.row = lastPos.row;
					}
					break;
				}
				if (!ret.moved){
					ret.moved = (newItm.col != itm.col) || (newItm.row != itm.row)
				}
				ret.setCell(newItm.col,newItm.row,newItm);
			});
			// 	}
			// }
			return ret;
		},
	}

////////////////////////public function impl////////////////////////
	game2048.containerElement = function () {
		return $ (".game-container .grid-container");
	}
	game2048.getGameSize = function(){
		if (gameSize)
			return gameSize;
		var gridContainer = this.containerElement();
		var rows = $$ (".grid-row",gridContainer);
		gameSize = {row:rows.length,col:$$(".grid-cell",rows[0]).length};
		return gameSize;
	}

	game2048.move = function (dir){
		var keycode = keyNameMap [dir];
		if (! (undefined == keycode))
		{
			emitKey (keycode);
		}
	};
	game2048.moveUp = function() {
		emitKey(keys.UP);
	};
	game2048.moveDown = function() {
		emitKey(keys.DOWN);
	};
	game2048.moveLeft = function() {
		emitKey(keys.LEFT);
	};
	game2048.moveRight = function() {
		emitKey(keys.RIGHT);
	};
	




	game2048.getGameState = function (){
		var size = this.getGameSize();
		var ret = new gameState(size.col,size.row);

		var squarelist = [];
		var titleItems = getTitleContainer().children;
		for (var i =0;i < titleItems.length;++i){
			var elem = titleItems[i];
			//squarelist.push (new squareInfo(elem));
			var node = new squareInfo(elem);
			var setNode = ret[node.col][node.row] == null?true:node.isMerged;

			if (setNode)
				ret.setCell (node.col,node.row,node);
				//ret[node.col][node.row] = node;
		}
		return ret;
	}
	var gameMsg = $(".game-message");
	game2048.playable = function(){
		return gameMsg.className.indexOf ("game-over") < 0;
	};
})();
/////////////////////////////toolbar///////////////////////////////////////
var gamebot_toolbar;
(function (){
	if (gamebot_toolbar)
		return;

	var elem = document.createElement ("div");
	elem.innerHTML = "<span id='title'>2048 GameBot ToolBar</span><div style='background-color:white' id='toolpanel'></div>";
	elem.style.backgroundColor = "orange";
	elem.style.position = "absolute";
	elem.style.left = "0px";
	elem.style.top = "0px";
	elem.style.cursor = "default";
	elem.style.padding = "2mm";
	elem.style.unselectable = "yes";
	var dialog = {e:elem};
	

	function setSelectable (s){
		var attr = [
			"-webkit-user-select",
			"-khtml-user-select",
			"-moz-user-select",
			"-ms-user-select",
			"-o-user-select",
			"user-select"
		];
		var val = s?"":"none";
		for (var i = 0 ; i < attr.length;++i){
			document.body.style[attr[i]] = val;
		}
	}
	function dialog_mousedown (e){
		this.drag = true;
		this.x = e.clientX;
		this.y = e.clientY;
		this.e.style.left = this.x;
		this.e.style.top = this.y;
		setSelectable(false);
		//console.log ()
	}
	function dialog_mouseup (e){
		this.drag = false;
		setSelectable(true);
	}

	function dialog_mousemove (e){
		if (this.drag){
			var dx = e.clientX - this.x;
			var dy = e.clientY - this.y;
			var x = parseInt (this.e.style.left);
			var y = parseInt (this.e.style.top);
			x += dx;
			y += dy;
			
			this.e.style.left = x + "px";
			this.e.style.top = y + "px";
			this.x = e.clientX;
			this.y = e.clientY;
		}
	}
	function bindMouseEvent (e,type,handler,obj){
		e.addEventListener (type,function (evt){
			handler.call (obj,evt);
		});
	}

	bindMouseEvent (elem,"mousedown",dialog_mousedown,dialog);
	bindMouseEvent (document,"mousemove",dialog_mousemove,dialog);
	bindMouseEvent (document,"mouseup",dialog_mouseup,dialog);
	document.body.appendChild (elem);


	gamebot_toolbar = {dialog:dialog,panel:elem.querySelector ("div#toolpanel")};
	gamebot_toolbar.addButton = function(html,func){
		var btn = document.createElement ("button");
		btn.innerHTML = html;
		btn.onclick = func;
		this.panel.appendChild(btn);
	};
	gamebot_toolbar.moveTo = function(x,y){
		elem.style.left = x + "px";
		elem.style.top = y + "px";
	};
	var title = elem.querySelector ("span#title")
	gamebot_toolbar.setTitle = function (html){
		title.innerHTML = html;
	}
})();

//////////////////////////////////////////////////////////bot logic starts here//////////////////////////

var c = document.querySelector (".game-container");
gamebot_toolbar.moveTo (c.offsetLeft,c.offsetTop + c.offsetHeight);
var moveInterval = 100;
var gs =game2048.getGameSize();
/////////////////////////demos:
//use getGameState to get game state!
var mov = ["up","down","left","right"];
function rndInt (n){
	return Math.floor (Math.random () * n);
}
var stopFlag;
function aiMove (step,t){
	var n =0;
	if (!t)
		t = 0;
	stopFlag = false;
	(function (){
		if (stopFlag)
			return;
		if (!game2048.playable())
			return;
		var st = game2048.getGameState();
		step (st,n++);

		setTimeout (arguments.callee,t);
	})();
}
function rndSet (set,tester){
	var flags = [];
	var tested = 0;
	while (tested < set.length){
		var i = rndInt(set.length);
		if (flags[i])
			continue;//已测试过,跳过

		if (tester (i))
			return i;
		
		if (!flags[i]){
			tested ++;
			flags[i] = true;
		}
	}
	return -1;//都找过了,放弃吧
}
gamebot_toolbar.addButton ("STOP!!!!!",function(){
	stopFlag = true;
});
gamebot_toolbar.addButton ("右下左上(→↓←↑)",function(){
	var mov = ["right","down","left","up"];
	var i = 0;
	aiMove(function (st,n){
		if (++i == 4)
			i = 0;
		console.log (st.toString());
		game2048.move (mov[i]);
		gamebot_toolbar.setTitle ("→↓←↑:" + ++n);
	},moveInterval);
});

gamebot_toolbar.addButton ("随机(Random Move)",function(){
	aiMove(function (st,n){
		console.log (st.toString());
		
		var rnd = rndInt(mov.length);
		game2048.move (mov[rnd]);
		gamebot_toolbar.setTitle ("Random:" + ++n);
	},moveInterval);
});


function predictMerge (mov){
	var cs = game2048.getGameState();
	console.log ("before");
	console.log (cs.toString());
	console.log ("after");
	var ps = cs.merge(mov);
	console.log (ps.toString());

	console.log ("nodes left : ",ps.nodeCount());
	for (var i = 0; i < gs.row;++i){
		mr = ps.rowMergeable(i);
		mc = ps.colMergeable(i)
		console.log ("row&col" ,i, " mergeable:",mr,",",mc);
	}
}

gamebot_toolbar.addButton ("预测down",function(){
	predictMerge("down");
});
gamebot_toolbar.addButton ("预测up",function(){
	predictMerge("up");
});
gamebot_toolbar.addButton ("预测left",function(){
	predictMerge("left");
});
gamebot_toolbar.addButton ("预测right",function(){
	predictMerge("right");
});

function moveMin (rslt){
	var rsltGroups = {};
	var minIdx = Infinity;
	for (var i = 0; i < mov.length;++i){
		var nc = rslt[i].nodeCount();
		if (rsltGroups[nc])
			rsltGroups[nc].push (i);
		else
			rsltGroups[nc] = [i];

		if (nc < minIdx)
			minIdx = nc;
	}
	var minGroup = rsltGroups[minIdx];
	if (minGroup.length ==4)
		return -1;
	var movIdx = 0;

	
	var i = rndSet (minGroup,function(i){
		return rslt[minGroup[i]].moved;
	});
	movIdx = minGroup[i < 0? 0:i];
	return movIdx;
}
gamebot_toolbar.addButton ("最多合并",function (){
	
	var n = 0;
	aiMove(function (st){
		var rslt = [];
		for(var i = 0;i < mov.length;++i){
			var r = st.merge (mov[i]);
			rslt[i] = r;
		}
		var midx = moveMin(rslt);
		midx = midx < 0? rndInt(4):midx;
		game2048.move (mov[midx]);
		//gamebot_toolbar.setTitle ((minexist?"MIN:":"RND:") + mov[movIdx]);
	},moveInterval);
});

function moveNextMaxMerge (rslt){
	//var mergeMax = [];
	var maxM = 0;
	var maxIdx = 0;
	var marray = [];
	for (var i = 0;i < rslt.length;++i){
		var r = rslt[i];
		var m = 0;
		for (var j = 0;j < gs.row;++j){
			var mc = r.rowMergeable(j);
			if (mc > m)
				m = mc;
			mc = r.colMergeable(j);
			if (mc > m)
				m = mc;
		}
		if (m > maxM){
			maxIdx = i;
			maxM = m;
		}
		marray.push (maxM);
	}
	if (!maxM){
		var n = rndSet (rslt,function (i){
			return rslt[i].moved
		});
		return n<0?0:n;
	}
	return maxIdx;
}
gamebot_toolbar.addButton ("最多合并或下一步最多可合并",function (){
	
	var n = 0;
	aiMove(function (st){
		var rslt = [];
		for(var i = 0;i < mov.length;++i){
			var r = st.merge (mov[i]);
			rslt[i] = r;
		}
		var midx = moveMin(rslt);
		midx = midx < 0? moveNextMaxMerge(rslt):midx;
		game2048.move (mov[midx]);
		//gamebot_toolbar.setTitle ((minexist?"MIN:":"RND:") + mov[movIdx]);
	},moveInterval);
});