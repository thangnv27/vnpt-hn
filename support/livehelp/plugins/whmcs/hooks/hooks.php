<?php
use WHMCS\Config\Setting;
use WHMCS\Security\Hash\Password;
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

if (isset($_PLUGINS) && $_PLUGINS['WHMCS'] == true) {
	require_once dirname(__FILE__) . '/../functions.php';
	require_once dirname(__FILE__) . '/../../../include/class.passwordhash.php';
	require_once dirname(__FILE__) . '/../class.models.php';
}


/*
 * Hook class name must end with Hooks
 * i.e. ExampleHooks or TestHooks
 *
 */
class LiveHelpWHMCSHooks {

	function LiveHelpWHMCSHooks() {
		// Init Hook
	}

	function CloseChat($args) {

		global $_SETTINGS;

		// Arguments
		list($chat, $name) = $args;

		if ($name === false) {
			return;
		}

		if (isset($_SETTINGS['WHMCSTICKETS']) && $_SETTINGS['WHMCSTICKETS'] == false) {
			return false;
		}

		// Close Chat Event
		$chat = Chat::where_id_is($chat)
			->order_by_asc('id')
			->find_one();

		if ($chat !== false) {

			$custom = $chat->custom()->find_one();
			if ($custom !== false) {
				$session = $custom->custom;

				// Log Chat Ticket
				$seeds = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
				$c = null;
				$seeds_count = strlen($seeds) - 1;
				for ($i = 0; 8 > $i; $i++) {
					$c .= $seeds[rand(0, $seeds_count)];
				}

				// Department
				$ticketdepartment = \Plugins\WHMCS\TicketDepartment::where('hidden', '')
					->order_by_asc('order')
					->find_one();

				if ($ticketdepartment !== false) {
					$department = $ticketdepartment->id;

					// Chat Transcript
					$messages = Message::where('chat', $chat->id)
						->where_lte('status', 3)
						->order_by_asc('datetime')
						->find_many();

					$transcript = ''; $textmessages = '';
					$names = array();

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
					$language = file_get_contents(dirname(__FILE__) . '/../../../locale/en/admin.json');
					if (file_exists(dirname(__FILE__) . '/../../../locale/' . LANGUAGE . '/admin.json')) {
						$language = file_get_contents(dirname(__FILE__) . '/../../../locale/' . LANGUAGE . '/admin.json');
					}
					$_LOCALE = json_decode($language, true);

					$transcript .= '[div="chat"]';
					if ($messages !== false) {
						foreach ($messages as $key => $message) {
							// Operator
							if ($message->status) {

								if (!empty($message->username) && !array_key_exists($message->username, $names)) {
									// Operator
									$user = Operator::where('username', $message->username)
										->find_one();

									if ($user !== false) {
										$names[$message->username] = $user->firstname;
									}
								}

								if (!empty($message->username)) {
									$transcript .= '[div="operator"][div="name"]' . $names[$message->username] . ' says:[/div][div="message"]' . $message->message . '[/div][/div]';
									$textmessages .= $names[$message->username] . ' ' . $_LOCALE['says'] . ':' . $eol . '	' . $message->message . $eol;
								} else {
									$transcript .= '[div="operator"][div="message"]' . $message->message . '[/div][/div]';
									$textmessages .= $message->message . $eol;
								}
							}

							// Guest
							if (!$message->status) {

								// Replace HTML Code
								$content = str_replace('<', '&lt;', $message->message);
								$content = str_replace('>', '&gt;', $content);

								$transcript .= '[div="visitor"][div="name"]' . $message->username . ' says:[/div][div="message"]' . $content . '[/div][/div]';
								$textmessages .= $message->username . ' ' . $_LOCALE['says'] . ':' . $eol . '	' . $content . $eol;
							}
						}
					}
					$transcript .= '[/div]';
					$transcript = preg_replace("/(\r\n|\r|\n)/", '<br/>', $transcript);

					// Insert Live Help Chat
					$ticket = \Plugins\WHMCS\Ticket::create();
					$ticket->did = $department;
					$ticket->userid = $session;
					$ticket->c = $c;
					$ticket->date = date('Y-m-d H:i:s', time());
					$ticket->title = sprintf('Chat Log %s', date('d/m/Y H:i'));
					$ticket->message = $transcript;
					$ticket->status = 'Closed';
					$ticket->urgency = 'Medium';
					$ticket->lastreply = date('Y-m-d H:i:s', time());
					$ticket->save();

					// WHMCS Ticket Masking
					$mask = genTicketMask($ticket->id);

					$ticket->tid = $mask;
					$ticket->save();

				}
			}
		}
	}


