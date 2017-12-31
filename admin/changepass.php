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
//$notice = "";
if (isset($_POST['submit'])) {
    $current_pass = $_POST['current_pass'];
//    check current pass
    $query = $db->select('config', "cf_value", array('cf_name' => 'admin_pass'));

    if ($query[0]['cf_value'] == $current_pass) {
        $new_pass = $_POST['new_pass'];
        $new_pass_2 = $_POST['new_pass_2'];
        if (empty($current_pass) or $current_pass == "") {
            $notice = "Hãy nhập mật khẩu";
        } elseif (empty($new_pass) or empty($new_pass_2)) {
            $notice = "Hãy nhập mật khẩu";
        } elseif ($new_pass != $new_pass_2) {
            $notice = "Mật khẩu mới không khớp";
        } else {
            $db->update('config', array('cf_value' => $new_pass), array('cf_name' => 'admin_pass'));
//        header("location: changepass.php");
            $notice = "Cập nhật thành công";
        }
    } else{
        $notice = "Mật khẩu hiện tại không đúng!";
    }
}
?>
<html>
    <head>
        <title>Thay đổi mật khẩu</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="css/bootstrap.min.css" rel="stylesheet">
        <link href="css/style.css" rel="stylesheet">
    </head>
    <body>

        <div class="container">
            <h3>Chỉnh sửa</h3>
            <p><?php echo $notice; ?></p>
            <form class="form-horizontal" method="post">
                <div class="form-group">
                    <label for="current_pass" class="col-sm-2 control-label">Mật khẩu hiện tại:</label>
                    <div class="col-sm-4">
                        <input type="password" class="form-control" id="current_pass" name="current_pass" value="">
                    </div>
                </div>
                <div class="form-group">
                    <label for="new_pass" class="col-sm-2 control-label">Mật khẩu mới</label>
                    <div class="col-sm-4">
                        <input type="password" class="form-control" id="new_pass" name="new_pass" value="">
                    </div>
                </div>
                <div class="form-group">
                    <label for="new_pass_2" class="col-sm-2 control-label">Xác nhận mật khẩu</label>
                    <div class="col-sm-4">
                        <input type="password" class="form-control" id="new_pass_2" name="new_pass_2" value="">
                    </div>
                </div>

                <div class="form-group">
                    <div class="col-sm-offset-2 col-sm-4">
                        <button type="submit" name="submit" class="btn btn-primary">Cập nhật</button>
                        <a class="btn btn-default" href="index.php">Quay lại</a>
                    </div>
                </div>
            </form>
        </div>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
        <script src="js/tinymce/tinymce.min.js"></script>
        <script>
            tinymce.init({
                selector: "textarea",
                theme: "modern",
                plugins: [
                    "advlist autolink link image lists charmap print preview hr anchor pagebreak spellchecker",
                    "searchreplace wordcount visualblocks visualchars code fullscreen insertdatetime media nonbreaking",
                    "save table contextmenu directionality emoticons template paste textcolor"
                ],
                content_css: "css/content.css",
                toolbar: "insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | l      ink image | print preview media fullpage | forecolor backcolor emoticons",
                style_formats: [
                    {title: 'Bold text', inline: 'b'},
                    {title: 'Red text', inline: 'span', styles: {color: '#ff0000'}},
                    {title: 'Red header', block: 'h1', styles: {color: '#ff0000'}},
                    {title: 'Example 1', inline: 'span', classes: 'example1'},
                    {title: 'Example 2', inline: 'span', classes: 'example2'},
                    {title: 'Table styles'},
                    {title: 'Table row 1', selector: 'tr', classes: 'tablerow1'}
                ]
            });
        </script>


    </body>
</html>
