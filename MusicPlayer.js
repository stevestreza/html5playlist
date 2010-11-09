window.MPHashFromUsernameAndPassword = function(username, password){
	var timestamp = parseInt((new Date().getTime() / 1000), 10);
	var hash = MD5(timestamp + MD5(password));
	return {
		username: username,
		hash: hash,
		timestamp: timestamp
	};
}

var MPPlaylist = function(tracks, username, playlistStub, name){
	this._tracks = tracks;
	this._username = username;
	this._playlistStub = playlistStub;
	this._name = name;
};

MPPlaylist.prototype.path = function(){
	return this._username + "/" + this._playlistStub;
}

MPPlaylist.prototype.name = function(){
	return this._name;
}

MPPlaylist.prototype.trackAfter = function(index){
	var newIndex = index+1;
	if(newIndex >= this._tracks.length || newIndex < 0){
		newIndex = 0;
	}
	return newIndex;
}

MPPlaylist.prototype.trackBefore = function(index){
	var newIndex = index-1;
	if(newIndex < 0){
		newIndex = this._tracks.length-1;
	}
	return newIndex;
}

MPPlaylist.prototype.tracks = function(){
	return this._tracks;
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

var MPPlayer = function(){
	this._player = $("<audio></audio>");
	this._isPlaying = false;
	this._currentTrack = -1;
	this._playlist = null;
	
	var self = this;
	this._player.bind("ended", function(){
		self.loadNextTrack();
	});
	
	$(window).bind("keypress", function(e){
		if(e.which == 32){
			/* spacebar */
			if(self.isPlaying()){
				self.pause();
			}else{
				self.play();
			}
			e.preventDefault();
		}else if(e.which == 106 || e.which == 108){
			/* next song */
			self.loadNextTrack();
			e.preventDefault();
		}else if(e.which == 104 || e.which == 107){
			/* previous song */
			self.loadPreviousTrack();
			e.preventDefault();
		}else{
			console.log("Pressed " + e.which);
		}
	});
};

MPPlayer.prototype.setPlaylist = function(playlist){
	this._currentTrack = -1;
	this._playlist = playlist;
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
		
		$(this).trigger("play", this.getCurrentTrack());
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
	
	$(this).trigger("progress", pos);
}

MPPlayer.prototype.pause = function(){
	if(this._isPlaying){
		this._isPlaying = false;
		this._player[0].pause();
		this._stopUpdateTimer();
		
		$(this).trigger("pause", this.getCurrentTrack());
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

MPPlayer.prototype.loadPreviousTrack = function(){
	if(this._playlist){
		var trackIndex = this._currentTrack;
		trackIndex = this._playlist.trackBefore(trackIndex);

		var track = this._playlist.trackAtIndex(trackIndex);
		this.loadTrack(track);
	}
}

MPPlayer.prototype.loadTrack = function(track){
	$(this).trigger("songend", this.getCurrentTrack());

	this._currentTrack = this._playlist.indexOfTrack(track);
	
	this._player.attr({
		src: track.url
	});
	
	this._player[0].load();

	if(this._isPlaying == true){
		this._isPlaying = false;
		this.play();
	}

	$(this).trigger("songbegin", track);
}

MPPlayer.prototype.getCurrentTrack = function(){
	return this._playlist.trackAtIndex(this._currentTrack);
}

$(function(){
	var element = $("#playlist");
	var player = new MPPlayer();
	$(window).hashchange(function(){
		var playlistURL = window.location.hash;
		var song = 0;
		if(playlistURL != undefined){
			playlistURL = playlistURL.substr(1, playlistURL.length);
			
			// check for page hash
			var songArray = playlistURL.match(/^.+\/([0-9]+)/);
			if(songArray && songArray.length > 0){
				song = parseInt(songArray[1], 10) - 1;
				playlistURL = playlistURL.substr(0, playlistURL.length - songArray[1].length - 1);
			}
			
			if(playlistURL.match(/^!/)){
				playlistURL = "http://api.slaylist.com/" + playlistURL.substr(1, playlistURL.length);
			}
			
			if(playlistURL.match(/^http:\/\//)){
				playlistURL = playlistURL + "?callback=?";
			}
		}

		$.getJSON(playlistURL || "playlist.json", function(data){
			var tracks = data.tracks;
			var playlists = data.playlists;
			if(tracks){
				var playlist = new MPPlaylist(tracks);

				element.children().remove();
				var playlistView = new MPPlaylistView(playlist, player, element);

				player.setPlaylist(playlist);
				player.loadTrack(playlist.trackAtIndex(song));
				player.play();
			}else if(playlists){
				var username = window.location.hash.match(/\#\!([^\/]+)\/?/)[1];
				
				element.children().remove();
				var newPlaylists = [];
				for(var stub in playlists){
					var name = playlists[stub];
					var playlist = new MPPlaylist([], username, stub, name);
					newPlaylists.push(playlist);
				}
				
				var listPlaylistsView = new MPListPlaylistsView(newPlaylists, element);
				$(listPlaylistsView).bind("selected", function(ev, playlist){
					window.location.hash = "#!" + playlist.path();
				});
			}
		});
	}).trigger("hashchange");
});
