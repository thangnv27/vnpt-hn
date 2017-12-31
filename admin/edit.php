<?php
session_start();
$login = $_SESSION['login_user'];
if (empty($login)) {
    header("location: login.php");
}
include 'lib/Database.php';
?>

<?php
ini_set('display_errors', 'On');
$db = new Database();
$id = $_GET['id'];
$news = $db->select('news', '*', array('id' => $id));

$notice = "";
if (isset($_POST['submit'])) {
    $title = $_POST['title'];
    $content = $_POST['content'];
    $slug = $_POST['slug'];
    if (empty($title)) {
        $notice = "Nhập tiêu đề";
    } else {
        $db->update('news', array('title' => $title, 'content' => $content, 'slug' => $slug), array('id' => $news[0]['id']));
        header("location: edit.php?id=" . $id);
    }
}
?>
<html>
    <head>
        <title>Chỉnh sửa tin tức</title>
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
                    <label for="title" class="col-sm-2 control-label">Tiêu đề</label>
                    <div class="col-sm-10">
                        <input type="text" class="form-control" id="title" name="title" value="<?php echo $news[0]['title']; ?>">
                    </div>
                </div>
                <div class="form-group">
                    <label for="slug" class="col-sm-2 control-label">Đường dẫn tĩnh</label>
                    <div class="col-sm-10">
                        <input type="text" class="form-control" id="slug" name="slug" value="<?php echo $news[0]['slug']; ?>">
                    </div>
                </div>
                <div class="form-group">
                    <label for="content" class="col-sm-2 control-label">Nội dung</label>
                    <div class="col-sm-10">
                        <textarea id="content" rows="10" class="form-control" name="content"><?php echo $news[0]['content']; ?></textarea>
                    </div>
                </div>
                <div class="form-group">
                    <div class="col-sm-offset-2 col-sm-10">
                        <button type="submit" name="submit" class="btn btn-primary">Lưu lại</button>
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
