$(function(){
	$.getJSON("playlist.json", function(data){
		var tracks = data.tracks;
		alert("Got " + tracks.length + " tracks");
		
		$("#MusicPlayer").attr({
			src: tracks[0].url
		})[0].play();
	});
});