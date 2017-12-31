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
require_once('./include/database.php');
require_once('./include/class.aes.php');
require_once('./include/class.cookie.php');
require_once('./include/class.session.php');
require_once('./include/config.php');
require_once('./include/class.models.php');
require_once('./include/functions.php');

if (!isset($_REQUEST['ID'])){ $_REQUEST['ID'] = ''; }
if (!isset($_REQUEST['MESSAGE'])){ $_REQUEST['MESSAGE'] = 0; }
if (!isset($_REQUEST['TYPING'])){ $_REQUEST['TYPING'] = ''; }
if (!isset($_REQUEST['TIME'])){ $_REQUEST['TIME'] = ''; }

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

$message = $_REQUEST['MESSAGE'];
$status = $_REQUEST['TYPING'];
$active = 0;
$chat = false;
$typing = false;

// Initialise Session
$session = new Session($_REQUEST['SESSION'], $_SETTINGS['AUTHKEY']);

if ($session->chat > 0) {

	$chat = Chat::where_id_is($session->chat)->find_one();
	if ($chat !== false) {

		if ($chat->status == 1) {
			// Accepted Operator
			$operator = $chat->session()->order_by_desc('requested')->find_one()->operator()->find_one();
			if ($chat !== false && $chat->status == 1 && $operator !== false) {
				$active = $operator->id;
			} else {
				$active = $chat->status;
			}
		}

		// Update Typing Status
		$typing = $chat->typing()->where('user', $active)->find_one();

		$result = false;
		if ($typing !== false) {
			if (isset($_COOKIE['LiveHelpOperator'])) {
				if ($status) { // Currently Typing
					switch($typing->status) {
						case 0: // None
						case 2: // Operator Only
							$result = 2;
							break;
						case 1: // Guest Only
						case 3: // Both
							$result = 3;
							break;
					}
				}
				else { // Not Currently Typing
					switch($typing->status) {
						case 0: // None
						case 2: // Operator Only
							$result = 0;
							break;
						case 1: // Guest Only
						case 3: // Both
							$result = 1;
							break;
					}
				}
			} else {
				if ($status) { // Currently Typing
					switch($typing->status) {
						case 0: // None
						case 1: // Guest Only
							$result = 1;
							break;
						case 2: // Operator Only
						case 3: // Both
							$result = 3;
							break;
					}
				}
				else { // Not Currently Typing
					switch($typing->status) {
						case 0: // None
						case 1: // Guest Only
							$result = 0;
							break;
						case 2: // Operator Only
						case 3: // Both
							$result = 2;
							break;
					}
				}
			}
		}

		// Typing
		if ($chat->status == 1 && $active > 0 && $result !== false) {
			if ($typing !== false) {
				$typing->status = $result;
			} else {
				$typing = Typing::create();
				$typing->id = sha1((string)$chat->id . (string)$active, true);
				$typing->chat = $chat->id;
				$typing->user = $active;
				$typing->status = $result;
			}
			$typing->save();
		}
	}
}

// Check if Accepted Chat
if ($chat !== false) {
	$username = $chat->name;
	$datetime = $chat->datetime;
	$department = $chat->department;
}

// HTTP/1.1
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Cache-Control: post-check=0, pre-check=0', false);

// HTTP/1.0
header('Pragma: no-cache');
header('Content-type: text/html; charset=utf-8');

if (file_exists('locale/' . LANGUAGE . '/guest.php')) {
	include('locale/' . LANGUAGE . '/guest.php');
}
else {
	include('locale/en/guest.php');
}

