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


function genTicketMask($id) {
	$lowercase = 'abcdefghijklmnopqrstuvwxyz';
	$uppercase = 'ABCDEFGHIJKLMNOPQRSTUVYWXYZ';
	$ticketmaskstr = '';

	$ticketmask = \Plugins\WHMCS\Setting::where_id_is('TicketMask')
		->find_one();

	if ($ticketmask !== false) {
		$ticketmask = trim($ticketmask->value);
	}
	if (!$ticketmask) {
		$ticketmask = '%n%n%n%n%n%n';
	}
	$masklen = strlen($ticketmask);
	for ($i = 0; $i < $masklen; $i++) {
		$maskval = $ticketmask[$i];
		if ($maskval == "%") {
			$i++;
			$maskval .= $ticketmask[$i];
			if ($maskval == "%A") {
				$ticketmaskstr .= $uppercase[rand(0,25)];
			} elseif ($maskval == "%a") {
				$ticketmaskstr .= $lowercase[rand(0,25)];
			} elseif ($maskval == "%n") {
				$ticketmaskstr .= (strlen($ticketmaskstr)) ? rand(0,9) : rand(1,9);
			} elseif ($maskval == "%y") {
				$ticketmaskstr .= date('Y');
			} elseif ($maskval == "%m") {
				$ticketmaskstr .= date('m');
			} elseif ($maskval == "%d") {
				$ticketmaskstr .= date('d');
			} elseif ($maskval == "%i") {
				$ticketmaskstr .= $id;
			} else {
				$ticketmaskstr .= $maskval;
			}
		} else {
			$ticketmaskstr .= $maskval;
		}
	}

	$ticket = \Plugins\WHMCS\Ticket::where('tid', $ticketmaskstr)
		->find_one();

	if ($ticket !== false) {
		if ($ticket->id) {
			$ticketmaskstr = genTicketMask($ticket->id);
		}
	}
	return $ticketmaskstr;
}

function whmcsURL($admin = true) {

	// WHMCS System URL Setting
	$setting = \Plugins\WHMCS\Setting::where_id_is('SystemSSLURL')
		->find_one();

	$address = $setting->value;
	if (empty($address)) {
		$setting = \Plugins\WHMCS\Setting::where_id_is('SystemURL')
			->find_one();

		$address = $setting->value;
	}
	
	if (substr($address, -1) != '/') {
		$address = $address . '/';
	}

	$customadminpath = '';
	require(dirname(__FILE__) . '/../../../../configuration.php');
	
	if ($admin == true) {
		if (!$customadminpath) { $customadminpath = 'admin'; }
		$address .= $customadminpath . '/';
	}

	return $address;
}

?>