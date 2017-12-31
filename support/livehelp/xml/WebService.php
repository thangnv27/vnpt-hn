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
require_once('../include/database.php');
require_once('../include/config.php');
require_once('../include/class.models.php');
require_once('../include/version.php');
require_once('../include/functions.php');
require_once('../include/class.passwordhash.php');
require_once('../include/class.aes.php');
require_once('../include/class.push.php');
require_once('../include/class.upgrade.php');
require_once('../include/class.email.php');

if (!ini_get('safe_mode')) {
	set_time_limit(0);
}
ignore_user_abort(true);

// Licensing Code Placeholder

// Cross-Origin Resource Sharing
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	if (isset($_SERVER['HTTP_ORIGIN'])) {
		header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
		header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
		header('Access-Control-Allow-Headers: X-Requested-With, Authorization');
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

if (function_exists('apache_request_headers')) {
	$headers = apache_request_headers();
	if (isset($headers['Authorization'])) {
		$_SERVER['HTTP_AUTHORIZATION'] = $headers['Authorization'];
	}
}

$_OPERATOR = array();

// Endpoint Hook
$endpoint = $_SERVER['QUERY_STRING'];
$overrideendpoint = $hooks->run('APIEndpoint');
$endpoint = (!empty($overrideendpoint) && is_string($overrideendpoint)) ? $overrideendpoint : $endpoint;

$authorised = false;
switch ($endpoint) {
	case 'Version':
		Version();
		break;
	case 'ResetPassword':
		ResetPassword();
		break;
	default:
		$authorised = IsAuthorized();
		break;
}

if ($authorised == true) {

	// Automatic Database Upgrade
	$upgrade = new DatabaseUpgrade();
	$upgrade->upgrade();

	if (isset($_SERVER['HTTP_ACCEPT'])) {
		$accept = strtolower(str_replace(' ', '', $_SERVER['HTTP_ACCEPT']));
		if ($accept == 'application/json') {
			$_REQUEST['Format'] = 'json';
		}
	}

	if (!isset($_REQUEST['Format'])){ $_REQUEST['Format'] = 'xml'; }
	$XML = ($_REQUEST['Format'] == 'xml');

	$endpoint = $_SERVER['QUERY_STRING'];
	$overrideendpoint = $hooks->run('APIEndpoint');
	$endpoint = (!empty($overrideendpoint) && is_string($overrideendpoint)) ? $overrideendpoint : $endpoint;

	switch ($endpoint) {
		case 'Login':
			Login();
			break;
		case 'Users':
			Users();
			break;
		case 'Visitors':
			Visitors();
			break;
		case 'Visitor':
			Visitor();
			break;
		case 'Version':
			Version();
			break;
		case 'Settings':
			Settings();
			break;
		case 'InitaliseChat':
			InitaliseChat();
			break;
		case 'Chat':
			Chat();
			break;
		case 'Chats':
			Chats();
			break;
		case 'Operators':
			Operators();
			break;
		case 'Statistics':
			Statistics();
			break;
		case 'History':
			History();
			break;
		case 'Send':
			Send();
			break;
		case 'EmailChat':
			EmailChat();
			break;
		case 'Calls':
			Calls();
			break;
		case 'Responses':
			Responses();
			break;
		case 'Activity':
			Activity();
			break;
		case 'Departments':
			Departments();
			break;
		default:
			if (strpos(php_sapi_name(), 'cgi') === false) { header('HTTP/1.0 403 Forbidden'); } else { header('Status: 403 Forbidden'); }
			break;
	}

} else {
	header('HTTP/1.1 403 Access Forbidden');
	header('Content-Type: text/plain');
}

exit();


function IsAuthorized() {

	global $_OPERATOR;
	global $_PLUGINS;
	global $_SETTINGS;
	global $XML;
	global $hooks;

	$session = false;
	$version = false;

	if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
		$auth = $_SERVER['HTTP_AUTHORIZATION'];
		if (!empty($auth) && substr($auth, 0, 5) === 'Token') {
			if (preg_match('/Token signature="([^"]+)", version="(\d)"/', $auth, $regs)) {
				$session = (isset($regs[1])) ? $regs[1] : false;
				$version = (isset($regs[2])) ? (int)$regs[2] : false;
			}
		}
	}

	if ($session == false && isset($_REQUEST['Session'])) {
		$session = $_REQUEST['Session'];
	}

	if ($version == false && isset($_REQUEST['Version'])) {
		$version = $_REQUEST['Version'];
	}

	define('AUTHVERSION', $version);

	$username = false;
	$password = false;
	$email = false;

	if (isset($_REQUEST['Username']) && isset($_REQUEST['Password']) && !empty($_REQUEST['Username']) && !empty($_REQUEST['Password'])) {
		$session = false;
		$username = $_REQUEST['Username'];
		$password = $_REQUEST['Password'];
	}

	// Encrypted Operator Session
	if (!empty($session)) {

		$hooks->run('AuthorizationKey', array('session' => $session));

		$data = base64_decode($session);
		$aes = new AES256($_SETTINGS['AUTHKEY']); // TODO Setup Seperate Operator Key

		$size = strlen($aes->iv);
		$iv = substr($data, 0, $size);
		$verify = substr($data, $size, 40);
		$ciphertext = substr($data, 40 + $size);

		$decrypted = $aes->decrypt($ciphertext, $iv);

		if (sha1($decrypted) == $verify) {
			$data = json_decode($decrypted, true);

			$id = (int)$data['id'];
			$username = (isset($data['username'])) ? $data['username'] : false;
			$password = (isset($data['password'])) ? $data['password'] : false;
			$email = (isset($data['email'])) ? $data['email'] : false;
		}
	}

	// Pre Auth Hook
	$hooks->run('PreAuthorization', array('username' => $username, 'email' => $email));

	// Database Constants
	if (!defined('DB_HOST') || !defined('DB_NAME') || !defined('DB_USER') || !defined('DB_PASS')) {
		return false;
	}

	if (!empty($version) && $version > 3.9) {

		if ($email !== false) {
			$operator = Operator::where('email', $email)->find_one();
			if ($operator !== false) {

				$_OPERATOR['ID'] = $operator->id;
				$_OPERATOR['DATETIME'] = $operator->datetime;
				$_OPERATOR['PRIVILEGE'] = $operator->privilege;
				$_OPERATOR['STATUS'] = $operator->status;
				$_OPERATOR['USERNAME'] = $operator->username;
				$_OPERATOR['PASSWORD'] = $operator->password;
				$_OPERATOR['NAME'] = (!empty($operator->lastname)) ? $operator->firstname . ' ' . $operator->lastname : $operator->firstname;
				$_OPERATOR['DEPARTMENT'] = $operator->department;
				return true;

			} else {
				return false;
			}
		} else {
			$operator = Operator::where('username', $username)->find_one();
			if ($operator === false) {
				$operator = Operator::where('email', $username)->find_one();
			}
		}

	} else {

		$operator = Operator::where('disabled', 0)
			->where('username', $username)
			->find_one();
	}

	if ($operator !== false) {

		// v4.0 Password
		$hasher = new PasswordHash(8, true);
		$check = $hasher->CheckPassword($password, $operator->password);

		// Legacy Hashes
		$legacy = '';
		if (substr($operator->password, 0, 3) != '$P$') {
			switch (strlen($operator->password)) {
				case 40: // SHA1
					$legacy = sha1($password);
					break;
				case 128: // SHA512
					if (function_exists('hash')) {
						if (in_array('sha512', hash_algos())) {
							$legacy = hash('sha512', $password);
						} else if (in_array('sha1', hash_algos())) {
							$legacy = hash('sha1', $password);
						}
					} else if (function_exists('mhash') && mhash_get_hash_name(MHASH_SHA512) != false) {
						$legacy = bin2hex(mhash(MHASH_SHA512, $password));
					}
					break;
				default: // MD5
					$legacy = md5($password);
					break;
			}
		}

		// Process Legacy Password
		$password = $hooks->run('LoginCustomHash', $password);

		if ((!empty($version) && $version >= 4.0 && ($check || $operator->password == $legacy)) || $operator->password == $password) {

			// Upgrade Password Authentication
			if (!empty($version) && $version >= 4.0) {
				if (substr($operator->password, 0, 3) != '$P$') {
					$hash = $hasher->HashPassword($_REQUEST['Password']);
					if (strlen($hash) >= 20) {
						// Update Password Hash
						$operator->password = $hash;
						$operator->save();
					}
				}
			}

			$_OPERATOR['DISABLED'] = $operator->disabled;
			if ($_OPERATOR['DISABLED']) {
				header('X-Disabled: *');
				return false;
			} else {

				$_OPERATOR['ID'] = $operator->id;
				$_OPERATOR['DATETIME'] = $operator->datetime;
				$_OPERATOR['PRIVILEGE'] = $operator->privilege;
				$_OPERATOR['STATUS'] = $operator->status;
				$_OPERATOR['USERNAME'] = $operator->username;
				$_OPERATOR['PASSWORD'] = $operator->password;
				$_OPERATOR['NAME'] = (!empty($operator->lastname)) ? $operator->firstname . ' ' . $operator->lastname : $operator->firstname;
				$_OPERATOR['DEPARTMENT'] = $operator->department;

				$_OPERATOR = $hooks->run('LoginCompleted', $_OPERATOR);
				return true;

			}

		} else {

			$_OPERATOR['ID'] = $operator->id;
			$_OPERATOR['USERNAME'] = $operator->username;
			$_OPERATOR['DATETIME'] = $operator->datetime;
			$_OPERATOR['PRIVILEGE'] = $operator->privilege;
			$_OPERATOR['STATUS'] = $operator->status;

			$_OPERATOR = $hooks->run('LoginFailed', array('Operator' => $_OPERATOR, 'Password' => $password));

			if (isset($_OPERATOR['PASSWORD'])) {
				return true;
			}

			$_OPERATOR['DISABLED'] = $operator->disabled;
			if ($_OPERATOR['DISABLED']) {
				header('X-Disabled: *');
				return false;
			}
		}
	} else {

		// Account Missing
		$_OPERATOR = $hooks->run('LoginAccountMissing', array('Username' => $username, 'Password' => $password));
		if ($_OPERATOR != false && count($_OPERATOR) > 2) {
			return true;
		} else {
			return false;
		}

	}

	//  Supports v4.0 Authentication
	$version = '4.0';
	header('X-Authentication: ' . $version);

	return false;
}