// JSON Messages
$messages = false;
$messagesjson = array();
if ($chat !== false && $chat->status == 1) {

	if ($message > 0) {
		// New Messages
		$messages = Message::where('chat', $chat->id)
			->where_gt('id', (int)$message)
			->where_gte('status', 0)
			->find_many();

	} else {
		// All Messages except PUSH
		$messages = Message::where('chat', $chat->id)
			->where_gte('id', (int)$message)
			->where_gte('status', 0)
			->where_not_equal('status', 4)
			->find_many();
	}

	if ($messages !== false) {
		$joined = array();

		foreach ($messages as $key => $value) {
			// New Message
			if ((unixtimestamp($value->datetime) - unixtimestamp($datetime)) > 0) {
				// Operator Joined Chat Message
				if (($operator !== false && $operator->username != $value->username) && $value->status > 0) {

					$user = Operator::where('username', $value->username)->find_one();

					if ($user !== false && !in_array($user->id, $joined)) {
						if (!empty($user->firstname) && !empty($user->lastname)) {
							$content = sprintf('%s %s %s', $user->firstname, $user->lastname, $_LOCALE['joinedconversation']);
						} else {
							$content = sprintf('%s %s', $user->firstname, $_LOCALE['joinedconversation']);
						}
						$joined[] = $user->id;

						$messagesjson[] = array('id' => '', 'datetime' => unixtimestamp($value->datetime), 'username' => '', 'content' => $content, 'align' => 2, 'status' => 1);
					}
				}
			}
		}
	}
}

/*
//Check for Operator Connection Issue
$operator = false;
$operator = Operator::where_id_is($active)
	->where_gt('refresh', date('Y-m-d H:i:s', time() - $_SETTINGS['CONNECTIONTIMEOUT'] * 2))
	->find_one();
*/

if ($_SETTINGS['CHATUSERNAME'] == false) { $username = ''; }

if (!isset($_SETTINGS['JQUERY'])) {
	$_SETTINGS['JQUERY'] = 'jQuery';
}

$_SETTINGS['JQUERYLEGACY'] = 'jQuery';

if (!isset($_SETTINGS['JQUERYLEGACY']) && $_SETTINGS['JQUERY'] != 'jQuery') {
	$_SETTINGS['JQUERYLEGACY'] = 'jQuery';
}

if ($chat !== false && $chat->status == 1 && $message == 0) {

	if ($operator !== false) {
		$name = $operator->firstname . ' ' . $operator->lastname;
		$depmnt = explode(';', $operator->department);
		if (count($department) > 0) {
			$depmnt = $depmnt[0];
		}

		$avatar = '';
		if (!empty($operator->email)) {
			$avatar = md5($operator->email);
		}
		$javascript = "if (typeof " . $_SETTINGS['JQUERY'] . " !== 'undefined' && typeof " . $_SETTINGS['JQUERY'] . ".jQuery !== 'undefined') { " . $_SETTINGS['JQUERY'] . ".jQuery(document).trigger('LiveHelp.Connected', [{$operator->id}, '" . addslashes($name) . "', '" . addslashes($depmnt) . "', '" . addslashes($avatar) . "']); }";
		if (isset($_SETTINGS['JQUERYLEGACY'])) {
			$javascript .= "if (typeof " . $_SETTINGS['JQUERYLEGACY'] . " !== 'undefined') { " . $_SETTINGS['JQUERYLEGACY'] . "(document).trigger('LiveHelp.Connected', [{$operator->id}, '" . addslashes($name) . "', '" . addslashes($depmnt) . "', '" . addslashes($avatar) . "']); }";
		}
		$messagesjson[] = array('id' => -4, 'username' => '', 'content' => $javascript, 'align' => 2, 'status' => 5);

		if (!empty($name)) {
			// Now Chatting Message
			$content = $_LOCALE['nowchattingwith'] . ' ' . $name;
			if ($_SETTINGS['DEPARTMENTS'] == true && !empty($department)) {
				$content .= ' (' . $department . ')';
			}
			$content = $content;
			$messagesjson[] = array('id' => -2, 'username' => '', 'content' => $content, 'align' => 2, 'status' => 1);
		}

	}

	// Google Analytics Custom Variable
	// Replace with analytics.js
	/*
	if (!empty($_SETTINGS['ANALYTICS'])) {
		$google = 'if (typeof(_gaq) === \'object\') { _gaq.push([\'_setCustomVar\', 1, \'Live Chat Operator\', \'' . $operator->firstname . ' ' . $operator->lastname . '\', 2]); _gaq.push([\'_trackEvent\', \'Live Chat\', \'Chat Accepted\']); }';
		$messagesjson[] = array('id' => -3, 'username' => '', 'content' => $google, 'align' => 2, 'status' => 5);
	}
	*/

	if ($_SETTINGS['INTRODUCTION'] != '') {
		$welcome = preg_replace("/(\r\n|\r|\n)/", '<br />', $_SETTINGS['INTRODUCTION']);
		$welcome = preg_replace("/({Username})/", $operator->firstname, $welcome);

		$messagesjson[] = array('id' => -1, 'username' => $operator->firstname, 'content' => $welcome, 'align' => 1, 'status' => 1);
	}
}
elseif ($chat !== false && $chat->status == -3) {
	// Blocked Chat
	$content = "if (typeof " . $_SETTINGS['JQUERY'] . " !== 'undefined' && typeof " . $_SETTINGS['JQUERY'] . ".jQuery !== 'undefined') { " . $_SETTINGS['JQUERY'] . '.jQuery(document).trigger("LiveHelp.BlockChat"); }';
	if (isset($_SETTINGS['JQUERYLEGACY'])) {
		$content .= "if (typeof " . $_SETTINGS['JQUERYLEGACY'] . " !== 'undefined') { " . $_SETTINGS['JQUERYLEGACY'] . '(document).trigger("LiveHelp.BlockChat"); }';
	}
	$messagesjson[] = array('id' => '', 'username' => '', 'content' => $content, 'align' => 2, 'status' => 5);
}
elseif ($chat !== false && $chat->status == -1) {
	// Closed Chat
	$content = 'if (typeof ' . $_SETTINGS['JQUERY'] . ' !== "undefined" && typeof ' . $_SETTINGS['JQUERY'] . '.jQuery !== "undefined" && ' . $_SETTINGS['JQUERY'] . '.jQuery(\'#LiveHelpMessageTextarea\').length > 0) { ' . $_SETTINGS['JQUERY'] . '.jQuery(document).trigger("LiveHelp.Disconnect"); }';
	if (isset($_SETTINGS['JQUERYLEGACY'])) {
		$content .= 'if (typeof ' . $_SETTINGS['JQUERYLEGACY'] . ' !== "undefined" && ' . $_SETTINGS['JQUERYLEGACY'] . '(\'#LiveHelpMessageTextarea\').length > 0) { ' . $_SETTINGS['JQUERYLEGACY'] . '(document).trigger("LiveHelp.Disconnect"); }';
	}
	$messagesjson[] = array('id' => '', 'username' => '', 'content' => $content, 'align' => 2, 'status' => 5);
}

