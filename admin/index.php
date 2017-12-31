<?php
session_start();

$login = $_SESSION['login_user'];
if (empty($login)) {
    header("location: login.php");
}

include 'lib/Database.php';
?>
<html>
    <head>
        <title>Danh sách tin tức</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="css/bootstrap.min.css" rel="stylesheet">
        <link href="css/style.css" rel="stylesheet">
    </head>
    <body>
        <?php
        ini_set('display_errors', 'On');
        $db = new Database();
        $lists = $db->select('news', "*", array(), "id", "DESC");
        ?>
        <div class="container">
            <div class="pull-left">Danh sách tin tức</div>
            <div class="pull-right">
                <a class="btn btn-success" href="add.php">Thêm mới</a>
                <a class="btn btn-primary" href="changepass.php">Đổi mật khẩu</a>
                <a class="btn btn-danger" href="logout.php">Thoát</a>
            </div>
            <div class="clearfix"></div>
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Tiêu đề</th>
                        <th>Ngày tạo</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($lists as $list): ?>
                        <tr>
                            <th scope="row"><?php echo $list['id']; ?></th>
                            <td><a href="edit.php?id=<?php echo $list['id']; ?>"><?php echo $list['title']; ?></a></td>
                            <td><?php echo $list['created_date']; ?></td>
                            <td><a class="btn btn-success" href="../<?php echo $list['slug']; ?>">Xem</a> <a class="btn btn-primary" href="edit.php?id=<?php echo $list['id']; ?>">Sửa</a> <a class="btn btn-danger" href="delete.php?id=<?php echo $list['id']; ?>" onclick="return confirm('Chắc chắn xoá chứ? không khôi phục lại được đâu');">Xoá</a></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </body>
</html>
