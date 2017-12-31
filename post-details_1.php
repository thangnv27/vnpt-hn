<?php
include 'admin/lib/Database.php';
$db = new Database();
$slug = $_GET['slug'];
$news = $db->select('news', '*', array('slug' => $slug));
?>
<!doctype html>
<!-- Microdata markup added by Google Structured Data Markup Helper. -->
<html>
    <head>
        <meta charset="utf-8">
        <title><?php echo $news[0]['title']; ?></title>
        <meta name="p:domain_verify" content="9842b78156d8007f9d813e8afd5d167a"/>
        <meta content="vi" http-equiv="content-language" />
        <meta name="keywords" content="Lắp đặt FTTH, Lap dat FTTH, Internet tốc độ cao, Internet toc do cao, Lắp đặt internet, Lap dat Internet, Internet cáp quang, Internet cap quang, Thuê bao điện thoại, Thue bao dien thoai, Thuê bao di động, Thue bao di dong, Fiber cáp quang, Fiber cap quang, Fiber tốc độ cao, Fiber toc do cao, Internet vnpt, Adsl vnpt,adsl vnpt hà nội, adsl vnpt ha noi, lắp đặt adsl vnpt, vnpt hà nội, Lap mang vnpt, Lap dat internet VNPT, Lap adsl vnpt, Lap dat adsl vnpt, Dang ky adsl vnpt, Lắp mạng VNPT tại Hà Nội, Lắp đặt internet VNPT,..." />
        <meta name="Description" content="Cơ sở hạ tầng VNPT hiện đại- tiên tiến, cổng quốc tế rộng | Ưu đãi lớn, chất lượng ổn định tới 99.99%, phục vụ tận tình và chu đáo | Hotline: 0913 19 10 10"/>

        <link rel="stylesheet" href="css/themes/default/default.css" type="text/css" media="screen" />
        <link rel="stylesheet" href="css/nivo-slider.css" type="text/css" media="screen" />
        <link rel="stylesheet" href="css/style.css" type="text/css" media="screen" />
        <link rel="stylesheet" href="css/menu.css" type="text/css" media="screen" />
        <link href="http://www.jqueryscript.net/css/jquerysctipttop.css" rel="stylesheet" type="text/css">
        <link rel="stylesheet" type="text/css" href="css/slicebox.css" />
        <link rel="stylesheet" type="text/css" href="css/custom.css" />
        <link href="css/jquery.bxslider.css" rel="stylesheet" />
