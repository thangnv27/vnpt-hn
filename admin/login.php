<?php
session_start();
include 'lib/Database.php';
$db = new Database();
$login = $_SESSION['login_user'];
if (!empty($login)) {
    header("location: index.php");
}

if (isset($_POST['submit'])) {
    if (empty($_POST['user']) || empty($_POST['password'])) {
        $error = "Sai tài khoản hoặc mật khẩu";
    } else {
// Define $username and $password
        $username = $_POST['user'];
        $password = $_POST['password'];
        
        $query = $db->select('config', "cf_value", array('cf_name' => 'admin_pass'));
        if ($username == 'admin' && $password == $query[0]['cf_value']) {
            $_SESSION['login_user'] = $username;
            header("location: index.php");
        } else {
            $error = "Sai tài khoản hoặc mật khẩu";
        }
    }
}
?>
<!DOCTYPE html>
<html>
    <head>
        <title>Đăng nhập</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="css/bootstrap.min.css" rel="stylesheet">
        <link href="css/style.css" rel="stylesheet">
    </head>
    <body>
        <div class="container">
            <div class="form-signin">
                <?php echo $error; ?>
                <form class="form-horizontal" method="post">
                    <div class="form-group">
                        <label for="user" class="col-sm-4 control-label">Tài khoản</label>
                        <div class="col-sm-8">
                            <input type="text" name="user" class="form-control" id="user" placeholder="Tài khoản">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="password" class="col-sm-4 control-label">Mật khẩu</label>
                        <div class="col-sm-8">
                            <input type="password" name="password" class="form-control" id="password" placeholder="Password">
                        </div>
                    </div>
                    <div class="form-group">
                    </div>
                    <div class="form-group">
                        <div class="col-sm-offset-4 col-sm-8">
                            <button type="submit" name="submit" class="btn btn-default">Đăng nhập</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </body>
</html>
