var express = require('express');
var router = express.Router();

var template = require('./template.js');
var db = require('./db');

// 로그인 화면
router.get('/login', function (request, response) {
    var title = '로그인';
    var html = template.HTML(title,`
            <form action="/auth/login_process" method="post" class="login-wrap">
            <div class="login-html">
        <input id="tab-1" type="radio" name="tab" class="sign-in" checked><label for="tab-1" class="tab">로그인</label>
        <input id="tab-2" type="radio" name="tab" class="sign-up" onClick="location.href='SignIn.html'"><label for="tab-2" class="tab"><a href="/auth/register">회원가입</a></label>
        <div class="login-form">
        <div class="sign-in-htm">
            <div class="group">
            <label for="user" class="label">ID</label>
            <input id="user" type="text" class="input" name="username">
            </div>
            <div class="group">
            <label for="pass" class="label">비밀번호</label>
            <input id="pass" type="password" class="input" data-type="password" name="pwd">
            </div>
            <div class="group">
            <input type="submit" class="button" value="로그인">
            </div>
            <div class="hr"></div>
            <div class="foot-lnk">
            <a href="FindPw.html">비밀번호 찾기</a>
            </div>
        </div>
        </div>
        </div>
        </form>            
        `, '');
    response.send(html);
});

// 로그인 프로세스
router.post('/login_process', function (request, response) {
    var username = request.body.username;
    var password = request.body.pwd;
    if (username && password) {             // id와 pw가 입력되었는지 확인
        
        db.query('SELECT * FROM user WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
            if (error) throw error;
            if (results.length > 0) {       // db에서의 반환값이 있으면 로그인 성공
                request.session.is_logined = true;      // 세션 정보 갱신
                request.session.nickname = username;
                request.session.save(function () {
                    response.redirect(`/`);
                });
            } else {              
                response.send(`<script type="text/javascript">alert("로그인 정보가 일치하지 않습니다."); 
                document.location.href="/auth/login";</script>`);    
            }            
        });

    } else {
        response.send(`<script type="text/javascript">alert("아이디와 비밀번호를 입력하세요!"); 
        document.location.href="/auth/login";</script>`);    
    }
});

// 로그아웃
router.get('/logout', function (request, response) {
    request.session.destroy(function (err) {
        response.redirect('/');
    });
});


// 회원가입 화면
router.get('/register', function(request, response) {
    var title = '회원가입';    
    var html = template.HTML(title, `
    <!DOCTYPE html>
    <html>
    <title>회원가입</title>
    <link rel="stylesheet" href="LogIn.css" />
    <div class="login-wrap">
      <div class="login-html">
        <input id="tab-1" type="radio" name="tab" class="sign-in" checked>
        <label for="tab-1" class="tab">회원가입</label>
        <input id="tab-2" type="radio" name="tab" class="sign-up" onClick="location.href='/auth/login'">
        <label for="tab-2" class="tab">로그인</label>
        <div class="login-form">
          <div class="sign-in-htm">
            <form action="/auth/register_process" method="post">
              <div class="group">
                <label for="user" class="label">ID</label>
                <input id="user" type="text" class="input" name="username" placeholder="아이디">
              </div>
              <div class="group">
                <label for="email" class="label">이메일</label>
                <input id="email" type="text" class="input" name="email" placeholder="이메일">
              </div>
              <div class="group">
                <label for="pass" class="label">비밀번호</label>
                <input id="pass" type="password" class="input" name="pwd" placeholder="비밀번호">
              </div>
              <div class="group">
                <label for="pass2" class="label">비밀번호 확인</label>
                <input id="pass2" type="password" class="input" name="pwd2" placeholder="비밀번호 재확인">
              </div>
              <div class="group">
                <input type="submit" class="button" value="회원가입">
              </div>
            </form>
            <div class="hr"></div>
            <div class="foot-lnk">
              <label for="tab-1">이미 회원이신가요? <a href="/auth/login">로그인</a></label>
            </div>
          </div>
        </div>
      </div>
    </div>
    </html>
    `, '');
    response.send(html);
});

 
// 회원가입 프로세스
router.post('/register_process', function(request, response) {    
    var username = request.body.username;
    var email = request.body.email; // 클라이언트가 입력한 이메일 가져오기
    var password = request.body.pwd;    
    var password2 = request.body.pwd2;

    if (username && email && password && password2) { // 모든 필드가 입력되었는지 확인
        
        // 중복된 사용자 이름 및 이메일을 데이터베이스에서 확인
        db.query('SELECT * FROM user WHERE username = ? OR email = ?', [username, email], function(error, results, fields) {
            if (error) throw error;

            if (results.length === 0 && password === password2) { // 중복된 사용자 이름 또는 이메일이 없고, 비밀번호가 일치하는 경우
                db.query('INSERT INTO user (username, email, password) VALUES (?, ?, ?)', [username, email, password], function (error, data) {
                    if (error) throw error;
                    response.send(`<script type="text/javascript">alert("회원가입이 완료되었습니다!"); document.location.href="/";</script>`);
                });
            } else if (password !== password2) { // 비밀번호가 일치하지 않는 경우
                response.send(`<script type="text/javascript">alert("입력된 비밀번호가 서로 다릅니다."); document.location.href="/auth/register";</script>`);    
            } else { // 이미 존재하는 사용자 이름 또는 이메일이 있는 경우
                response.send(`<script type="text/javascript">alert("이미 존재하는 아이디 또는 이메일입니다."); document.location.href="/auth/register";</script>`);    
            }            
        });

    } else { // 필수 정보가 입력되지 않은 경우
        response.send(`<script type="text/javascript">alert("입력되지 않은 정보가 있습니다."); document.location.href="/auth/register";</script>`);
    }
});

module.exports = router;