	function ResponsesCustom($format) {

		// KB URL
		$whmcs = whmcsURL(false);
		$kburl = $whmcs . 'knowledgebase.php?action=displayarticle&id=';

		if ($format == 'json') {

			// Custom Responses
			$other = array();

			// Output Knowledge Base Links
			$categories = \Plugins\WHMCS\KnowledgebaseCategory::where_not_equal('hidden', 'on')
				->find_many();

			if ($categories !== false) {
				$name = 'WHMCS Knowledgebase';
				$custom = array('Description' => $name);

				foreach ($categories as $key => $category) {

					// KB Links
					$knowledgebaselinks = \Plugins\WHMCS\KnowledgebaseLink::where('categoryid', $category->id)
						->find_many();

					if ($knowledgebaselinks !== false) {
						foreach ($knowledgebaselinks as $key => $link) {
							// Knowledgebase Article
							$article = $link->knowledgebase()->find_one();
							if ($article !== false) {
								// WHMCS Knowledgebase Link
								$custom[] = array('ID' => $article->id, 'Name' => $article->title, 'Content' => $kburl . $id, 'Category' => $category->name, 'Type' => 2);
							}
						}
					}
				}
				$other[] = array('Custom' => $custom);
			}

			return $other;

		} else {

			// Output Knowledge Base Links
			$categories = \Plugins\WHMCS\KnowledgebaseCategory::where_not_equal('hidden', 'on')
				->find_many();

			if ($categories !== false) {
?>
		<Custom Description="WHMCS Knowledgebase">
<?php
				foreach ($categories as $key => $category) {

					// KB Links
					$knowledgebaselinks = \Plugins\WHMCS\KnowledgebaseLink::where('categoryid', $category->id)
						->find_many();

					if ($knowledgebaselinks !== false) {
?>
			<Category Name="<?php echo($category->name); ?>">
<?php
						foreach ($knowledgebaselinks as $key => $link) {

							// Knowledgebase Article
							$article = $link->knowledgebase()->find_one();
							if ($article !== false) {
?>
				<Response ID="<?php echo($article->id); ?>" Type="Hyperlink">
					<Name><?php echo(xmlelementinvalidchars($article->title)); ?></Name>
					<Content><?php echo(xmlelementinvalidchars($kburl . $article->id)); ?></Content>
					<Tags/>
				</Response>
<?php
							}
						}
?>
			</Category>
<?php
					}
				}
?>
		</Custom>
<?php
			}
		}
	}

	function LoginCustomHash($password) {
		if (isset($_REQUEST['Version']) && $_REQUEST['Version'] >= 4.0) {
			$password = md5(htmlspecialchars($password));
		}
		return $password;
	}

