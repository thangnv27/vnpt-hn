<?php

include 'admin/lib/Database.php';
$db = new Database();
$slug = $_REQUEST["slug"];
$news = $db->select('news', '*', array('slug' => $slug));
$lists = $db->select('news', "*", "slug<>'$slug' AND id<>3 AND id<7");
foreach ($lists as $list):
    $listHTML .= <<<HTML
        <li><a id="titlelink" class="other-link" onclick="Get_Post('{$list['slug']}')" href="javascript://">{$list['title']}</a></li>
HTML;
endforeach;
$return["news"] = json_encode(array(
    'title' => $news[0]['title'],
    'content' => $news[0]['content'],
    'lists'=> $listHTML,
        )
);
echo $return["news"];
