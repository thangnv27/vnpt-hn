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

class Activity extends Model {
	public static $_table = 'activity';
	public static $_id_column = 'id';
}
Activity::$_table = TABLEPREFIX . 'activity';


class OperatorMessage extends Model {
	public static $_table = 'operatormessages';
	public static $_id_column = 'id';
}
OperatorMessage::$_table = TABLEPREFIX . 'operatormessages';


class Callback extends Model {
	public static $_table = 'callback';
	public static $_id_column = 'id';
}
Callback::$_table = TABLEPREFIX . 'callback';


class Country extends Model {
	public static $_table = 'countries';
	public static $_id_column = 'code';
}
Country::$_table = TABLEPREFIX . 'countries';


class Department extends Model {
	public static $_table = 'departments';
	public static $_id_column = 'id';
}
Department::$_table = TABLEPREFIX . 'departments';


class Device extends Model {
	public static $_table = 'devices';
	public static $_id_column = 'id';
}
Device::$_table = TABLEPREFIX . 'devices';


class Message extends Model {
	public static $_table = 'messages';
	public static $_id_column = 'id';

	public function operator() {
		return $this->has_one('Operator', 'username', 'username');
	}
}
Message::$_table = TABLEPREFIX . 'messages';


class Response extends Model {
	public static $_table = 'responses';
	public static $_id_column = 'id';
}
Response::$_table = TABLEPREFIX . 'responses';


class Chat extends Model {
	public static $_table = 'chats';
	public static $_id_column = 'id';

	public $hash = false;

	public function messages() {
		return $this->has_many('Message', 'chat');
	}

	public function custom() {
		return $this->has_one('Custom', 'request', 'request');
	}

	public function rating() {
		return $this->has_many('Rating', 'chat');
	}

	public function session() {
		return $this->has_many('ChatSession', 'chat');
	}

	public function typing() {
		return $this->has_one('Typing', 'chat');
	}

	public function visitor() {
		return $this->has_one('ChatVisitor', 'chat');
	}

	public static function has_department($chat, $department) {
		$result = false;
		$departments = explode(';', $department);
		if (!empty($chat->department)) {
			if (is_array($departments)) {
				foreach ($departments as $key => $value) {
					if ($chat->department == trim($value)) {
						$result = true;
					}
				}
			}
		} else {
			$result = true;
		}
		return $result;
	}

}
Chat::$_table = TABLEPREFIX . 'chats';


class Geolocation extends Model {
	public static $_table = 'geolocation';
	public static $_id_column = 'id';
}
Geolocation::$_table = TABLEPREFIX . 'geolocation';


class Custom extends Model {
	public static $_table = 'custom';
	public static $_id_column = 'id';
}
Custom::$_table = TABLEPREFIX . 'custom';


class Visitor extends Model {
	public static $_table = 'requests';
	public static $_id_column = 'id';

	public $socket = false;

	public function geolocation() {
		return $this->has_one('Geolocation', 'request');
	}

	public function custom() {
		return $this->has_many('Custom', 'request', 'request');
	}

}
Visitor::$_table = TABLEPREFIX . 'requests';


class Operator extends Model {

	public static $_table = 'users';
	public static $_id_column = 'id';

	public function devices() {
		return $this->has_many('Device', 'user');
	}

	public function status() {
		global $_SETTINGS;

		$status = 0;
		$active = time() - strtotime($this->refresh) < $_SETTINGS['CONNECTIONTIMEOUT'];

		if ((int)$_SETTINGS['DATABASEVERSION'] >= 10) {
			if ($active || count($this->devices()->find_array()) > 0 || (defined('WEBSOCKETS') && count($this->websocket()->where_gt('active', 0)->find_array()) > 0)) {
				$status = (int)$this->status;
			}
		} elseif ((float)$_SETTINGS['SERVERVERSION'] >= 4.1) {
			if ($active || count($this->devices()->find_array()) > 0) {
				$status = (int)$this->status;
			}
		} elseif ((float)$_SETTINGS['SERVERVERSION'] >= 3.80) {
			if ($active || !empty($this->device)) {
				$status = (int)$this->status;
			}
		} else {
			if ($active) {
				$status = (int)$this->status;
			}
		}
		return $status;
	}

	public function websocket() {
		return $this->has_one('Websocket', 'id');
	}

	public static function has_department($user, $department) {
		$result = false;
		$departments = explode(';', $user->department);
		if (is_array($departments)) {
			foreach ($departments as $key => $value) {
				if ($department == trim($value)) {
					$result = true;
				}
			}
		}
		return $result;
	}

}
Operator::$_table = TABLEPREFIX . 'users';

class Operators {
	public static $online = array();
	public static $hidden = array();
	public static $away = array();
	public static $brb = array();
}

class Rating extends Model {
	public static $_table = 'ratings';
	public static $_id_column = 'id';
}
Rating::$_table = TABLEPREFIX . 'ratings';

class ChatSession extends Model {
	public static $_table = 'sessions';
	public static $_id_column = 'id';

	public function operator() {
		return $this->has_one('Operator', 'id', 'user');
	}

}
ChatSession::$_table = TABLEPREFIX . 'sessions';


class Typing extends Model {
	public static $_table = 'typing';
	public static $_id_column = 'id';
}
Typing::$_table = TABLEPREFIX . 'typing';


class ChatVisitor extends Model {
	public static $_table = 'chatvisitors';
	public static $_id_column = 'id';

	public function visitor() {
		return $this->has_one('Visitor', 'id', 'visitor');
	}

	public function chat() {
		return $this->has_one('Chat', 'id', 'chat');
	}

}
ChatVisitor::$_table = TABLEPREFIX . 'chatvisitors';


?>
