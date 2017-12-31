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

class DatabaseUpgrade {

	var $version = 14;
	var $current = 0;

	function process($version) {

		global $_SETTINGS;

		// Upgrade Database Schema
		$upgradefile = '../install/mysql.schema.v' . $version . '.upgrade.txt';

		if ((float)$version > (float)$this->current && file_exists($upgradefile)) {
		
			$file = file($upgradefile);
			if (is_array($file)) {
				$query = '';
				$db = ORM::get_db();
				foreach ($file as $key => $line) {
					$line = trim($line);
					if (!empty($line) && substr($line, 0, 1) != '#') {
						$line = str_replace('prefix_', TABLEPREFIX, $line);
						$query .= $line; unset($line);
						if (strpos($query, ';') !== false) {

							// Override MySQL Engine
							if (isset($_SETTINGS['FORCEINNODB'])) {
								$query = str_replace('ENGINE=MyISAM', 'ENGINE=InnoDB', $query);
							}

							try {
								$result = $db->exec($query);
							} catch (PDOException $e) {
								$result = false;
							}
							
							if ($result === false) {
								return;
							}
							$query = '';
						}
					}
				}
				unset($file);
			}

			$version = (strlen(substr($version, strpos($version, '.'))) > 1) ? (float)$version : $version;
			if ($this->current == 0) {
				$setting = Setting::create();
				$setting->name = 'DatabaseVersion';
				$setting->value = $version;
				$setting->save();
			} else {
				$setting = Setting::where_id_is('DatabaseVersion')
					->find_one();

				$setting->value = $version;
				$setting->save();
			}
			$this->current = (string)$version;
		}

	}

	function upgrade() {

		// Server Version
		$setting = Setting::where_id_is('ServerVersion')->find_one();

		// Database Version
		$database = Setting::where_id_is('DatabaseVersion')->find_one();

		// Migrate to Database Version
		if ($setting !== false) {
			$this->current = $setting->value;

			if ($database != false) {
				$databaseversion = (int)$database->value;
			} else {

				$databaseversion = false;
				switch ($setting->value) {
					case '3.30':
						$databaseversion = 1;
						break;
					case '3.50':
						$databaseversion = 2;
						break;
					case '3.70':
						$databaseversion = 3;
						break;
					case '3.80':
						$databaseversion = 4;
						break;
					case '3.90':
						$databaseversion = 5;
						break;
					case '3.95':
					case '4.0':
						$databaseversion = 6;
						break;
					case '4.1':
						$databaseversion = 7;
						break;
					case '5.0':
						$databaseversion = 8;
						break;
				}

				if ($databaseversion !== false) {
					$setting = Setting::create();
					$setting->name = 'DatabaseVersion';
					$setting->value = $databaseversion;
					$setting->save();
				}
			}

			if ($databaseversion > 7) {
				$setting = Setting::where_id_is('ServerVersion')->find_one();
				if ($setting !== false) {
					$setting->value = '5.0';
					$setting->save();
				}
			}

		}


		// Automatic Upgrade
		for ($version = $databaseversion + 1; $version <= $this->version; $version++) {
			$this->process($version);
		}
		
		return $this->current;
	}

}

?>