// Typing Status
if ($chat !== false) {
	$typing = Typing::where('chat', $chat->id)->find_many();

	$operators = array();
	foreach ($typing as $key => $type) {
		if ($type !== false) {
			switch($type->status) {
				case 0: // None
				case 1: // Guest Only
					$operators = array_diff($operators, array($type->user));
					break;
				case 2: // Operator Only
				case 3: // Both
					$operators[] = $type->user;
					break;
			}
		}
	}

	$typing = 0;
	if (count($operators) > 0) {
		$typing = 1;
	}
}

$names = array();
if ($messages !== false) {
	foreach ($messages as $key => $message) {

		$username = $message->username;
		$content = $message->message;

		if ($_SETTINGS['CHATUSERNAME'] == false) { $username = ''; }
		$content = str_replace('<', '&lt;', $content);
		$content = str_replace('>', '&gt;', $content);
		$content = preg_replace("/(\r\n|\r|\n)/", '<br />', $content);

		if ($message->status > 0) {
			if (!array_key_exists($username, $names)) {
				$operator = Operator::where('username', $username)->find_one();

				if ($operator !== false) {
					$username = $operator->firstname;
					$names[$username] = $operator->firstname;
				}
			} else {
				$username = $names[$username];
			}
		}

		// Output Message
		if ($message->status >= 0) {
			$messagesjson[] = array('id' => (int)$message->id, 'datetime' => unixtimestamp($message->datetime), 'username' => $username, 'content' => $content, 'align' => (int)$message->align, 'status' => (int)$message->status);
		}
	}
}

// Update Refresh
if ($chat !== false) {
	$chat->refresh = date('Y-m-d H:i:s', time());
	$chat->save();
}

// JSON Output
$json = array();

// Typing Status
if ($typing) { $json['typing'] = $typing; }

// Messages
if (count($messagesjson) > 0) {
	$json['messages'] = $messagesjson;
}

// Output JSON
$json = json_encode($json);
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

?>
