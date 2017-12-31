<?php
/*
stardevelop.com Live Help
International Copyright stardevelop.com

You may not distribute this program in any manner,
modified or otherwise, without the express, written
consent from stardevelop.com

You may make modifications, but only for your own
use and within the confines of the License Agreement.
All rights reserved.

Selling the code for this program without prior
written consent is expressly forbidden. Obtain
permission before redistributing this program over
the Internet or in any other medium.  In all cases
copyright and header must remain intact.
*/

$installed = false;
$database = require_once('./database.php');
if ($database) {
	// Smarty Template
	require_once('./smarty/Smarty.class.php');

	require_once('./spiders.php');
	require_once('./class.aes.php');
	require_once('./class.cookie.php');
	require_once('./class.session.php');
	$installed = require_once('./config.php');
	require_once('./class.models.php');
} else {
	$installed = false;
}

require_once('./functions.php');
$version = require_once('./version.php');

if ($installed == false) {

	// Hooks
	require_once dirname(__FILE__) . '/class.hooks.php';

	// Settings Failure Hook
	$hooks->run('SettingsFailure');

	// Initialise Settings
	$_SETTINGS = array();

} else {

	// Copyright Removal
	if ($version == false && !isset($_LOCALE['stardevelopcopyright'])) {
		$_LOCALE['stardevelopcopyright'] = 'International Copyright &copy; 2003 - ' . date('Y') . ' <a href="http://livehelp.stardevelop.com" target="_blank" class="normlink">Live Help Messenger</a> All Rights Reserved';
	}

	if (!isset($_REQUEST['SESSION'])){ $_REQUEST['SESSION'] = ''; }
	if (!isset($_REQUEST['DEPARTMENT'])){ $_REQUEST['DEPARTMENT'] = ''; }
	$department = trim($_REQUEST['DEPARTMENT']);

	// Initialise Session
	$session = new Session($_REQUEST['SESSION'], $_SETTINGS['AUTHKEY']);

	// Visitor
	$visitor = false;
	if (is_numeric($session->request) && $session->request > 0) {
		$visitor = Visitor::where_id_is($session->request)->find_one();
	}

	// Visitor Session Hook
	$result = $hooks->run('VisitorSession', $session);
	if (is_array($result) && isset($result['visitor']) && isset($result['session'])) {
		$visitor = ($result['visitor'] !== false) ? $result['visitor'] : $visitor;
		$session->visitor = $result['session']->visitor;
	}

	// Hidden Departments
	$hiddendepts = false;
	if ((float)$_SETTINGS['SERVERVERSION'] >= 5.0) {
		$hiddendepts = Department::where('status', 1)->find_many();
	}

	$excludedepts = array();
	if ($hiddendepts !== false) {
		foreach ($hiddendepts as $key => $value) {
			$excludedepts[] = $value->name;
		}
	}

	// Operators
	$users = Operator::find_many();

	$type = false;
	foreach ($users as $key => $user) {

		$id = (int)$user->id;

		switch ($user->status()) {
			case 0: // Offline - Hidden
				$type = &Operators::$hidden;
				break;
			case 1: // Online
				$type = &Operators::$online;
				break;
			case 2: // Be Right Back
				$type = &Operators::$brb;
				break;
			case 3: // Away
				$type = &Operators::$away;
				break;
		}

		if (!empty($department) && $type !== false) {

			$depmnts = explode(';', $user->department);
			if (is_array($depmnts)) {
				foreach ($depmnts as $key => $depart) {
					if (!in_array($id, $type)) {
						$depart = trim($depart);
						if ($depart == $department && !in_array($depart, $excludedepts)) {
							$type[] = $id;
						}
					}
				}
			}
			else {
				if (!in_array($id, $type)) {
					$depmnt = trim($user->department);
					if ($depmnt == $department && !in_array($depmnt, $excludedepts)) {
						$type[] = $id;
					}
				}
			}

		} else {
			$type[] = $id;
		}

	}

	// Status Mode
	$status = 'Offline';
	if (count(Operators::$online) > 0) {
		$status = 'Online';
	} elseif (count(Operators::$brb) > 0 && count(Operators::$brb) >= count(Operators::$away)) {
		$status = 'BRB';
	} elseif (count(Operators::$away) > 0) {
		$status = 'Away';
	}

	// Away Disabled
	if ($status == 'Away' && isset($_SETTINGS['AWAYMODE']) && $_SETTINGS['AWAYMODE'] === false) {
		$status = 'Offline';
	}

	// BRB Disabled
	if ($status == 'BRB' && isset($_SETTINGS['BRBMODE']) && $_SETTINGS['BRBMODE'] === false) {
		$status = 'Offline';
	}

	// Auto Initiate Chat
	$initiate = false;
	if ($visitor !== false) {

		$initiate = (int)$visitor->initiate;
		if (is_string($visitor->path)) {
			$path = explode('; ', $visitor->path);
		} else {
			$path = $visitor->path;
		}
		$totalpages = count($path) + 1;

		if ($initiate > 0 || $initiate == -1 || (isset($_SETTINGS['INITIATECHATAUTO']) && $_SETTINGS['INITIATECHATAUTO'] > 0 && $initiate == 0 && count(Operators::$online) > 0 && $totalpages >= $_SETTINGS['INITIATECHATAUTO'])) {
			$initiate = true;
		} else {
			$initiate = false;
		}
	}

	// Offline Email Redirection
	if (!empty($_SETTINGS['OFFLINEEMAILREDIRECT'])) {
		if (preg_match('/^[\-!#$%&\'*+\\\\.\/0-9=?A-Z\^_`a-z{|}~]+@[\-!#$%&\'*+\\\\\/0-9=?A-Z\^_`a-z{|}~]+\.[\-!#$%&\'*+\\\\.\/0-9=?A-Z\^_`a-z{|}~]+$/', $_SETTINGS['OFFLINEEMAILREDIRECT'])) {
			$_SETTINGS['OFFLINEEMAILREDIRECT'] = 'mailto:' . $_SETTINGS['OFFLINEEMAILREDIRECT'];
		}
		$_SETTINGS['OFFLINEEMAIL'] = 0;
	}

	// Operators
	$embeddedoperator = false;

	// Departments
	$departments = array();
	$operators = array();

	$excludedepts = array();
	if ($hiddendepts !== false) {
		foreach ($hiddendepts as $key => $value) {
			$excludedepts[] = $value->name;
		}
	}

	if (Operators::$online !== false) {
		foreach (Operators::$online as $id) {
			$user = Operator::where_id_is($id)->find_one();

			$depmnts = explode(';', $user->department);
			if (is_array($depmnts)) {
				foreach ($depmnts as $key => $depart) {
					$depart = trim($depart);
					if (!in_array($depart, $departments) && !in_array($depart, $excludedepts)) {
						$departments[] = $depart;
					}
					if (empty($department) || (!empty($department) && $depart == $department && !in_array($depart, $excludedepts))) {
						$operators[] = $user;
					}
				}
			}
			else {
				$depmnt = trim($user->department);
				if (!in_array($depmnt, $departments) && !in_array($depmnt, $excludedepts)) {
					$departments[] = $depmnt;
				}
				if (empty($department) || (!empty($department) && $depmnt == $department && !in_array($depmnt, $excludedepts))) {
					$operators[] = $user;
				}
			}
		}

		if (count($operators) > 0) {
			$embeddedoperator = $operators[array_rand($operators)];
		}

		$total = count($departments);
		sort($departments);
	}

	// Departments Loaded Hook
	if (is_array($departments) && count($departments) > 0) {
		$departments = $hooks->run('DepartmentsLoaded', $departments);
	}

	// Disable Departments
	if ($_SETTINGS['DEPARTMENTS'] == false) {
		$departments = false;
	}

	if ($embeddedoperator !== false) {
		$embeddedinitate = array('id' => (int)$embeddedoperator->id, 'name' => $embeddedoperator->firstname . ' ' . $embeddedoperator->lastname, 'department' => $embeddedoperator->department, 'avatar' => md5($embeddedoperator->email), 'photo' => false);
	} else {
		$embeddedinitate = array('id' => -1);
	}

	// Auto Open Chat
	$autoload = 0;
	$name = '';
	$email = false;
	$depmnt = '';
	$blocked = 0;

	// Chat
	$chat = false;
	if ($session->chat > 0) {
		$chat = Chat::where_id_is($session->chat)->find_one();
	}

	$channel = '';
	if ($chat !== false) {
		if (($chat->status == 1 && $chat->session()->count() > 0) || $chat->status == 0) {
			$autoload = 1;
			$name = $chat->name;
			$email = $chat->email;
			$depmnt = $chat->department;

			$salt = $_SETTINGS['CLOUDSOCKETSCHANNELSALT'];
			$channel = sha1((int)$chat->id . $salt);

		} else if ($chat->status == -3) {
			$blocked = 1;
		}
	}

	// Encrypt Session
	$data = array();
	if ($visitor !== false) {
		$data['visitor'] = (int)$visitor->id;
		if ($visitor !== false && is_numeric($visitor->id) && $visitor->id > 0) {
			$data = array('visitor' => (int)$visitor->id);
		}

		// Visitor Session Hook
		$result = $hooks->run('VisitorSessionData', array('guid' => false, 'session' => $session));
		if ($result !== false && is_string($result)) {
			$data = array('visitor' => $result);
		} else if (is_array($result) && is_array($result['session']) && isset($result['session']['request'])) {
			$data = array('visitor' => (int)$result['session']['request']);
		}
	}

	if ($chat !== false) {
		$data['chat'] = (int)$chat->id;
		$data['name'] = $chat->name;
		$data['email'] = $chat->email;
		$data['department'] = $chat->department;

		// Chat Blocked
		if ($chat->status == -3) {
			$blocked = 1;
		}
	}

	$encrypted = $session->encrypt($data);

}

