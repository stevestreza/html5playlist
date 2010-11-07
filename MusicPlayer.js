var MPPlaylist = function(tracks){
	this._tracks = tracks;
};

MPPlaylist.prototype.trackAfter = function(index){
	var newIndex = index+1;
	if(newIndex >= this._tracks.length || newIndex < 0){
		newIndex = 0;
	}
	return newIndex;
}

MPPlaylist.prototype.getTrackAtIndex = function(index){
	return this._tracks[index];
}

MPPlaylist.prototype.numberOfTracks = function(){
	return this._tracks.length;
}

var MPPlayer = function(dom){
	this._player = $("<audio></audio>");
	this._isPlaying = false;
	this._currentTrack = -1;
	this._playlist = null;
	
	this._dom = $(dom);
	
	var self = this;
	this._player.bind("ended", function(){
		self.loadNextTrack();
	})
};

MPPlayer.prototype.setPlaylist = function(playlist){
	this._currentTrack = -1;
	this._playlist = playlist;

	if(this._dom){
		var count = this._playlist.numberOfTracks();
		for(var idx=0; idx<count; idx++){
			var track = this._playlist.getTrackAtIndex(idx);
			this._dom.append(this.trackViewForTrack(track).domElement());
		}
	}
};

MPPlayer.prototype.play = function(){
	if(!this._isPlaying){
		this._isPlaying = true;
		
		if(this._currentTrack < 0 || this._currentTrack === undefined){
			this.loadNextTrack();
		}
		
//		this._player[0].load();
//		this._player[0].play();
	}
};

MPPlayer.prototype.pause = function(){
	if(this._isPlaying){
		this._isPlaying = false;
		this._player[0].stop();
	}
};

MPPlayer.prototype.loadNextTrack = function(){
	if(this._playlist){
		var trackIndex = this._currentTrack;
		trackIndex = this._playlist.trackAfter(trackIndex);

		var track = this._playlist.getTrackAtIndex(trackIndex);
		this._currentTrack = trackIndex;
		
		this._player.attr({
			src: track.url
		});
		
		if(this._isPlaying == true){
			this._isPlaying = false;
			this.play();
		}
	}
}

MPPlayer.prototype.getCurrentTrack = function(){
	return this._currentTrack;
}

MPPlayer.prototype.trackViewForTrack = function(track){
	var trackView = track._trackView;
	if(!trackView){
		trackView = new MPTrackView(track, this);
		track._trackView = trackView;
	}
	return trackView;
}

var MPTrackView = function(track, player){
	var self = this;
	this._track = track;
	
	this._domElement = $("<div class='MPTrackView'></div>");
	this._domElement.bind("click", function(event){
		
	});
	
	this._albumArtView = $("<div class='MPAlbumArtView'></div>");
	this._titleLabel = $("<div class='MPTitleLabel MPLabel'></div>");
	this._artistLabel = $("<div class='MPArtistLabel MPLabel'></div>");
	this._albumLabel = $("<div class='MPAlbumLabel MPLabel'></div>");

	this._domElement.append(this._albumArtView).append(this._titleLabel).append(this._artistLabel).append(this._albumLabel);
	
	if(this._track.albumArtURL){
		this._albumArtView.css({
			backgroundImage: this._track.albumArtURL
		});
	}else{
		this._albumArtView.addClass("MPEmptyAlbumArt");
	}
	
	if(this._track.title){
		this._titleLabel.text(this._track.title);
	}else{
		this._titleLabel.text("No Title");
		this._titleLabel.addClass("PMEmptyLabel");
	}

	if(this._track.artist){
		this._artistLabel.text(this._track.artist);
	}else{
		this._artistLabel.text("No Artist");
		this._artistLabel.addClass("PMEmptyLabel");
	}

	if(this._track.album){
		this._albumLabel.text(this._track.album);
	}else{
		this._albumLabel.text("No Album");
		this._albumLabel.addClass("PMEmptyLabel");
	}
}

MPTrackView.prototype.domElement = function(){
	return this._domElement[0];
}

$(function(){
	var player = new MPPlayer($("#playlist")[0]);
	
	var playlistURL = window.location.hash;
	if(playlistURL != undefined){
		playlistURL = playlistURL.substr(1, playlistURL.length);
		if(playlistURL.match(/^http:\/\//)){
			playlistURL = playlistURL + "?callback=?";
		}
	}

	$.getJSON(playlistURL || "playlist.json", function(data){
		var tracks = data.tracks;
		var playlist = new MPPlaylist(tracks);

		player.setPlaylist(playlist);
		player.loadNextTrack();
		player.play();
	});
});