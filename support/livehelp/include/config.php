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

error_reporting(E_ALL);
if (isset($_SETTINGS['DISPLAYERRORS']) && $_SETTINGS['DISPLAYERRORS'] == true) {
	ini_set('display_errors', 1);
} else {
	ini_set('display_errors', 0);
}
ini_set('html_errors', false);

// Log PHP Fatal Errors - Development Servers
if (isset($_SETTINGS['PHPLOG'])) {
	ini_set('log_errors', 1);
	ini_set('error_log', $_SETTINGS['PHPLOG']);
}

// Error Log
if (isset($_SETTINGS['LOGFILE'])) {
	$logfile = $_SETTINGS['LOGFILE'];
} else {
	$logfile = dirname(__FILE__) . '/../log/ERRORLOG.TXT';
}

if (!isset($_SETTINGS['DATABASECHARSET']) || !isset($_SETTINGS['DATABASECOLLATION'])) {
	$_SETTINGS['DATABASECHARSET'] = 'utf8';
	$_SETTINGS['DATABASECOLLATION'] = 'utf8_unicode_ci';
}

// User defined error handling function
function userErrorHandler($errno, $errmsg, $filename, $linenum, $vars) {

	global $logfile;

	// Define an assoc array of error string
	// in reality the only entries we should
	// consider are 2,8,256,512 and 1024
	$errortype = array (
		1   =>  'Error',
		2   =>  'Warning',
		4   =>  'Parsing Error',
		8   =>  'Notice',
		16  =>  'Core Error',
		32  =>  'Core Warning',
		64  =>  'Compile Error',
		128 =>  'Compile Warning',
		256 =>  'User Error',
		512 =>  'User Warning',
		1024=>  'User Notice',
		2048=>  'Strict Error',
		4096=>  'Recoverable Error',
		8191=>  'All Errors'
		);

	$date = date('Y-m-d H:i:s');
	$trace = debug_backtrace();

	$file = ''; $line = ''; $function = '';
	foreach ($trace as $key => $value) {
		if (is_array($value)) {
			if (isset($value['file'])) { $file = $value['file']; }
			if (isset($value['line'])) { $line = $value['line']; }
			if (isset($value['function'])) { $function = $value['function']; }
		}
	}

	$data = array(
		'date' => $date,
		'error' => array('type' => $errortype, 'code' => $errno),
		'message' => $errmsg,
		'filename' => $filename,
		'line' => $linenum
	);

	$error = "$date PHP {$errortype[$errno]}: $errmsg $filename at line $linenum";
	if (!empty($file) && !empty($line)) {
		$error .= " (Debug Trace: $function() at line $line within $file)";
		$data['trace'] = array(
			'function' => $function,
			'filename' => $file,
			'line' => $line
		);
	}

	if (isset($_SERVER['HTTP_HOST']) && isset($_SERVER['REQUEST_URI'])) {
		$error .= sprintf(' from %s/%s', $_SERVER['HTTP_HOST'], $_SERVER['REQUEST_URI']);
		$data['host'] = $_SERVER['HTTP_HOST'];
		$data['uri'] = $_SERVER['REQUEST_URI'];
	}
	$error .= "\n";

	// Save Error
	if (!empty($logfile)) {
		error_log($error, 3, $logfile);
	}

}

if (!empty($logfile) && is_writable($logfile)) {
	set_error_handler('userErrorHandler');
}

ini_set('magic_quotes_sybase', 0);

if (get_magic_quotes_gpc()) {
	$_COOKIE = array_map('stripslashes', $_COOKIE);
	$_REQUEST = array_map('stripslashes', $_REQUEST);
}

if (!isset($_SERVER['HTTP_REFERER'])){ $_SERVER['HTTP_REFERER'] = ''; }
if (!isset($_REQUEST['COOKIE'])){ $_REQUEST['COOKIE'] = ''; }
if (!isset($_REQUEST['SERVER'])){ $_REQUEST['SERVER'] = ''; }

// Database Table Prefix
if (!defined('TABLEPREFIX') && isset($table_prefix)) {
	define('TABLEPREFIX', $table_prefix);
}

// Include Path
$dir = dirname(__FILE__);

// Paris and Idiorm
require_once($dir . '/lib/idiorm.php');
require_once($dir . '/lib/paris.php');

// Settings Model
$settings = false;
require_once($dir . '/class.settings.php');

// Database Configuration
if (defined('DB_HOST') && defined('DB_NAME') && defined('DB_USER') && defined('DB_PASS')) {

	try {
		ORM::configure('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . $_SETTINGS['DATABASECHARSET']);
		ORM::configure('username', DB_USER);
		ORM::configure('password', DB_PASS);

		if (!isset($_SETTINGS['DATABASECHARSETOVERRIDE']) || (isset($_SETTINGS['DATABASECHARSETOVERRIDE']) && !$_SETTINGS['DATABASECHARSETOVERRIDE'])) {
			ORM::raw_execute(sprintf('SET NAMES %s COLLATE %s', $_SETTINGS['DATABASECHARSET'], $_SETTINGS['DATABASECOLLATION']));
		}

	} catch (PDOException $ex) {
		return false;
	}

	// Settings
	$settings = Setting::find_many();

}

// Hooks
require_once $dir . '/class.hooks.php';

// Web Hook
if (!defined('WEBHOOK')) {
	if ($settings !== false) {
		// Initialize Settings
		Setting::initializeSettings($settings);
		return true;

	} else {
		// Settings Loaded Hook
		$hooks->run('SettingsLoaded', $_SETTINGS);
		return false;
	}
}

?>