	function LoginCompleted($_OPERATOR) {

		// WHMCS Plugin
		if (isset($_PLUGINS) && $_PLUGINS['WHMCS'] == true) {
			$user = \Plugins\WHMCS\Admin::where('username', $_OPERATOR['USERNAME'])->find_one();

			if ($user !== false) {
				if ($user->password == $_OPERATOR['PASSWORD']) {
					$departments = explode(',', $user->supportdepts);

					$departmnts = array();
					foreach ($departments as $key => $id) {
						$department = \Plugins\WHMCS\TicketDepartment::where_id_is($id)
							->find_one();

						if ($department !== false) {
							$departmnts[] = $department->name;
						}
					}
					$department = implode('; ', $departmnts);

					// Update Account
					$operator = Operator::where_id_is($_OPERATOR['ID'])
						->find_one();

					if ($operator !== false) {
						$operator->username = $user->username;
						$operator->password = $user->password;
						$operator->firstname = $user->firstname;
						$operator->lastname = $user->lastname;
						$operator->email = $user->email;
						$operator->department = $department;
						$operator->custom = $user->id;
						$operator->save();
					}

					$_OPERATOR['USERNAME'] = $user->username;
					$_OPERATOR['PASSWORD'] = $user->password;
					$_OPERATOR['NAME'] = (!empty($user->lastname)) ? $user->firstname . ' ' . $user->lastname : $user->firstname;
					$_OPERATOR['DEPARMENT'] = $department;
					return $_OPERATOR;
				}
			} else {
				$_OPERATOR['USERNAME'] = $operator->username;
				$_OPERATOR['PASSWORD'] = $operator->password;
				$_OPERATOR['NAME'] = (!empty($operator->lastname)) ? $operator->firstname . ' ' . $operator->lastname : $operator->firstname;
				$_OPERATOR['DEPARMENT'] = $operator->department;
				return $_OPERATOR;
			}
		}
		return $_OPERATOR;
	}

	function LoginFailed($data) {

		global $_SETTINGS;

		$_OPERATOR = $data['Operator'];
		$password = $data['Password'];

		// Sync WHMCS Account
		$user = \Plugins\WHMCS\Admin::where('username', $_OPERATOR['USERNAME'])->find_one();
		if ($user !== false) {

			$validhash = false;
			if (class_exists('WHMCS\\Security\\Hash\\Password')) {
				$whmcshasher = new Password();
				$validhash = $whmcshasher->verify($password, $user->password);
				if ($validhash){
					// Valid WHMCS Admin
					// Generate Live Help Hash for subsequent login attempts
					$livehelphasher = new PasswordHash(8, true);
					$hash = $livehelphasher->HashPassword($password);
				}
			} else {
				// Old Hashing prior to WHMCS 5.3.9
				$validhash = ($user->password == $password);
			}

			if ($validhash) {
				$departments = explode(',', $user->supportdepts);

				$departmnts = array();
				foreach ($departments as $key => $id) {
					$department = \Plugins\WHMCS\TicketDepartment::where_id_is($id)
						->find_one();

					if ($department !== false) {
						$departmnts[] = $department->name;
					}
				}
				$department = implode('; ', $departmnts);

				// Update Account
				$operator = Operator::where_id_is($_OPERATOR['ID'])
					->find_one();

				if ($operator !== false) {
					$operator->username = $user->username;
					$operator->password = $user->password;
					$operator->firstname = $user->firstname;
					$operator->lastname = $user->lastname;
					$operator->email = $user->email;
					$operator->department = $department;
					$operator->custom = $user->id;
					$operator->save();
				}

				$_OPERATOR['USERNAME'] = $user->username;
				$_OPERATOR['PASSWORD'] = $user->password;
				$_OPERATOR['NAME'] = (!empty($user->lastname)) ? $user->firstname . ' ' . $user->lastname : $user->firstname;
				$_OPERATOR['DEPARMENT'] = $department;
				return $_OPERATOR;
			}

		}

		return $_OPERATOR;
	}

