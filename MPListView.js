var MPListView = window.MPListView = Class.extend({
	init: function(element, items, viewCreator){
		this._dom = $(element);
		this._viewItems = [];

		for(var idx=0; idx<items.length; idx++){
			var item = items[idx];
			var viewItem = viewCreator(item, idx);
			this._viewItems.push(viewItem);
			
			this._dom.append(viewItem.domElement());
		}
	}
});

var MPListViewItem = window.MPListViewItem = Class.extend({
	init: function(){
		this._domElement = $("<div class='MPListViewItem'></div>");
		this._backgroundView = $("<div class='MPBackgroundView'></div>");
		this._contentsView = $("<div class='MPContentView'></div>");

		this._domElement.append(this._backgroundView).append(this._contentsView);

		$([this.backgroundView(), this.contentsView()]).css({
			width: "100%",
			height: "100%",
			position: "relative",
			left:0,
			top:0
		});
	},

	domElement: function(){
		return this._domElement[0];
	},

	backgroundView: function(){
		return this._backgroundView;
	},

	contentsView: function(){
		return this._contentsView;
	}
});