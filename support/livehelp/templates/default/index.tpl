{include file="$template/header.tpl"}

	<div id="LiveHelpLogin" align="center" style="position:relative; top:0; min-height:365px{if $connected}; display:none{/if}">
		<div>
			{$LOCALE.welcome}<br/>{$LOCALE.enterguestdetails}
		</div>

	{if isset($error)}<br/><strong>{$error}</strong>{/if}
	<div id="LiveHelpLoginForm" class="LiveHelpLoginContent" style="width:400px; color:#777">

		<div class="form-group col-xs-12 col-sm-6 col-lg-3">
			<input type="text" name="NAME" id="NAME" placeholder="{$LOCALE.name}" value="{$username}" maxlength="20" class="form-control"/>
			<div id="LiveHelpNameError" title="Name Required" class="sprite input-error"></div>
		</div>

		{if $SETTINGS.LOGINEMAIL}
		<div class="form-group col-xs-12 col-sm-6 col-lg-3">
			<input type="text" name="EMAIL" id="EMAIL" placeholder="{$LOCALE.email}" value="{$email}" class="form-control"/>
			<div id="LiveHelpEmailError" title="Email Required" class="sprite input-error"></div>
		</div>
		{/if}

		{if $SETTINGS.LOGINTELEPHONE}
		<div class="form-group col-xs-12 col-sm-6 col-lg-3">
			<input type="text" name="TELEPHONE" id="TELEPHONE" placeholder="{$telephone}" value="{$telephone}" class="form-control"/>
			<div id="LiveHelpTelephoneError" title="Telephone Required" class="sprite input-error"></div>
		</div>
		{/if}

