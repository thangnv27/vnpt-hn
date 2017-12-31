<?php
session_start();
// @ini_set('display_errors', 'On');

$login = $_SESSION['login_user'];
if (empty($login)) {
    header("location: login.php");
}

include 'lib/Database.php';
include 'lib/functions.php';

$db = new Database();
$notice = '';
if (isset($_POST['submit'])) {
    $title = $_POST['title'];
    $slug = $_POST['slug'];
    $content = $_POST['content'];
    if (empty($title)) {
        $notice = "Nhập tiêu đề";
    } else {
        if(empty($slug)){
            $slug = clean_entities($title);
        }
        $id = $db->insert('news', array('title' => $title, 'content' => $content, 'slug' => $slug));
        if (!empty($id)) {
            header("location: edit.php?id=" . $id);
        }
    }
}
?>
<html>
    <head>
        <title>Thêm mới tin tức</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="css/bootstrap.min.css" rel="stylesheet">
        <link href="css/style.css" rel="stylesheet">
    </head>
    <body>

        <div class="container">
            <h3>Thêm mới</h3>
            <p><?php echo $notice; ?></p>
            <form class="form-horizontal" method="post">
                <div class="form-group">
                    <label for="title" class="col-sm-2 control-label">Tiêu đề</label>
                    <div class="col-sm-10">
                        <input type="text" class="form-control" id="title" name="title" value="">
                    </div>
                </div>
                <div class="form-group">
                    <label for="slug" class="col-sm-2 control-label">Đường dẫn tĩnh</label>
                    <div class="col-sm-10">
                        <input type="text" class="form-control" id="slug" name="slug" />
                    </div>
                </div>
                <div class="form-group">
                    <label for="content" class="col-sm-2 control-label">Nội dung</label>
                    <div class="col-sm-10">
                        <textarea rows="10" class="form-control" name="content"></textarea>
                    </div>
                </div>
                <div class="form-group">
                    <div class="col-sm-offset-2 col-sm-10">
                        <button type="submit" name="submit" class="btn btn-primary">Thêm mới</button>
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