	function LoginAccountMissing($data) {

		global $_SETTINGS;

		$username = $data['Username'];
		$password = $data['Password'];

		// MD5 Password Hash
		if (isset($_REQUEST['Version']) && $_REQUEST['Version'] >= 4.0) {
			$password = md5(htmlspecialchars($password));
		}

		// WHMCS Account
		$user = \Plugins\WHMCS\Admin::where('username', $username)->find_one();

		if ($user !== false) {

			// Departments
			$departments = explode(',', $user->supportdepts);
			$departmnts = array();
			foreach ($departments as $key => $id) {
				$department = \Plugins\WHMCS\TicketDepartment::where_id_is($id)->find_one();

				if ($department !== false) {
					$departmnts[] = $department->name;
				}
			}
			$department = implode('; ', $departmnts);

			$validhash = false;
			if (class_exists('WHMCS\\Security\\Hash\\Password')) {
				$whmcshasher = new Password();
				$validhash = $whmcshasher->verify($password, $user->password);
				if ($validhash){
					// Valid WHMCS Admin
					// Generate Live Help Hash for subsequent login attempts
					$livehelphasher = new PasswordHash(8, true);
					$hash = $livehelphasher->HashPassword($password);
				}
			} else {
				// Old Hashing prior to WHMCS 5.3.9
				$validhash = ($user->password == $password);
			}

			// Operator Password
			if ($validhash) {

				// Existing Operator
				$operator = Operator::where('custom', $user->id)->find_one();

				if ($operator !== false) {

					$operator->username = $user->username;
					$operator->password = $user->password;
					$operator->firstname = $user->firstname;
					$operator->lastname = $user->lastname;
					$operator->email = $user->email;
					$operator->department = $department;
					$operator->save();

				} else {

					$operator = Operator::create();
					$operator->username = $user->username;
					$operator->password = $user->password;
					$operator->firstname = $user->firstname;
					$operator->lastname = $user->lastname;
					$operator->datetime = date('Y-m-d H:i:s', time());
					$operator->email = $user->email;
					$operator->department = $department;
					$operator->image = '';
					$operator->privilege = -1;
					$operator->status = -1;
					$operator->custom = $user->id;
					$operator->save();

				}

				$_OPERATOR['ID'] = $operator->id;
				$_OPERATOR['USERNAME'] = $operator->username;
				$_OPERATOR['PASSWORD'] = $operator->password;
				$_OPERATOR['NAME'] = (!empty($operator->lastname)) ? $operator->firstname . ' ' . $operator->lastname : $operator->firstname;
				$_OPERATOR['DEPARMENT'] = $operator->department;
				$_OPERATOR['DATETIME'] = $operator->datetime;
				$_OPERATOR['PRIVILEGE'] = $operator->privilege;
				$_OPERATOR['STATUS'] = $operator->status;
				return $_OPERATOR;

			}
		}

		return false;
	}

	function SettingsLoaded($_SETTINGS = false) {

		global $_SETTINGS;

		if (!empty($settings)) {
			$_SETTINGS = $settings;
		}

		$config = array();
		$settings = \Plugins\WHMCS\Setting::find_many();
		if ($settings !== false) {
			foreach ($settings as $key => $setting) {
				$config[$setting->setting] = $setting->value;
			}
		}

		$domain = '';
		if (!empty($config['SystemSSLURL'])) {
			$domain = trim($config['SystemSSLURL']);
		} else {
			$domain = trim($config['SystemURL']);
		}
		if (substr($domain, -1) != '/') { $domain = $domain . '/'; }

		$host = str_replace(array('http://', 'https://'), '', $domain);

		$_SETTINGS['HTMLHEAD'] = <<<END
<!-- stardevelop.com Live Help International Copyright - All Rights Reserved //-->
<!--  BEGIN stardevelop.com Live Help Messenger Code - Copyright - NOT PERMITTED TO MODIFY COPYRIGHT LINE / LINK //-->
<script type="text/JavaScript" src="{$domain}modules/livehelp/scripts/jquery-latest.js"></script>
<script type="text/javascript">
<!--
	var LiveHelpSettings = {};
	LiveHelpSettings.server = '{$host}';
	LiveHelpSettings.embedded = true;

	(function(d, $, undefined) {
		$(window).ready(function() {
			var LiveHelp = d.createElement('script'); LiveHelp.type = 'text/javascript'; LiveHelp.async = true;
			LiveHelp.src = ('https:' == d.location.protocol ? 'https://' : 'http://') + LiveHelpSettings.server + '/livehelp/scripts/jquery.livehelp.js';
			var s = d.getElementsByTagName('script')[0];
			s.parentNode.insertBefore(LiveHelp, s);
		});
	})(document, jQuery);
-->
</script>
<!--  END stardevelop.com Live Help Messenger Code - Copyright - NOT PERMITTED TO MODIFY COPYRIGHT LINE / LINK //-->
END;

		$_SETTINGS['HTMLBODY'] = '';

		$_SETTINGS['HTMLIMAGE'] = <<<END
<!-- stardevelop.com Live Help International Copyright - All Rights Reserved //-->
<!--  BEGIN stardevelop.com Live Help Messenger Code - Copyright - NOT PERMITTED TO MODIFY COPYRIGHT LINE / LINK //-->
<a href="#" class="LiveHelpButton"><img src="{$domain}modules/livehelp/include/status.php" id="LiveHelpStatusDefault" name="LiveHelpStatusDefault" border="0" alt="Live Help" class="LiveHelpStatus"/></a>
<!--  END stardevelop.com Live Help Messenger Code - Copyright - NOT PERMITTED TO MODIFY COPYRIGHT LINE / LINK //-->
END;

		return $_SETTINGS;

	}

