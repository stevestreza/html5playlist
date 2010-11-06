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

var MPPlayer = function(){
	this._player = $("<audio></audio>");
	this._isPlaying = false;
	this._currentTrack = -1;
	this._playlist = null;
	
	var self = this;
	this._player.bind("ended", function(){
		self.loadNextTrack();
	})
};

MPPlayer.prototype.setPlaylist = function(playlist){
	this._currentTrack = -1;
	this._playlist = playlist;

};

MPPlayer.prototype.play = function(){
	if(!this._isPlaying){
		this._isPlaying = true;
		
		if(this._currentTrack < 0 || this._currentTrack === undefined){
			this.loadNextTrack();
		}
		
		this._player[0].load();
		this._player[0].play();
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
		
	})
}

$(function(){
	var player = new MPPlayer();
	
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