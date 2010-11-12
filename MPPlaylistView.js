var MPPlaylistView = window.MPPlaylistView = Class.extend({
	init: function(playlist, player, element){
		this._playlist = playlist;
		this._player = player;
		this._domElement = $(element);
		
		var playlistName = this._playlist.name();
		if(playlistName){
			document.title = playlistName;
			$("#title").text(playlistName);
		}
		
		var self = this;
		this._listView = new MPListView(this._domElement, this._playlist.tracks(), function(item, idx){
			return self.trackViewForTrack(item);
		});
		
		$(this._player).bind("play", function(ev, track){
			$(self.trackViewForTrack(track).domElement()).addClass("MPNowPlaying").removeClass("MPPaused");
		}).bind("pause", function(ev, track){
			$(self.trackViewForTrack(track).domElement()).addClass("MPNowPlaying").addClass("MPPaused");
		}).bind("progress", function(ev, pos){
			var track = player.getCurrentTrack();
			var trackView = self.trackViewForTrack(track);
			trackView.setProgress(pos);
		}).bind("songbegin", function(ev, track){
			var newTrackView = self.trackViewForTrack(track);
			newTrackView.setProgress(0);
			$(newTrackView.domElement()).addClass("MPNowPlaying");
		}).bind("songend", function(ev, track){
		    var oldTrackView = self.trackViewForTrack(player.getCurrentTrack());
		    if(oldTrackView){
		    	oldTrackView.setProgress(0);
		    	$(oldTrackView.domElement()).removeClass("MPNowPlaying").removeClass("MPPaused");
		    }
		});
	},
	trackViewForTrack: function(track){
		if(!track){
			return undefined;
		}

		var trackView = track._trackView;
		if(!trackView){
			trackView = new MPTrackView(track, this._player);
			track._trackView = trackView;
		}
		return trackView;
	}
});

var MPTrackView = MPListViewItem.extend({
	init: function(track, player){
		this._super();
		
		var self = this;
		this._track = track;

		$(this.domElement()).addClass("MPTrackView").bind("click", function(event){
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


		this._progressBarView = $("<div class='MPProgressBar'></div>");
		this.backgroundView().append(this._progressBarView);

		this._albumArtView = $("<div class='MPAlbumArtView'></div>");
		this._titleLabel = $("<div class='MPTitleLabel MPLabel'></div>");
		this._artistLabel = $("<div class='MPArtistLabel MPLabel'></div>");
		this._albumLabel = $("<div class='MPAlbumLabel MPLabel'></div>");

		this.contentsView().append(this._albumArtView).append(this._titleLabel).append(this._artistLabel).append(this._albumLabel);

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
	},
	setProgress: function(progress){
		var width = $(this.backgroundView()).width();
		var totalWidth = (width - 72) * progress + 71;
		this._progressBarView.css({
			width: totalWidth
		});
	}	
});