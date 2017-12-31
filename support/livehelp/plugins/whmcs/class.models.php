<?php
namespace Plugins\WHMCS;
use ORM, Model;

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

class Admin extends Model {
	public static $_table = 'tbladmins';
	public static $_id_column = 'id';
}

class TicketDepartment extends Model {
	public static $_table = 'tblticketdepartments';
	public static $_id_column = 'id';
}

class Setting extends Model {
	public static $_table = 'tblconfiguration';
	public static $_id_column = 'setting';
}

class Ticket extends Model {
	public static $_table = 'tbltickets';
	public static $_id_column = 'id';
}

class TicketReply extends Model {
	public static $_table = 'tblticketreplies';
	public static $_id_column = 'id';
}

class KnowledgebaseCategory extends Model {
	public static $_table = 'tblknowledgebasecats';
	public static $_id_column = 'id';
}

class KnowledgebaseLink extends Model {
	public static $_table = 'tblknowledgebaselinks';
	public static $_id_column = 'id';

	public function knowledgebase() {
		return $this->has_one('\Plugins\WHMCS\Knowledgebase', 'id', 'articleid');
	}
}

class Knowledgebase extends Model {
	public static $_table = 'tblknowledgebase';
	public static $_id_column = 'id';
}

class Client extends Model {
	public static $_table = 'tblclients';
	public static $_id_column = 'id';
}

?>