header('Content-type: text/html; charset=utf-8');

if (defined('LANGUAGE') && file_exists('../locale/' . LANGUAGE . '/guest.php')) {
	include('../locale/' . LANGUAGE . '/guest.php');
}
else {
	include('../locale/en/guest.php');
}

// Templates
$templates = array();
if (isset($_SETTINGS['TEMPLATES']) && is_array($_SETTINGS['TEMPLATES'])) {
	foreach ($_SETTINGS['TEMPLATES'] as $key => $template) {
		$templates[] = $template['value'];
	}
}

if (empty($templates)) {
	$templates[] = 'default';
}

// Visitor Language Hook
$hooks->run('VisitorLanguage');

// Language
$language = array();
$language['welcome'] = $_LOCALE['welcome'];
$language['enterguestdetails'] = $_LOCALE['enterguestdetails'];
$language['says'] = $_LOCALE['says'];
$language['pushedurl'] = $_LOCALE['pushedurl'];
$language['opennewwindow'] = $_LOCALE['opennewwindow'];
$language['sentfile'] = $_LOCALE['sentfile'];
$language['startdownloading'] = $_LOCALE['startdownloading'];
$language['disconnecttitle'] = $_LOCALE['disconnecttitle'];
$language['disconnectdescription'] = $_LOCALE['disconnectdescription'];
$language['thankyoupatience'] = $_LOCALE['thankyoupatience'];
$language['emailchat'] = $_LOCALE['emailchat'];
$language['togglesound'] = $_LOCALE['togglesound'];
$language['feedback'] = $_LOCALE['feedback'];
$language['disconnect'] = $_LOCALE['disconnect'];
$language['collapse'] = $_LOCALE['collapse'];
$language['expand'] = $_LOCALE['expand'];
$language['invalidemail'] = $_LOCALE['invalidemail'];
$language['name'] = $_LOCALE['name'];
$language['email'] = $_LOCALE['email'];
$language['department'] = $_LOCALE['department'];
$language['question'] = $_LOCALE['question'];
$language['send'] = $_LOCALE['send'];
$language['enteryourmessage'] = $_LOCALE['enteryourmessage'];
$language['switchpopupwindow'] = $_LOCALE['switchpopupwindow'];
$language['initiatechatquestion'] = $_LOCALE['initiatechatquestion'];
$language['rateyourexperience'] = $_LOCALE['rateyourexperience'];
$language['copyright'] = $_LOCALE['stardevelopcopyright'];
$language['thankyoumessagesent'] = $_LOCALE['thankyoumessagesent'];
$language['cancel'] = $_LOCALE['cancel'];
$language['pleasewait'] = $_LOCALE['pleasewait'];
$language['telephonecallshortly'] = $_LOCALE['telephonecallshortly'];
$language['telephonethankyoupatience'] = $_LOCALE['telephonethankyoupatience'];
$language['connect'] = $_LOCALE['connect'];
$language['connecting'] = $_LOCALE['connecting'];
$language['closechat'] = $_LOCALE['closechat'];
$language['chatsessionblocked'] = $_LOCALE['chatsessionblocked'];
$language['accessdenied'] = $_LOCALE['accessdenied'];
$language['blockedchatsession'] = $_LOCALE['blockedchatsession'];
$language['istyping'] = $_LOCALE['istyping'];
$language['online'] = $_LOCALE['online'];
$language['offline'] = $_LOCALE['offline'];
$language['brb'] = $_LOCALE['brb'];
$language['away'] = $_LOCALE['away'];
$language['offlineerrortitle'] = $_LOCALE['offlineerrortitle'];
$language['closedusermessage'] = $_LOCALE['closedusermessage'];
$language['contactus'] = $_LOCALE['contactus'];
$language['restartchat'] = $_LOCALE['restartchat'];
$language['password'] = $_LOCALE['password'];
$language['retypepassword'] = $_LOCALE['retypepassword'];
$language['chatwith'] = $_LOCALE['chatwith'];