function Login() {

	global $_OPERATOR;
	global $_SETTINGS;
	global $XML;
	global $hooks;
	global $authorised;

	if (!isset($_SETTINGS['OPERATORVERSION'])){ $_SETTINGS['OPERATORVERSION'] = '3.28'; }
	if (!isset($_REQUEST['Action'])){ $_REQUEST['Action'] = ''; }
	if (!isset($_REQUEST['Device'])){ $_REQUEST['Device'] = ''; }
	if (!isset($_REQUEST['Data'])){ $_REQUEST['Data'] = ''; }

	$session = false;
	$version = false;

	if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
		$auth = $_SERVER['HTTP_AUTHORIZATION'];
		if (!empty($auth) && substr($auth, 0, 5) === 'Token') {
			if (preg_match('/Token signature="([^"]+)", version="(\d)"/', $auth, $regs)) {
				$session = (isset($regs[1])) ? $regs[1] : false;
				$version = (isset($regs[2])) ? (int)$regs[2] : false;
			}
		}
	}

	if ($session == false && isset($_REQUEST['Session'])) {
		$session = $_REQUEST['Session'];
	}

	if ($version == false && isset($_REQUEST['Version'])) {
		$version = $_REQUEST['Version'];
	}

	$username = false;
	$password = false;
	$email = false;
	$otp = false;

	// Encrypted Operator Session
	if (!empty($session)) {
		$data = base64_decode($session);
		$aes = new AES256($_SETTINGS['AUTHKEY']); // TODO Setup Seperate Operator Key

		$size = strlen($aes->iv);
		$iv = substr($data, 0, $size);
		$verify = substr($data, $size, 40);
		$ciphertext = substr($data, 40 + $size);

		$decrypted = $aes->decrypt($ciphertext, $iv);

		if (sha1($decrypted) == $verify) {
			$data = json_decode($decrypted, true);

			$id = (int)$data['id'];
			$username = (isset($data['username'])) ? $data['username'] : false;
			$password = (isset($data['password'])) ? $data['password'] : false;
			$email = (isset($data['email'])) ? $data['email'] : false;
			$otp = (isset($data['otp'])) ? $data['otp'] : false;
		}
	}

	if (isset($_REQUEST['Username']) && isset($_REQUEST['Password']) && !empty($_REQUEST['Username']) && !empty($_REQUEST['Password'])) {
		$username = $_REQUEST['Username'];
		$password = $_REQUEST['Password'];
	}

	switch ($_REQUEST['Action']) {
		case 'Offline':
			$status = 0;
			break;
		case 'Hidden':
			$status = 0;
			break;
		case 'Online':
			$status = 1;
			break;
		case 'BRB':
			$status = 2;
			break;
		case 'Away':
			$status = 3;
			break;
		default:
			$status = -1;
			break;
	}

	// Update Operator Session
	$operator = Operator::where_id_is($_OPERATOR['ID'])->find_one();

	$operator->datetime = date('Y-m-d H:i:s', time());
	$operator->refresh = date('Y-m-d H:i:s', time());

	if ($status != -1) {
		$operator->status = $status;
	}

	// PUSH Notifications
	if ((float)$_SETTINGS['SERVERVERSION'] >= 4.1 && isset($_REQUEST['Unique']) && isset($_REQUEST['Model']) && isset($_REQUEST['OS'])) {

		$operator->save();

		// Unique Device ID
		$unique = sha1($_REQUEST['Unique']);

		// Update Device Token
		$device = Device::where('user', $_OPERATOR['ID'])
			->where('unique', $unique)
			->find_one();

		$exists = Device::where('user', $_OPERATOR['ID'])
			->where('token', $_REQUEST['Device'])
			->find_one();

		if ($device !== false) {

			$device->token = $_REQUEST['Device'];
			$device->device = $_REQUEST['Model'];
			$device->save();
		} else if ($exists !== false) {

			$exists->token = $_REQUEST['Device'];
			$exists->device = $_REQUEST['Model'];
			$exists->save();
		} else {

			$device = Device::create();
			$device->user = $_OPERATOR['ID'];
			$device->datetime = date('Y-m-d H:i:s', time());
			$device->unique = $unique;
			$device->device = $_REQUEST['Model'];
			$device->os = $_REQUEST['OS'];
			$device->token = $_REQUEST['Device'];
			$device->save();
		}

	} else {
		// Update Device Token
		if (!empty($_REQUEST['Device'])) {
			$operator->device = $_REQUEST['Device'];
		}

		$operator->save();
	}

	// Update Operator Status
	if ($status != -1) {
		$_OPERATOR['STATUS'] = $status;
	}

	// Authentication
	$authentication = '4.0';
	$token = false;

	// Generate Session
	$salt = '';
	$chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`~!@#$%^&*()-_=+[{]}\|;:\'",.>/?';
	for ($index = 1; $index <= 64; $index++) {
		$number = rand(1, strlen($chars));
		$salt .= substr($chars, $number - 1, 1);
	}
	$unique = uniqid($salt, true);
	$hash = sha1($unique);
	$ipaddress = ip_address();

	// Login Session Hook
	$session = $hooks->run('LoginSession', array('id' => $_OPERATOR['ID'], 'data' => $_REQUEST['Data']));

	// Disable Two Factor - TOTP Hook Missing
	if (!isset($session['Token'])) {
		$session['Token'] = true;
		$session['OTP'] = false;
	}

	if ($authorised !== false && $session['Token'] == true) {
		// Session Data
		if ($username === false && $email !== false) {
			$username = $email;
		}
		$data = array('id' => (int)$_OPERATOR['ID'], 'username' => $username, 'password' => $password, 'otp' => $session['OTP']);

		// Authorisation Data Hook
		$data = $hooks->run('AuthorizationData', $data);

		// JSON
		$data = json_encode($data);

		// Encrypt
		$verify = sha1($data);
		$aes = new AES256($_SETTINGS['AUTHKEY']);  // TODO Setup Seperate Operator Key
		$token = base64_encode($aes->iv . $verify . $aes->encrypt($data));

		$hooks->run('AuthorizationKey', array('token' => $token, 'username' => $username));

		$session = array('Token' => $token, 'OTP' => $session['OTP']);
	} else {
		// Check Existing Session
		if ($otp !== false) {
			// Session Data
			if ($username === false && $email !== false) {
				$username = $email;
			}
			$data = array('id' => (int)$_OPERATOR['ID'], 'username' => $username, 'password' => $password, 'otp' => true);

			// Authorisation Data Hook
			$data = $hooks->run('AuthorizationData', $data);

			// JSON
			$data = json_encode($data);

			// Encrypt
			$verify = sha1($data);
			$aes = new AES256($_SETTINGS['AUTHKEY']);  // TODO Setup Seperate Operator Key
			$token = base64_encode($aes->iv . $verify . $aes->encrypt($data));

			$hooks->run('AuthorizationKey', array('token' => $token, 'username' => $username));

			$session['Token'] = $token;
			$session['OTP'] = true;
		} else {
			$session['Token'] = false;
		}
	}

	if ((float)$_SETTINGS['SERVERVERSION'] >= 3.90) {
		// Insert Login Activity
		$activity = Activity::create();
		$activity->user = $_OPERATOR['ID'];
		$activity->username = $_OPERATOR['NAME'];
		$activity->datetime = date('Y-m-d H:i:s', time());
		$activity->activity = 'signed into Live Help';
		$activity->type = 1;
		$activity->status = 1;
		$activity->save();
	}

	if ($XML) {
		header('Content-type: text/xml; charset=utf-8');
		echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<Login xmlns="urn:LiveHelp" ID="<?php echo($_OPERATOR['ID']); ?>" Session="<?php echo($session['Token']); ?>" Version="<?php echo($_SETTINGS['OPERATORVERSION']); ?>" Database="<?php echo($version); ?>" Authentication="<?php echo($authentication) ?>" Name="<?php echo(xmlattribinvalidchars($_OPERATOR['NAME'])); ?>" Access="<?php echo($_OPERATOR['PRIVILEGE']); ?>"/>
<?php
	} else {
		header('Content-type: application/json; charset=utf-8');
		$login = array(
			'ID' => (int)$_OPERATOR['ID'],
			'Session' => $session['Token'],
			'Version' => $_SETTINGS['OPERATORVERSION'],
			'Database' => $version,
			'Authentication' => $authentication,
			'Name' => $_OPERATOR['NAME'],
			'Email' => $operator->email,
			'Access' => $_OPERATOR['PRIVILEGE'],
			'Status' => (int)$_OPERATOR['STATUS']
		);

		if (isset($session['OTP'])) {
			$login['OTP'] = $session['OTP'];
		}

		$result = $hooks->run('LoginComplete', array('login' => $login, 'json' => true));
		if (is_array($result) && isset($result['login'])) {
			$login = $result['login'];
		}

		$json = array('Login' => $login);
		$json = json_encode($json);
		echo($json);
		exit();
	}

}

function AcceptChat($id) {
	global $_OPERATOR;
	global $_SETTINGS;
	global $hooks;

	if (is_numeric($id)) {
		$chat = Chat::where_id_is((int)$id)->find_one();

		if ($chat !== false) {
			// Already Assigned
			if ($chat->status == 0 || $chat->status == -2) {

				$name = ucwords(strtolower($chat->name));
				$datetime = $chat->datetime;

				// Accept Chat
				$chat->status = 1;
				$chat->save();

				// Datetime
				$datetime = date('Y-m-d H:i:s', time());

				// Add Session
				$session = ChatSession::create();
				$session->chat = $chat->id;
				$session->user = $_OPERATOR['ID'];
				$session->requested = $chat->datetime;
				$session->accepted = $datetime;
				$session->save();

				if ((float)$_SETTINGS['SERVERVERSION'] >= 3.90) {
					// Insert Accepted Chat Activity
					$activity = Activity::create();
					$activity->user = $_OPERATOR['ID'];
					$activity->chat = $_REQUEST['ID'];
					$activity->username = $name;
					$activity->datetime = $datetime;
					$activity->activity = sprintf('accepted chat with %s', $name);
					$activity->duration = time() - strtotime($chat->datetime);
					$activity->type = 7;
					$activity->status = 1;
					$activity->save();
				}

				// Accept Chat Device Notification
				if ($chat !== false) {
					$hooks->run('AcceptChat', array('id' => (int)$id, 'chat' => $chat));
				}

			}
		}
	} else {
		// Accept Chat Device Notification
		$hooks->run('AcceptChat', array('id' => (int)$id, 'chat' => false));
	}
}

function Users() {

	global $_OPERATOR;
	global $_SETTINGS;
	global $_PLUGINS;
	global $XML;
	global $hooks;

	if (!isset($_REQUEST['Action'])){ $_REQUEST['Action'] = ''; }
	if (!isset($_REQUEST['ID'])){ $_REQUEST['ID'] = ''; }
	if (!isset($_REQUEST['Transfer'])){ $_REQUEST['Transfer'] = ''; }

	$date = date('Y-m-d H:i:s', time());

	// Device PUSH Notifications
	if ((float)$_SETTINGS['SERVERVERSION'] >= 4.1) {

		if (isset($_REQUEST['Device']) && isset($_REQUEST['Unique']) && isset($_REQUEST['Model']) && isset($_REQUEST['OS'])) {
			$unique = sha1($_REQUEST['Unique']);

			$device = Device::where('user', (int)$_OPERATOR['ID'])
				->where('unique', $unique)
				->find_one();

			$exists = Device::where('user', $_OPERATOR['ID'])
				->where('token', $_REQUEST['Device'])
				->find_one();

			if ($device !== false || $exists !== false) {

				$device->token = $_REQUEST['Device'];
				$device->device = $_REQUEST['Model'];
				$device->save();

			} else if ($exists !== false) {

				$exists->token = $_REQUEST['Device'];
				$exists->device = $_REQUEST['Model'];
				$exists->save();
			} else {

				$device = Device::create();
				$device->user = $_OPERATOR['ID'];
				$device->datetime = date('Y-m-d H:i:s', time());
				$device->unique = $unique;
				$device->device = $_REQUEST['Model'];
				$device->os = $_REQUEST['OS'];
				$device->token = $_REQUEST['Device'];
				$device->save();

			}
		} else {

			$operator = Operator::where_id_is((int)$_OPERATOR['ID'])->find_one();
			if (isset($_REQUEST['Device']) && (float)$_SETTINGS['SERVERVERSION'] < 5) {

				// Update Device Token
				$operator->refresh = $date;
				$operator->device = $_REQUEST['Device'];
				$operator->save();

			} else {

				$operator->refresh = $date;
				$operator->save();
			}
		}

	} else {

		$operator = Operator::where_id_is((int)$_OPERATOR['ID'])->find_one();
		if (isset($_REQUEST['Device'])) {

			// Update Device Token
			$operator->refresh = $date;
			$operator->device = $_REQUEST['Device'];
			$operator->save();

		} else {

			$operator->refresh = $date;
			$operator->save();
		}
	}

	// Process Actions
	if ($_REQUEST['Action'] == 'Accept' && $_REQUEST['ID'] != '0') {
		$id = $_REQUEST['ID'];
		AcceptChat($id);
	}
	elseif ($_REQUEST['Action'] == 'Close' && $_REQUEST['ID'] != '0') {

		// Verify Closed Chat
		if (is_numeric($_REQUEST['ID'])) {
			$chat = Chat::where_id_is((int)$_REQUEST['ID'])->find_one();

			if ($chat !== false) {
				// Determine EOL
				$server = strtoupper(substr(PHP_OS, 0, 3));
				if ($server == 'WIN') {
					$eol = "\r\n";
				} elseif ($server == 'MAC') {
					$eol = "\r";
				} else {
					$eol = "\n";
				}

				if ($chat->status == 1 || $chat->status == 0) {
					// Close Chat
					$chat->status = -1;
					$chat->save();

					// Save Session End Datetime
					$session = ChatSession::where('chat', $chat->id)
						->where('end', '0000-00-00 00:00:00')
						->order_by_desc('accepted')
						->find_one();

					if ($session !== false) {
						$session->end = date('Y-m-d H:i:s', time());
						$session->save();
					}

					// Delete Typing
					$typing = Typing::where('chat', $chat->id)->find_many();

					if ($typing !== false) {
						foreach ($typing as $key => $type) {
							$type->delete();
						}
					}

					$hooks->run('CloseChat', array($chat->id, $chat->name));
				}

				// Send Chat Transcript
				if (isset($_SETTINGS['AUTOEMAILTRANSCRIPT']) && $_SETTINGS['AUTOEMAILTRANSCRIPT'] != '') {

					// Language
					$language = file_get_contents('../locale/en/admin.json');
					if (file_exists('../locale/' . LANGUAGE . '/admin.json')) {
						$language = file_get_contents('../locale/' . LANGUAGE . '/admin.json');
					}
					$_LOCALE = json_decode($language, true);

					// Chat Messages
					$messages = Message::where('chat', (int)$_REQUEST['ID'])
						->where_lte('status', 3)
						->find_many();

					$htmlmessages = ''; $textmessages = '';
					foreach ($messages as $key => $message) {
						// Operator
						if ($message->status) {
							$htmlmessages .= '<div style="color:#666666">' . $message->username . ' ' . $_LOCALE['says'] . ':</div><div style="margin-left:15px; color:#666666;">' . $message->message . '</div>';
							$textmessages .= $message->username . ' ' . $_LOCALE['says'] . ':' . $eol . '	' . $message->message . $eol;
						}
						// Guest
						if (!$message->status) {
							$htmlmessages .= '<div>' . $message->username . ' ' . $_LOCALE['says'] . ':</div><div style="margin-left: 15px;">' . $message->message . '</div>';
							$textmessages .= $message->username . ' ' . $_LOCALE['says'] . ':' . $eol . '	' . $message->message . $eol;
						}
					}

					$htmlmessages = preg_replace("/(\r\n|\r|\n)/", '<br/>', $htmlmessages);

					$html = <<<END
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<style type="text/css">
<!--

div, p {
	font-family: Calibri, Verdana, Arial, Helvetica, sans-serif;
	font-size: 14px;
	color: #000000;
}

//-->
</style>
</head>

<body>
<p><img src="{$_SETTINGS['CHATTRANSCRIPTHEADERIMAGE']}" alt="Chat Transcript" /></p>
<p><strong>Chat Transcript:</strong></p>
<p>$htmlmessages</p>
<p><img src="{$_SETTINGS['CHATTRANSCRIPTFOOTERIMAGE']}" alt="{$_SETTINGS['NAME']}" /></p>
</body>
</html>
END;
					if ($_SETTINGS['AUTOEMAILTRANSCRIPT'] != '') {

						$language = file_get_contents('../locale/en/admin.json');
						if (file_exists('../locale/' . LANGUAGE . '/admin.json')) {
							$language = file_get_contents('../locale/' . LANGUAGE . '/admin.json');
						}
						$_LOCALE = json_decode($language, true);

						$subject = $_SETTINGS['NAME'] . ' ' . $_LOCALE['chattranscript'] . ' (' . $_LOCALE['autogenerated'] . ')';
						$result = Email::send($_SETTINGS['AUTOEMAILTRANSCRIPT'], $_SETTINGS['EMAIL'], $_SETTINGS['NAME'], $subject, $html, EmailType::HTML);
					}
				}
			}
		} else {
			$hooks->run('CloseChat', array($_REQUEST['ID'], false));
		}

	}
	elseif ($_REQUEST['Action'] == 'Transfer' && $_REQUEST['ID'] != '0' && $_REQUEST['Transfer'] != '0') {

		// Transfer Chat
		$chat = Chat::where_id_is((int)$_REQUEST['ID'])
			->find_one();

		$chat->datetime = date('Y-m-d H:i:s', time());
		$chat->status = -2;
		$chat->transfer = $_REQUEST['Transfer'];
		$chat->save();

	}
	elseif ($_REQUEST['Action'] == 'Block' && $_REQUEST['ID'] != '0') {

		// Block Chat
		$chat = Chat::where_id_is((int)$_REQUEST['ID'])
			->find_one();

		$chat->datetime = date('Y-m-d H:i:s', time());
		$chat->status = -3;
		$chat->save();

	}
	elseif ($_REQUEST['Action'] == 'Unblock' && $_REQUEST['ID'] != '0') {

		// Unblock Chat
		$chat = Chat::where_id_is((int)$_REQUEST['ID'])
			->find_one();

		$chat->datetime = date('Y-m-d H:i:s', time());
		$chat->status = -1;
		$chat->save();

	}
	elseif ($_REQUEST['Action'] == 'Hidden' || $_REQUEST['Action'] == 'Offline' || $_REQUEST['Action'] == 'Online' || $_REQUEST['Action'] == 'BRB' || $_REQUEST['Action'] == 'Away' || $_REQUEST['Action'] == 'SignOut') {

		$id = (int)$_OPERATOR['ID'];
		if (!empty($_REQUEST['ID'])) {
			$id = (int)$_REQUEST['ID'];
		}

		// Operator
		$operator = Operator::where_id_is($id)->find_one();

		$status = 0;
		$action = $_REQUEST['Action'];
		switch ($action) {
			case 'Hidden':
			case 'Offline':
			case 'SignOut':
				$status = 0;
				break;
			case 'Online':
				$status = 1;
				break;
			case 'BRB':
				$status = 2;
				break;
			case 'Away':
				$status = 3;
				break;
		}

		// Update Status Mode
		$operator->refresh = date('Y-m-d H:i:s', time());
		$operator->status = $status;
		$operator->save();

		$hooks->run('OperatorUpdatedStatusMode', array('id' => $operator->id, 'status' => $action));

		// Sign Out - Remove Device Token
		if ($_REQUEST['Action'] == 'SignOut') {

			$unique = sha1($_REQUEST['Unique']);

			// Delete Unique Device
			$device = Device::where('user', (int)$_OPERATOR['ID'])
				->where('unique', $unique)
				->find_one();

			if ($device !== false) {
				$device->delete();
			}

			// Delete Token
			$device = Device::where('user', (int)$_OPERATOR['ID'])
				->where('token', $_REQUEST['Device'])
				->find_one();

			if ($device !== false) {
				$device->delete();
			}
		}


	}

	// Update Activity
	if ((float)$_SETTINGS['SERVERVERSION'] >= 3.90) {

		if ($_REQUEST['Action'] == 'Offline') {

			// Insert Sign Out Activity
			$activity = Activity::create();
			$activity->user = $_OPERATOR['ID'];
			$activity->username = $_OPERATOR['NAME'];
			$activity->datetime = date('Y-m-d H:i:s', time());
			$activity->activity = 'signed out of Live Help';
			$activity->type = 2;
			$activity->status = 1;
			$activity->save();

		} elseif ($_REQUEST['Action'] == 'Online' || $_REQUEST['Action'] == 'BRB' || $_REQUEST['Action'] == 'Away' || $_REQUEST['Action'] == 'Hidden') {

			switch ($_REQUEST['Action']) {
				case 'Hidden':
					$status = 'Hidden';
					$flag = 3;
					break;
				case 'BRB':
					$status = 'Be Right Back';
					$flag = 5;
					break;
				case 'Away':
					$status = 'Away';
					$flag = 6;
					break;
				default:
					$status = 'Online';
					$flag = 4;
					break;
			}

			if (!empty($_REQUEST['ID'])) {
				// Select Operator Name
				$operator = Operator::where_id_is((int)$_OPERATOR['ID'])->find_one();

				if ($operator !== false) {

					// Insert Away Status Activity
					$activity = Activity::create();
					$activity->user = $_OPERATOR['ID'];
					$activity->username = $_OPERATOR['NAME'];
					$activity->datetime = date('Y-m-d H:i:s', time());
					$activity->activity = sprintf('changed the status of %s %s to $s', $operator->firstname, $operator->lastname, $status);
					$activity->type = $flag;
					$activity->status = 1;
					$activity->save();
				}
			} else {

				// Insert Status Activity
				$activity = Activity::create();
				$activity->user = $_OPERATOR['ID'];
				$activity->username = $_OPERATOR['NAME'];
				$activity->datetime = date('Y-m-d H:i:s', time());
				$activity->activity = sprintf('changed status to %s', $status);
				$activity->type = $flag;
				$activity->status = 1;
				$activity->save();

			}
		}
	}

	// Last Call
	$lastcall = (int)Callback::max('id');

	$lastactivity = 0;
	if ((float)$_SETTINGS['SERVERVERSION'] >= 3.90) {
		$lastactivity = (int)Activity::where_not_equal('user', (int)$_OPERATOR['ID'])
			->where('status', 0)
			->max('id');
	}

	if ($XML) {
		header('Content-type: text/xml; charset=utf-8');
		echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");

		if ((float)$_SETTINGS['SERVERVERSION'] >= 3.90) {
?>
<Users xmlns="urn:LiveHelp" LastCall="<?php echo($lastcall); ?>" LastActivity="<?php echo($lastactivity); ?>">
<?php
		} else {
?>
<Users xmlns="urn:LiveHelp" LastCall="<?php echo($lastcall); ?>">
<?php
		}
	} else {
		header('Content-type: application/json; charset=utf-8');

		$staff = array();
		$online = array();
		$pending = array();
		$transferred = array();

	}

	// Online Operators
	$operators = Operator::order_by_asc('username')->find_many();

	$online = false;
	if ($operators !== false) {
		foreach ($operators as $key => $operator) {
			$status = $operator->status();
			if ($status == 1 || $status == 2 || $status == 3) {
				$online[] = $operator;
			}
		}
	}

	if ($online !== false) {
		if ($XML) {
?>
<Staff>
<?php
		}

		$staff = array();
		foreach ($online as $key => $operator) {

			$id = (int)$operator->id;
			$status = $operator->status;
			$username = $operator->username;
			$firstname = $operator->firstname;
			$department = $operator->department;
			$email = $operator->email;
			$access = $operator->privilege;
			$device = $operator->device;

			// Total Messages
			$messages = OperatorMessage::where('from', $id)
				->where('to', $_OPERATOR['ID'])
				->where_gt('datetime', date('Y-m-d H:i:s', strtotime($_OPERATOR['DATETIME'])))
				->max('id');

			if ($id == $_OPERATOR['ID']) {
				$messages = 0;
			}

			if ($XML) {
?>
<User ID="<?php echo($id); ?>" <?php if (!empty($messages)) { ?>Messages="<?php echo($messages); ?>" <?php } ?>Status="<?php echo($status); ?>"><?php echo(xmlelementinvalidchars($username)); ?></User>
<?php
			} else {

				// Staff User JSON
				if (!empty($messages)) {
					$user = array('ID' => $id, 'Name' => $username, 'Firstname' => $firstname, 'Department' => $department, 'Email' => $email, 'Access' => $access, 'Messages' => $messages, 'Status' => $status);
				} else {
					$user = array('ID' => $id, 'Name' => $username, 'Firstname' => $firstname, 'Department' => $department, 'Email' => $email, 'Access' => $access, 'Status' => $status);
				}
				$staff[] = $user;
			}
		}

		if ($XML) {
?>
</Staff>
<?php
		}

	}
	unset($online);

	// Chatting / Pending / Transferred Visitors
	$chats = Chat::where_gt('refresh', date('Y-m-d H:i:s', time() - $_SETTINGS['CONNECTIONTIMEOUT']))
		->order_by_desc('datetime')
		->find_many();

	// Chats Query Completed Hook
	$chats = $hooks->run('ChatsQueryCompleted', $chats);

	if ($chats !== false) {
		if ($XML) {
?>
<Online>
<?php
		}

		$online = array();
		foreach ($chats as $key => $chat) {

			if (defined('OVERRIDEPENDING') && $_SETTINGS['LOGINDETAILS'] == 0 && ($chat->status == 0 && $_SETTINGS['DEPARTMENTS'] == true && $chat->has_department($chat, $_OPERATOR['DEPARTMENT']) == false)) {
				continue;
			}

			if ($chat->status == 1 || (defined('OVERRIDEPENDING') && $_SETTINGS['LOGINDETAILS'] == 0 && $chat->status == 0)) {
				$id = (is_numeric($chat->id)) ? (int)$chat->id : $chat->id;
				$username = $chat->name;
				$request = $chat->request;
				$question = '';

				if (empty($request) && method_exists($chat, 'visitor')) {
					$request = $chat->visitor()->find_one();
					if ($request !== false) {
						$request = $request->visitor;
					}
				}

				$department = '';
				if (!empty($chat->department)) {
					$department = $chat->department;
				}

				$server = '';
				if (!empty($chat->server)) {
					$server = $chat->server;
				}

				$email = '';
				if (!empty($chat->email)) {
					$email = $chat->email;
				}

				$hash = '';
				if (!empty($chat->hash)) {
					$hash = $chat->hash;
				}

				$custom = '';
				$reference = '';

				// Integration
				$integration = false;
				if (!empty($request) && is_numeric($request)) {
					$integration = Custom::where('request', $request)->find_one();
				}

				if ($integration !== false) {
					$reference = $integration->reference;
					$custom = $integration->custom;
				}

				// Operator
				$account = false;
				$session = $chat->session()->order_by_desc('requested')->find_one();
				if ($session !== false) {
					$account = $session->operator()->find_one();
				}

				if ($account !== false) {
					if (!empty($account->firstname) && !empty($account->lastname)) {
						$operator = $account->firstname . ' ' . $account->lastname;
					} else if (!empty($account->firstname)) {
						$operator = $account->firstname;
					}
				} else {
					$operator = '';
				}

				$active = 0;
				if ($chat !== false && $chat->status == 1 && $account !== false) {
					$active = $account->id;
				} else if (defined('OVERRIDEPENDING') && $_SETTINGS['LOGINDETAILS'] == 0 && $chat->status == 0) {
					$active = $_OPERATOR['ID'];
				} else {
					$active = $chat->status;
				}

				if ($_OPERATOR['PRIVILEGE'] <= 1 && (($account !== false && $_OPERATOR['ID'] != $account->id) || $account === false)) {
					if ($XML) {
?>
<User ID="<?php echo($id); ?>" Active="<?php echo($active); ?>" Operator="<?php echo($operator); ?>" Visitor="<?php echo($request); ?>" Department="<?php echo(xmlattribinvalidchars($department)); ?>" Server="<?php echo(xmlattribinvalidchars($server)); ?>" Email="<?php echo(xmlattribinvalidchars($email)); ?>" Question="<?php echo(xmlattribinvalidchars($question)); ?>" Custom="<?php echo(xmlattribinvalidchars($custom)); ?>" Reference="<?php echo(xmlattribinvalidchars($reference)); ?>"><?php echo(xmlelementinvalidchars($username)); ?></User>
<?php
					} else {

						// Online User JSON
						$user = array('ID' => $id, 'Hash' => $hash, 'Name' => $username, 'Active' => $active, 'Status' => $chat->status, 'Operator' => $operator, 'Visitor' => $request, 'Department' => $department, 'Server' => $server, 'Email' => $email, 'Question' => $question);
						$online[] = $user;
					}
				}
				else if (($account !== false && $_OPERATOR['ID'] == $account->id) || $account === false) {

					// Total Messages
					$messages = Message::where('chat', $id)
						->where('status', 0)
						->count('id');

					if ($XML) {
						if (empty($request)) {
?>
<User ID="<?php echo($id); ?>" Active="<?php echo($active); ?>" <?php if (!empty($messages)) { ?>Messages="<?php echo($messages); ?>"<?php } ?> Department="<?php echo(xmlattribinvalidchars($department)); ?>" Server="<?php echo(xmlattribinvalidchars($server)); ?>" Email="<?php echo(xmlattribinvalidchars($email)); ?>" Question="<?php echo(xmlattribinvalidchars($question)); ?>" Custom="<?php echo(xmlattribinvalidchars($custom)); ?>" Reference="<?php echo(xmlattribinvalidchars($reference)); ?>"><?php echo(xmlelementinvalidchars($username)); ?></User>
<?php
						} else {
?>
<User ID="<?php echo($id); ?>" Active="<?php echo($active); ?>" Visitor="<?php echo($request); ?>"<?php if (!empty($messages)) { ?> Messages="<?php echo($messages); ?>"<?php } ?> Department="<?php echo(xmlattribinvalidchars($department)); ?>" Server="<?php echo(xmlattribinvalidchars($server)); ?>" Email="<?php echo(xmlattribinvalidchars($email)); ?>" Question="<?php echo(xmlattribinvalidchars($question)); ?>" Custom="<?php echo(xmlattribinvalidchars($custom)); ?>" Reference="<?php echo(xmlattribinvalidchars($reference)); ?>"><?php echo(xmlelementinvalidchars($username)); ?></User>
<?php
						}
					} else {

						// Online User JSON
						$user = array('ID' => $id, 'Hash' => $hash, 'Name' => $username, 'Active' => $active, 'Operator' => $operator, 'Visitor' => $request, 'Messages' => $messages, 'Department' => $department, 'Server' => $server, 'Email' => $email, 'Question' => $question);
						$online[] = $user;

					}

				}
			}
		}

		if ($XML) {
?>
</Online>
<?php
		}
	}

	if ($chats !== false) {
		if ($XML) {
?>
<Pending>
<?php
		}

		$pending = array();
		foreach ($chats as $key => $chat) {

			if ((defined('OVERRIDEPENDING') && $_SETTINGS['LOGINDETAILS'] == 0 && $chat->status == 0) || ($chat->status != 0 || ($chat->status == 0 && $_SETTINGS['DEPARTMENTS'] == true && $chat->has_department($chat, $_OPERATOR['DEPARTMENT']) == false))) {
				continue;
			}

			$id = (is_numeric($chat->id)) ? (int)$chat->id : $chat->id;
			$username = $chat->name;
			$request = $chat->request;
			$datetime = $chat->datetime . date('O');
			$question = '';

			if (empty($request) && method_exists($chat, 'visitor')) {
				$request = $chat->visitor()->find_one();
				if ($request !== false) {
					$request = $request->visitor;
				}
			}

			$department = '';
			if (!empty($chat->department)) {
				$department = $chat->department;
			}

			$server = '';
			if (!empty($chat->server)) {
				$server = $chat->server;
			}

			$email = '';
			if (!empty($chat->email)) {
				$email = $chat->email;
			}

			$hash = '';
			if (!empty($chat->hash)) {
				$hash = $chat->hash;
			}

			$custom = '';
			$reference = '';

			// Integration
			$integration = false;
			if (!empty($request) && is_numeric($request)) {
				$integration = Custom::where('request', $request)->find_one();
			}

			if ($integration !== false) {
				$reference = $integration->reference;
				$custom = $integration->custom;
			}

			if ($XML) {
				if (empty($request)) {
?>
<User ID="<?php echo($id); ?>" Department="<?php echo(xmlattribinvalidchars($department)); ?>" Server="<?php echo(xmlattribinvalidchars($server)); ?>" Email="<?php echo(xmlattribinvalidchars($email)); ?>" Question="<?php echo(xmlattribinvalidchars($question)); ?>" Custom="<?php echo(xmlattribinvalidchars($custom)); ?>" Reference="<?php echo(xmlattribinvalidchars($reference)); ?>"><?php echo(xmlelementinvalidchars($username)); ?></User>
<?php
				} else {
?>
<User ID="<?php echo($id); ?>" Visitor="<?php echo($request); ?>" Department="<?php echo(xmlattribinvalidchars($department)); ?>" Server="<?php echo(xmlattribinvalidchars($server)); ?>" Email="<?php echo(xmlattribinvalidchars($email)); ?>" Question="<?php echo(xmlattribinvalidchars($question)); ?>" Custom="<?php echo(xmlattribinvalidchars($custom)); ?>" Reference="<?php echo(xmlattribinvalidchars($reference)); ?>"><?php echo(xmlelementinvalidchars($username)); ?></User>
<?php
				}
			} else {

				// Pending User JSON
				$user = array('ID' => $id, 'Hash' => $hash, 'Name' => $username, 'Visitor' => $request, 'Department' => $department, 'Server' => $server, 'Email' => $email, 'Question' => $question, 'Datetime' => $datetime);
				$pending[] = $user;
			}
		}
		if ($XML) {
?>
</Pending>
<?php
		}
	}

	if ($chats !== false) {
		if ($XML) {
?>
<Transferred>
<?php
		}

		$transferred = array();
		foreach ($chats as $key => $chat) {
			if ($chat->status == -2 && $chat->transfer == (int)$_OPERATOR['ID']) {
				$id = (int)$chat->id;
				$request = $chat->request;
				$username = $chat->name;
				$datetime = $chat->datetime . date('O');

				$department = '';
				if (!empty($chat->department)) {
					$department = $chat->department;
				}

				$server = '';
				if (!empty($chat->server)) {
					$server = $chat->server;
				}

				$email = '';
				if (!empty($chat->email)) {
					$email = $chat->email;
				}

				$custom = '';
				$reference = '';

				// Integration
				$custom = Custom::where('request', $request)
					->find_one();

				if ($custom !== false) {
					$reference = $custom->reference;
					$custom = $custom->custom;
				}

				if ($XML) {
?>
<User ID="<?php echo($id); ?>" Visitor="<?php echo($request); ?>" Department="<?php echo(xmlattribinvalidchars($department)); ?>" Server="<?php echo(xmlattribinvalidchars($server)); ?>" Email="<?php echo(xmlattribinvalidchars($email)); ?>" Custom="<?php echo(xmlattribinvalidchars($custom)); ?>" Reference="<?php echo(xmlattribinvalidchars($reference)); ?>"><?php echo(xmlelementinvalidchars($username)); ?></User>
<?php
				} else {

					// Tranferrered User JSON
					$user = array('ID' => $id, 'Name' => $username, 'Visitor' => $request, 'Department' => $department, 'Server' => $server, 'Email' => $email, 'Question' => $question, 'Datetime' => $datetime);
					$transferred[] = $user;
				}
			}
		}

		if ($XML) {
?>
</Transferred>
<?php
		}
	}

	if ($XML) {
?>
</Users>
<?php
	} else {

		// Output JSON
		if ((float)$_SETTINGS['SERVERVERSION'] >= 3.90) {
			$users = array('LastCall' => $lastcall, 'LastActivity' => $lastactivity, 'Staff' => array('User' => $staff), 'Online' => array('User' => $online), 'Pending' => array('User' => $pending), 'Transferred' => array('User' => $transferred));
		} else {
			$users = array('LastCall' => $lastcall, 'Staff' => array('User' => $staff), 'Online' => array('User' => $online), 'Pending' => array('User' => $pending), 'Transferred' => array('User' => $transferred));
		}

		$results = $hooks->run('ChatsCompleted', array('users' => $users, 'type' => 'json'));
		if (!empty($results) && !empty($results['users'])) {
			$users = $results['users'];
		}

		$json = array('Users' => $users);
		echo(json_encode($json));

	}
}

function Visitors() {
	global $_OPERATOR;
	global $_SETTINGS;
	global $_PLUGINS;
	global $XML;
	global $hooks;

	if (!isset($_REQUEST['Action'])){ $_REQUEST['Action'] = ''; }
	if (!isset($_REQUEST['Request'])){ $_REQUEST['Request'] = ''; }
	if (!isset($_REQUEST['Record'])){ $_REQUEST['Record'] = ''; }
	if (!isset($_REQUEST['Total'])){ $_REQUEST['Total'] = '6'; }

	if ($_REQUEST['Action'] == 'Initiate' && $_OPERATOR['PRIVILEGE'] < 4) {

		if (!empty($_REQUEST['Request'])) {
			// Initiate Chat
			$visitor = Visitor::where_id_is((int)$_REQUEST['Request'])
				->where('initiate', 0)
				->find_one();

			if ($visitor !== false) {
				$visitor->initiate = (int)$_OPERATOR['ID'];
				$visitor->save();
			}
		}
		else {
			// Initiate Chat All (25 Visitors)
			$visitors = Visitor::where('initiate', 0)
				->order_by_desc('datetime')
				->limit(25)
				->find_many();

			if ($visitors !== false) {
				foreach ($visitors as $key => $visitor) {
					$visitor->initiate = (int)$_OPERATOR['ID'];
					$visitor->save();
				}
			}
		}
	}
	elseif ($_REQUEST['Action'] == 'Remove' && $_OPERATOR['PRIVILEGE'] < 3) {

		if (!empty($_REQUEST['Request'])) {
			// Hide Visitor Request
			$visitor = Visitor::where_id_is((int)$_REQUEST['Request'])->find_one();
			$visitor->status = 1;
			$visitor->save();
		}
	}

	// Visitors Timeout
	$time = time() - $_SETTINGS['VISITORTIMEOUT'];

	// Visitors Pre Processing Hook
	$visitors = $hooks->run('VisitorsPreProcessing', array('time' => $time));

	if ((float)$_SETTINGS['SERVERVERSION'] >= 4.1) {
		if (!isset($_SETTINGS['COUCHBASEHOST']) && !isset($_SETTINGS['COUCHBASEBUCKET'])) {
			$visitors = Visitor::where_gt('refresh', date('Y-m-d H:i:s', $time))
				->where('status', 0)
				->order_by_asc('id')
				->find_many();
		} else if ($visitors === false) {
			$visitors = array();
		}
	}

	if ($visitors !== false) {

		// Visitors Query Completed Hook
		$results = $hooks->run('VisitorsQueryCompleted', array('visitors' => $visitors));
		if (!empty($results['visitors'])) {
			$visitors = $results['visitors'];
		}

		$sockets = array();
		$last = 0; $total = 0; $pageviews = 0;
		foreach ($visitors as $key => $visitor) {
			if (!isset($_SETTINGS['COUCHBASEHOST']) && !isset($_SETTINGS['COUCHBASEBUCKET'])) {
				$pageviews += substr_count($visitor->path, '; ') + 1;
			} else {
				$sockets[] = $visitor;
			}
			if (is_numeric($visitor->id) && $visitor->id > $last) {
				$last = $visitor->id;
			}
			$total += 1;
		}

		if ($total > 0) {
			while ($total <= $_REQUEST['Record']) {
				$_REQUEST['Record'] = $_REQUEST['Record'] - $_REQUEST['Total'];
			}
		} else {
			$_REQUEST['Record'] = 0;
		}

		if ($XML) {
			header('Content-type: text/xml; charset=utf-8');
			echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<Visitors xmlns="urn:LiveHelp" TotalVisitors="<?php echo($total); ?>" LastVisitor="<?php echo($last); ?>" PageViews="<?php echo($pageviews); ?>">
<?php
		} else {
			header('Content-type: application/json; charset=utf-8');

			if ((int)$_REQUEST['Total'] < 0) {
				$data = array();
				foreach ($visitors as $key => $visitor) {
					$data[] = (int)$visitor->id;
				}
				$json = json_encode(array('Visitors' => $data));
				echo($json);
				exit();
			}

			$visits = array();
			$visitorsjson = array('TotalVisitors' => $total, 'LastVisitor' => $last, 'Pageviews' => $pageviews);
		}

		$initiated_default_label = 'Live Help Request has not been Initiated';
		$initiated_sending_label = 'Sending the Initiate Live Help Request...';
		$initiated_waiting_label = 'Waiting on the Initiate Live Help Reply...';
		$initiated_accepted_label = 'Initiate Live Help Request was ACCEPTED';
		$initiated_declined_label = 'Initiate Live Help Request was DECLINED';
		$initiated_chatting_label = 'Currently chatting to Operator';
		$initiated_chatted_label = 'Already chatted to an Operator';
		$initiated_pending_label = 'Currently Pending for Live Help';

		$rating_label = 'Rating';
		$unavailable_label = 'Unavailable';

		$count = count($visitors);
		$total = (int)$_REQUEST['Record'] + (int)$_REQUEST['Total'];
		if ($count < $total) { $total = $count; }

		$index = 0;
		foreach ($visitors as $key => $visitor) {
			if ($index >= (int)$_REQUEST['Record'] && $index < (int)$_REQUEST['Record'] + (int)$_REQUEST['Total']) {

				if (defined('ACCOUNT') && strpos($visitor->id, 'visitor:' . ACCOUNT . ':') > -1) {
					$id = str_replace('visitor:' . ACCOUNT . ':', '', $visitor->id);
				} else {
					$id = (int)$visitor->id;
				}

				$request = $visitor->request;
				$datetime = $visitor->datetime;
				$path = $visitor->path;
				$initiate = $visitor->initiate;
				$url = $visitor->url;
				$referrer = $visitor->referrer;
				$ipaddress = $visitor->ipaddress;
				$useragent = $visitor->useragent;
				$resolution = $visitor->resolution;
				$title = $visitor->title;
				$socket = $visitor->socket;

				// Location
				if (method_exists($visitor, 'geolocation')) {
					$location = $visitor->geolocation()->find_one();
					$city = ($location !== false) ? $location->city : '';
					$state = ($location !== false) ? $location->state : '';
					$country = ($location !== false) ? $location->country : '';
					$latitude = ($location !== false) ? $location->latitude : '';
					$longitude = ($location !== false) ? $location->longitude : '';
				} else {
					$city = ($visitor->city !== false) ? $visitor->city : '';
					$state = ($visitor->state !== false) ? $visitor->state : '';
					$country = ($visitor->country !== false) ? $visitor->country : '';
					$latitude = ($visitor->latitude !== false) ? $visitor->latitude : '';
					$longitude = ($visitor->longitude !== false) ? $visitor->longitude : '';
				}

				if (!is_array($path) && is_string($path)) {
					$path = explode('; ', $path);
				}

				$pagetime = time() - strtotime($request);
				$sitetime = time() - strtotime($datetime);

				if ($pagetime < 0) { $pagetime = 0; }
				if ($sitetime < 0) { $sitetime = 0; }

				// Last 20 Page Paths
				$totalpages = count($path);
				$path = array_slice($path, $totalpages - 20);
				$path = implode('; ', $path);

				// Limit Page History
				if (strlen($path) > 500) {
					$path = substr($path, 0, 500);
				}

				// Chat Status
				$status = '';
				$initiate = '';

				// Chat
				$chat = false;
				if (is_numeric($id) && (int)$id > 0 && $_SETTINGS['DATABASEVERSION'] < 11) {
					$chat = Chat::where('request', $id)->find_one();
				} else if ($_SETTINGS['DATABASEVERSION'] > 10) {
					$chatvisitor = ChatVisitor::where('visitor', $id)->find_one();
					if ($chatvisitor !== false) {
						$chat = $chatvisitor->chat()->find_one();
					}
				}

				if ($chat !== false) {

					if ($chat->status == 1) {

						// Chat Operator
						$operator = $chat->session()->order_by_desc('requested')->find_one()->operator()->find_one();

						if ($operator !== false) {
							if (!empty($operator->firstname)) {
								if (!empty($operator->lastname)) {
									$initiate = sprintf('%s (%s %s)', $initiated_chatting_label, $operator->firstname, $operator->lastname);
								} else {
									$initiate = sprintf('%s (%s)', $initiated_chatting_label, $operator->firstname);
								}
							} else {
								$initiate = sprintf('%s (%s)', $initiated_chatting_label, $unavailable_label);
							}
						}

					} else if ($chat->status == -1 || $chat->status == -3) {

						// Chat Rating
						$rating = Rating::where('chat', $chat->id)->find_one();

						// Chat Ended
						if ($rating != false) {
							$status = $initiated_chatted_label . ' - ' . $rating_label . ' (' . $rating->rating . '/5)';
						} else {
							$status = $initiated_chatted_label;
						}

						// Initiate Chat Status
						switch ($initiate) {
							case 0: // Not Initiated
								break;
							case -1: // Waiting
								$initiate = $initiated_waiting_label;
								break;
							case -2: // Accepted
								$initiate = $initiated_accepted_label;
								break;
							case -3: // Declined
								$initiate = $initiated_declined_label;
								break;
							case -4: // Chatting
								break;
							default: // Sending
								$initiate = $initiated_sending_label;
								break;
						}

					} else {

						if (!empty($chat->department)) {
							$initiate = sprintf('%s (%s)', $initiated_pending_label, $chat->department);
						} else {
							$initiate = $initiated_pending_label;
						}
					}

				}
				else {

					// Initiate Chat Status
					switch($initiate) {
						case 0: // Default Status
							$initiate = $initiated_default_label;
							break;
						case -1: // Waiting
							$initiate = $initiated_waiting_label;
							break;
						case -2: // Accepted
							$initiate = $initiated_accepted_label;
							break;
						case -3: // Declined
							$initiate = $initiated_declined_label;
							break;
						default: // Sending
							$initiate = $initiated_sending_label;
							break;
					}
				}

				if (empty($url)) {
					$url = $unavailable_label;
				}

				// Set the referrer as approriate
				if (!empty($referrer) && $referrer != false) {
					$referrer = urldecode($referrer);
				}
				else if ($referrer == false) {
					$referrer = 'Direct Visit / Bookmark';
				}
				else {
					$referrer = $unavailable_label;
				}

				if ($chat == false) {
					$chat = Chat::create();
					$chat->id = -1;
					$chat->status = '';
					$chat->name = '';
				}

				$active = '';
				if ($chat !== false && $chat->status == 1) {
					$account = $chat->session()->order_by_desc('requested')->find_one()->operator()->find_one();
					if ($account !== false) {
						$active = $account->id;
					}
				} else {
					$active = $chat->status;
				}

				$hash = false;
				if (isset($_SETTINGS['CLOUDSOCKETSVISITORSALT'])) {
					$salt = $_SETTINGS['CLOUDSOCKETSVISITORSALT'];
					$hash = sha1($id . $salt);
				}

				if ($XML) {

					// Integration
					$custom = Custom::where('request', $id)->find_one();
					if ($custom !== false) {
?>
<Visitor ID="<?php echo($id); ?>" Session="<?php echo($chat->id); ?>" Active="<?php echo($active); ?>" Username="<?php echo(xmlattribinvalidchars($custom->name)); ?>" Custom="<?php echo(xmlattribinvalidchars($custom->custom)); ?>" Reference="<?php echo(xmlattribinvalidchars($custom->reference)); ?>">
<?php
					}
					else {
?>
<Visitor ID="<?php echo($id); ?>" Session="<?php echo($chat->id); ?>" Active="<?php echo($active); ?>" Username="<?php echo(xmlattribinvalidchars($chat->name)); ?>">
<?php
					}
?>
<Hostname><?php echo(xmlelementinvalidchars($ipaddress)); ?></Hostname>
<Country City="<?php echo(xmlattribinvalidchars($city)); ?>" State="<?php echo(xmlattribinvalidchars($state)); ?>"><?php echo($country); ?></Country>
<UserAgent><?php echo(xmlelementinvalidchars($useragent)); ?></UserAgent>
<Resolution><?php echo(xmlelementinvalidchars($resolution)); ?></Resolution>
<CurrentPage><?php echo(xmlelementinvalidchars($url)); ?></CurrentPage>
<CurrentPageTitle><?php echo(xmlelementinvalidchars($title)); ?></CurrentPageTitle>
<Referrer><?php echo(xmlelementinvalidchars($referrer)); ?></Referrer>
<TimeOnPage><?php echo($pagetime); ?></TimeOnPage>
<ChatStatus><?php echo(xmlelementinvalidchars($initiate)); ?></ChatStatus>
<PagePath Total="<?php echo($totalpages); ?>"><?php echo(xmlelementinvalidchars($path)); ?></PagePath>
<TimeOnSite><?php echo($sitetime); ?></TimeOnSite>
</Visitor>
<?php
				} else {
					$visit = array(
						'ID' => $id,
						'Hash' => $hash,
						'Active' => $active,
						'Session' => $chat->id,
						'Username' => $chat->name,
						'Socket' => $socket,
						'Hostname' => $ipaddress,
						'City' => $city,
						'State' => $state,
						'Country' => $country,
						'Latitude' => $latitude,
						'Longitude' => $longitude,
						'UserAgent' => $useragent,
						'Resolution' => $resolution,
						'CurrentPage' => $url,
						'CurrentPageTitle' => $title,
						'Referrer' => $referrer,
						'TimeOnPage' => $pagetime,
						'ChatStatus' => $initiate,
						'PagePath' => $path,
						'TimeOnSite' => $sitetime
					);
					$visits[] = $visit;
				}
			}
			$index = $index++;
		}

		if ($XML) {
?>
</Visitors>
<?php
		} else {
			$visitorsjson['Visitor'] = $visits;
			$json = array('Visitors' => $visitorsjson);
			$json = json_encode($json);
			echo($json);
		}
	}
	else {
		if ($XML) {
			header('Content-type: text/xml; charset=utf-8');
			echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<Visitors xmlns="urn:LiveHelp"/>
<?php
		} else {
			header('Content-type: application/json; charset=utf-8');
			$visitorsjson = array('Visitors' => null);
			$json = json_encode($visitorsjson);
			echo($json);
		}
	}
}

function Visitor() {

	global $_OPERATOR;
	global $_PLUGINS;
	global $_SETTINGS;
	global $XML;
	global $hooks;

	$id = (isset($_REQUEST['ID'])) ? $_REQUEST['ID'] : false;

	$visitor = false;
	if ($id !== false && is_numeric($id) && (int)$id > 0) {
		$visitor = Visitor::where_id_is($id)->find_one();
	}

	$visitor = $hooks->run('VisitorLoaded', array('id' => $id, 'visitor' => $visitor));

	if ($visitor !== false) {

		$initiated_default_label = 'Live Help Request has not been Initiated';
		$initiated_sending_label = 'Sending the Initiate Live Help Request...';
		$initiated_waiting_label = 'Waiting on the Initiate Live Help Reply...';
		$initiated_accepted_label = 'Initiate Live Help Request was ACCEPTED';
		$initiated_declined_label = 'Initiate Live Help Request was DECLINED';
		$initiated_chatting_label = 'Currently chatting to Operator';
		$initiated_chatted_label = 'Already chatted to an Operator';
		$initiated_pending_label = 'Currently Pending for Live Help';
		$initiate = $initiated_default_label;

		$rating_label = 'Rating';
		$unavailable_label = 'Unavailable';

		$pagetime = time() - strtotime($visitor->request);
		$sitetime = time() - strtotime($visitor->datetime);

		if ($pagetime < 0) { $pagetime = 0; }
		if ($sitetime < 0) { $sitetime = 0; }

		// Chat
		$chat = false;
		if (is_numeric($visitor->id) && (int)$visitor->id > 0 && $_SETTINGS['DATABASEVERSION'] < 11) {
			$chat = Chat::where('request', $visitor->id)->find_one();
		} else if ($_SETTINGS['DATABASEVERSION'] > 10) {
			$chatvisitor = ChatVisitor::where('visitor', $visitor->id)->find_one();
			if ($chatvisitor !== false) {
				$chat = $chatvisitor->chat()->find_one();
			}
		}

		if ($chat !== false) {

			if ($chat->status == 1) {
				// Chat Operator
				$operator = $chat->session()->order_by_desc('requested')->find_one()->operator()->find_one();

				if ($operator !== false) {
					if (!empty($operator->firstname)) {
						if (!empty($operator->lastname)) {
							$initiate = sprintf('%s (%s %s)', $initiated_chatting_label, $operator->firstname, $operator->lastname);
						} else {
							$initiate = sprintf('%s (%s)', $initiated_chatting_label, $operator->firstname);
						}
					} else {
						$initiate = sprintf('%s (%s)', $initiated_chatting_label, $unavailable_label);
					}
				}

			} else if ($chat->status == -1 || $chat->status == -3) {

				// Chat Rating
				$rating = Rating::where('chat', $chat->id)->find_one();

				// Chat Ended
				if ($rating != false) {
					$status = $initiated_chatted_label . ' - ' . $rating_label . ' (' . $rating->rating . '/5)';
				} else {
					$status = $initiated_chatted_label;
				}

				// Initiate Chat Status
				switch ($visitor->initiate) {
					case 0: // Not Initiated
						break;
					case -1: // Waiting
						$initiate = $initiated_waiting_label;
						break;
					case -2: // Accepted
						$initiate = $initiated_accepted_label;
						break;
					case -3: // Declined
						$initiate = $initiated_declined_label;
						break;
					case -4: // Chatting
						break;
					default: // Sending
						$initiate = $initiated_sending_label;
						break;
				}

			} else {

				if (!empty($chat->department)) {
					$initiate = sprintf('%s (%s)', $initiated_pending_label, $chat->department);
				} else {
					$initiate = $initiated_pending_label;
				}
			}

		}
		else {

			// Initiate Chat Status
			switch($visitor->initiate) {
				case 0: // Default Status
					$initiate = $initiated_default_label;
					break;
				case -1: // Waiting
					$initiate = $initiated_waiting_label;
					break;
				case -2: // Accepted
					$initiate = $initiated_accepted_label;
					break;
				case -3: // Declined
					$initiate = $initiated_declined_label;
					break;
				default: // Sending
					$initiate = $initiated_sending_label;
					break;
			}
		}

		if (empty($visitor->url)) {
			$visitor->url = $unavailable_label;
		}

		// Set the referrer as approriate
		if (!empty($visitor->referrer) && $visitor->referrer != false) {
			$visitor->referrer = urldecode($visitor->referrer);
		}
		elseif ($visitor->referrer == false) {
			$visitor->referrer = 'Direct Visit / Bookmark';
		}
		else {
			$visitor->referrer = $unavailable_label;
		}

		if (empty($visitor->country)) {
			$visitor->country = $unavailable_label;
		}

		if (empty($chat->id)) {
			$chat->id = 0;
			$chat->status = 0;
		}

		$active = 0;
		if ($chat !== false && $chat->status == 1) {
			$account = $chat->session()->order_by_desc('requested')->find_one()->operator()->find_one();
			if ($account !== false) {
				$active = $account->id;
			}
		} else {
			$active = $chat->status;
		}

		header('Content-type: text/xml; charset=utf-8');
		echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");

		// Custom Visitor Details
		$custom = '';
		$reference = '';

		$data = $hooks->run('VisitorCustomDetails', $visitor->id);
		if ($data !== false) {
			$custom = $data['Custom'];
			$username = $data['Username'];
			$reference = $data['Reference'];
		}

		if (is_array($visitor->path)) {
			$visitor->path = implode('; ', $visitor->path);
		}

?>
<Visitor xmlns="urn:LiveHelp" ID="<?php echo($visitor->id); ?>" Session="<?php echo($chat->id); ?>" Active="<?php echo($active); ?>" Username="<?php echo(xmlattribinvalidchars($username)); ?>" Custom="<?php echo(xmlattribinvalidchars($custom)); ?>" Reference="<?php echo(xmlattribinvalidchars($reference)); ?>">
<Hostname><?php echo(xmlelementinvalidchars($visitor->ipaddress)); ?></Hostname>
<Country><?php echo($visitor->country); ?></Country>
<UserAgent><?php echo(xmlelementinvalidchars($visitor->useragent)); ?></UserAgent>
<Resolution><?php echo(xmlelementinvalidchars($visitor->resolution)); ?></Resolution>
<CurrentPage><?php echo(xmlelementinvalidchars($visitor->url)); ?></CurrentPage>
<CurrentPageTitle><?php echo(xmlelementinvalidchars($visitor->title)); ?></CurrentPageTitle>
<Referrer><?php echo(xmlelementinvalidchars($visitor->referrer)); ?></Referrer>
<TimeOnPage><?php echo($pagetime); ?></TimeOnPage>
<ChatStatus><?php echo(xmlelementinvalidchars($initiate)); ?></ChatStatus>
<PagePath><?php echo(xmlelementinvalidchars($visitor->path)); ?></PagePath>
<TimeOnSite><?php echo($sitetime); ?></TimeOnSite>
</Visitor>
<?php
	}
	else {
		header('Content-type: text/xml; charset=utf-8');
		echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<Visitor xmlns="urn:LiveHelp"/>
<?php
	}
}

function Version() {

	global $_OPERATOR;
	global $_SETTINGS;
	global $XML;

	if (!isset($_REQUEST['Windows'])){ $_REQUEST['Windows'] = ''; }
	if ($_REQUEST['Windows'] == $_SETTINGS['WINDOWSAPP']) { $result = true; } else { $result = false; }

	if ($XML) {
		header('Content-type: text/xml; charset=utf-8');
		echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<Version xmlns="urn:LiveHelp" Web="<?php echo($_SETTINGS['WEBVERSION']); ?>" Windows="<?php echo($result); ?>"/>
<?php
	} else {

		if ($result && strtolower($result) !== "false") {
			$result = true;
		} else {
			$result = false;
		}

		header('Content-type: application/json; charset=utf-8');
		$json = array('Web' => floatval($_SETTINGS['WEBVERSION']), 'Windows' => $result);
		echo(json_encode($json));
	}

	exit();
}

function Settings() {

	global $_OPERATOR;
	global $_SETTINGS;
	global $_PLUGINS;
	global $XML;
	global $hooks;

	if (!isset($_REQUEST['Cached'])){ $_REQUEST['Cached'] = ''; }

	// Save Settings Full Administrator / Department Administrator
	if ($_OPERATOR['PRIVILEGE'] < 2) {

		// Update Settings
		$updated = false;
		foreach ($_REQUEST as $key => $value) {
			// Valid Setting
			if (array_key_exists(strtoupper($key), $_SETTINGS)) {

				// Update Setting
				$setting = Setting::where_id_is($key)->find_one();
				$setting->value = $value;
				$setting->save();

				$updated = true;
			}
		}

		// Update Last Updated
		if ($updated == true) {
			$setting = Setting::where_id_is('LastUpdated')
				->find_one();

			$setting->value = date('Y-m-d H:i:s', time());
			$setting->save();
		}

		$settings = Setting::find_many();

		if ($settings !== false) {
			foreach ($settings as $key => $setting) {
				$_SETTINGS[strtoupper($setting->name)] = $setting->value;
			}
		}

		// Default Settings
		if (!isset($_SETTINGS['CHATWINDOWWIDTH'])) { $_SETTINGS['CHATWINDOWWIDTH'] = 625; }
		if (!isset($_SETTINGS['CHATWINDOWHEIGHT'])) { $_SETTINGS['CHATWINDOWHEIGHT'] = 435; }
		if (!isset($_SETTINGS['TEMPLATE'])) { $_SETTINGS['TEMPLATE'] = 'default'; }
		if (!isset($_SETTINGS['LOCALE'])) { $_SETTINGS['LOCALE'] = 'en'; }

	}

	// Time Zone Setting
	$_SETTINGS['DEFAULTTIMEZONE'] = date('Z');

	// Language Packs
	$languagefile = file('../locale/i18n.txt');
	$languages = '';
	foreach ($languagefile as $key => $line) {
		$i18n = explode(',', $line);
		$code = trim($i18n[0]);
		$available = file_exists('../locale/' . $code . '/guest.php');
		if ($available) {
			if ($languages == '') {
				$languages .= $code;
			}
			else {
				$languages .=  ', ' . $code;
			}
		}
	}

	$hooks->run('SettingsLoaded', $_SETTINGS);

	if ($XML) {
		header('Content-type: text/xml; charset=utf-8');
		echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<Settings xmlns="urn:LiveHelp">
<Domain><?php echo(xmlelementinvalidchars($_SETTINGS['DOMAIN'])); ?></Domain>
<SiteAddress><?php echo(xmlelementinvalidchars($_SETTINGS['URL'])); ?></SiteAddress>
<Email><?php echo(xmlelementinvalidchars($_SETTINGS['EMAIL'])); ?></Email>
<Name><?php echo(xmlelementinvalidchars($_SETTINGS['NAME'])); ?></Name>
<Logo><?php echo(xmlelementinvalidchars($_SETTINGS['LOGO'])); ?></Logo>
<WelcomeMessage><?php echo(xmlelementinvalidchars($_SETTINGS['INTRODUCTION'])); ?></WelcomeMessage>
<?php
	if (isset($_REQUEST['Version']) && $_REQUEST['Version'] >= 3.5) {
?>
<Smilies Enabled="<?php echo($_SETTINGS['SMILIES']); ?>"/>
<?php
	} else {
		if (!isset($_SETTINGS['GUESTSMILIES'])) { $_SETTINGS['GUESTSMILIES'] = '-1'; }
		if (!isset($_SETTINGS['OPERATORSMILIES'])) { $_SETTINGS['OPERATORSMILIES'] = '-1'; }
?>
<Smilies Guest="<?php echo($_SETTINGS['GUESTSMILIES']); ?>" Operator="<?php echo($_SETTINGS['OPERATORSMILIES']); ?>"/>
<?php
	}
?>
<Font Size="<?php echo(xmlattribinvalidchars($_SETTINGS['FONTSIZE'])); ?>" Color="<?php echo(xmlattribinvalidchars($_SETTINGS['FONTCOLOR'])); ?>" LinkColor="<?php echo(xmlattribinvalidchars($_SETTINGS['LINKCOLOR'])); ?>"><?php echo(xmlattribinvalidchars($_SETTINGS['FONT'])); ?></Font>
<ChatFont Size="<?php echo(xmlattribinvalidchars($_SETTINGS['CHATFONTSIZE'])); ?>" SentColor="<?php echo(xmlattribinvalidchars($_SETTINGS['SENTFONTCOLOR'])); ?>" ReceivedColor="<?php echo(xmlattribinvalidchars($_SETTINGS['RECEIVEDFONTCOLOR'])); ?>"><?php echo(xmlelementinvalidchars($_SETTINGS['CHATFONT'])); ?></ChatFont>
<BackgroundColor><?php echo(xmlelementinvalidchars($_SETTINGS['BACKGROUNDCOLOR'])); ?></BackgroundColor>
<OnlineLogo><?php echo(xmlelementinvalidchars($_SETTINGS['ONLINELOGO'])); ?></OnlineLogo>
<OfflineLogo><?php echo(xmlelementinvalidchars($_SETTINGS['OFFLINELOGO'])); ?></OfflineLogo>
<OfflineEmailLogo><?php echo(xmlelementinvalidchars($_SETTINGS['OFFLINEEMAILLOGO'])); ?></OfflineEmailLogo>
<BeRightBackLogo><?php echo(xmlelementinvalidchars($_SETTINGS['BERIGHTBACKLOGO'])); ?></BeRightBackLogo>
<AwayLogo><?php echo(xmlelementinvalidchars($_SETTINGS['AWAYLOGO'])); ?></AwayLogo>
<LoginDetails Enabled="<?php echo($_SETTINGS['LOGINDETAILS']); ?>" Required="<?php echo(xmlattribinvalidchars($_SETTINGS['REQUIREGUESTDETAILS'])); ?>" Email="<?php echo($_SETTINGS['LOGINEMAIL']); ?>" Question="<?php echo($_SETTINGS['LOGINQUESTION']); ?>"/>
<OfflineEmail Enabled="<?php echo($_SETTINGS['OFFLINEEMAIL']); ?>" Redirect="<?php echo(xmlattribinvalidchars($_SETTINGS['OFFLINEEMAILREDIRECT'])); ?>"><?php echo(xmlelementinvalidchars($_SETTINGS['OFFLINEEMAIL'])); ?></OfflineEmail>
<SecurityCode Enabled="<?php echo($_SETTINGS['SECURITYCODE']); ?>"/>
<Departments Enabled="<?php echo($_SETTINGS['DEPARTMENTS']); ?>"/>
<VisitorTracking Enabled="<?php echo($_SETTINGS['VISITORTRACKING']); ?>"/>
<Timezone Server="<?php echo($_SETTINGS['DEFAULTTIMEZONE']); ?>"><?php echo(xmlelementinvalidchars($_SETTINGS['TIMEZONE'])); ?></Timezone>
<Language Available="<?php echo(xmlattribinvalidchars($languages)); ?>"><?php echo(xmlelementinvalidchars($_SETTINGS['LOCALE'])); ?></Language>
<InitiateChat Vertical="<?php echo(xmlattribinvalidchars($_SETTINGS['INITIATECHATVERTICAL'])); ?>" Horizontal="<?php echo(xmlattribinvalidchars($_SETTINGS['INITIATECHATHORIZONTAL'])); ?>" Auto="<?php echo($_SETTINGS['INITIATECHATAUTO']); ?>"/>
<ChatUsername Enabled="<?php echo($_SETTINGS['CHATUSERNAME']); ?>"/>
<Campaign Link="<?php echo(xmlattribinvalidchars($_SETTINGS['CAMPAIGNLINK'])); ?>"><?php echo(xmlelementinvalidchars($_SETTINGS['CAMPAIGNIMAGE'])); ?></Campaign>
<IP2Country Enabled="<?php echo($_SETTINGS['IP2COUNTRY']); ?>"/>
<P3P><?php echo(xmlelementinvalidchars($_SETTINGS['P3P'])); ?></P3P>
<ChatWindowSize Width="<?php echo($_SETTINGS['CHATWINDOWWIDTH']); ?>" Height="<?php echo($_SETTINGS['CHATWINDOWHEIGHT']); ?>"/>
<Code>
<Head><![CDATA[<?php echo($_SETTINGS['HTMLHEAD']); ?>]]></Head>
<Body><![CDATA[<?php echo($_SETTINGS['HTMLBODY']); ?>]]></Body>
<Image><![CDATA[<?php echo($_SETTINGS['HTMLIMAGE']); ?>]]></Image>
</Code>
<?php
	if (isset($_PLUGINS)) {
?>
<Plugins>
<?php
		$hooks->run('SettingsPlugin', false);
?>
</Plugins>
<?php
	}

	if (is_array($_SETTINGS['TEMPLATES'])) {
?>
<Templates Current="<?php echo($_SETTINGS['TEMPLATE']); ?>">
<?php
		foreach ($_SETTINGS['TEMPLATES'] as $key => $template) {
			$name = $template['name'];
			$value = $template['value'];
?>
<Template Name="<?php echo(xmlattribinvalidchars($name)); ?>" Value="<?php echo(xmlattribinvalidchars($value)); ?>" />
<?php
		}
?>
</Templates>
<?php
	}
?>
</Settings>
<?php
	} else {

		if ($_REQUEST['Cached'] != '') {
			$updated = strtotime($_SETTINGS['LASTUPDATED']);
			$cached = strtotime($_REQUEST['Cached']);
			if ($updated - $cached <= 0) {
				if (strpos(php_sapi_name(), 'cgi') === false) { header('HTTP/1.0 304 Not Modified'); } else { header('Status: 304 Not Modified'); }
				exit();
			}
		}

		if (!isset($_SETTINGS['PLUGINS'])) {
			$_SETTINGS['PLUGINS'] = array();
		}

		header('Content-type: application/json; charset=utf-8');
		$settings = array(
			'Domain' => $_SETTINGS['DOMAIN'],
			'SiteAddress' => $_SETTINGS['URL'],
			'Email' => $_SETTINGS['EMAIL'],
			'Name' => $_SETTINGS['NAME'],
			'Logo' => $_SETTINGS['LOGO'],
			'WelcomeMessage' => $_SETTINGS['INTRODUCTION'],
			'Smilies' => (int)$_SETTINGS['SMILIES'],
			'Font' => array('Type' => $_SETTINGS['FONT'], 'Size' => $_SETTINGS['FONTSIZE'], 'Color' => $_SETTINGS['FONTCOLOR'], 'LinkColor' => $_SETTINGS['LINKCOLOR']),
			'ChatFont' => array('Type' => $_SETTINGS['FONT'], 'Size' => $_SETTINGS['CHATFONTSIZE'], 'SentColor' => $_SETTINGS['SENTFONTCOLOR'], 'ReceivedColor' => $_SETTINGS['RECEIVEDFONTCOLOR']),
			'BackgroundColor' => $_SETTINGS['BACKGROUNDCOLOR'],
			'OnlineLogo' => $_SETTINGS['ONLINELOGO'],
			'OfflineLogo' => $_SETTINGS['OFFLINELOGO'],
			'OfflineEmailLogo' => $_SETTINGS['OFFLINEEMAILLOGO'],
			'BeRightBackLogo' => $_SETTINGS['BERIGHTBACKLOGO'],
			'AwayLogo' => $_SETTINGS['AWAYLOGO'],
			'LoginDetails' => array('Enabled' => (int)$_SETTINGS['LOGINDETAILS'], 'Required' => (int)$_SETTINGS['REQUIREGUESTDETAILS'], 'Email' => (int)$_SETTINGS['LOGINEMAIL'], 'Question' => (int)$_SETTINGS['LOGINQUESTION']),
			'OfflineEmail' => array('Enabled' => (int)$_SETTINGS['OFFLINEEMAIL'], 'Redirect' => $_SETTINGS['OFFLINEEMAILREDIRECT'], 'Email' => (int)$_SETTINGS['OFFLINEEMAIL']),
			'SecurityCode' => (int)$_SETTINGS['SECURITYCODE'],
			'Departments' => (int)$_SETTINGS['DEPARTMENTS'],
			'VisitorTracking' => (int)$_SETTINGS['VISITORTRACKING'],
			'Timezone' => array('Offset' => $_SETTINGS['DEFAULTTIMEZONE'], 'Server' => $_SETTINGS['TIMEZONE']),
			'Language' => array('Available' => $languages, 'Locale' => $_SETTINGS['LOCALE']),
			'InitiateChat' => array('Vertical' => $_SETTINGS['INITIATECHATVERTICAL'], 'Horizontal' => $_SETTINGS['INITIATECHATHORIZONTAL'], 'Auto' => $_SETTINGS['INITIATECHATAUTO']),
			'ChatUsername' => (int)$_SETTINGS['CHATUSERNAME'],
			'Campaign' => array('Link' => $_SETTINGS['CAMPAIGNLINK'], 'Image' => $_SETTINGS['CAMPAIGNIMAGE']),
			'P3P' => $_SETTINGS['P3P'],
			'ChatWindowSize' => array('Width' => (int)$_SETTINGS['CHATWINDOWWIDTH'], 'Height' => (int)$_SETTINGS['CHATWINDOWHEIGHT']),
			'LastUpdated' => $_SETTINGS['LASTUPDATED'],
			'Code' => array('Head' => $_SETTINGS['HTMLHEAD'], 'Body' => $_SETTINGS['HTMLBODY'], 'Image' => $_SETTINGS['HTMLIMAGE']),
			'Templates' => $_SETTINGS['TEMPLATES'],
			'Template' => $_SETTINGS['TEMPLATE'],
			'Version' => array('Server' => (float)$_SETTINGS['SERVERVERSION']),
			'Plugins' => $_SETTINGS['PLUGINS'],
			'Telephone' => $_SETTINGS['TELEPHONE'],
			'Address' => $_SETTINGS['ADDRESS']
		);

		if (isset($_SETTINGS['AWAYMODE']) && $_SETTINGS['AWAYMODE'] == false) {
			$settings['AwayLogo'] = false;
		}

		if (isset($_SETTINGS['BRBMODE']) && $_SETTINGS['BRBMODE'] == false) {
			$settings['BeRightBackLogo'] = false;
		}

		if (isset($_SETTINGS['ACCOUNT'])) {
			$settings['Account'] = $_SETTINGS['ACCOUNT'];
		}

		$json = array('Settings' => $settings);
		$json = json_encode($json);
		echo($json);
	}

}

function InitaliseChat() {

	global $_OPERATOR;
	global $_SETTINGS;
	global $XML;

	if (!isset($_REQUEST['ID'])){ $_REQUEST['ID'] = ''; }
	if (!isset($_REQUEST['Message'])){ $_REQUEST['Message'] = ''; }

	// Chat
	$chat = Chat::where_id_is((int)$_REQUEST['ID'])
		->find_one();

	// Messages
	$messages = Message::where('chat', $chat->id)
		->where_lte('status', 3)
		->where_gt('id', (int)$_REQUEST['Message'])
		->order_by_asc('datetime')
		->find_many();

	$active = 0;
	if ($chat !== false && $chat->status == 1) {
		$account = $chat->session()->order_by_desc('requested')->find_one()->operator()->find_one();
		if ($account !== false) {
			$active = $account->id;
		}
	} else {
		$active = $chat->status;
	}

	header('Content-type: text/xml; charset=utf-8');
	echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<Messages xmlns="urn:LiveHelp" ID="<?php echo($_REQUEST['ID']); ?>" Status="<?php echo($active); ?>" Email="<?php echo(xmlattribinvalidchars($chat->email)); ?>" Server="<?php echo(xmlattribinvalidchars($chat->server)); ?>" Department="<?php echo(xmlattribinvalidchars($chat->department)); ?>">
<?php
if ($messages !== false) {
	foreach ($messages as $key => $message) {

		// Integration
		$custom = false;
		if ($message->status == -4) {
			$integration = Custom::where_id_is($message->align)
				->find_one();

			if ($integration !== false) {
				$custom = $integration->custom;
				$reference = $integration->reference;
			}
		}

		// Sent Message
		if ($message->status == 1) {
?>
<Message ID="<?php echo($message->id); ?>" Align="<?php echo($message->align); ?>" Status="<?php echo($message->status); ?>" Username="<?php echo(xmlattribinvalidchars($message->username)); ?>"><?php echo(xmlelementinvalidchars($message->message)); ?></Message>
<?php
		} else { // Received Message
			if ($custom !== false) {
?>
<Message ID="<?php echo($message->id); ?>" Custom="<?php echo($custom); ?>" Reference="<?php echo(xmlattribinvalidchars($reference)); ?>" Status="<?php echo($message->status); ?>" Username="<?php echo(xmlattribinvalidchars($message->username)) ?>"><?php echo(xmlelementinvalidchars($message->message)); ?></Message>
<?php
			} else {
?>
<Message ID="<?php echo($message->id); ?>" Align="<?php echo($message->align); ?>" Status="<?php echo($message->status); ?>" Username="<?php echo(xmlattribinvalidchars($message->username)) ?>"><?php echo(xmlelementinvalidchars($message->message)); ?></Message>
<?php
			}
		}
	}
}
?>
</Messages>
<?php
}

function Chat() {

	global $_OPERATOR;
	global $_SETTINGS;
	global $XML;

	if (!isset($_REQUEST['ID'])){ $_REQUEST['ID'] = ''; }
	if (!isset($_REQUEST['Message'])){ $_REQUEST['Message'] = ''; }
	if (!isset($_REQUEST['Staff'])){ $_REQUEST['Staff'] = ''; }
	if (!isset($_REQUEST['Typing'])){ $_REQUEST['Typing'] = ''; }

	if (!$_REQUEST['Staff']) {

		// Chat
		$chat = Chat::where_id_is((int)$_REQUEST['ID'])
			->find_one();

		if ($chat !== false) {
			$status = $chat->status;

			if ($_REQUEST['Typing']) { // Currently Typing
				switch($chat->typing) {
				case 0: // None
					$typing = 2;
					break;
				case 1: // Guest Only
					$typing = 3;
					break;
				case 2: // Operator Only
					$typing = 2;
					break;
				case 3: // Both
					$typing = 3;
					break;
				}
			}
			else { // Not Currently Typing
				switch($chat->typing) {
				case 0: // None
					$typing = 0;
					break;
				case 1: // Guest Only
					$typing = 1;
					break;
				case 2: // Operator Only
					$typing = 0;
					break;
				case 3: // Both
					$typing = 1;
					break;
				}
			}

			// Update Typing
			$chat->typing = $typing;
			$chat->save();
		}
	}
	else {
		$status = -1;
		$typing = 0;
	}

	if ($_REQUEST['Staff']) {

		// Other Chatting Operator
		$operator = Operator::where_id_is((int)$_REQUEST['ID'])
			->find_one();

		if ($operator !== false) {
			// Operator-Operator Chat Messages
			$messages = OperatorMessage::where_lte('status', 3)
				->where_gt('id', (int)$_REQUEST['Message'])
				->where_raw("((`from` = ? AND `to` = ?) OR (`from` = ? AND `to` = ?)) AND (UNIX_TIMESTAMP(`datetime`) - UNIX_TIMESTAMP(?)) > 0", array($_REQUEST['ID'], $_OPERATOR['ID'], $_OPERATOR['ID'], $_REQUEST['ID'], $_OPERATOR['DATETIME']))
				->order_by_asc('datetime')
				->find_many();
		} else {
			$messages = false;
		}
	}
	else {
		// Visitor Chat Messages
		$messages = Message::where_gt('id', (int)$_REQUEST['Message'])
			->where_lte('status', 3)
			->where('chat', (int)$_REQUEST['ID'])
			->order_by_asc('datetime')
			->find_many();
	}

	header('Content-type: text/xml; charset=utf-8');
	echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<Messages xmlns="urn:LiveHelp" ID="<?php echo($_REQUEST['ID']); ?>" Typing="<?php echo($typing); ?>" Status="<?php echo($status); ?>" ChatType="<?php echo($_REQUEST['Staff']); ?>">
<?php
if ($messages !== false) {
	foreach ($messages as $key => $message) {

		if ($_REQUEST['Staff']) {
			$session = $message->user;
		}
		else {
			$session = $message->chat;
		}

		// Integration
		$custom = false;
		if ($message->status == -4) {
			$integration = Custom::where_id_is('id', $message->align)
				->find_one();

			if ($integration !== false) {
				$custom = $integration->custom;
				$reference = $integration->reference;
			}
		}

		// Sent Message
		if ((!$_REQUEST['Staff'] && $message->status == 1) || ($_REQUEST['Staff'] && $session == $_REQUEST['ID'] && $message->username == $_OPERATOR['USERNAME'])) {
?>
<Message ID="<?php echo($message->id); ?>" Align="<?php echo($message->align); ?>" Status="<?php echo($message->status); ?>" Username="<?php echo(xmlattribinvalidchars($message->username)); ?>"><?php echo(xmlelementinvalidchars($message->message)); ?></Message>
<?php
		}
		// Received Message
		if ((!$_REQUEST['Staff'] && $message->status != 1) || ($_REQUEST['Staff'] && $session == $_OPERATOR['ID'] && $message->username != $_OPERATOR['USERNAME'])) {
			if ($custom !== false) {
?>
<Message ID="<?php echo($message->id); ?>" Custom="<?php echo($custom); ?>" Reference="<?php echo(xmlattribinvalidchars($reference)); ?>" Status="<?php echo($message->status); ?>" Username="<?php echo(xmlattribinvalidchars($message->username)) ?>"><?php echo(xmlelementinvalidchars($message->message)); ?></Message>
<?php
			} else {
?>
<Message ID="<?php echo($message->id); ?>" Align="<?php echo($message->align); ?>" Status="<?php echo($message->status); ?>" Username="<?php echo(xmlattribinvalidchars($message->username)) ?>"><?php echo(xmlelementinvalidchars($message->message)); ?></Message>
<?php
			}
		}
	}
}
?>
</Messages>
<?php
}

function Chats() {

	global $_OPERATOR;
	global $_SETTINGS;
	global $XML;
	global $hooks;

	if (!isset($_REQUEST['Data'])){ $_REQUEST['Data'] = ''; }

	if (empty($_REQUEST['Data'])) {
?>
<MultipleMessages xmlns="urn:LiveHelp"/>
<?php
		exit();
	}

	$data = explode('|', $_REQUEST['Data']);
	if (is_array($data)) {

		if ($XML) {
			header('Content-type: text/xml; charset=utf-8');
			echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<MultipleMessages xmlns="urn:LiveHelp">
<?php
		}
		else {
			$chats = array();
		}

		foreach ($data as $chatkey => $value) {
			list($id, $typingstatus, $staff, $message) = explode(',', $value);

			$introduction = false;
			if ($message < 0) { $introduction = true; }

			if (is_string($id) && strlen($id) == 36) {
				continue;
			} else {
				$id  = (int)$id;
			}

			$status = -1;
			$typing = 0;
			if (!$staff) {
				$chat = Chat::where_id_is($id)->find_one();

				$typing = false;
				if ($chat !== false) {

					$active = false;
					if ($chat->status == 1) {
						// Accepted Operator
						$operator = $chat->session()->order_by_desc('requested')->find_one()->operator()->find_one();
						if ($chat !== false && $chat->status == 1 && $operator !== false) {
							$active = $operator->id;
						} else {
							$active = $chat->status;
						}
					}

					if ($active !== false) {
						$status = $active;
					} else {
						$status = $chat->status;
					}

					$typing = Typing::where('chat', $chat->id)
						->where('user', $_OPERATOR['ID'])
						->find_one();

					if ($typing !== false) {
						if ($typingstatus) { // Currently Typing
							switch($typing->status) {
								case 0: // None
								case 2: // Operator Only
									$updatedtyping = 2;
									break;
								case 1: // Guest Only
								case 3: // Both
									$updatedtyping = 3;
									break;
							}
						}
						else { // Not Currently Typing
							switch($typing->status) {
								case 0: // None
								case 2: // Operator Only
									$updatedtyping = 0;
									break;
								case 1: // Guest Only
								case 3: // Both
									$updatedtyping = 1;
									break;
							}
						}

						// Typing
						if ($typing !== false) {
							$typing->status = $updatedtyping;
						} else {
							$typing = Typing::create();
							$typing->id = sha1((string)$chat->id . (string)$_OPERATOR['ID'], true);
							$typing->chat = $chat->id;
							$typing->user = $_OPERATOR['ID'];
							$typing->status = $updatedtyping;
						}
						$typing->save();
					}
				}
			}

			if ($staff) {
				// Operator
				$operator = Operator::where_id_is($id)->find_one();

				if ($operator !== false) {

					// Operator-Operator Chat Messages
					if ($message > 0) {
						$messages = OperatorMessage::where_gt('id', $message)
							->where_raw("((`from` = ? AND `to` = ?) OR (`from` = ? AND `to` = ?)) AND (`status` <= 3 OR `status` = 7) AND (UNIX_TIMESTAMP(`datetime`) - UNIX_TIMESTAMP(?)) > 0", array($operator->id, $_OPERATOR['ID'], $_OPERATOR['ID'], $operator->id, $_OPERATOR['DATETIME']))
							->order_by_asc('datetime')
							->find_many();
					} else {
						$messages = OperatorMessage::where_raw("((`from` = ? AND `to` = ?) OR (`from` = ? AND `to` = ?)) AND (`status` <= 3 OR `status` = 7)", array($operator->id, $_OPERATOR['ID'], $_OPERATOR['ID'], $operator->id))
							->order_by_desc('datetime')
							->limit(100)
							->find_many();

						$messages = array_reverse($messages);
					}

				} else {
					$messages = false;
				}
			}
			else {
				// Visitor Chat Messages
				$messages = Message::where_gt('id', (int)$message)
					->where('chat', (int)$id)
					->order_by_asc('datetime')
					->find_many();
			}

			$typing = ($typing !== false && isset($typing->status)) ? $typing->status : 0;

			if ($XML) {
?>
<Messages xmlns="urn:LiveHelp" ID="<?php echo($id); ?>" Typing="<?php echo($typing); ?>" Status="<?php echo($status); ?>" ChatType="<?php echo($staff); ?>">
<?php
			}
			else {
				$chat = array('ID' => $id, 'Typing' => $typing, 'Status' => $status, 'ChatType' => $staff);
				$messagesjson = array();
			}

$names = array();

$results = $hooks->run('MessagesQueryCompleted', array('id' => $id, 'messages' => $messages, 'staff' => $staff));
if (empty($results)) {
	$messages = $results['mesages'];
}

if ($messages !== false) {
	foreach ($messages as $key => $message) {
		if (!$staff) {
			if ($message->status > 3 && $message->status != 7) {
				continue;
			}
		}

		$custom = '';
		$reference = '';

		/* TODO Operator Username / Firstname
		$names = array();
		if ($message->status > 0) {
			if (!array_key_exists($message->username, $names)) {
				// Operator
				$operator = Operator::where('username', $message->username)
					->find_one();

				if ($operator !== false) {
					$message->username = $operator->firstname;
					$names[$message->username] = $operator->firstname;
				}
			} else {
				$message->username = $names[$message->username];
			}
		}
		*/

		// Integration
		if ($message->status == -4) {
			$integration = Custom::where_id_is($message->align)->find_one();

			if ($integration !== false) {
				$custom = $integration->custom;
				$reference = $integration->reference;
			}
		}

		$datetime = new DateTime($message->datetime);
		$message->datetime = $datetime->format('c');

		if ($XML) {
			if ($custom > 0 && !empty($reference)) {
?>
<Message ID="<?php echo($message->id); ?>" Datetime="<?php echo($message->datetime); ?>" Custom="<?php echo($custom); ?>" Reference="<?php echo(xmlattribinvalidchars($reference)); ?>" Align="<?php echo($message->align); ?>" Status="<?php echo($message->status); ?>" Username="<?php echo(xmlattribinvalidchars($message->username)) ?>"><?php echo(xmlelementinvalidchars($message->message)); ?></Message>
<?php
			} else {
				if ($staff) {

					$operator = Operator::where_id_is($message->from)->find_one();
					if ($operator !== false) {

						$account = Operator::where_id_is((int)$message->from)->find_one();
						if ($account !== false) {
							$name = $account->firstname;
						}

?>
<Message ID="<?php echo($message->id); ?>" From="<?php echo($message->from); ?>" To="<?php echo($message->to); ?>" Name="<?php echo($name); ?>" Datetime="<?php echo($message->datetime); ?>" Align="<?php echo($message->align); ?>" Status="<?php echo($message->status); ?>"><?php echo(xmlelementinvalidchars($message->message)); ?></Message>
<?php
					}

				} else {
?>
<Message ID="<?php echo($message->id); ?>" Datetime="<?php echo($message->datetime); ?>" Align="<?php echo($message->align); ?>" Status="<?php echo($message->status); ?>" Username="<?php echo(xmlattribinvalidchars($message->username)) ?>"><?php echo(xmlelementinvalidchars($message->message)); ?></Message>
<?php
				}
			}
		}
		else {
			if ($staff) {
				$operator = Operator::where_id_is($message->from)->find_one();
				if ($operator !== false) {
					$messagesjson[] = array(
						'ID' => (int)$message->id,
						'From' => $message->from,
						'To' => $message->to,
						'Name' => $operator->firstname,
						'Content' => $message->message,
						'Datetime' => $message->datetime,
						'Align' => $message->align,
						'Status' => $message->status
					);
				}
			} else {
				$messagesjson[] = array(
					'ID' => (int)$message->id,
					'Content' => $message->message,
					'Datetime' => $message->datetime,
					'Align' => $message->align,
					'Status' => $message->status,
					'Username' => $message->username
				);
			}
		}
	}
}
			if ($XML) {
?>
</Messages>
<?php
			}
			else {
				$chat['Message'] = $messagesjson;
				$chats[] = $chat;
			}
		}
		if ($XML) {
?>
</MultipleMessages>
<?php
		}
		else {

			$results = $hooks->run('MessagesCompleted', array('chats' => $chats, 'type' => 'json'));
			if (!empty($results) && !empty($results['chats'])) {
				$chats = $results['chats'];
			}

			header('Content-type: application/json; charset=utf-8');
			$json = array('MultipleMessages' => array('Messages' => $chats));
			$json = json_encode($json);
			echo($json);
		}
	}
}

function Operators() {

	global $_OPERATOR;
	global $_SETTINGS;
	global $XML;
	global $hooks;
	global $version;

	if (!isset($_REQUEST['ID'])){ $_REQUEST['ID'] = ''; }
	if (!isset($_REQUEST['User'])){ $_REQUEST['User'] = ''; }
	if (!isset($_REQUEST['Firstname'])){ $_REQUEST['Firstname'] = ''; }
	if (!isset($_REQUEST['Lastname'])){ $_REQUEST['Lastname'] = ''; }
	if (!isset($_REQUEST['CurrentPassword'])){ $_REQUEST['CurrentPassword'] = ''; }
	if (!isset($_REQUEST['NewPassword'])){ $_REQUEST['NewPassword'] = ''; }
	if (!isset($_REQUEST['Email'])){ $_REQUEST['Email'] = ''; }
	if (!isset($_REQUEST['Department'])){ $_REQUEST['Department'] = ''; }
	if (!isset($_REQUEST['Privilege'])){ $_REQUEST['Privilege'] = ''; }
	if (!isset($_REQUEST['Disabled'])){ $_REQUEST['Disabled'] = ''; }
	if (!isset($_REQUEST['Status'])){ $_REQUEST['Status'] = ''; }
	if (!isset($_REQUEST['Cached'])){ $_REQUEST['Cached'] = ''; }
	if (!isset($_REQUEST['Version'])){ $_REQUEST['Version'] = ''; }
	if (!isset($_REQUEST['Data'])){ $_REQUEST['Data'] = ''; }

	// Password Hash
	$hash = '';
	$password = $_REQUEST['NewPassword'];

	if (empty($_REQUEST['Version']) && defined('AUTHVERSION')) {
		$_REQUEST['Version'] = AUTHVERSION;
	}

	// Hash Operator Password
	if (!empty($_REQUEST['Version']) && !empty($password)) {
		$version = $_REQUEST['Version'];
		list($major, $minor) = explode('.', $version);
		if ((int)$major >= 4) {
			if (strlen($password) > 72) {
				$hash = '';
			} else {
				$hasher = new PasswordHash(8, true);
				$hash = $hasher->HashPassword($password);
				if (strlen($hash) < 20) {
					$hash = '';
				}
			}
		} else {
			if (function_exists('hash')) {
				if (in_array('sha512', hash_algos())) {
					$hash = hash('sha512', $password);
				}
				elseif (in_array('sha1', hash_algos())) {
					$hash = hash('sha1', $password);
				}
			} else if (function_exists('mhash') && mhash_get_hash_name(MHASH_SHA512) != false) {
				$hash = bin2hex(mhash(MHASH_SHA512, $password));
			} else if (function_exists('sha1')) {
				$hash = sha1($password);
			}
		}
	}

	if ($_OPERATOR['ID'] == $_REQUEST['ID']) {
		$hooks->run('EditAccount', array('id' => $_REQUEST['ID'], 'data' => $_REQUEST['Data']));
	}

	if (!empty($_REQUEST['ID']) && empty($_REQUEST['Data'])) {

		// Editing Own Account
		if ($_OPERATOR['ID'] == $_REQUEST['ID']) {

			// Block Permission Elevation
			if ($_REQUEST['Privilege'] < $_OPERATOR['PRIVILEGE']) {
				$_REQUEST['Privilege'] = $_OPERATOR['PRIVILEGE'];
			}

			// Ignore -1 Privilege to Full Administrator
			if ($_OPERATOR['PRIVILEGE'] < 0 && $_REQUEST['Privilege'] == 0) {
				$_REQUEST['Privilege'] = -1;
			}

		}
		else {
			// Other Access Levels Excluding Full / Department Administrator
			if ($_OPERATOR['PRIVILEGE'] > 1) {

				if ($XML) {
					header('Content-type: text/xml; charset=utf-8');
					echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");

?>
<Operators xmlns="urn:LiveHelp" />
<?php
				}
				else {
					header('Content-type: application/json; charset=utf-8');
					$data = array('Operators' => null);
					$json = json_encode($data);
					echo($json);
				}
				exit();
			}
		}

		// Update Existing Account
		if (!empty($_REQUEST['ID']) && !empty($_REQUEST['User']) && !empty($_REQUEST['Firstname']) && !empty($_REQUEST['Email']) && !empty($_REQUEST['Department']) && $_REQUEST['Privilege'] != '' && $_REQUEST['Disabled'] != '') {

			// Update Username
			$operator = Operator::where_id_is($_REQUEST['ID'])->find_one();

			if ($operator !== false) {
				if ($_REQUEST['User'] != $operator->username) {
					// Update Messages
					$messages = Message::where('username', $operator->username)
						->where_not_equal('status', 0)
						->find_many();

					foreach ($messages as $key => $message) {
						$message->username = $_REQUEST['User'];
						$message->save();
					}

					// Update Operator Messages
					$messages = OperatorMessage::where('from', $operator->id)
						->where('to', $_OPERATOR['ID'])
						->find_many();

					foreach ($messages as $key => $message) {
						$message->username = $_REQUEST['User'];
						$message->save();
					}
				}
			}

			// Uploaded Operator Image
			$upload = isset($_FILES['files']) ? $_FILES['files'] : null;
			if ($upload && is_array($upload['tmp_name'])) {
				// Upload File
				$file = $upload['tmp_name'][0];

				// Validate Image
				list($width, $height) = @getimagesize($file);
				if ($width >= 100 && $width <= 300 && $height >= 100 && $height <= 300) {
					if (file_exists('../plugins/rackspace/functions.php')) {
						require '../plugins/rackspace/functions.php';
						$url = processImage((int)$_REQUEST['ID'], $_REQUEST['User'], $file);
						$_REQUEST['Image'] = '';
					} else {
						$content = file_get_contents($file);
						$_REQUEST['Image'] = base64_encode($content);
					}
				}
			}

			$previousemail = false;
			$operator = Operator::where_id_is((int)$_REQUEST['ID'])->find_one();

			// Full Administrator / Department Administrator
			if ($_OPERATOR['PRIVILEGE'] < 2) {

				// Previous Email
				$previousemail = $operator->email;

				// Update Account
				$operator->username = $_REQUEST['User'];
				$operator->firstname = $_REQUEST['Firstname'];
				$operator->lastname = $_REQUEST['Lastname'];
				$operator->email = $_REQUEST['Email'];
				$operator->department = $_REQUEST['Department'];
				$operator->privilege = $_REQUEST['Privilege'];
				$operator->disabled = $_REQUEST['Disabled'];

				// Update Password
				if (!empty($hash)) {
					$operator->password = $hash;
				}

				// Update Image
				if (isset($_REQUEST['Image'])) {
					$operator->image = $_REQUEST['Image'];
					$operator->updated = date('Y-m-d H:i:s', time());
				}

			} else {

				// Previous Email
				$previousemail = $operator->email;

				// Update Account / Other Access Levels
				$operator->username = $_REQUEST['User'];
				$operator->firstname = $_REQUEST['Firstname'];
				$operator->lastname = $_REQUEST['Lastname'];
				$operator->email = $_REQUEST['Email'];
				$operator->disabled = $_REQUEST['Disabled'];

				// Update Image
				if (isset($_REQUEST['Image'])) {
					$operator->image = $_REQUEST['Image'];
					$operator->updated = date('Y-m-d H:i:s', time());
				}
			}

			// Check Unique Email and Username
			$username = Operator::where('username', $_REQUEST['User'])
				->where_not_equal('id', (int)$_REQUEST['ID'])
				->find_one();

			$email = Operator::where('email', $_REQUEST['Email'])
				->where_not_equal('id', (int)$_REQUEST['ID'])
				->find_one();

			// Save Account
			$result = false;
			if ($username === false && $email === false) {

				// Edit Account Hook
				$type = ($XML) ? 'xml' : 'json';
				$hooks->run('EditAccount', array('account' => $operator, 'email' => $previousemail, 'type' => $type));

				// Save Account
				$result = $operator->save();
			}

			if ($result == false) {

				if ($XML) {
					header('Content-type: text/xml; charset=utf-8');
					echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");

?>
<Operators xmlns="urn:LiveHelp" />
<?php
				}
				else {
					header('Content-type: application/json; charset=utf-8');
					$data = array('Operators' => null);
					$json = json_encode($data);
					echo($json);
				}
				exit();
			}

		}
		elseif (!empty($_REQUEST['NewPassword'])) {  // Change password

			$validated = false;

			// Other Access Levels / Confirm Current Password
			if ($_OPERATOR['PRIVILEGE'] > 0 && !empty($_REQUEST['CurrentPassword'])) {

				// Operator
				$operator = Operator::where_id_is((int)$_REQUEST['ID'])->find_one();
				$password = $_REQUEST['CurrentPassword'];

				// v4.0 Password
				$hasher = new PasswordHash(8, true);
				$check = $hasher->CheckPassword($password, $operator->password);

				// Legacy Hashes
				$legacy = '';
				if (substr($operator->password, 0, 3) != '$P$') {
					switch (strlen($operator->password)) {
						case 40: // SHA1
							$legacy = sha1($password);
							break;
						case 128: // SHA512
							if (function_exists('hash')) {
								if (in_array('sha512', hash_algos())) {
									$legacy = hash('sha512', $password);
								} else if (in_array('sha1', hash_algos())) {
									$legacy = hash('sha1', $password);
								}
							} else if (function_exists('mhash') && mhash_get_hash_name(MHASH_SHA512) != false) {
								$legacy = bin2hex(mhash(MHASH_SHA512, $password));
							}
							break;
						default: // MD5
							$legacy = md5($password);
							break;
					}
				}

				// Process Legacy Password
				$password = $hooks->run('LoginCustomHash', $password);

				if ((!empty($version) && $version >= 4.0 && ($check || $operator->password == $legacy)) || $operator->password == $password) {
					$validated = true;
				}

			}

			// Full Admnistrator
			if ($_OPERATOR['PRIVILEGE'] <= 0 || $validated !== false) {

				$hash = $_REQUEST['NewPassword'];
				if (isset($_REQUEST['Version']) && $_REQUEST['Version'] >= 4.0) {
					$hasher = new PasswordHash(8, true);
					$hash = $hasher->HashPassword($hash);
				}

				$result = false;
				$operator = Operator::where_id_is((int)$_REQUEST['ID'])->find_one();
				if ($operator !== false) {
					$operator->password = $hash;
					$result = $operator->save();
				}

				if ($result == false) {

					if ($XML) {
						header('Content-type: text/xml; charset=utf-8');
						echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");

?>
<Operators xmlns="urn:LiveHelp" />
<?php
					}
					else {
						header('Content-type: application/json; charset=utf-8');
						$data = array('Operators' => null);
						$json = json_encode($data);
						echo($json);
					}
					exit();
				}

			} elseif ($validated == false) {

				// Forbidden - Incorrect Password
				if (strpos(php_sapi_name(), 'cgi') === false) { header('HTTP/1.0 403 Forbidden'); } else { header('Status: 403 Forbidden'); }
				exit();

			} else {

				if ($XML) {
					header('Content-type: text/xml; charset=utf-8');
					echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");

?>
<Operators xmlns="urn:LiveHelp" />
<?php
				}
				else {
					header('Content-type: application/json; charset=utf-8');
					$data = array('Operators' => null);
					$json = json_encode($data);
					echo($json);
				}
				exit();
			}
		}
		else {  // Delete Account

			if ($_OPERATOR['ID'] != $_REQUEST['ID']) {

				$operator = Operator::where_id_is((int)$_REQUEST['ID'])
					->where_not_equal('privilege', -1)
					->find_one();

				$result = $operator->delete();
				if ($result == false) {

					if ($XML) {
						header('Content-type: text/xml; charset=utf-8');
						echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<Operators xmlns="urn:LiveHelp" />
<?php
					}
					else {
						header('Content-type: application/json; charset=utf-8');
						$data = array('Operators' => null);
						$json = json_encode($data);
						echo($json);
					}
					exit();
				}
			}
			else {
				if ($XML) {
					header('Content-type: text/xml; charset=utf-8');
					echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<Operators xmlns="urn:LiveHelp" />
<?php
				}
				else {
					header('Content-type: application/json; charset=utf-8');
					$data = array('Operators' => null);
					$json = json_encode($data);
					echo($json);
				}
				exit();
			}

		}
	}
	else {

		// Full Administrator / Department Administrator
		if ($_OPERATOR['PRIVILEGE'] < 2) {

			// Add Account
			if ($_REQUEST['User'] != '' && $_REQUEST['Firstname'] != '' && $_REQUEST['NewPassword'] != '' && $_REQUEST['Email'] != '' && $_REQUEST['Department'] != '' && $_REQUEST['Privilege'] != '' && $_REQUEST['Disabled'] != '') {

				if ($_OPERATOR['PRIVILEGE'] > 0 && $_REQUEST['Privilege'] == 0) {
					if ($XML) {
						header('Content-type: text/xml; charset=utf-8');
						echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<Operators xmlns="urn:LiveHelp" />
<?php
					}
					else {
						header('Content-type: application/json; charset=utf-8');
						$data = array('Operators' => null);
						$json = json_encode($data);
						echo($json);
					}
					exit();
				}

				/* TODO Hosted Account / Operator Limit / Solution: Add $_SETTINGS['OPERATORLIMIT']
				$operators = Operator::count();

				if ($operators !== false) {
					$total = $operators;
					if ($total == $operators) {

						if ($XML) {
							header('Content-type: text/xml; charset=utf-8');
							echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<Operators xmlns="urn:LiveHelp" />
<?php
						}
						else {
							header('Content-type: application/json; charset=utf-8');
							$data = array('Operators' => null);
							$json = json_encode($data);
							echo($json);
						}
						exit();
					}
				}
				*/

				// Uploaded Operator Image
				$upload = isset($_FILES['files']) ? $_FILES['files'] : null;
				if ($upload && is_array($upload['tmp_name'])) {
					// Upload File
					$file = $upload['tmp_name'][0];

					// Validate Image
					list($width, $height) = @getimagesize($file);
					if ($width >= 100 && $width <= 300 && $height >= 100 && $height <= 300) {
						if (file_exists('../plugins/rackspacecloud/functions.php')) {
							require '../plugins/rackspacecloud/functions.php';
							$url = processImage((int)$_REQUEST['ID'], $_REQUEST['User'], $file);
							$_REQUEST['Image'] = '';
						} else {
							$content = file_get_contents($file);
							$_REQUEST['Image'] = base64_encode($content);
						}
					}
				}

				$result = false;
				if (!empty($hash)) {

					// Check Unique Email and Username
					$username = Operator::where('username', $_REQUEST['User'])->find_one();
					$email = Operator::where('email', $_REQUEST['Email'])->find_one();

					if ($username === false && $email === false) {

						$operator = Operator::create();
						$operator->username = $_REQUEST['User'];
						$operator->firstname = $_REQUEST['Firstname'];
						$operator->lastname = $_REQUEST['Lastname'];
						$operator->password = $hash;
						$operator->email = $_REQUEST['Email'];
						$operator->department = $_REQUEST['Department'];

						if (isset($_REQUEST['Image'])) {
							$operator->image = $_REQUEST['Image'];
						}

						$operator->updated = date('Y-m-d H:i:s', time());
						$operator->privilege = $_REQUEST['Privilege'];
						$operator->disabled = $_REQUEST['Disabled'];

						// Add Account Hook
						$type = ($XML) ? 'xml' : 'json';
						$hooks->run('AddAccount', array('account' => $operator, 'type' => $type));

						// Save Account
						$result = $operator->save();
					}

				}
				if ($result == false) {

					if ($XML) {
						header('Content-type: text/xml; charset=utf-8');
						echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");

?>
<Operators xmlns="urn:LiveHelp" />
<?php
					}
					else {
						header('Content-type: application/json; charset=utf-8');
						$data = array('Operators' => null);
						$json = json_encode($data);
						echo($json);
					}
					exit();
				}
			}
		}

	}

	if ($XML) {
		header('Content-type: text/xml; charset=utf-8');
		echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
	}
	else {
		header('Content-type: application/json; charset=utf-8');
	}

	$accounts = Operator::find_many();

	if ($accounts !== false) {
		if (isset($_SETTINGS['OPERATORLIMIT'])) {
			if ($XML) {
?>
<Operators xmlns="urn:LiveHelp" Limit="<?php echo($_SETTINGS['OPERATORLIMIT']) ?>">
<?php
			}
			else {
				$operators = array();
			}
		} else {
			if ($XML) {
?>
<Operators xmlns="urn:LiveHelp">
<?php
			}
			else {
				$operators = array();
			}
		}

		foreach ($accounts as $accountkey => $account) {

			$account = $hooks->run('AccountLoaded', $account);

			if (substr($account->password, 0, 3) != '$P$') {
				$length = strlen($account->password);
				switch ($length) {
					case 40: // SHA1
						$authentication = '2.0';
						break;
					case 128: // SHA512
						$authentication = '3.0';
						break;
					default: // MD5
						$authentication = '1.0';
						break;
				}
			} else {
				$authentication = '4.0';
			}

			$refresh = strtotime($account->refresh);
			if (!empty($_REQUEST['Cached'])) {
				$updated = strtotime($account->updated);
				$cached = strtotime($_REQUEST['Cached']);
				if ($updated - $cached <= 0 && strpos($account->image, 'https://') < 0) {
					$account->image = '';
				}
			}

			// Average Rating
			$ratings = Rating::where('user', $account->id)->find_many();

			if ($ratings !== false) {
				$rating = 0; $total = 0;
				foreach ($ratings as $ratingkey => $value) {
					if ($value->rating > 0) {
						$rating = $rating + (int)$value->rating;
						$total = $total++;
					}
				}
				if ($total > 0) {
					$rating = $rating / $total;
				} else {
					$rating = 'Unavailable';
				}
			} else {
				$rating = 'Unavailable';
			}

			if ($XML) {
?>
<Operator ID="<?php echo($account->id); ?>" Updated="<?php echo($account->updated); ?>" Authentication="<?php echo($authentication); ?>" Device="">
<Username><?php echo(xmlelementinvalidchars($account->username)); ?></Username>
<Firstname><?php echo(xmlelementinvalidchars($account->firstname)); ?></Firstname>
<Lastname><?php echo(xmlelementinvalidchars($account->lastname)); ?></Lastname>
<Email><?php echo(xmlelementinvalidchars($account->email)); ?></Email>
<Department><?php echo(xmlelementinvalidchars($account->department)); ?></Department>
<?php if (!empty($account->image)) { ?><Image><![CDATA[<?php echo(xmlelementinvalidchars($account->image)); ?>]]></Image><?php } ?>
<Datetime><?php echo(xmlelementinvalidchars($account->datetime)); ?></Datetime>
<Refresh><?php echo(xmlelementinvalidchars($account->refresh)); ?></Refresh>
<Privilege><?php echo($account->privilege); ?></Privilege>
<Disabled><?php echo($account->disabled); ?></Disabled>
<Status><?php echo($account->status()); ?></Status>
<Rating><?php echo(xmlelementinvalidchars($rating)); ?></Rating>
</Operator>
<?php
			}
			else {

				// Devices
				$devicesjson = array();
				if ((float)$_SETTINGS['SERVERVERSION'] >= 4.1) {
					$devices = Device::where('user', $account->id)
						->find_many();

					if ($devices !== false) {
						foreach ($devices as $devicekey => $device) {
							$data = array(
								'ID' => $device->id,
								'Datetime' => $device->datetime,
								'Device' => $device->device,
								'OS' => $device->os,
								'Token' => $device->token
							);
							$devicesjson[] = $data;
						}
					}
				}

				$operator = array(
					'ID' => $account->id,
					'Updated' => $account->updated,
					'Authentication' => $authentication,
					'Devices' => $devicesjson,
					'Username' => $account->username,
					'Firstname' => $account->firstname,
					'Lastname' => $account->lastname,
					'Email' => $account->email,
					'Department' => $account->department,
					'Datetime' => $account->datetime,
					'Refresh' => $account->refresh,
					'Privilege' => $account->privilege,
					'Disabled' => $account->disabled,
					'Status' => $account->status(),
					'Rating' => $rating
				);

				if ($account->id == $_OPERATOR['ID'] && isset($account->twofactor)) {
					$operator['TwoFactor'] = $account->twofactor;
				}

				// Image
				if (!empty($account->image)) {
					$operator['Image'] = $account->image;
				}

				$operators[] = $operator;
			}
		}
		if ($XML) {
?>
</Operators>
<?php
		}
		else {
			if (isset($_SETTINGS['OPERATORLIMIT'])) {
				$json = array('Operators' => array('Limit' => $_SETTINGS['OPERATORLIMIT'], 'Operator' => $operators));
			} else {
				$json = array('Operators' => array('Operator' => $operators));
			}
			$json = json_encode($json);
			echo($json);
		}
	}
	else {
		if ($XML) {
?>
<Operators xmlns="urn:LiveHelp"/>
<?php
		}
		else {
			$data = array('Operators' => null);
			$json = json_encode($data);
			echo($json);
		}
	}
}

function Statistics() {

	global $_SETTINGS;
	global $XML;
	global $hooks;

	if (!isset($_REQUEST['Timezone'])){ $_REQUEST['Timezone'] = $_SETTINGS['SERVERTIMEZONE']; }

	$hours = 0; $minutes = 0;
	$timezone = $_SETTINGS['SERVERTIMEZONE']; $from = ''; $to = '';
	if ($timezone != $_REQUEST['Timezone']) {

		$sign = substr($_REQUEST['Timezone'], 0, 1);
		$hours = substr($_REQUEST['Timezone'], -4, 2);
		$minutes = substr($_REQUEST['Timezone'], -2, 2);
		if ($minutes != 0) { $minutes = ($minutes / 0.6); }
		$local = $sign . $hours . $minutes;

		$sign = substr($timezone, 0, 1);
		$hours = substr($timezone, 1, 2);
		$minutes = substr($timezone, 3, 4);
		if ($minutes != 0) { $minutes = ($minutes / 0.6); }
		$remote = $sign . $hours . $minutes;

		// Convert to eg. +/-0430 format
		$hours = substr(sprintf("%04d", $local - $remote), 0, 2);
		$minutes = substr(sprintf("%04d", $local - $remote), 2, 4);
		if ($minutes != 0) { $minutes = ($minutes * 0.6); }
		$difference = ($hours * 60 * 60) + ($minutes * 60);

		if ($difference != 0) {
			$from = date('Y-m-d H:i:s', mktime(0, 0, 0, date('m'), date('d')-30, date('Y')));
			$to = date('Y-m-d H:i:s', mktime(24, 0, 0, date('m'), date('d'), date('Y')));
		}
	}

	if (empty($from) && empty($to)) {
		$from = date('Y-m-d H:i:s', mktime(0, 0, 0, date('m'), date('d')-30, date('Y')));
		$to = date('Y-m-d H:i:s', mktime(24, 0, 0, date('m'), date('d'), date('Y')));
	}

	if ($XML) {
		header('Content-type: text/xml; charset=utf-8');
		echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<Statistics xmlns="urn:LiveHelp">
<?php
	}
	else {
		header('Content-type: application/json; charset=utf-8');
	}

	// Visitors Statistics - 30 days
	$dates = array_pad(array(), 30, 0);
	$data = ''; $start = '';

	$seconds = ($hours * 60 * 60) + ($minutes * 60);
	$date = date('Y-m-d H:i:s', time() + $seconds);

	$start = mktime(0, 0, 0, substr($date, 5, 2), substr($date, 8, 2), substr($date, 0, 4));
	$end = mktime(23, 59, 59, substr($date, 5, 2), substr($date, 8, 2), substr($date, 0, 4));

	// Visitor Statistics Hook
	$statistics = false;
	$results = $hooks->run('VisitorStatistics', array('date' => date('Y-m-d H:i:s', $end - $seconds), 'visitors' => array()));
	if (!empty($results['visitors'])) {
		$statistics = $results['visitors'];
	}

	// Visitors
	$i = 0;
	if (is_array($statistics)) {
		$dates = $statistics;
	} else {
		foreach ($dates as $key => $date) {
			// Daily Visitors
			$visitors = Visitor::where_gte('datetime', date('Y-m-d H:i:s', $start - $seconds - ($key * 86400)))
				->where_lte('datetime', date('Y-m-d H:i:s', $end - $seconds - ($key * 86400)))
				->count();

			$dates[$key] = $visitors;
		}
	}

	$date = date('Y-m-d H:i:s', time() + $seconds);
	$start = date('Y-m-d', mktime(0, 0, 0, substr($date, 5, 2), substr($date, 8, 2) - 30, substr($date, 0, 4)));

	if ($XML) {
		$data = implode(', ', $dates);
?>
	<Visitors Date="<?php echo(xmlattribinvalidchars($start)); ?>" Data="<?php echo(xmlattribinvalidchars($data)); ?>"/>
<?php
	} else {
		$data = array('Date' => $start, 'Data' => $dates);
		$visitors = $data;
	}

	// Chats
	$chats = Chat::where_gt('datetime', date('Y-m-d H:i:s', time() + $seconds - (30 * 86400)))
		->find_many();

	if ($chats !== false) {
		$duration = array();
		foreach ($chats as $key => $chat) {
			// Messages
			if ($chat->messages()->count() > 0) {
				$duration[] = strtotime($chat->refresh) - strtotime($chat->datetime);
			}
		}

		if (count($duration) > 0) {
			sort($duration);
		} else {
			$duration[] = 0;
		}

		if ($XML) {
			$data = implode(', ', $duration);
?>
	<Duration Data="<?php echo(xmlattribinvalidchars($data)); ?>"/>
<?php
		} else {
			$duration = array('Data' => $duration);
		}
	}

	// Chat Statistics - 30 days
	$dates = array();
	$data = ''; $start = '';
	for ($i = 29; $i >= 0; $i--) {
		$time = mktime(0, 0, 0, substr($date, 5, 2), substr($date, 8, 2) - $i, substr($date, 0, 4));
		$dates[date('Y-m-d', $time)] = 0;
	}

	if ($chats !== false) {
		foreach ($chats as $key => $chat) {
			// Messages
			if ($chat->messages()->count() > 0) {
				$date = date('Y-m-d', strtotime($chat->datetime) + $seconds);
				if (isset($dates[$date])) {
					$dates[$date] = (int)$dates[$date] + 1;
				}
			}
		}

		$date = date('Y-m-d H:i:s', time() + $seconds);
		$start = date('Y-m-d', mktime(0, 0, 0, substr($date, 5, 2), substr($date, 8, 2) - 30, substr($date, 0, 4)));

		if ($XML) {
			$data = implode(', ', $dates);
?>
	<Chats Date="<?php echo(xmlattribinvalidchars($start)); ?>" Data="<?php echo(xmlattribinvalidchars($data)); ?>"/>
<?php
		} else {
			$data = array();
			foreach ($dates as $key => $row) {
				$data[] = (int)$row;
			}
			$data = array('Date' => $start, 'Data' => $data);
			$chatsjson = $data;
		}
	}

	// Chats - Weekday Average
	if ($chats !== false) {
		$data = array();
		$days = array('Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');

		for ($i = 0; $i < 7; $i++) {
			$data[$i] = array('Day' => $days[$i], 'Total' => 0, 'Average' => 0);
		}

		// Daily Chat Totals
		$total = array_fill(0, 7, 0);
		foreach ($chats as $key => $chat) {
			$day = (int)date('w', strtotime($chat->datetime) + $seconds);
			$total[$day] = (int)$total[$day] + 1;
			$average = 0;
			$data[$day] = array('Day' => $days[$day], 'Total' => $total[$day], 'Average' => $average);
		}

		// Daily Chat Averages
		$weeks = array_fill(0, 7, 0);
		for ($i = 29; $i >= 0; $i--) {
			$time = mktime(0, 0, 0, substr($date, 5, 2), substr($date, 8, 2) - $i, substr($date, 0, 4));
			$day = date('w', $time);
			$weeks[$day] = $weeks[$day] + 1;
		}
		foreach ($weeks as $key => $week) {
			$data[$key]['Average'] = $data[$key]['Total'] / $week;
		}

		if ($_REQUEST['Format'] == 'json') {
			$chatsjson['Weekday'] = $data;
		}
	}

	// Rating Statistics - 30 Days
	$excellent = 0;
	$verygood= 0;
	$good = 0;
	$poor = 0;
	$verypoor = 0;
	$unrated = 0;

	if ($chats !== false) {
		foreach ($chats as $key => $chat) {
			$rating = $chat->rating()->find_one();
			if ($rating != false) {
				switch((int)$rating->rating) {
					case 5:
						$excellent = $excellent + 1;
						break;
					case 4:
						$verygood = $verygood + 1;
						break;
					case 3:
						$good = $good + 1;
						break;
					case 2:
						$poor = $poor + 1;
						break;
					case 1:
						$verypoor = $verypoor + 1;
						break;
					default:
						$unrated = $unrated + 1;
						break;
				}
			}
		}

		if ($XML) {
?>
	<Rating Excellent="<?php echo($excellent); ?>" VeryGood="<?php echo($verygood); ?>" Good="<?php echo($good); ?>" Poor="<?php echo($poor); ?>" VeryPoor="<?php echo($verypoor); ?>" Unrated="<?php echo($unrated); ?>"/>
<?php
		} else {
			$rating = array('Excellent' => $excellent, 'VeryGood' => $verygood, 'Good' => $good, 'Poor' => $poor, 'VeryPoor' => $verypoor, 'Unrated' => $unrated);
		}
	}

	if ($XML) {
?>
</Statistics>
<?php
	} else {
		$statistics = array('Visitors' => $visitors, 'Chats' => $chatsjson, 'Duration' => $duration, 'Rating' => $rating);
		$json = array('Statistics' => $statistics);
		$json = json_encode($json);
		echo($json);
	}

}

function History() {

	global $_SETTINGS;
	global $_OPERATOR;
	global $XML;
	global $hooks;

	if (!isset($_REQUEST['StartDate'])){ $_REQUEST['StartDate'] = ''; }
	if (!isset($_REQUEST['EndDate'])){ $_REQUEST['EndDate'] = ''; }
	if (!isset($_REQUEST['Timezone'])){ $_REQUEST['Timezone'] = ''; }
	if (!isset($_REQUEST['Transcripts'])){ $_REQUEST['Transcripts'] = ''; }
	if (!isset($_REQUEST['ID'])){ $_REQUEST['ID'] = ''; }
	if (!isset($_REQUEST['Version'])){ $_REQUEST['Version'] = ''; }

	if ($XML) {
		header('Content-type: text/xml; charset=utf-8');
		echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
	} else {
		header('Content-type: application/json; charset=utf-8');
	}

	// View History if authorized
	if ($_OPERATOR['PRIVILEGE'] > 2) {
		if ($_REQUEST['Transcripts'] == '') {
			if ($XML) {
?>
<VisitorHistory xmlns="urn:LiveHelp"/>
<?php
			} else {
				$history = array('VisitorHistory' => null);
				$json = json_encode($history);
				echo($json);
			}
		exit();
		}
	}

	// Live Help Messenger 2.95 Compatibility
	if (isset($_REQUEST['Date'])) {
		list($from_year, $from_month, $from_day) = explode('-', $_REQUEST['Date']);
		list($to_year, $to_month, $to_day) = explode('-', $_REQUEST['Date']);
	} else {
		list($from_year, $from_month, $from_day) = explode('-', $_REQUEST['StartDate']);
		list($to_year, $to_month, $to_day) = explode('-', $_REQUEST['EndDate']);
	}

	$difference = 0;
	$timezone = $_SETTINGS['SERVERTIMEZONE']; $from = ''; $to = ''; $fromtime = ''; $totime = '';
	if ($timezone != $_REQUEST['Timezone']) {

		$sign = substr($_REQUEST['Timezone'], 0, 1);
		$hours = substr($_REQUEST['Timezone'], -4, 2);
		$minutes = substr($_REQUEST['Timezone'], -2, 2);
		if ($minutes != 0) { $minutes = ($minutes / 0.6); }
		$local = $sign . $hours . $minutes;

		$sign = substr($timezone, 0, 1);
		$hours = substr($timezone, 1, 2);
		$minutes = substr($timezone, 3, 4);
		if ($minutes != 0) { $minutes = ($minutes / 0.6); }
		$remote = $sign . $hours . $minutes;

		// Convert to eg. +/-0430 format
		$hours = substr(sprintf("%04d", $local - $remote), 0, 2);
		$minutes = substr(sprintf("%04d", $local - $remote), 2, 4);
		if ($minutes != 0) { $minutes = ($minutes * 0.6); }
		$difference = ($hours * 60 * 60) + ($minutes * 60);

		if ($difference != 0) {
			$fromtime = mktime(0 - $hours, 0 - $minutes, 0, $from_month, $from_day, $from_year);
			$totime = mktime(0 - $hours, 0 - $minutes, 0, $to_month, $to_day + 1, $to_year);
			$from = date('Y-m-d H:i:s', $fromtime);
			$to = date('Y-m-d H:i:s', $totime);
		}
	}

	if (empty($from) && empty($to)) {
		$fromtime = mktime(0, 0, 0, $from_month, $from_day, $from_year);
		$totime = mktime(24, 0, 0, $to_month, $to_day, $to_year);
		$from = date('Y-m-d H:i:s', $fromtime);
		$to = date('Y-m-d H:i:s', $totime);
	}

	if ($_REQUEST['Transcripts'] != '') {

		if ($timezone != $_REQUEST['Timezone']) {
			if ($difference != 0) {
			$chats = Chat::where_gt('id', $_REQUEST['ID'])
				->where_gt('datetime', date('Y-m-d H:i:s', $fromtime + $difference))
				->where_lt('datetime', date('Y-m-d H:i:s', $totime + $difference))
				->order_by_asc('datetime')
				->find_many();
			}
		} else {
			$chats = Chat::where_gt('id', $_REQUEST['ID'])
				->where_gt('datetime', $from)
				->where_lt('datetime', $to)
				->find_many();
		}

		if ($XML) {
?>
<ChatHistory xmlns="urn:LiveHelp">
<?php
		} else {
			$visitors = array();
		}

		if ($chats !== false) {
			foreach ($chats as $key => $chat) {

				$id = $chat->id;
				$username = $chat->name;
				$department = $chat->department;
				$email = $chat->email;
				$datetime = $chat->datetime;
				$refresh = $chat->refresh;

				$active = 0;
				if ($chat !== false && $chat->status == 1) {
					$account = $chat->session()->order_by_desc('requested')->find_one()->operator()->find_one();
					if ($account !== false) {
						$active = $account->id;
					}
				} else {
					$active = $chat->status;
				}

				// Rating
				$rating = Rating::where('chat', $chat->id)->find_one();
				if ($rating != false) {
					$rating = $rating->rating;
				} else {
					$rating = 0;
				}

				// Operator Chat Message
				$message = Message::where('status', 1)
					->where('chat', $chat->id)
					->find_one();

				$operator = '';
				$user = false;
				if ($message !== false) {
					$user = $message->operator()->find_one();
					if ($user !== false) {
						$operator = (!empty($user->lastname)) ? sprintf('%s %s', $user->firstname, $user->lastname) : $user->firstname;
					}
				}

				// Limit History for Non-Administrator
				if ($user !== false) {
					if ($_OPERATOR['PRIVILEGE'] > 2) {
						if ($user->username !== $_REQUEST['Username']) {
							continue;
						}
					}
				} else {
					if ($_OPERATOR['PRIVILEGE'] > 2) {
						continue;
					}
				}

				// Visitor
				$visitor = false;
				if ($_SETTINGS['DATABASEVERSION'] > 10) {
					if (!empty($chat->id) && (int)$chat->id > 0) {
						$chatvisitor = ChatVisitor::where('chat', $chat->id)->find_one();
						if ($chatvisitor !== false) {
							if (is_numeric($chatvisitor->visitor) && (int)$chatvisitor->visitor > 0) {
								$visitor = $chatvisitor->visitor()->find_one();
							} else {
								$hash = false;
								$id = $chat->id;
								$prefix = 'visitor:' . ACCOUNT . ':';
								if (strpos($chatvisitor->visitor, $prefix) > -1) {
									$hash = str_replace($prefix, '', $chatvisitor->visitor);
									$visitor = $hooks->run('VisitorLoaded', array('id' => $hash, 'visitor' => $visitor));
								}
							}
						}
					}
				} else {
					if (!empty($chat->request) && (int)$chat->request > 0) {
						$visitor = Visitor::where_id_is($chat->request)->find_one();
					}
				}

				if ($visitor !== false) {
					$ipaddress = (isset($visitor->ipaddress) && !empty($visitor->ipaddress)) ? $visitor->ipaddress : 'Unavailable';
					$useragent = (isset($visitor->useragent) && !empty($visitor->useragent)) ? $visitor->useragent : 'Unavailable';
					$referer = (isset($visitor->referrer) && !empty($visitor->referrer)) ? $visitor->referrer : 'Unavailable';
					$city = (isset($visitor->city) && !empty($visitor->city)) ? $visitor->city : 'Unavailable';
					$state = (isset($visitor->state) && !empty($visitor->state)) ? $visitor->state : 'Unavailable';
					$country = (isset($visitor->country) && !empty($visitor->country)) ? $visitor->country : 'Unavailable';
					$url =  (isset($visitor->url) && !empty($visitor->url)) ? $visitor->url : 'Unavailable';
					$path = (isset($visitor->path) && !empty($visitor->path)) ? $visitor->path : 'Unavailable';

					// Page Path Limit
					if (is_array($path)) {
						$total = count($path);
					} else {
						$paths = explode('; ', $path);
						$total = count($paths);
						$paths = array_slice($paths, $total - 20);
						$path = implode('; ', $paths);
					}

					// Integration
					$custom = ''; $reference = '';
					$integration = Custom::where('request', $chat->request)->find_one();

					if ($integration !== false) {
						$custom = $integration->custom;
						$reference = $integration->reference;
					}

					if ($XML) {
?>
<Visitor ID="<?php echo($visitor->id); ?>" Session="<?php echo($id); ?>" Active="<?php echo($active); ?>" Username="<?php echo(xmlattribinvalidchars($username)); ?>" Email="<?php echo(xmlattribinvalidchars($email)); ?>" Custom="<?php echo(xmlattribinvalidchars($custom)); ?>" Reference="<?php echo(xmlattribinvalidchars($reference)); ?>">
<Date><?php echo(xmlelementinvalidchars($datetime)); ?></Date>
<Refresh><?php echo(xmlelementinvalidchars($refresh)); ?></Refresh>
<Hostname><?php echo(xmlelementinvalidchars($ipaddress)); ?></Hostname>
<UserAgent><?php echo(xmlelementinvalidchars($useragent)); ?></UserAgent>
<CurrentPage><?php echo(xmlelementinvalidchars($url)); ?></CurrentPage>
<SiteTime><?php echo($timezone); ?></SiteTime>
<Referrer><?php echo(xmlelementinvalidchars($referer)); ?></Referrer>
<Country City="<?php echo(xmlattribinvalidchars($city)); ?>" State="<?php echo(xmlattribinvalidchars($state)); ?>"><?php echo(xmlelementinvalidchars($country)); ?></Country>
<PagePath><?php echo(xmlelementinvalidchars($path)); ?></PagePath>
<Operator><?php echo(xmlelementinvalidchars($operator)); ?></Operator>
<Department><?php echo(xmlelementinvalidchars($department)); ?></Department>
<Rating><?php echo(xmlelementinvalidchars($rating)); ?></Rating>
</Visitor>
<?php
					} else {

						$visitor = array("ID" => $visitor->id, "Session" => $id, "Active" => $active, "Username" => $username, "Email" => $email, "Date" => $datetime, "Refresh" => $refresh, "Hostname" => $ipaddress, "UserAgent" => $useragent, "CurrentPage" => $url, "SiteTime" => $timezone, "Referrer" => $referer, "City" => $city, "State" => $state, "Country" => $country, "PagePath" => $path, "Operator" => $operator, "Department" => $department, "Rating" => $rating);
						$visitors[] = array("Visitor" => $visitor);

					}
				}
			}
		}

		if ($XML) {
?>
</ChatHistory>
<?php
		} else {

			$json = array("ChatHistory" => $visitors);
			echo(json_encode($json));
		}
	}
	else { // $_REQUEST['Transcripts'] == ''
		if ($timezone != $_REQUEST['Timezone']) {
			if ($difference != 0) {
				$visitors = Visitor::where_gt('id', $_REQUEST['ID'])
					->where_gt('datetime', date('Y-m-d H:i:s', $fromtime + $difference))
					->where_lt('datetime', date('Y-m-d H:i:s', $totime + $difference))
					->where('status', 0)
					->order_by_asc('request')
					->find_many();
			}
		} else {
			$visitors = Visitor::where_gt('id', $_REQUEST['ID'])
				->where_gt('datetime', $from)
				->where_lt('datetime', $to)
				->where('status', 0)
				->order_by_asc('request')
				->find_many();
		}

		if ($visitors !== false) {
?>
<VisitorHistory xmlns="urn:LiveHelp">
<?php
			foreach ($visitors as $key => $visitor) {
				$id = $visitor->id;
				$ipaddress = $visitor->ipaddress;
				$useragent = $visitor->useragent;
				$resolution = $visitor->resolution;
				$city = $visitor->city;
				$state = $visitor->state;
				$country = $visitor->country;
				$datetime = $visitor->datetime;
				$url = $visitor->url;
				$title = $visitor->title;
				$referer = $visitor->referrer;
				$path = $visitor->path;

				$pagetime = time() - strtotime($visitor->request);
				$sitetime = time() - strtotime($visitor->datetime);

				if ($pagetime < 0) { $pagetime = 0; }
				if ($sitetime < 0) { $sitetime = 0; }

				$pages = explode('; ', $path);
				$total = count($path);
				if ($total > 20) {
					$path = '';
					for ($i = $total - 20; $i < $total; $i++) {
						$path .= $pages[$i] . '; ';
					}
				}
?>
<Visitor ID="<?php echo($id); ?>">
<Hostname><?php echo(xmlelementinvalidchars($ipaddress)); ?></Hostname>
<UserAgent><?php echo(xmlelementinvalidchars($useragent)); ?></UserAgent>
<Resolution><?php echo(xmlelementinvalidchars($resolution)); ?></Resolution>
<Country City="<?php echo(xmlattribinvalidchars($city)); ?>" State="<?php echo(xmlattribinvalidchars($state)); ?>"><?php echo(xmlelementinvalidchars($country)); ?></Country>
<Date><?php echo(xmlelementinvalidchars($datetime)); ?></Date>
<PageTime><?php echo($pagetime); ?></PageTime>
<SiteTime><?php if (!isset($_REQUEST['Version'])) { echo($datetime); } else { echo($sitetime); } ?></SiteTime>
<CurrentPage><?php echo(xmlelementinvalidchars($url)); ?></CurrentPage>
<CurrentPageTitle><?php echo(xmlelementinvalidchars($title)); ?></CurrentPageTitle>
<Referrer><?php echo(xmlelementinvalidchars($referer)); ?></Referrer>
<PagePath><?php echo(xmlelementinvalidchars($path)); ?></PagePath>
</Visitor>
<?php
			}
?>
</VisitorHistory>
<?php
		}
		else {
?>
<VisitorHistory xmlns="urn:LiveHelp"/>
<?php
		}
	}

}

function Send() {

	global $_OPERATOR;
	global $_SETTINGS;
	global $XML;
	global $hooks;

	if (!isset($_REQUEST['ID'])){ $_REQUEST['ID'] = ''; }
	if (!isset($_REQUEST['UUID'])){ $_REQUEST['UUID'] = ''; }
	if (!isset($_REQUEST['Message'])){ $_REQUEST['Message'] = ''; }
	if (!isset($_REQUEST['Staff'])){ $_REQUEST['Staff'] = ''; }
	if (!isset($_REQUEST['Type'])){ $_REQUEST['Type'] = ''; }
	if (!isset($_REQUEST['Name'])){ $_REQUEST['Name'] = ''; }
	if (!isset($_REQUEST['Content'])){ $_REQUEST['Content'] = ''; }
	if (!isset($_REQUEST['Status'])){ $_REQUEST['Status'] = 1; }

	$result = '0';

	// Check if the message contains any content else return headers
	if (empty($_REQUEST['Message']) && empty($_REQUEST['Type']) && empty($_REQUEST['Name']) && empty($_REQUEST['Content'])) {
		if ($XML) {
			header('Content-type: text/xml; charset=utf-8');
			echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<SendMessage xmlns="urn:LiveHelp"/>
<?php
			exit();
		} else {
?>
{"SendMessage": null}
<?php
		}
	}

	// Accept Chat
	if (defined('OVERRIDEPENDING') && $_SETTINGS['LOGINDETAILS'] == 0) {
		$id = $_REQUEST['ID'];
		AcceptChat($id);
	}

	if ($_REQUEST['Type'] != '' && $_REQUEST['Name'] != '' && $_REQUEST['Content'] != '') {

		// Strip the slashes because slashes will be added to whole string
		$type = $_REQUEST['Type'];
		$name = stripslashes(trim($_REQUEST['Name']));
		$content = stripslashes(trim($_REQUEST['Content']));
		$operator = '';

		switch ($type) {
			case 'LINK':
			case 'HYPERLINK':
				$type = 2;
				$command = addslashes($name . " \r\n " . $content);
				break;
			case 'IMAGE':
				$type = 3;
				$command = addslashes($name . " \r\n " . $content);
				break;
			case 'PUSH':
				$type = 4;
				$command = addslashes($content);
				$operator = addslashes('The ' . $name . ' has been PUSHed to the visitor.');
				break;
			case 'JAVASCRIPT':
				$type = 5;
				$command = addslashes($content);
				$operator = addslashes('The ' . $name . ' has been sent to the visitor.');
				break;
			case 'FILE':
				$type = 6;
				$command = addslashes($content);
				//$operator = addslashes('The ' . $name . ' has been sent to the visitor.');
				break;
		}

		if (!empty($command)) {

			// Chat
			$chat = Chat::where_id_is((int)$_REQUEST['ID'])->find_one();

			$date = new DateTime();

			$message = Message::create();
			$message->chat = (int)$chat->id;
			$message->username = '';
			$message->datetime = $date->format('Y-m-d H:i:s');
			$message->message = $command;
			$message->align = 2;
			$message->status = $type;
			$id = $message->save();

			if (!empty($operator)) {
				$message = Message::create();
				$message->chat = (int)$chat->id;
				$message->username = '';
				$message->datetime = $date->format('Y-m-d H:i:s');
				$message->message = $operator;
				$message->align = 2;
				$message->status = -1;
				$id = $message->save();
			}

			if ($id != false) {
				$result = 1;
			}

			// Format Date
			$message->datetime = $date->format('c');

			$hooks->run('SendMessage', array('chat' => $chat, 'message' => $message, 'json' => false, 'guest' => false));
		}

	}

	// Format the message string
	$message = trim($_REQUEST['Message']);
	$uuid = $_REQUEST['UUID'];

	$json = false;
	if ($message !== '') {
		if (!$_REQUEST['Staff']) {

			// Chat
			if (is_numeric($_REQUEST['ID']) && (int)$_REQUEST['ID'] > 0) {
				$chat = Chat::where_id_is((int)$_REQUEST['ID'])->find_one();

				$date = new DateTime();

				// Send Message
				$message = Message::create();
				$message->chat = (int)$chat->id;
				$message->username = $_OPERATOR['USERNAME'];
				$message->datetime = $date->format('Y-m-d H:i:s');
				$message->message = $_REQUEST['Message'];
				$message->align = 1;
				$message->status = (int)$_REQUEST['Status'];
				$id = $message->save();

				if ($id != false) {
					$result = 1;

					$json['ID'] = $message->id();
					$json['Content'] = $message->message;
					$json['Datetime'] = $message->datetime;
					$json['Align'] = $message->align;
					$json['Status'] = $message->status;
					$json['Username'] = $message->username;
				}

				// Format Date
				$message->datetime = $date->format('c');
			} else {
				$chat = $_REQUEST['ID'];
				$message = $_REQUEST['Message'];
			}

			$args = $hooks->run('SendMessage', array('uuid' => $uuid, 'chat' => $chat, 'message' => $message, 'json' => $json, 'guest' => false));
			if ($args !== false && !empty($args['json'])) {
				$json = $args['json'];
			}
		}
		else {

			$user = Operator::where_id_is((int)$_REQUEST['ID'])->find_one();

			if (!isset($_REQUEST['Status'])) { $_REQUEST['Status'] = 1; }
			$date = new DateTime();

			// Send Operator-Operator Message
			$message = OperatorMessage::create();
			$message->from = (int)$_OPERATOR['ID'];
			$message->to = (int)$user->id;
			$message->datetime = $date->format('Y-m-d H:i:s');
			$message->message = $_REQUEST['Message'];
			$message->align = 1;
			$message->status = (int)$_REQUEST['Status'];
			$id = $message->save();

			if ($id != false) {
				$result = 1;

				$operator = Operator::where_id_is($message->from)->find_one();

				$json = array();
				$json['ID'] = $message->id();
				$json['From'] = $message->from;
				$json['To'] = $message->to;
				$json['Name'] = $operator->firstname;
				$json['Content'] = $message->message;
				$json['Datetime'] = $message->datetime;
				$json['Align'] = $message->align;
				$json['Status'] = $message->status;
			}

			// Format Date
			$message->datetime = $date->format('c');

			$hooks->run('SendOperatorMessage', array('uuid' => $uuid, 'user' => $user, 'message' => $message, 'guest' => false));
		}
	}

	if ($XML) {
		header('Content-type: text/xml; charset=utf-8');
		echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<SendMessage xmlns="urn:LiveHelp" Result="<?php echo($result); ?>"></SendMessage>
<?php
	} else {
		header('Content-type: application/json; charset=utf-8');
		echo(json_encode($json));
	}

}

function EmailChat() {

	global $_OPERATOR;
	global $_SETTINGS;
	global $XML;

	if (!isset($_REQUEST['ID'])){ $_REQUEST['ID'] = ''; }
	if (!isset($_REQUEST['Email'])){ $_REQUEST['Email'] = ''; }

	// Determine EOL
	$server = strtoupper(substr(PHP_OS, 0, 3));
	if ($server == 'WIN') {
		$eol = "\r\n";
	} elseif ($server == 'MAC') {
		$eol = "\r";
	} else {
		$eol = "\n";
	}

	// Language
	$language = file_get_contents('../locale/en/admin.json');
	if (file_exists('../locale/' . LANGUAGE . '/admin.json')) {
		$language = file_get_contents('../locale/' . LANGUAGE . '/admin.json');
	}
	$_LOCALE = json_decode($language, true);

	// Messages
	$messages = Message::where('chat', $_REQUEST['ID'])
		->order_by_asc('datetime')
		->find_many();

	$htmlmessages = ''; $textmessages = '';
	if ($messages !== false) {
		foreach ($messages as $key => $message) {
			if ($message->status <= 3 || $message->status == 7) {

				// Remove HTML code
				$content = striptags($message->message);

				// Operator
				if ($message->status) {
					$htmlmessages .= '<div style="color:#666666">' . $message->username . ' ' . $_LOCALE['says'] . ':</div> <div style="margin-left:15px; color:#666666;">' . $content . '</div>';
					$textmessages .= $message->username . ' ' . $_LOCALE['says'] . ':' . $eol . '	' . $content . $eol;
				}
				// Guest
				if (!$message->status) {
					$htmlmessages .= '<div>' . $message->username . ' ' . $_LOCALE['says'] . ':</div> <div style="margin-left: 15px;">' . $content . '</div>';
					$textmessages .= $message->username . ' ' . $_LOCALE['says'] . ':' . $eol . '	' . $content . $eol;
				}
			}
		}
	}

	$htmlmessages = preg_replace("/(\r\n|\r|\n)/", '<br/>', $htmlmessages);

	$html = <<<END
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<style type="text/css">
<!--

div, p {
	font-family: Calibri, Verdana, Arial, Helvetica, sans-serif;
	font-size: 14px;
	color: #000000;
}

//-->
</style>
</head>

<body>
<p><img src="{$_SETTINGS['CHATTRANSCRIPTHEADERIMAGE']}" alt="{$_LOCALE['chattranscript']}" /></p>
<p><strong>{$_LOCALE['chattranscript']}:</strong></p>
<p>$htmlmessages</p>
<p><img src="{$_SETTINGS['CHATTRANSCRIPTFOOTERIMAGE']}" alt="{$_SETTINGS['NAME']}" /></p>
</body>
</html>
END;

	$email = $_SETTINGS['EMAIL'];
	if (!empty($_REQUEST['Email'])) {
		$email = $_REQUEST['Email'];
	}

	$subject = $_SETTINGS['NAME'] . ' ' . $_LOCALE['chattranscript'];
	$result = Email::send($email, $_SETTINGS['EMAIL'], $_SETTINGS['NAME'], $subject, $html, EmailType::HTML);

}

function Calls() {

	global $_SETTINGS;
	global $XML;

	if (!isset($_REQUEST['ID'])){ $_REQUEST['ID'] = ''; }
	if (!isset($_REQUEST['Operator'])){ $_REQUEST['Operator'] = ''; }
	if (!isset($_REQUEST['Status'])){ $_REQUEST['Status'] = ''; }

	if (!empty($_REQUEST['ID']) && !empty($_REQUEST['Status'])) {

		// Call
		$call = Call::where_id_is((int)$_REQUEST['ID'])
			->find_one();

		$call->operator = $_REQUEST['Operator'];
		$call->status = $_REQUEST['Status'];
		$call->save();
	}


	$calls = Call::where_not_equal(5)
		->order_by_asc('datetime')
		->find_many();

	if ($calls !== false) {

		header('Content-type: text/xml; charset=utf-8');
		echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<Calls xmlns="urn:LiveHelp" IPAddress="<?php echo(ip_address()); ?>">
<?php
		foreach ($calls as $key => $call) {
?>
<Call ID="<?php echo($call->id); ?>" Name="<?php echo(xmlattribinvalidchars($call->name)); ?>" Email="<?php echo(xmlattribinvalidchars($call->email)); ?>" Operator="<?php echo(xmlattribinvalidchars($call->operator)); ?>" Status="<?php echo(xmlattribinvalidchars($call->status)); ?>">
<Datetime><?php echo($call->datetime); ?></Datetime>
<Country><?php echo(xmlelementinvalidchars($call->country)); ?></Country>
<Timezone><?php echo(xmlelementinvalidchars($call->timezone)); ?></Timezone>
<Telephone Prefix="<?php echo(xmlattribinvalidchars($call->dial)); ?>"><?php echo(xmlelementinvalidchars($call->telephone)); ?></Telephone>
<Message><?php echo(xmlelementinvalidchars($call->message)); ?></Message>
</Call>
<?php
		}
?>
</Calls>
<?php
	} else {
		header('Content-type: text/xml; charset=utf-8');
		echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<Calls xmlns="urn:LiveHelp"/>
<?php
	}


}

function Responses() {

	global $_RESPONSES;
	global $_PLUGINS;
	global $_SETTINGS;
	global $XML;
	global $hooks;

	if (!isset($_REQUEST['ID'])){ $_REQUEST['ID'] = ''; }
	if (!isset($_REQUEST['Operator'])){ $_REQUEST['Operator'] = ''; }
	if (!isset($_REQUEST['Department'])){ $_REQUEST['Department'] = ''; }
	if (!isset($_REQUEST['ResponsesArray'])){ $_REQUEST['ResponsesArray'] = ''; }
	if (!isset($_REQUEST['Name'])){ $_REQUEST['Name'] = ''; }
	if (!isset($_REQUEST['Category'])){ $_REQUEST['Category'] = ''; }
	if (!isset($_REQUEST['Content'])){ $_REQUEST['Content'] = ''; }
	if (!isset($_REQUEST['Type'])){ $_REQUEST['Type'] = ''; }
	if (!isset($_REQUEST['Tags'])){ $_REQUEST['Tags'] = ''; }
	if (!isset($_REQUEST['Cached'])){ $_REQUEST['Cached'] = ''; }

	if (!empty($_REQUEST['ResponsesArray'])) {
		$lines = preg_split("/(\r\n|\r|\n)/", trim($_REQUEST['ResponsesArray']));

		// Add Responses
		foreach ($lines as $key => $line) {

			$id = ''; $name = ''; $category = ''; $content = ''; $type = ''; $tags = '';
			list($id, $name, $category, $content, $type, $tags) = explode('|', $line);

			// Add / Update Response
			if (!empty($name) && !empty($content)) {
				if (!empty($id)) {
					$response = Response::where_id_is($id)
						->find_one();

					if ($response !== false) {
						$response->name = $name;
						$response->category = $category;
						$response->type = $type;
						$response->content = $content;
						$response->tags = $tags;
						$response->datetime = date('Y-m-d H:i:s', time());
						$response->save();
					}
				}
				else {
					// Add Response
					$response = Response::create();
					$response->name = $name;
					$response->category = $category;
					$response->type = $type;
					$response->content = $content;
					$response->tags = $tags;
					$response->datetime = date('Y-m-d H:i:s', time());
					$response->save();
				}
			}

		}
	} else if (!empty($_REQUEST['Name']) && !empty($_REQUEST['Content']) && !empty($_REQUEST['Type'])) {
		$id = $_REQUEST['ID'];
		$name = $_REQUEST['Name'];
		$category = $_REQUEST['Category'];
		$content = $_REQUEST['Content'];
		$type = $_REQUEST['Type'];
		$tags = $_REQUEST['Tags'];

		// Add / Update Response
		if (!empty($id)) {
			// Response
			$response = Response::where_id_is($id)->find_one();

			if ($response !== false) {
				$response->name = $name;
				$response->category = $category;
				$response->type = $type;
				$response->content = $content;
				$response->tags = $tags;
				$response->datetime = date('Y-m-d H:i:s', time());
				$response->save();
			}
		}
		else {
			// Add Response
			$response = Response::create();
			$response->name = $name;
			$response->category = $category;
			$response->type = $type;
			$response->content = $content;
			$response->tags = $tags;
			$response->datetime = date('Y-m-d H:i:s', time());
			$response->save();
		}
	}

	if (!empty($_REQUEST['ID']) && empty($_REQUEST['Name']) && empty($_REQUEST['Content']) && empty($_REQUEST['Type'])) {
		$id = $_REQUEST['ID'];

		$response = Response::where_id_is((int)$_REQUEST['ID'])->find_one();
		$response->delete();
	}

	// Responses
	if (!empty($_REQUEST['Cached'])) {
		$responses = Response::where_gt('datetime', date('Y-m-d H:i:s', strtotime($_REQUEST['Cached'])))
			->order_by_asc('type')
			->order_by_asc('category')
			->order_by_asc('name')
			->find_many();
	} else {
		$responses = Response::order_by_asc('type')
			->order_by_asc('category')
			->order_by_asc('name')
			->find_many();
	}

	if ($_REQUEST['Format'] == 'json') {
		header('Content-type: application/json; charset=utf-8');

		$json = array();
		$text = array();
		$hyperlink = array();
		$image = array();
		$push = array();
		$javascript = array();
		$other = array();
		$lastupdated = '';

		if ($responses !== false && count($responses) > 0) {
			foreach ($responses as $key => $response) {

				// Tags
				if (!empty($response->tags)) {
					$tags = explode(';', $response->tags);
				} else {
					$tags = array();
				}

				// Last Updated
				if (empty($response->datetime)) { $lastupdated = $response->datetime; }
				if (strtotime($response->datetime) - strtotime($lastupdated) > 0) {
					$lastupdated = $response->datetime;
				}

				switch ((int)$response->type) {
					case 1: // Text
						$text[] = array('ID' => $response->id, 'Name' => $response->name, 'Content' => $response->content, 'Category' => $response->category, 'Type' => (int)$response->type, 'Tags' => $tags);
						break;
					case 2: // Hyperlink
						$hyperlink[] = array('ID' => $response->id, 'Name' => $response->name, 'Content' => $response->content, 'Category' => $response->category, 'Type' => (int)$response->type, 'Tags' => $tags);
						break;
					case 3: // Image
						$image[] = array('ID' => $response->id, 'Name' => $response->name, 'Content' => $response->content, 'Category' => $response->category, 'Type' => (int)$response->type, 'Tags' => $tags);
						break;
					case 4: // PUSH
						$push[] = array('ID' => $response->id, 'Name' => $response->name, 'Content' => $response->content, 'Category' => $response->category, 'Type' => (int)$response->type, 'Tags' => $tags);
						break;
					case 5: // JavaScript
						$javascript[] = array('ID' => $response->id, 'Name' => $response->name, 'Content' => $response->content, 'Category' => $response->category, 'Type' => (int)$response->type, 'Tags' => $tags);
						break;
				}
			}

			// Custom Responses Hook
			$other = $hooks->run('ResponsesCustom', 'json');
			if (!is_array($other)) {
				$other = '';
			}

			// Responses JSON
			$json['Responses'] = array('LastUpdated' => $lastupdated, 'Text' => $text, 'Hyperlink' => $hyperlink, 'Image' => $image, 'PUSH' => $push, 'JavaScript' => $javascript, 'Other' => $other);
			echo(json_encode($json));
			exit();

		} else {
			// Empty Responses JSON
			$json['Responses'] = array();
			echo(json_encode($json));
			exit();
		}

	}

	$text = array();
	$hyperlink = array();
	$image = array();
	$push = array();
	$javascript = array();
	if ($responses !== false && count($responses) > 0) {
		foreach ($responses as $key => $response) {
			switch((int)$response->type) {
				case 1: // Text
					$text[] = $response;
					break;
				case 2: // Hyperlink
					$hyperlink[] = $response;
					break;
				case 3: // Image
					$image[] = $response;
					break;
				case 4: // PUSH
					$push[] = $response;
					break;
				case 5: // JavaScript
					$javascript[] = $response;
					break;
			}
		}
	}

	header('Content-type: text/xml; charset=utf-8');
	echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");

?>
<Responses xmlns="urn:LiveHelp">
  <Text>
<?php

	if (is_array($text)) {
		while (count($text) > 0) {
			$response = $text[count($text) - 1];
			if ($response !== false) {
				$category = $response->category;

				if (!empty($category)) {
?>
	<Category Name="<?php echo(xmlattribinvalidchars($category)); ?>">
<?php
					for ($i = count($text) - 1; $i >= 0; $i--) {
						$response = $text[$i];
						if ($response->category == $category) {
?>
		<Response ID="<?php echo($response->id); ?>">
		  <Name><?php echo(xmlelementinvalidchars($response->name)); ?></Name>
		  <Content><?php echo(xmlelementinvalidchars($response->content)); ?></Content>
		  <Tags>
<?php
							$tags = explode(';', $response->tags);
							if (count($tags) > 0) {
								foreach ($tags as $key => $tag) {
?>
			<Tag><?php echo(xmlelementinvalidchars($tag)); ?></Tag>
<?php
								}
							}
?>
		  </Tags>
		</Response>
<?php
							array_splice($text, $i, 1);
						}
					}
?>
	</Category>
<?php
				} else {
?>
	<Response ID="<?php echo($response->id); ?>">
	  <Name><?php echo(xmlelementinvalidchars($response->name)); ?></Name>
	  <Content><?php echo(xmlelementinvalidchars($response->content)); ?></Content>
	  <Tags>
<?php
						$tags = explode(';', $response->tags);
						if (count($tags) > 0) {
							foreach($tags as $key => $tag) {
?>
		<Tag><?php echo(xmlelementinvalidchars($tag)); ?></Tag>
<?php
							}
						}
?>
	  </Tags>
	</Response>
<?php
					$popped = array_pop($text);
				}
			} else {
				$popped = array_pop($text);
			}
		}
	}
?>
  </Text>
  <Hyperlink>
<?php
	if (is_array($hyperlink)) {
		while (count($hyperlink) > 0) {
			$response = $hyperlink[count($hyperlink) - 1];
			if ($response !== false) {
				$category = $response->category;

				if (!empty($category)) {
?>
	<Category Name="<?php echo(xmlattribinvalidchars($category)); ?>">
<?php
					for($i = count($hyperlink) - 1; $i >= 0; $i--) {
						$response = $hyperlink[$i];
						if ($response->category == $category) {
?>
		<Response ID="<?php echo($response->id); ?>">
		  <Name><?php echo(xmlelementinvalidchars($response->name)); ?></Name>
		  <Content><?php echo(xmlelementinvalidchars($response->content)); ?></Content>
		  <Tags>
<?php
							$tags = explode(';', $response->tags);
							if (count($tags) > 0) {
								foreach($tags as $key => $tag) {
?>
			<Tag><?php echo(xmlelementinvalidchars($tag)); ?></Tag>
<?php
								}
							}
?>
		  </Tags>
		</Response>
<?php
							array_splice($hyperlink, $i, 1);
						}
					}
?>
	</Category>
<?php
				} else {
?>
	<Response ID="<?php echo($response->id); ?>">
	  <Name><?php echo(xmlelementinvalidchars($response->name)); ?></Name>
	  <Content><?php echo(xmlelementinvalidchars($response->content)); ?></Content>
	  <Tags>
<?php
					$tags = explode(';', $response->tags);
					if (count($tags) > 0) {
						foreach($tags as $key => $tag) {
?>
		<Tag><?php echo(xmlelementinvalidchars($tag)); ?></Tag>
<?php
						}
					}
?>
	  </Tags>
	</Response>
<?php
					$popped = array_pop($hyperlink);
				}
			} else {
				$popped = array_pop($hyperlink);
			}
		}
	}
?>
  </Hyperlink>
  <Image>
<?php
	if (is_array($image)) {
		while (count($image) > 0) {
			$response = $image[count($image) - 1];
			if ($response !== false) {
				$category = $response->category;

				if (!empty($category)) {
?>
	<Category Name="<?php echo(xmlattribinvalidchars($category)); ?>">
<?php
					for($i = count($image) - 1; $i >= 0; $i--) {
						$response = $image[$i];
						if ($response->category == $category) {
?>
		<Response ID="<?php echo($response->id); ?>">
		  <Name><?php echo(xmlelementinvalidchars($response->name)); ?></Name>
		  <Content><?php echo(xmlelementinvalidchars($response->content)); ?></Content>
		  <Tags>
<?php
							$tags = explode(';', $response->tags);
							if (count($tags) > 0) {
								foreach ($tags as $key => $tag) {
?>
			<Tag><?php echo(xmlelementinvalidchars($tag)); ?></Tag>
<?php
								}
							}
?>
		  </Tags>
		</Response>
<?php
							array_splice($image, $i, 1);
						}
					}
?>
	</Category>
<?php
				} else {
?>
	<Response ID="<?php echo($response->id); ?>">
	  <Name><?php echo(xmlelementinvalidchars($response->name)); ?></Name>
	  <Content><?php echo(xmlelementinvalidchars($response->content)); ?></Content>
	  <Tags>
<?php
					$tags = explode(';', $response->tags);
					if (count($tags) > 0) {
						foreach($tags as $key => $tag) {
?>
		<Tag><?php echo(xmlelementinvalidchars($tag)); ?></Tag>
<?php
						}
					}
?>
	  </Tags>
	</Response>
<?php
					$popped = array_pop($image);
				}
			} else {
				$popped = array_pop($image);
			}
		}
	}
?>
  </Image>
  <PUSH>
<?php
	if (is_array($push)) {
		while (count($push) > 0) {
			$response = $push[count($push) - 1];
			if ($response !== false) {
				$category = $response->category;

				if (!empty($category)) {
?>
	<Category Name="<?php echo(xmlattribinvalidchars($category)); ?>">
<?php
					for($i = count($push) - 1; $i >= 0; $i--) {
						$response = $push[$i];
						if ($response->category == $category) {
?>
		<Response ID="<?php echo($response->id); ?>">
		  <Name><?php echo(xmlelementinvalidchars($response->name)); ?></Name>
		  <Content><?php echo(xmlelementinvalidchars($response->content)); ?></Content>
		  <Tags>
<?php
							$tags = explode(';', $response->tags);
							if (count($tags) > 0) {
								foreach($tags as $key => $tag) {
?>
			<Tag><?php echo(xmlelementinvalidchars($tag)); ?></Tag>
<?php
								}
							}
?>
		  </Tags>
		</Response>
<?php
							array_splice($push, $i, 1);
						}
					}
?>
	</Category>
<?php
				} else {
?>
	<Response ID="<?php echo($response->id); ?>">
	  <Name><?php echo(xmlelementinvalidchars($response->name)); ?></Name>
	  <Content><?php echo(xmlelementinvalidchars($response->content)); ?></Content>
	  <Tags>
<?php
					$tags = explode(';', $response->tags);
					if (count($tags) > 0) {
						foreach ($tags as $key => $tag) {
?>
		<Tag><?php echo(xmlelementinvalidchars($tag)); ?></Tag>
<?php
						}
					}
?>
	  </Tags>
	</Response>
<?php
					$popped = array_pop($push);
				}
			} else {
				$popped = array_pop($push);
			}
		}
	}
?>
  </PUSH>
  <JavaScript>
<?php
	if (is_array($javascript)) {
		while (count($javascript) > 0) {
			$response = $javascript[count($javascript) - 1];
			if ($response !== false) {
				$category = $response->category;
				if (!empty($category)) {
?>
	<Category Name="<?php echo(xmlattribinvalidchars($category)); ?>">
<?php
					for($i = count($javascript) - 1; $i >= 0; $i--) {
						$response = $javascript[$i];
						if ($response->category == $category) {
?>
		<Response ID="<?php echo($response->id); ?>">
		  <Name><?php echo(xmlelementinvalidchars($response->name)); ?></Name>
		  <Content><?php echo(xmlelementinvalidchars($response->content)); ?></Content>
		  <Tags>
<?php
							$tags = explode(';', $response->tags);
							if (count($tags) > 0) {
								foreach($tags as $key => $tag) {
?>
			<Tag><?php echo(xmlelementinvalidchars($tag)); ?></Tag>
<?php
								}
							}
?>
		  </Tags>
		</Response>
<?php
							array_splice($javascript, $i, 1);
						}
					}
?>
	</Category>
<?php
				} else {
?>
	<Response ID="<?php echo($response->id); ?>">
	  <Name><?php echo(xmlelementinvalidchars($response->name)); ?></Name>
	  <Content><?php echo(xmlelementinvalidchars($response->content)); ?></Content>
	  <Tags>
<?php
					$tags = explode(';', $response->tags);
					if (count($tags) > 0) {
						foreach($tags as $key => $tag) {
?>
		<Tag><?php echo(xmlelementinvalidchars($tag)); ?></Tag>
<?php
						}
					}
?>
	  </Tags>
	</Response>
<?php
					$popped = array_pop($javascript);
				}
			} else {
				$popped = array_pop($javascript);
			}
		}
	}
?>
  </JavaScript>
  <Other>
<?php
	if (isset($_RESPONSES) && is_array($_RESPONSES)) {
		foreach ($_RESPONSES as $key => $response) {
			// Output Knowledge Base Responses
			$custom = @file_get_contents($response);
			if ($custom !== false) {
				$custom = str_replace('<?xml version="1.0" encoding="utf-8"?>', '', $custom);
				if (!empty($custom)) {
					echo($custom);
				}
			}
		}
	}

	// Custom Responses Hook
	$hooks->run('ResponsesCustom', 'xml');
?>
  </Other>
</Responses>
<?php

}

function ResetPassword() {

	global $_OPERATOR;
	global $_SETTINGS;
	global $XML;
	global $hooks;

	if (!isset($_REQUEST['Username'])){ $_REQUEST['Username'] = ''; }
	if (!isset($_REQUEST['Email'])){ $_REQUEST['Email'] = ''; }

	if ($XML) {
		header('Content-type: text/xml; charset=utf-8');
	} else {
		header('Content-type: application/json; charset=utf-8');
	}

	$language = file_get_contents('../locale/en/admin.json');
	if (defined('LANGUAGE') && file_exists('../locale/' . LANGUAGE . '/admin.json')) {
		$language = file_get_contents('../locale/' . LANGUAGE . '/admin.json');
	}
	$_LOCALE = json_decode($language, true);

	$password = '';
	$chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	for ($index = 1; $index <= 10; $index++) {
		$number = rand(1, strlen($chars));
		$password .= substr($chars, $number - 1, 1);
	}

	// Change Password
	if (function_exists('hash') && in_array('sha512', hash_algos())) {
		$hash = hash('sha512', $password);
	} else {
		$hash = sha1($password);
	}

	$hooks->run('PasswordReset', array('username' => $_REQUEST['Username'], 'email' => $_REQUEST['Email']));

	// Reset Password
	$server = false;
	if (!empty($_REQUEST['Username']) && !empty($_REQUEST['Email'])) {
		$operator = Operator::where('username', $_REQUEST['Username'])
			->where('email', $_REQUEST['Email'])
			->find_one();

		// Server
		$protocols = array('http://', 'https://');
		$server = str_replace($protocols, '', $_SETTINGS['URL']);

	} else {
		$operator = Operator::where('email', $_REQUEST['Email'])->find_one();

		// Override Username
		if ($operator !== false) {
			$_REQUEST['Username'] = $operator->email;
		}
	}

	$result = false;
	if ($operator !== false) {
		$operator->password = $hash;
		$result = $operator->save();
	}

	if ($result !== false) {

		$html = <<<END
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<style type="text/css">
<!--
div, p {
	font-family: Calibri, Verdana, Arial, Helvetica, sans-serif;
	font-size: 14px;
	color: #000000;
}
//-->
</style>
</head>

<body>
<div><img src="{$_SETTINGS['PASSWORDRESETHEADERIMAGE']}" alt="Password Reset" /></div>
<div></div><br/>
END;

		if ($server !== false) {
			$html .= <<<END
<div>{$_LOCALE['server']}: $server</div>
END;
		}

		$html .= <<<END
<div>{$_LOCALE['username']}: {$_REQUEST['Username']}</div>
<div>{$_LOCALE['password']}: $password</div><br/>
<div>Tip: Please change your password after you login with the temporary password shown above.</div><br/>
<div><img src="{$_SETTINGS['PASSWORDRESETFOOTERIMAGE']}" alt="{$_SETTINGS['NAME']}" /></div>
</body>
</html>
END;

		$subject = $_SETTINGS['NAME'] . ' ' . $_LOCALE['resetpassword'];
		$result = Email::send($operator->email, $_SETTINGS['EMAIL'], $_SETTINGS['NAME'], $subject, $html, EmailType::HTML);

		if ($XML) {
			header('Content-type: text/xml; charset=utf-8');
			echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<ResetPassword xmlns="urn:LiveHelp" Value="<?php echo($result); ?>"></ResetPassword>
<?php
		}
		else {
			header('Content-type: application/json; charset=utf-8');
			$json = array('result' => (bool)$result);
			echo json_encode($json);
		}

	}
	else {
		if (strpos(php_sapi_name(), 'cgi') === false) { header('HTTP/1.0 403 Forbidden'); } else { header('Status: 403 Forbidden'); }
	}

}

function Activity() {

	global $_OPERATOR;
	global $_SETTINGS;
	global $XML;

	if (!isset($_REQUEST['Record'])){ $_REQUEST['Record'] = '0'; }
	if (!isset($_REQUEST['Total'])){ $_REQUEST['Total'] = '500'; }
	if (!isset($_REQUEST['Timezone'])){ $_REQUEST['Timezone'] = ''; }

	$timezone = $_SETTINGS['SERVERTIMEZONE']; $from = ''; $to = ''; $difference = 0;
	if ($timezone != $_REQUEST['Timezone']) {

		$sign = substr($_REQUEST['Timezone'], 0, 1);
		$hours = substr($_REQUEST['Timezone'], -4, 2);
		$minutes = substr($_REQUEST['Timezone'], -2, 2);
		if ($minutes != 0) { $minutes = ($minutes / 0.6); }
		$local = $sign . $hours . $minutes;

		$sign = substr($timezone, 0, 1);
		$hours = substr($timezone, 1, 2);
		$minutes = substr($timezone, 3, 4);
		if ($minutes != 0) { $minutes = ($minutes / 0.6); }
		$remote = $sign . $hours . $minutes;

		// Convert to eg. +/-0430 format
		$hours = substr(sprintf("%04d", $local - $remote), 0, 2);
		$minutes = substr(sprintf("%04d", $local - $remote), 2, 4);
		if ($minutes != 0) { $minutes = ($minutes * 0.6); }
		$difference = ($hours * 60 * 60) + ($minutes * 60);

	}

	header('Content-type: text/xml; charset=utf-8');

	$activities = Activity::where_gt('id', (int)$_REQUEST['Record'])
		->order_by_desc('id')
		->limit((int)$_REQUEST['Total'])
		->find_many();

	if (isset($_REQUEST['Update'])) {
		$activities = Activity::where_lt('id', (int)$_REQUEST['Update'])
			->order_by_desc('id')
			->limit((int)$_REQUEST['Total'])
			->find_many();
	}
	// (`user` <> %d OR `status` = 0) $_OPERATOR['ID']
	// DATE_ADD(`datetime`, INTERVAL '%s' HOUR_MINUTE) AS `datetime`

	echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<Activity xmlns="urn:LiveHelp">
<?php
	if ($activities !== false) {
		foreach ($activities as $key => $activity) {
			if ($activity->user != $_OPERATOR['ID'] || $activity->status == 0) {

				$datetime = date('Y-m-d H:i:s', strtotime($activity->datetime) + $difference);
				$datetime = xmlattribinvalidchars($datetime);

				// User
				// Visitor or Operator ID
				// See Status for ID type

				// Activity Type
				// 1: Signed In
				// 2: Signed Out
				// 3: Changed Status Hidden
				// 4: Changed Status Online
				// 5: Changed Status Be Right Back
				// 6: Changed Status Away
				// 7: Accepted Chat
				// 8: Requested Live Help
				// 9: Closed Chat

				// Status
				// 0: Visitor / Guest
				// 1: Operator

				// Accepted / Chat Closed
				if ($activity->type == 7 || $activity->type == 9) {

					if ($activity->type == 7) {
						$id = $activity->chat;
					} else {
						$id = $activity->user;
					}

					// Chat
					$chat = Chat::where_id_is($id)
						->find_one();

					if ($chat !== false) {

						$custom = '';
						$reference = '';

						// Integration
						$integration = Custom::where('request', $chat->request)
							->find_one();

						if ($integration !== false) {
							$custom = $integration->custom;
							$reference = $integration->reference;
						}

						$active = 0;
						if ($chat !== false && $chat->status == 1) {
							$account = $chat->session()->order_by_desc('requested')->find_one()->operator()->find_one();
							if ($account !== false) {
								$active = $account->id;
							}
						} else {
							$active = $chat->status;
						}

						// Accepted Chat
						if ($activity->type == 7) {

							// Operator
							$operator = Operator::where_id_is($activity->user)
								->find_one();

							if ($operator !== false) {
								if (!empty($operator->lastname)) {
									$name = sprintf('%s %s', $operator->firstname, $operator->lastname);
								} else {
									$name = $operator->firstname;
								}
?>
<Item ID="<?php echo($activity->id); ?>" User="<?php echo($activity->user); ?>" Session="<?php echo($activity->chat); ?>" Request="<?php echo($chat->request); ?>" Active="<?php echo($active); ?>" Operator="<?php echo($name); ?>" Username="<?php echo(xmlattribinvalidchars($activity->username)); ?>" Datetime="<?php echo($datetime); ?>" Email="<?php echo(xmlattribinvalidchars($chat->email)); ?>" Type="<?php echo($activity->type); ?>" Status="<?php echo($activity->status); ?>" Duration="<?php echo($activity->duration); ?>" Custom="<?php echo($custom); ?>" Reference="<?php echo($reference); ?>"><?php echo(xmlelementinvalidchars($activity->activity)); ?></Item>
<?php
							}
						} else {
?>
<Item ID="<?php echo($activity->id); ?>" User="<?php echo($activity->user); ?>" Session="<?php echo($activity->chat); ?>" Request="<?php echo($chat->request); ?>" Active="<?php echo($active); ?>" Username="<?php echo(xmlattribinvalidchars($activity->username)); ?>" Datetime="<?php echo($datetime); ?>" Email="<?php echo(xmlattribinvalidchars($chat->email)); ?>" Type="<?php echo($activity->type); ?>" Status="<?php echo($activity->status); ?>" Duration="<?php echo($activity->duration); ?>" Custom="<?php echo($custom); ?>" Reference="<?php echo($reference); ?>"><?php echo(xmlelementinvalidchars($activity->activity)); ?></Item>
<?php
						}
						continue;
					}
				}
?>
<Item ID="<?php echo($activity->id); ?>" User="<?php echo($activity->user); ?>" Username="<?php echo(xmlattribinvalidchars($activity->username)); ?>" Datetime="<?php echo($datetime); ?>" Type="<?php echo($activity->type); ?>" Status="<?php echo($activity->status); ?>"><?php echo(xmlelementinvalidchars($activity->activity)); ?></Item>
<?php
			}
		}
	}

?>
</Activity>
<?php

}


function Departments() {

	global $_OPERATOR;
	global $_SETTINGS;
	global $XML;

	if (!isset($_REQUEST['Data'])){ $_REQUEST['Data'] = ''; }
	$data = $_REQUEST['Data'];

	// Departments
	$departments = Department::find_many();
	$existing = array();
	foreach ($departments as $key => $department) {
		if (in_array($department->name, $existing) === false) {
			$existing[] = $department->name;
		}
	}

	// Operator Departments
	$operators = Operator::find_many();
	$created = array();
	if ($operators !== false) {
		foreach ($operators as $key => $operator) {
			$department = explode(';', $operator->department);
			if (is_array($department)) {
				foreach ($department as $key => $value) {
					$value = trim($value);
					if (in_array($value, $created) === false && in_array($value, $existing) === false) {
						$created[] = $value;
						$depart = Department::create();
						$depart->name = $value;
						$depart->save();
					}
				}
			}
		}
	}

	// Update / Add Department
	if (!empty($data)) {
		$json = json_decode($data, true);

		if (isset($json['id'])) {

			$id = $json['id'];
			$department = Department::where_id_is($id)
				->find_one();

			if ($department !== false) {
				if (isset($json['name'])) {

					$existing = $department->name;

					$name = $json['name'];

					// Save Department
					$department->name = $name;
					$department->email = $json['email'];
					$department->status = $json['status'];
					$department->save();

					// Update Operator Departments
					$operators = Operator::find_many();
					if ($operators !== false) {
						foreach ($operators as $key => $operator) {
							$depmnts = explode(';', $operator->department);
							$updated = array();
							if (is_array($depmnts)) {
								$exist = false;
								foreach ($depmnts as $key => $value) {
									$value = trim($value);
									if ($value !== $existing && $value !== $name) {
										if (in_array($value, $updated) == false) {
											$updated[] = $value;
										}
									} else {
										if (in_array($name, $updated) == false) {
											$updated[] = $name;
										}
										$exist = true;
									}
								}

								// Udpate Operator Departments
								if ($exist) {
									if (count($updated) > 0) {
										$updated = implode('; ', $updated);
									} else {
										$updated = '';
									}
									$operator->department = $updated;
									$operator->save();
								}
							}
						}
					}

				} else {
					$department->delete();

					// Remove Operator Departments
					$operators = Operator::find_many();
					if ($operators !== false) {
						foreach ($operators as $key => $operator) {
							$depmnts = explode(';', $operator->department);
							$updated = array();
							if (is_array($depmnts)) {
								$exist = false;
								foreach ($depmnts as $key => $value) {
									$value = trim($value);
									if ($value !== $department->name) {
										$updated[] = $value;
									} else {
										$exist = true;
									}
								}

								// Remove Existing Operator Departments
								if ($exist) {
									if (count($updated) > 0) {
										$updated = implode('; ', $updated);
									} else {
										$updated = '';
									}
									$operator->department = $updated;
									$operator->save();
								}
							}
						}
					}
				}
			} else {
				if (isset($json['name'])) {
					$department = Department::create();
					$department->name = $json['name'];
					$department->email = $json['email'];
					$department->status = $json['status'];
					$department->save();
				}
			}
		} else {
			if (isset($json['name'])) {
				$department = Department::create();
				$department->name = $json['name'];
				$department->email = $json['email'];
				$department->status = $json['status'];
				$department->save();
			}
		}
	}

	// Departments
	$departments = Department::order_by_asc('name')
		->find_many();

	$depmnts = array();
	foreach ($departments as $key => $department) {
		$depmnts[] = array('id' => (int)$department->id, 'name' => $department->name, 'email' => $department->email, 'hidden' => (((int)$department->status !== 0) ? true : false));
	}

	if ($XML) {
		header('Content-type: text/xml; charset=utf-8');
		echo('<?xml version="1.0" encoding="utf-8"?>' . "\n");
?>
<Departments xmlns="urn:LiveHelp"></Departments>
<?php

	}
	else {
		header('Content-type: application/json; charset=utf-8');
		$json = $departments;
		echo json_encode($depmnts);
	}

}

?>
