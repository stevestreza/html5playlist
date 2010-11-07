window.MPHashFromUsernameAndPassword = function(username, password){
	var timestamp = new Date().getTime();
	var hash = MD5(timestamp + MD5(password));
	return {
		username: username,
		hash: hash,
		timestamp: timestamp
	};
}

var MPPlaylist = function(tracks, username, playlistStub){
	this._tracks = tracks;
	this._username = username;
	this._playlistStub = playlistStub;
};

MPPlaylist.prototype.trackAfter = function(index){
	var newIndex = index+1;
	if(newIndex >= this._tracks.length || newIndex < 0){
		newIndex = 0;
	}
	return newIndex;
}

MPPlaylist.prototype.trackAtIndex = function(index){
	return this._tracks[index];
}

MPPlaylist.prototype.indexOfTrack = function(track){
	return this._tracks.indexOf(track);
}

MPPlaylist.prototype.numberOfTracks = function(){
	return this._tracks.length;
}

MPPlaylist.prototype.saveToServerWithInfo = function(info){
	var username = info.username;
	var password = info.password;
	var name = info.name;
	
	var parameters = {
		name: name,
		tracks: this._tracks
	};
	
	var signature = MPHashFromUsernameAndPassword(username, password);
	for(var key in signature){
		parameters[key] = signature[key];
	}
	
	$.post("http://api.slaylist.com/" + this._username + "/" + this._playlistStub, parameters, function(data){
		console.log("Got data: " + JSON.stringify(data));
	});
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
			var track = this._playlist.trackAtIndex(idx);
			this._dom.append(this.trackViewForTrack(track).domElement());
		}
	}
};

MPPlayer.prototype.isPlaying = function(){
	return this._isPlaying;
}

MPPlayer.prototype.play = function(){
	if(!this._isPlaying){
		this._isPlaying = true;
		
		if(this._currentTrack < 0 || this._currentTrack === undefined){
			this.loadNextTrack();
		}
		
		this._player[0].play();
		
		this._startUpdateTimer();
	}
};

MPPlayer.prototype._startUpdateTimer = function(){
	var self = this;
	this._timer = setInterval(function(){
		self._updateProgressBar();
	}, 66);
};

MPPlayer.prototype._stopUpdateTimer = function(){
	if(this._timer){
		clearInterval(this._timer);
		this._timer = null;
	}
}

MPPlayer.prototype._updateProgressBar = function(){
	var audio = this._player[0];
	var rem = parseInt(audio.duration - audio.currentTime, 10);
	var pos = (audio.currentTime / audio.duration);
	
	var track = this.getCurrentTrack();
	var trackView = this.trackViewForTrack(track);
	trackView.setProgress(pos);
}

MPPlayer.prototype.pause = function(){
	if(this._isPlaying){
		this._isPlaying = false;
		this._player[0].pause();
		this._stopUpdateTimer();
	}
};

MPPlayer.prototype.loadNextTrack = function(){
	if(this._playlist){
		var trackIndex = this._currentTrack;
		trackIndex = this._playlist.trackAfter(trackIndex);

		var track = this._playlist.trackAtIndex(trackIndex);
		this.loadTrack(track);
	}
}

MPPlayer.prototype.loadTrack = function(track){
	var oldTrackView = this.trackViewForTrack(this.getCurrentTrack());
	if(oldTrackView){
		oldTrackView.setProgress(0);
		$(oldTrackView.domElement()).removeClass("MPNowPlaying");
	}

	this._currentTrack = this._playlist.indexOfTrack(track);
	
	this._player.attr({
		src: track.url
	});
	
	this._player[0].load();

	if(this._isPlaying == true){
		this._isPlaying = false;
		this.play();
	}

	var newTrackView = this.trackViewForTrack(track);
	newTrackView.setProgress(0);
	$(newTrackView.domElement()).addClass("MPNowPlaying");
}

MPPlayer.prototype.getCurrentTrack = function(){
	return this._playlist.trackAtIndex(this._currentTrack);
}

MPPlayer.prototype.trackViewForTrack = function(track){
	if(!track){
		return undefined;
	}
	
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
		if(self._track == player.getCurrentTrack()){
			if(player.isPlaying()){
				player.pause();
			}else{
				player.play();
			}
		}else{
			player.loadTrack(self._track);
		}
	});
	
	this._backgroundView = $("<div class='MPBackgroundView'></div>");
	this._contentsView = $("<div class='MPContents'></div>");
	
	this._progressBarView = $("<div class='MPProgressBar'></div>");
	this._backgroundView.append(this._progressBarView);
	
	$([this._backgroundView, this._contentsView]).css({
		width: "100%",
		height: "100%",
		position: "relative",
		left:0,
		top:0
	});
	
	this._albumArtView = $("<div class='MPAlbumArtView'></div>");
	this._titleLabel = $("<div class='MPTitleLabel MPLabel'></div>");
	this._artistLabel = $("<div class='MPArtistLabel MPLabel'></div>");
	this._albumLabel = $("<div class='MPAlbumLabel MPLabel'></div>");

	this._contentsView.append(this._albumArtView).append(this._titleLabel).append(this._artistLabel).append(this._albumLabel);
	
	this._domElement.append(this._backgroundView).append(this._contentsView);
	
	if(this._track.albumArtURL){
		this._albumArtView.css({
			backgroundImage: "url(" + this._track.albumArtURL + ")"
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

MPTrackView.prototype.setProgress = function(progress){
	this._progressBarView.css({
		width: "" + (progress * 100) + "%"
	})
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