$json = (isset($_REQUEST['JSON'])) ? true : false;
if ($json) {

	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		if (isset($_SERVER['HTTP_ORIGIN'])) {
			header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
			header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
			header('Access-Control-Allow-Headers: X-Requested-With');
			header('Access-Control-Allow-Credentials: true');
			header('Access-Control-Max-Age: 1728000');
			header('Content-Length: 0');
			header('Content-Type: text/plain');
			exit();
		} else {
			header('HTTP/1.1 403 Access Forbidden');
			header('Content-Type: text/plain');
			exit();
		}
	} else {
		// AJAX Cross-site Headers
		if (isset($_SERVER['HTTP_ORIGIN'])) {
			header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
			header('Access-Control-Allow-Credentials: true');
		}
	}

	$settings = array();
	if (!empty($_SETTINGS)) {
		$settings['popupSize'] = array('width' => (int)$_SETTINGS['CHATWINDOWWIDTH'], 'height' => (int)$_SETTINGS['CHATWINDOWHEIGHT']);
		$settings['initiateAlign'] = array('x' => strtolower($_SETTINGS['INITIATECHATHORIZONTAL']), 'y' => strtolower($_SETTINGS['INITIATECHATVERTICAL']));
		$settings['status'] = $status;
		$settings['offlineRedirect'] = $_SETTINGS['OFFLINEEMAILREDIRECT'];
		$settings['offlineEmail'] = (int)$_SETTINGS['OFFLINEEMAIL'];
		$settings['channel'] = $channel;
		$settings['autoload'] = $autoload;
		$settings['smilies'] = (int)$_SETTINGS['SMILIES'];
		$settings['departments'] = $departments;
		$settings['locale'] = LANGUAGE;
		$settings['language'] = $language;
		$settings['session'] = $encrypted;
		$settings['user'] = $name;
		$settings['email'] = $email;
		$settings['department'] = $depmnt;
		$settings['visitorTracking'] = (int)$_SETTINGS['VISITORTRACKING'];
		$settings['requireGuestDetails'] = (int)$_SETTINGS['REQUIREGUESTDETAILS'];
		$settings['loginDetails'] = (int)$_SETTINGS['LOGINDETAILS'];
		$settings['loginEmail'] = (int)$_SETTINGS['LOGINEMAIL'];
		$settings['loginQuestion'] = (int)$_SETTINGS['LOGINQUESTION'];
		$settings['initiate'] = (int)$initiate;
		$settings['embeddedinitiate'] = $embeddedinitate;
		$settings['templates'] = $templates;
		$settings['template'] = $_SETTINGS['TEMPLATE'];
		$settings['blocked'] = $blocked;
		$settings['rtl'] = (isset($_SETTINGS['DIRECTION']) && $_SETTINGS['DIRECTION'] == 'rtl') ? true : false;
		$settings['plugins'] = (isset($_SETTINGS['PLUGINS'])) ? $_SETTINGS['PLUGINS'] : false;
		$settings['images'] = array('online' => $_SETTINGS['ONLINELOGO'], 'offline' => $_SETTINGS['OFFLINELOGO'], 'brb' => $_SETTINGS['BERIGHTBACKLOGO'], 'away' => $_SETTINGS['AWAYLOGO']);
		$settings['introduction'] = $_SETTINGS['INTRODUCTION'];

		// Visitor Hash
		if ($visitor !== false && isset($_SETTINGS['CLOUDSOCKETSVISITORSALT'])) {
			$salt = $_SETTINGS['CLOUDSOCKETSVISITORSALT'];
			$settings['visitor'] = array('hash' => sha1($visitor->id . $salt));
		}

	}

	// Default Template
	if (empty($_SETTINGS['TEMPLATE'])) {
		$_SETTINGS['TEMPLATE'] = 'default';
	}

	if ($installed !== false) {
		// Smarty Templates
		$smarty = new Smarty;

		$smarty->debugging = false;
		$smarty->caching = false;
		$smarty->template_dir = '../templates';
		$smarty->compile_dir = '../templates_c';
		$smarty->cache_dir = '../templates/cache';
		$smarty->config_dir = '../includes/smarty';

		$smarty->assign('LOCALE', $_LOCALE, true);

		$dir = (isset($_SETTINGS['DIRECTION']) && $_SETTINGS['DIRECTION'] == 'rtl') ? 'dir="rtl"' : '';
		$rtl = (isset($_SETTINGS['DIRECTION']) && $_SETTINGS['DIRECTION'] == 'rtl') ? 'style="text-align:right"' : '';
		$style = (strlen($_LOCALE['stardevelopcopyright']) > 0) ? 'block' : 'none';
		$smarty->assign('dir', $dir, true);
		$smarty->assign('rtl', $rtl, true);
		$smarty->assign('style', $style, true);

		if (isset($_REQUEST['TEMPLATE'])) {
			$path = $_REQUEST['TEMPLATE'] . '/embedded.tpl';
			if (file_exists($smarty->template_dir . '/' . $path)) {
				$embedded = $smarty->fetch($path);
			} else {
				$path = $_SETTINGS['TEMPLATE'] . '/embedded.tpl';
				$embedded = $smarty->fetch($path);
			}
		} else {

			$path = $_SETTINGS['TEMPLATE'] . '/embedded.tpl';
			$embedded = $smarty->fetch($path);
		}
		$settings['embedded'] = $embedded;
	}

	$result = $hooks->run('VisitorSettings', array('settings' => $settings));
	if (is_array($result) && isset($result['settings'])) {
		$settings = $result['settings'];
	}

	if ($installed == false) {
		$settings['error'] = true;
	} else {
		$settings['error'] = false;
	}

	$json = json_encode($settings);
	if (!isset($_GET['callback'])) {
		header('Content-Type: application/json; charset=utf-8');
		exit($json);
	} else {
		if (is_valid_callback($_GET['callback'])) {
			header('Content-Type: text/javascript; charset=utf-8');
			exit($_GET['callback'] . '(' . $json . ')');
		} else {
			header('Status: 400 Bad Request');
			exit();
		}
	}
}
?>