	function SettingsPlugin($json) {

		if (!$json) {
?>
<Plugin ID="WHMCS">
<?php
			// WHMCS SSL URL
			$setting = \Plugins\WHMCS\Setting::where_id_is('SystemSSLURL')->find_one();
			$address = $setting->value;
			if (empty($address)) {
				$setting = \Plugins\WHMCS\Setting::where_id_is('SystemURL')->find_one();
				$address = $setting->value;
			}

			if (substr($address, -1) != '/') {
				$address = $address . '/';
			}

			$customadminpath = '';
			require_once(dirname(__FILE__) . '/../../../../../configuration.php');

			if (!$customadminpath) { $customadminpath = 'admin'; }
			$address .= $customadminpath . '/';
?>
<QuickLinks Address="<?php echo($address); ?>">
<Link Name="Summary" Image="card-address">clientssummary.php?userid={0}</Link>
<Link Name="Orders" Image="shopping-basket">orders.php?client={0}</Link>
<Link Name="Products / Services" Image="box">clientshosting.php?userid={0}</Link>
<Link Name="Domains" Image="globe-medium-green">clientsdomains.php?userid={0}</Link>
<Link Name="Invoices" Image="document-invoice">clientsinvoices.php?userid={0}</Link>
<Link Name="Add Order" Image="shopping-basket--plus">ordersadd.php?userid={0}</Link>
<Link Name="Create Invoice" Image="document--plus">invoices.php?action=createinvoice&amp;userid={0}</Link>
<Link Name="Quotes" Image="documents-text">clientsquotes.php?userid={0}</Link>
<Link Name="Tickets" Image="ticket">supporttickets.php?view=any&amp;client={0}</Link>
<Link Name="Emails" Image="mail-open-document">clientsemails.php?userid={0}</Link>
</QuickLinks>
</Plugin>
<?php
		}
	}

	function VisitorCustomDetails($id) {

		// Custom Integration Details
		$custom = Custom::where('request', $id)
			->find_one();

		if ($custom !== false) {
			return array('Custom' => $custom->custom, 'Username' => $custom->name, 'Reference' => $custom->reference);
		}

		return false;
	}

	function DepartmentsLoaded($departments) {

		$departs = $departments;
		$departments = array();
		if (is_array($departs)) {
			foreach ($departs as $key => $department) {
				// WHMCS Department
				$ticketdepartment = \Plugins\WHMCS\TicketDepartment::where('name', $department)
					->find_one();

				if ($ticketdepartment !== false) {
					if ($ticketdepartment->hidden != 'on') {
						$departments[] = $ticketdepartment->name;
					}
				} else {
					$departments[] = $department;
				}
			}
			sort($departments);
			return $departments;
		}
		return $departs;
	}