{if $departments}
		<div class="form-group col-xs-12 col-sm-6 col-lg-3">
			<select name="DEPARTMENT" id="DEPARTMENT" placeholder="{$LOCALE.department}" class="form-control select select-default select-block mbl">
				{html_options values=$departments output=$departments selected=$selected}
			</select>
			<div id="LiveHelpDepartmentError" title="Department Required" class="sprite" style="display:none; position:absolute; right:5px; top:5px"></div>
		</div>
{else if $department}
			<input name="DEPARTMENT" id="DEPARTMENT" type="hidden" value="{$department}"/>
{/if}
{if $SETTINGS.LOGINQUESTION}
		<div class="form-group col-xs-12 col-sm-6 col-lg-3">
			<textarea name="QUESTION" id="QUESTION" placeholder="{$LOCALE.question}" class="form-control" rows="3" cols="25" style="height:70px; bborder:none; outline:none; resize:none">{$question}</textarea>
			<div id="LiveHelpQuestionError" title="Question Required" class="sprite" style="display:none; position:absolute; right:5px; top:5px"></div>
		</div>
{/if}

		<input name="LANGUAGE" id="LANGUAGE" type="hidden" value="{$language}"/>
		<div id="LiveHelpConnectButton" class="btn btn-embossed btn-primary">Start Chatting</div>
	</div>
	</div>

	<div id="LiveHelpChat"{if !$connected} style="display:none"{/if}>
	<div id="LiveHelpToolbar" style="position:absolute; {if $SETTINGS.CAMPAIGNIMAGE}right:140px;{else}right:15px;{/if} top:35px; width:78px; height:20px">
		<div id="LiveHelpEmailChatToolbarButton" title="{$LOCALE.emailchat}" class="sprite Email" style="display:none; position:absolute; top:0px; left:0px; opacity:0.5"></div>
		<div id="LiveHelpSoundToolbarButton" title="{$LOCALE.togglesound}" class="sprite SoundOn" style="position:absolute; top:0px; left:20px; opacity:0.5"></div>
		<div id="LiveHelpFeedbackToolbarButton" title="{$LOCALE.feedback}" class="sprite Feedback" style="position:absolute; top:0px; left:40px; opacity:0.5"></div>
		<div id="LiveHelpDisconnectToolbarButton" title="{$LOCALE.disconnect}" class="sprite Disconnect" style="position:absolute; top:0px; left:60px; opacity:0.5"></div>
	</div>
	<div id="LiveHelpScrollBorder" style="position:relative; height:{$SETTINGS.CHATWINDOWHEIGHT-185}px; width:{$SETTINGS.CHATWINDOWWIDTH-150}px; margin:0 0 20px 5px; border-radius:3px; -moz-border-radius:3px; webkit-border-radius:3px; border: 1px solid #d0d0bf; background-color:#fff">
		<div id="LiveHelpScroll" style="position:absolute; overflow:auto; text-align:left; left:10px">
		<div id="LiveHelpWaiting" class="box">{$LOCALE.thankyoupatience}</div>
{if $SETTINGS.OFFLINEEMAILREDIRECT}
	<div id="LiveHelpContinue" class="box" style="border:none; background:none; text-align:right; display:none;">{$LOCALE.continuewaiting} <a href="{$SETTINGS.OFFLINEEMAILREDIRECT}" target="_blank">{$LOCALE.offlineemail}</a> ?</div>
{elseif $SETTINGS.OFFLINEEMAIL}
	<div id="LiveHelpContinue" class="box" style="border:none; background:none; text-align:right; display:none;">{$LOCALE.continuewaiting} <a href="offline.php" target="_top">{$LOCALE.offlineemail}</a> ?</div>
{/if}
		<div id="LiveHelpMessages" style="margin-left:5px"></div>
		<div id="LiveHelpMessagesEnd">
			<div id="LiveHelpClosedChatMessage">{$LOCALE.closedusermessage}</div>
		</div>
		</div>
	</div>
{if $SETTINGS.CAMPAIGNIMAGE}
	<div id="LiveHelpCampaign" style="position:absolute; right:5px; top:80px; width:125px;">
		{if $SETTINGS.CAMPAIGNLINK}<a href="{$SETTINGS.CAMPAIGNLINK}" target="_blank">{/if}<img src="{$SETTINGS.CAMPAIGNIMAGE}" border="0" alt="Live Help - Welcome, how can I be of assistance?" style="position:relative; top:-20px"/>{if $SETTINGS.CAMPAIGNLINK}</a>{/if}
	</div>
{/if}
	<div id="LiveHelpTypingPopup">
		<div class="sprite Typing"></div>
		<span></span>
	</div>
{if $SETTINGS.SMILIES}
	<div id="LiveHelpSmiliesButton" style="width:24px; height:24px; position:absolute; bottom:65px; right:105px; top:auto; left:auto">
		<img class="trigger" src="{$basedir}images/Smile.png" id="download" title="Smilies" alt="Smilies"/>
		<div id="SmiliesTooltip" style="display:none;"><div><span title="Laugh" class="sprite Laugh"></span><span title="Smile" class="sprite Smile"></span><span title="Sad" class="sprite Sad"></span><span title="Money" class="sprite Money"></span><span title="Impish" class="sprite Impish"></span><span title="Sweat" class="sprite Sweat"></span><span title="Cool" class="sprite Cool"></span><br/><span title="Frown" class="sprite Frown"></span><span title="Wink" class="sprite Wink"></span><span title="Surprise" class="sprite Surprise"></span><span title="Woo" class="sprite Woo"></span><span title="Tired" class="sprite Tired"></span><span title="Shock" class="sprite Shock"></span><span title="Hysterical" class="sprite Hysterical"></span><br/><span title="Kissed" class="sprite Kissed"></span><span title="Dizzy" class="sprite Dizzy"></span><span title="Celebrate" class="sprite Celebrate"></span><span title="Angry" class="sprite Angry"></span><span title="Adore" class="sprite Adore"></span><span title="Sleep" class="sprite Sleep"></span><span title="Quiet" class="sprite Stop"></span></div></div>
	</div>
{/if}
	<div style="position:absolute; bottom:90px; left:0; width:{$SETTINGS.CHATWINDOWWIDTH-140}px">
		<textarea id="LiveHelpMessageTextarea" placeholder="{$LOCALE.enteryourmessage}" style="top:auto; left:0; width:{$SETTINGS.CHATWINDOWWIDTH-150}px; height:45px; padding:2px; margin-left:5px; font-family:{$SETTINGS.CHATFONT}; font-size:{$SETTINGS.CHATFONTSIZE}; resize:none" rows="2" cols="250"></textarea>
	</div>
	<iframe id="FileDownload" name="FileDownload" frameborder="0" height="0" width="0" style="visibility:hidden; display:none; border:none"></iframe>
	<div id="LiveHelpDisconnect" style="display:none; margin:20px 20px 75px 20px">
		<div style="font-family: 'Source Sans Pro', sans-serif; text-shadow:0 0 2px #ccc; letter-spacing:-1px; font-size:25px; font-weight:700; line-height:28px; color:#999">{$LOCALE.disconnecttitle}</div><br/>
		<span>{$LOCALE.disconnectdescription}</span>
		<div id="LiveHelpDisconnectButton" class="btn btn-primary" style="position:absolute; bottom:10px; right:115px; border-radius:40px">Disconnect</div>
		<div id="LiveHelpCancelButton" class="btn btn-default" style="position:absolute; bottom:10px; right:10px; border-radius:40px">{$LOCALE.cancel}</div>
	</div>
	</div>

{include file="$template/footer.tpl"}
