( function( $ ) {
$( document ).ready(function() {
$('#cssmenu > ul').prepend('<li class=\"mobile\"><a href=\"#\"><span>Menu <i>&#9776;</i></span></a></li>');
$('#cssmenu > ul > li').hover(function(e) {
	$(this).find('ul').slideDown(200);
}, function(e){
	$(this).find('ul').slideUp(200);
	});



});
} )( jQuery );