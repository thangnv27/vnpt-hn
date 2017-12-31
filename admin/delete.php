<?php

session_start();
$login = $_SESSION['login_user'];
if (empty($login)) {
    header("location: login.php");
}
include 'lib/Database.php';
?>

<?php

$db = new Database();
$id = $_GET['id'];
$db->delete('news', array('id' => $id));
header("location: index.php");
?>