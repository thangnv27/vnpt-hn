<!DOCTYPE html>
<html>
<head>
<title>{$SETTINGS.NAME}</title>
<link href="{$basedir}templates/{$template}/styles/bootstrap.min.css" rel="stylesheet" type="text/css"/>
<link href="{$basedir}templates/{$template}/styles/flat-ui-pro.min.css" rel="stylesheet" type="text/css"/>
<link href="{$basedir}styles/styles.php" rel="stylesheet" type="text/css"/>
<link href="{$basedir}templates/{$template}/styles/styles.min.css" rel="stylesheet" type="text/css"/>
<script language="JavaScript" type="text/JavaScript" src="{$basedir}scripts/jquery-latest.js"></script>
<script language="JavaScript" type="text/JavaScript" src="{$basedir}templates/{$template}/js/flat-ui-pro.js"></script>
{literal}
<script type="text/javascript">
<!--
	var LiveHelpSettings = {};
	LiveHelpSettings.server = document.location.host + document.location.pathname.substring(0, document.location.pathname.indexOf('/livehelp'));
	LiveHelpSettings.visitorTracking = false;
	LiveHelpSettings.popup = true;
	LiveHelpSettings.embedded = false;
	LiveHelpSettings.css = false;
	LiveHelpSettings.template = {/literal}'{$template|escape:quotes}'{literal};
	LiveHelpSettings.department = {/literal}'{$department|escape:quotes}'{literal};
	LiveHelpSettings.session = {/literal}'{$session|escape:quotes}'{literal};
	LiveHelpSettings.security = {/literal}'{$captcha|escape:quotes}'{literal};
	LiveHelpSettings.locale = {/literal}'{$language|escape:quotes}'{literal};
{/literal}{if $connected}{literal}	LiveHelpSettings.connected = {/literal}{$connected}{literal};{/literal}{/if}{literal}

	(function($) {
		$(function() {
			$(window).ready(function() {
				// JavaScript
				LiveHelpSettings.server = LiveHelpSettings.server.replace(/[a-z][a-z0-9+\-.]*:\/\/|\/livehelp\/*(\/|[a-z0-9\-._~%!$&'()*+,;=:@\/]*(?![a-z0-9\-._~%!$&'()*+,;=:@]))|\/*$/g, '');
				var LiveHelp = document.createElement('script'); LiveHelp.type = 'text/javascript'; LiveHelp.async = true;
				LiveHelp.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + LiveHelpSettings.server + '{/literal}{$jspath}{literal}';
				var s = document.getElementsByTagName('script')[0];
				s.parentNode.insertBefore(LiveHelp, s);

				// Select2 Replacement
				$('select').select2({dropdownCssClass: 'dropdown-inverse'});
			});
		});
	})(jQuery);
-->
</script>
{/literal}
</head>
<body style="background-color: {$SETTINGS.BACKGROUNDCOLOR};">
<div id="LiveHelpContent">
	<div id="Logo">
{if $SETTINGS.LOGO}
		<img id="LogoImage" src="{$SETTINGS.LOGO}" alt="{$SETTINGS.NAME}" border="0"/>
{/if}
	</div>