	function VisitorCustomDetailsInitialised($args) {

		global $_SETTINGS;

		// Arguments
		$request = $args['request'];
		$custom = $args['custom'];
		$plugin = $args['plugin'];

		// WHMCS Account Name
		if ($plugin == 'WHMCS' && empty($name)) {

			// Client
			$client = \Plugins\WHMCS\Client::where_id_is($custom)
				->find_one();

			if ($client !== false) {
				$name = $client->firstname . ' ' . $client->lastname;

				// Charset Setting
				$setting = \Plugins\WHMCS\Setting::where_id_is('Charset')->find_one();

				if ($setting !== false) {
					$charset = $setting->value;
					if (!empty($charset) && $charset != 'utf-8') {
						$name = iconv($charset, 'UTF-8', $name);
					}
				}
			}
		}

		$exists = Custom::where('request', $request)
			->where('reference', $plugin)
			->find_one();

		if ($exists !== false) {

			// Update Custom Integration
			$exists->custom = $custom;
			$exists->name = $name;
			$exists->save();

		} else {

			// Custom Integration
			$integration = Custom::create();
			$integration->request = $request;
			$integration->custom = $custom;
			$integration->name = $name;
			$integration->reference = $plugin;
			$integration->save();

			$chatdetails = false;
			if (is_numeric($request) && (int)$request > 0 && $_SETTINGS['DATABASEVERSION'] < 11) {
				$chatdetails = Chat::where('request', $request)->find_one();
			} else if ($_SETTINGS['DATABASEVERSION'] > 10) {
				$chatvisitor = ChatVisitor::where('visitor', $id)->find_one();
				if ($chatvisitor !== false) {
					$chat = $chatvisitor->chat()->find_one();
				}
			}

			if ($chatdetails !== false && !empty($chatdetails->username)) {

				$messagedetails = Message::where('chat', $chat)
					->where('status', -4)
					->find_one();

				if ($messagedetails !== false) {
					// Integration Message Alert
					$message = Message::create();
					$message->chat = $chat;
					$message->username = $chatdetails->username;
					$message->datetime = date('Y-m-d H:i:s', time());
					$message->message = sprintf('%s has just signed into %s', $chatdetails->username, $plugin);
					$message->align = $id;
					$message->status = -2;
					$message->save();
				}
			}
		}

	}

	function VisitorAdded() {

		// WHMCS Integration / Quick Links
		if (isset($_COOKIE['WHMCSUID']) || isset($_SESSION['uid'])) {
			$id = (isset($_COOKIE['WHMCSUID']) ? $_COOKIE['WHMCSUID'] : $_SESSION['uid']);
			$reference = 'WHMCS';
			$name = '';

			if (is_numeric($id)) {

				$client = \Plugins\WHMCS\Client::where_id_is($id)
					->find_one();

				if ($client !== false) {
					$name = $client->firstname . ' ' . $client->lastname;
				}

				$custom = Custom::create();
				$custom->request = $request;
				$custom->custom = $id;
				$custom->name = $name;
				$custom->reference = $reference;
				$custom->save();
			}
		}
	}

}

// Add Hook Functions
// $hooks->add('ExampleHooks', 'EventName', 'FunctionName');
$class = 'LiveHelpWHMCSHooks';

if (isset($_PLUGINS) && $_PLUGINS['WHMCS'] == true) {
	$hooks->add($class, 'CloseChat', 'CloseChat');
	$hooks->add($class, 'LoginCustomHash', 'LoginCustomHash');
	$hooks->add($class, 'LoginCompleted', 'LoginCompleted');
	$hooks->add($class, 'LoginFailed', 'LoginFailed');
	$hooks->add($class, 'LoginAccountMissing', 'LoginAccountMissing');
	$hooks->add($class, 'SettingsLoaded', 'SettingsLoaded');
	$hooks->add($class, 'SettingsPlugin', 'SettingsPlugin');
	$hooks->add($class, 'ResponsesCustom', 'ResponsesCustom');
	$hooks->add($class, 'DepartmentsLoaded', 'DepartmentsLoaded');
	$hooks->add($class, 'VisitorCustomDetails', 'VisitorCustomDetails');
	$hooks->add($class, 'VisitorCustomDetailsInitialised', 'VisitorCustomDetailsInitialised');
	$hooks->add($class, 'VisitorAdded', 'VisitorAdded');
}

?>
