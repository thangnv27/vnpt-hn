<?php 

// EDIT THE 2 LINES BELOW AS REQUIRED

$send_email_to ="dungdv4@vnpt-hanoi.com.vn"; // "thao.daohuu@gmail.com";;//
//$email_subject = $_POST['subject'];//"Your email subject line";
$email_name = $_POST['hoten'];
$email_email = $_POST['email'];
$email_phone = $_POST['dienthoai'];
$email_address = $_POST['diachi'];
$email_message = $_POST['yeucau'];

function send_email2($name,$emailfrom,$email_message,$emailto)
{
  $headers = "MIME-Version: 1.0" . "\r\n";
  $headers .= "Content-type:text/html;charset=iso-8859-1" . "\r\n";
  $headers .= "From: ".$emailfrom. "\r\n";

  $message = "<strong>連絡元 : </strong>".$emailfrom."<br>";
  $message .= "<strong>お客様名前 : </strong>".$name."<br>";
  $message .= "<strong> </strong>".$email_message."<br>";
 // @mail($emailto, $subject, $message,$headers);
  @mail($emailto,'Lycheesoftのお客様から', $message,$headers);
  @mail('hn79525@coast.ocn.ne.jp','Lycheesoftのお客様から', $message,$headers);
  //@mail($emailfrom,'Lycheesoftから',' Thank you for your mail <br/>'.$message,$headers);
  
  return true;
}



function send_email_dunginfo($name,$emailfrom,$address,$phone,$messagex,$emailto)
{
  $headers = "MIME-Version: 1.0" . "\r\n";
  $headers .= "Content-type:text/html;charset=iso-8859-1" . "\r\n";
  $headers .= "From: ".$emailfrom. "\r\n";

  $message = "<strong>Họ tên: </strong>".$name."<br>";
  $message .= "<strong>Email: </strong>".$emailfrom."<br>";
  $message .= "<strong>Địa chỉ lắp đặt: </strong>".$address."<br>";
  $message .= "<strong>Số điện thoại: </strong>".$phone."<br>";
  $message .= "<strong>Yêu cầu:</strong>".$messagex."<br>";
 // @mail($emailto, $subject, $message,$headers);
  @mail($emailto,'VNPT-HN - Đăng kí dịch vụ', $message,$headers);

  return true;
}


function send_email_php_mailer($name,$emailfrom,$address,$phone,$messagex,$emailto)
{
  $message =  "<strong>Họ tên: </strong>".$name."<br>";
  $message .= "<strong>Email: </strong>".$emailfrom."<br>";
  $message .= "<strong>Địa chỉ lắp đặt: </strong>".$address."<br>";
  $message .= "<strong>Số điện thoại: </strong>".$phone."<br>";
  $message .= "<strong>Yêu cầu:</strong>".$messagex."<br>";
 
  
//Create a new PHPMailer instance
$mail = new PHPMailer;

$mail->CharSet = 'UTF-8';

//Tell PHPMailer to use SMTP
$mail->isSMTP();

//Enable SMTP debugging
// 0 = off (for production use)
// 1 = client messages
// 2 = client and server messages
$mail->SMTPDebug = 0;

//Ask for HTML-friendly debug output
$mail->Debugoutput = 'html';

//Set the hostname of the mail server
$mail->Host = 'smtp.gmail.com';

//Set the SMTP port number - 587 for authenticated TLS, a.k.a. RFC4409 SMTP submission
$mail->Port = 587;

//Set the encryption system to use - ssl (deprecated) or tls
$mail->SMTPSecure = 'tls';

//Whether to use SMTP authentication
$mail->SMTPAuth = true;

//Username to use for SMTP authentication - use full email address for gmail
$mail->Username = "bhkv3.ttkd.vnpt@gmail.com";

//Password to use for SMTP authentication
$mail->Password = "ztuvjopjzglruxec";

//Set who the message is to be sent from
$mail->setFrom("bhkv3.ttkd.vnpt@gmail.com", 'VNPT HN Service');

//Set an alternative reply-to address
$mail->addReplyTo($emailfrom, $name);

//Set who the message is to be sent to
$mail->addAddress($emailto, 'Dung info');

//


//Set the subject line
$mail->Subject = 'VNPT - DANG KY DICH VU';

//Read an HTML message body from an external file, convert referenced images to embedded,
//convert HTML into a basic plain-text alternative body
$mail->msgHTML($message);

//Replace the plain text body with one created manually
$mail->AltBody = $message;

//Attach an image file
//$mail->addAttachment('images/phpmailer_mini.png');

//send the message, check for errors
if (!$mail->send()) {
   // echo "Mailer Error: " . $mail->ErrorInfo;
    return false;
} else {
//    echo "Message sent!";
    return true;
}

}


function validate($name,$email,$message,$address,$phone)
{
  $return_array = array();
  $return_array['success'] = '1';
  $return_array['name_msg'] = '';
  $return_array['email_msg'] = '';
  $return_array['message_msg'] = '';

 if($email == '')
  {
    $return_array['success'] = '0';
    $return_array['email_msg'] = 'Thiếu thông tin email';
  }
  else
  {
    $email_exp = '/^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/';
    if(!preg_match($email_exp,$email)) {
      $return_array['success'] = '0';
      $return_array['email_msg'] = 'Email không đúng định dạng';  
    }
  }

  if($name == '')
  {
    $return_array['success'] = '0';
    $return_array['name_msg'] = 'Thiếu họ và tên';
  }
  if($address == '')
  {
    $return_array['success'] = '0';
    $return_array['name_msg'] = 'Thiếu địa chỉ lắp đặt';
  }
  if($phone == '')
  {
    $return_array['success'] = '0';
    $return_array['name_msg'] = 'Thiếu số điện thoại';
  }
  


  if($message == '')
  {
    $return_array['success'] = '0';
    $return_array['message_msg'] = 'Thiếu nội dung yêu cầu';
  }
  else
  {
    if (strlen($message) < 2) {
      $return_array['success'] = '0';
      $return_array['message_msg'] = 'Thiếu nội dung yêu cầu';
    }
  }
  return $return_array;
}

//$name = $_POST['name'];
//$email = $_POST['email'];
//$message = $_POST['message'];

require 'PHPMailer/PHPMailerAutoload.php';
$return_array = validate($email_name,$email_email,$email_message,$email_address,$email_phone);
if($return_array['success'] == '1')
{
 // send_email2($email_name,$email_email,$email_message,$email_subject,$send_email_to);
if(!send_email_php_mailer($email_name, $email_email, $email_address, $email_phone, $email_message, $send_email_to))
{
    $return_array['success'] = '0';
    $return_array['msg'] = 'Khong the gui mail';
}

}

header('Content-type: text/json');
echo json_encode($return_array);
die();

?>