<!--        <script type="text/javascript" src="http://code.jquery.com/jquery-1.4.2.min.js"></script>

        <link rel="stylesheet" href="css/tip-skyblue/tip-skyblue.css" type="text/css" />
        <script type="text/javascript" src="js/jquery.poshytip.min.js"></script>-->
        <script type="text/javascript" src="js/modernizr.custom.46884.js"></script>
        <script>
            (function (i, s, o, g, r, a, m) {
                i['GoogleAnalyticsObject'] = r;
                i[r] = i[r] || function () {
                    (i[r].q = i[r].q || []).push(arguments)
                }, i[r].l = 1 * new Date();
                a = s.createElement(o),
                        m = s.getElementsByTagName(o)[0];
                a.async = 1;
                a.src = g;
                m.parentNode.insertBefore(a, m)
            })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

            ga('create', 'UA-67872717-1', 'auto');
            ga('send', 'pageview');

        </script>


    </head>

    <!-- Google Tag Manager -->
    <noscript><iframe src="//www.googletagmanager.com/ns.html?id=GTM-TRK2VC"
                      height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <script>(function (w, d, s, l, i) {
            w[l] = w[l] || [];
            w[l].push({'gtm.start':
                        new Date().getTime(), event: 'gtm.js'});
            var f = d.getElementsByTagName(s)[0],
                    j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
            j.async = true;
            j.src =
                    '//www.googletagmanager.com/gtm.js?id=' + i + dl;
            f.parentNode.insertBefore(j, f);
        })(window, document, 'script', 'dataLayer', 'GTM-TRK2VC');</script>
    <!-- End Google Tag Manager -->

    <body>

        <!-- Start Chatstack / Live Chat Button 
        <a href="#" class="LiveHelpButton default" style="border:none"><img src="http://support.vnpt-hn.com/livehelp/include/status.php" id="LiveHelpStatusDefault" name="LiveHelpStatusDefault" border="0" alt="Live Help" class="LiveHelpStatus"/></a>
         End Chatstack / Live Chat Button //-->

        <!-- slider & header -->
        <span itemscope itemtype="http://schema.org/Event">
            <div id="row1">
                <!-- slider -->
                <div id="wrapper">
                    <div class="slider-wrapper theme-default">
                        <div id="slider" class="nivoSlider"> 
                            <img alt="Lắp mạng VNPT" src="images/slider/vnptslide1.jpg"/>
                            <img alt="Lắp mạng VNPT" src="images/slider/vnptslide2.jpg"/>
                            <img alt="Lắp mạng VNPT" src="images/slider/vnptslide3.jpg"/>
                            <img alt="Lắp mạng VNPT" src="images/slider/vnptslide4.jpg"/>
                        </div>
                    </div>
                </div>

                <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
                <script src="js/jquery.popupoverlay.js"></script>
                <script type="text/javascript" src="js/jquery.nivo.slider.js"></script> 
                <script type="text/javascript">
        $(window).load(function () {
            $("#slider").nivoSlider();
        });
                </script>                     
                <!-- end slider -->

                <!-- logo vnpt -->
                <div id="logovnpt">
                    <img src="images/vnptlogo.png" alt="VNPT"/>
                    <span itemprop="performer" itemscope itemtype="http://schema.org/Person">
                        <H1 itemprop="name">TẬP ĐOÀN BƯU CHÍNH VIỄN THÔNG VIỆT NAM</H1></span>
                </div>
                <!-- end logo vnpt --> 

                <!-- vnpt vianphone -->
                <div id="vnptVinaphone">
                    <img itemprop="image" src="images/vinaphone.png" alt="VNPT"/>
                    <p class="p1">Tổng Công Ty VNPT-Vinaphone</p>
                    <p itemprop="name" class="p2">Trung tâm kinh doanh VNPT Hà Nội</p>
                    <div id="regisSer">
                        <input class="slide_open" type="button" value="ĐĂNG KÝ DỊCH VỤ" />
                        <div CLASS="hotline">
                            <p class="hotline-p1">HOTLINE</p>
                            <p class="hotline-num">(24/7): 0913 19 10 10 </p>
                        </div>
                    </div>    

                    <div id="textKhuyenmai">
                        Trước ngày <span itemprop="startDate" content="2013-08-27">31/12/2015</span>: Giảm tới <span style="font-size:18px; color:red;">100% cước</span><BR/> hòa mạng và <span style="font-size:18px; color:red; ">25% cước</span> sử dụng trọn gói
                    </div>    
                </div>
                <!-- vnpt vinaphone 
                
                <div id="livechat">
                      <img src="images/livechat.png" />
                </div>
                
                 menu -->
                <div id="cssmenu">
                    <ul>
                        <li style="width:159px;"><a href="#"><span>INTERNET CÁP QUANG</span></a>
                            <ul>
                                <li><a class="popupBGADMKH_open" href="#popupBGADMKH"><span>BẢNG GIÁ ÁP DỤNG MỌI KHÁCH HÀNG</span></a></li>
                                <li><a  class="popupKHGD_open" href="#popupKHGD"><span>KHÁCH HÀNG NGÀNH GIÁO DỤC</span></a></li>
                                <li class="last"><a class="fadeandscale_open" href="#fadeandscale"><span>KHÁCH HÀNG NGÀNH Y TẾ</span></a></li>
                            </ul>
                        </li>
                        <li class="has-sub"  style="width:209px;"><a href="#"><span>THUÊ BAO DI ĐỘNG TRẢ SAU</span></a>
                            <ul>
                                <li><a class="popupKHCN_open" href="#popupKHCN"><span>KHÁCH HÀNG CÁ NHÂN</span></a></li>
                                <li><a class="popupKHDN_open" href="#popupKHDN"><span>KHÁCH HÀNG DOANH NGHIỆP</span></a></li>
                                <li><a  class="popupHMTS_open" href="#popupHMTS"><span>NHẬN QUA KHI HÒA MẠNG TRẢ SAU</span></a></li>
                                <li class="last"><a  class="popupBG_open" href="#popupBG"><span>DỊCH VỤ 3G ÁP DỤNG MỌI KHÁCH HÀNG</span></a></li>
                            </ul>
                        </li>
                        <li  style="width:159px;"><a class="popupNB_open" href="#popupNB"><span>GÓI CƯỚC NHÀ BÁO</span></a></li>
                        <li  style="width:139px;"><a  class="popupVNPTCA_open" href="#popupVNPTCA"><span>DỊCH VỤ VNPT- CA</span></a></li>
                        <li   style="width:159px;"><a href="#"><span>TIN NHẮN QUẢNG CÁO</span></a>
                            <ul>
                                <li><a  class="popupBN_open" href="#popupBN"><span>DỊCH VỤ SMS BRANDNAME</span></a></li>
                                <li><a  class="popupQCCMTT_open" href="#popupQCCMTT"><span>QUẢNG CÁO CÁC MẠNG THEO TIN</span></a></li>
                                <li class="last"><a  class="popupVNT_open" href="#popupVNT" ><span>SMS MẠNG VINAPHONE THEO THÁNG</span></a></li>
                            </ul>
                        </li>
                        <li   style="width:159x;"><a  class="popupCDVK_open" href="#popupCDVK"><span>CÁC DỊCH VỤ KHÁC</span></a></li>
                    </ul>
                </div>
                <script type="text/javascript" src="js/menu.js"></script> 
                <!-- end menu -->

                <a><img src="images/arrowdown.PNG" id="arrowdown" alt="VNPT"/></a>
            </div>
            <!-- end slider & header -->

            <script src="js/jquery.contenthover.js"></script> 
            <script>
        $('.d2').contenthover({
            effect: 'slide',
            slide_speed: 300,
            overlay_background: '#000',
            overlay_opacity: 0.8
        });

            </script>   


            <!-- end body -->
        </span>
        <style>
            #fadeandscale, #popupBGADMKH {
                -webkit-transform: scale(0.8);
                -moz-transform: scale(0.8);
                -ms-transform: scale(0.8);
                transform: scale(0.8);
            }
            .popup_visible #fadeandscale, .popup_visible #popupBGADMKH {
                -webkit-transform: scale(1);
                -moz-transform: scale(1);
                -ms-transform: scale(1);
                transform: scale(1);
            }
        </style>
        <!-- end popup 1 -->

        <!-- popup 2 -->
        <div id="slide" class="well">
            <button id="slide-close" class="slide_close btn btn-default">X</button>
            <div id="formdangky"><br/>
                <p id="titleFormdangky">Đăng ký dịch vụ</p><br/>
                <p class="noteformdangky">Khách hàng vui lòng điền đầy đủ thông tin theo biểu mẫu dưới đây, chúng tôi sẽ liên hệ với Quý khách ngay sau khi nhận được yêu cầu!</p>
                <p class="noteformdangky">Cảm ơn quý khách !</p><br/>
                <table>
                    <tr><td>Họ và tên <span class="red">*</span></td><td><input style="width:200px;" type="text" id ="txtHoTen" name ="txtHoTen" required /></td></tr>
                    <tr><td>Địa chỉ lắp đặt <span class="red">*</span></td><td><input style="width:200px;"  type="text" id ="txtDiaChi" name ="txtDiaChi" required/></td></tr>
                    <tr><td>Email <span class="red">*</span></td><td><input style="width:200px;"  type="text" id ="txtEmail" name ="txtEmail" required/></td></tr>
                    <tr><td>Số điện thoại <span class="red">*</span></td><td><input style="width:200px;"  type="text" id ="txtSoDienThoai" name ="txtSoDienThoai" required/></td></tr>
                    <tr><td>Yêu cầu </td><td><textarea style="width:210px;"   rows="4" id ="txtYeuCau" name ="txtYeuCau"></textarea> </td></tr>
                    <tr><td></td><td><br/><input type="button" value="GỬI YÊU CẦU" id="btn-dangky" /></td></tr>
                </table>
            </div>
        </div>

        <!-- popup CÁP QUANG ÁP DỤNG CHO MỌI KHÁCH HÀNG -->
        <div id="pop-details" class="well  popupbackground">
            <a href="http://vnpt-hn.com/" class="btn btn-default" id="scale-close">X</a>
            <div class="content-right" id="scale-content">
                <h2 id="title"  class="content-title"><?php echo $news[0]['title']; ?></h2>
                <div class="content-news <?php
                if ($news[0]['id'] == 3) {
                    echo 'taisao';
                }
                ?>">
                         <?php echo $news[0]['content']; ?>
                </div>
                <?php if ($news[0]['id'] != 3) : ?>
                    <div class="content-other">
                        <?php
                        $lists = $db->select('news', "*", "slug<>'$slug' AND id<>3");
                        ?>
                        <h3>Khuyến mại khác</h3>
                        <ul class="other-news">
                            <?php foreach ($lists as $list): ?>
                                <li><a id="titlelink" class="other-link" onclick="Get_Post('<?php echo $list['slug']; ?>');" href="javascript://"><?php echo $list['title']; ?></a></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        <script>
            $(document).ready(function () {
                $('#pop-details').popup({
                    blur: false,
                    transition: 'all 0.3s'
                });
                $('#pop-details').popup('show');
                $("#pop-details_wrapper").click(function () {
//                    window.location.href = "http://vnpt-hn.com";

                });
            });
        </script>

        <script>

            function submitSendMailForm()
            {
                //                var dataString = $('#formdangky').serialize();
                txtHoTen = $('#txtHoTen').val();
                txtDiaChi = $('#txtDiaChi').val();
                txtEmail = $('#txtEmail').val();
                txtSoDienThoai = $('#txtSoDienThoai').val();
                txtYeuCau = $('#txtYeuCau').val();
                var dataRequest = {hoten: txtHoTen, diachi: txtDiaChi, email: txtEmail, dienthoai: txtSoDienThoai, yeucau: txtYeuCau};
                $.ajax({
                    type: "POST",
                    url: 'send_form_email.php',
                    data: dataRequest,
                    dataType: 'json',
                    success: function (data) {
                        if (data.success == 0) {
                            alert('Mail của bạn gửi không thành công vì lý do khách quan nào đó. Bạn vui  kiểm tra lại hoặc điện thoại đến số 0913 19 10 10 để được hỗ trợ.');//Your message is sent
                        }
                        else if (data.success == 1)
                        {
                            alert('Gửi thông tin yêu cầu thành công. Chúng tôi sẽ liên hệ với bạn sớm nhất có thể'); // Khong thanh cong
                            //$('#success_message').show();
                        }

                    },
                    error: function () {

                    }
                });

                return false;
            }
            ;

            $(document).ready(function () {

                $('#slide').popup({
                    focusdelay: 400,
                    vertical: 'center'
                });

                $('#btn-dangky').click(function () {
                    submitSendMailForm();
                });

            });
        </script>


        <style>
            #slide_background {
                -webkit-transition: all 0.3s 0.3s;
                -moz-transition: all 0.3s 0.3s;
                transition: all 0.3s 0.3s;
            }
            #slide,
            #slide_wrapper {
                -webkit-transition: all 0.4s;
                -moz-transition: all 0.4s;
                transition: all 0.4s;
            }
            #slide {
                -webkit-transform: translateX(0) translateY(-40%);
                -moz-transform: translateX(0) translateY(-40%);
                -ms-transform: translateX(0) translateY(-40%);
                transform: translateX(0) translateY(-40%);
            }
            .popup_visible #slide {
                -webkit-transform: translateX(0) translateY(0);
                -moz-transform: translateX(0) translateY(0);
                -ms-transform: translateX(0) translateY(0);
                transform: translateX(0) translateY(0);
            }
            .LiveHelpButton {
                bottom: 0;
                position: fixed;
                right: 10px;
                z-index: 9;
            }
        </style>

        <!-- end popup 2 -->
        <script src="js/script.js"></script>

            <!-- <script type="text/JavaScript" src="http://support.vnpt-hn.com/livehelp/scripts/jquery-latest.js"></script> -->
        <script type="text/javascript">
            <!--
                    var LiveHelpSettings = {};
            LiveHelpSettings.server = 'support.vnpt-hn.com';
            LiveHelpSettings.embedded = true;

            (function ($) {
                $(function () {
                    $(window).ready(function () {
                        // JavaScript
                        LiveHelpSettings.server = LiveHelpSettings.server.replace(/[a-z][a-z0-9+\-.]*:\/\/|\/livehelp\/*(\/|[a-z0-9\-._~%!$&'()*+,;=:@\/]*(?![a-z0-9\-._~%!$&'()*+,;=:@]))|\/*$/g, '');
                        var LiveHelp = document.createElement('script');
                        LiveHelp.type = 'text/javascript';
                        LiveHelp.async = true;
                        LiveHelp.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + LiveHelpSettings.server + '/livehelp/scripts/jquery.livehelp.min.js';
                        var s = document.getElementsByTagName('script')[0];
                        s.parentNode.insertBefore(LiveHelp, s);
                    });
                });
            })(jQuery);
-->
        </script>
        <div id="pop-details" class="well  popupbackground">
            <a href="http://vnpt-hn.com/" class="btn btn-default" id="scale-close">X</a>
            <div class="content-right" id="scale-content">
                <h2 id="title"  class="content-title"><?php echo $news[0]['title']; ?></h2>
                <div class="content-news <?php
                if ($news[0]['id'] == 3) {
                    echo 'taisao';
                }
                ?>">
                         <?php echo $news[0]['content']; ?>
                </div>
                <?php if ($news[0]['id'] != 3) : ?>
                    <div class="content-other">
                        <?php
                        $lists = $db->select('news', "*", "slug<>'$slug' AND id<>3");
                        ?>
                        <h3>Khuyến mại khác</h3>
                        <ul class="other-news">
                            <?php foreach ($lists as $list): ?>
                                <li><a id="titlelink" class="other-link" onclick="Get_Post('<?php echo $list['slug']; ?>');" href="javascript://"><?php echo $list['title']; ?></a></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        <div class="div-right">
            <a class="tooltips  btn-right btn-r1 <?php
            if ($news[0]['id'] == 3) {
                echo 'btn-act';
            }
            ?>" href="http://vnpt-hn.com/"><span>Tại sao dùng dịch vụ VNPT?</span></a>
            <a class="tooltip btn-right btn-r2 other-link <?php
            if ($news[0]['id'] != 3) {
                echo 'btn-act';
            }
            ?>" href="chuong-trinh-vinaphone-dong-hanh-cung-doanh-nghiep"><span>VNPT khuyến mại!</span></a>
            <div class="div-btn">
                <p class="icon-social btn-plus"><img src="images/icon/btn-plus.png" /></p>
                <a class="icon-social" href="https://www.facebook.com/groups/bhkv3.ttkd.vnpt/"><img src="images/icon/facebook-48.png" /></a>
                <a class="icon-social" href="http://bh3-ttkd-vnpt.blogspot.com"><img src="images/icon/blogger-48.png" /></a>
                <a class="icon-social" href="http://bh3ttkdvnpt.wordpress.com"><img src="images/icon/wordpress-48.png" /></a>
                <a class="icon-social" href="https://plus.google.com/117549384025007047585"><img src="images/icon/google-48.png" /></a>
                <a class="icon-social" href="https://twitter.com/vnpt_hn"><img src="images/icon/twitter-48.png" /></a>
                <a class="icon-social" href="https://myspace.com/ph.ng.b.n.h.ng.khu.v.c.3"><img src="images/icon/myspace-48.png" /></a>
                <a class="icon-social" href="https://www.pinterest.com/bhkv3/"><img src="images/icon/pinterest-48.png" /></a>
                <a class="icon-social" href="http://bhkv3.tumblr.com/"><img src="images/icon/tumblr-48.png" /></a>
                <a class="icon-social" href="https://www.flickr.com/people/134836984@N07/"><img src="images/icon/flickr-48.png" /></a>
            </div>
        </div>

        <script>

            function Get_Post(slug) {
                $.ajax({
                    url: "ajax.php",
                    data: {slug: slug},
                    dataType: 'json',
                    cache: false,
                }).done(function (news) {
                    $('.content-title').html(news.title);
                    $('.content-news').html(news.content);
                    $('.other-news').html(news.lists);
                    document.title = news.title;
                    window.history.pushState({path: slug}, '', slug);
                    $('#scale-content').animate({scrollTop: 1 * 2}, 'slow');
                });
            }
            $(document).ready(function () {
//                $('.other-link').click(function () {
//                    var slug = $(this).attr('href');
//
//                    return false;
//                });

            });
        </script>

    </body>
</html>
