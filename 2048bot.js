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
/////////////////////game state////////////////////////////
	function gameState (c,r){
		for(var i = 0;i < c;++i){
			this [i] = [];
			for (var j = 0; j < r;++j)
				this[i].push (null);
		}
		this.rows = r;
		this.cols = c;
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

	gameState.prototype = {
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
			this[col][row] = cell;
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
		}
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

/////////////////////////demos:
//use getGameState to get game state!

gamebot_toolbar.addButton ("右下左上(→↓←↑)",function(){
	var mov = ["right","down","left","up"];
	var i = 0;
	var n = 0;

	(function (){
		if (!game2048.playable())
			return;
		if (++i == 4)
			i = 0;

		var st = game2048.getGameState();
		console.log (st.toString());
		game2048.move (mov[i]);
		gamebot_toolbar.setTitle ("→↓←↑:" + ++n);
		setTimeout (arguments.callee,0);
	})();
});

gamebot_toolbar.addButton ("随机(Random Move)",function(){
	var mov = ["up","right","down","left"];
	var n = 0;
	(function (){
		if (!game2048.playable())
			return;
		var st = game2048.getGameState();
		console.log (st.toString());
		
		var rnd = Math.floor (Math.random () * 4);
		game2048.move (mov[rnd]);
		gamebot_toolbar.setTitle ("Random:" + ++n);
		setTimeout (arguments.callee,0);
	})();
});

