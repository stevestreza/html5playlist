var MPListPlaylistsView = window.MPListPlaylistsView = Class.extend({
	init: function(playlists, element){
		this._domElement = $(element);
		this._playlists = playlists;
		
		var self = this;
		this._listView = new MPListView(this._domElement, this._playlists, function(thePlaylist){
			return new MPPlaylistViewItem(thePlaylist, self);
		});
	}
});

var MPPlaylistViewItem = window.MPPlaylistViewItem = MPListViewItem.extend({
	init: function(playlist, parent){
		this._super();
		
		this._titleLabel = $("<div class='MPTitleLabel MPLabel'></div>");
		this.contentsView().append(this._titleLabel);
		
		$(this.domElement()).addClass("MPPlaylistViewItem");
		
		this._titleLabel.text(playlist.name());
		
		var self = this;
		$(this.domElement()).bind("click", function(ev){
			$(parent).trigger("selected", playlist);
		});
	}
})