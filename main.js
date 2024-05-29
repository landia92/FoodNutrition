const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser');
const FileStore = require('session-file-store')(session)
const multer = require('multer');

var authRouter = require('./lib_login/auth');
var authCheck = require('./lib_login/authCheck.js');
var template = require('./lib_login/template.js');

const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: '~~~',	// 원하는 문자 입력
  resave: false,
  saveUninitialized: true,
  store:new FileStore(),
}))

const upload = multer({ dest: 'files/' });

app.get('/', (req, res) => {
  if (!authCheck.isOwner(req, res)) {  // 로그인 안되어있으면 로그인 페이지로 이동시킴
    res.redirect('/auth/login');
    return false;
  } else {                                      // 로그인 되어있으면 메인 페이지로 이동시킴
    res.redirect('/main');
    return false;
  }
})

// 인증 라우터
app.use('/auth', authRouter);

// 메인 페이지
app.get('/main', (req, res) => {
  if (!authCheck.isOwner(req, res)) {  // 로그인 안되어있으면 로그인 페이지로 이동시킴
    res.redirect('/auth/login');
    return false;
  }

  // 파일 업로드를 위한 HTML 폼
  const html = template.HTML('Welcome',
    `<hr>
    <h2>메인 페이지에 오신 것을 환영합니다</h2>
    <p>로그인에 성공하셨습니다.</p>
    <form action="/upload" method="post" enctype="multipart/form-data">
      <input type="file" name="file">
      <button type="submit">파일 업로드</button>
    </form>`,
    authCheck.statusUI(req, res)
  );

  res.send(html);
});

// 파일 업로드 POST 요청 처리
app.post('/upload', upload.single('file'), (req, res) => {
  const uploadedFile = req.file;
  if (!uploadedFile) {
    res.status(400).send('파일을 업로드하지 못했습니다.');
    return;
  }
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send(`파일이 업로드되었습니다: ${uploadedFile.originalname}`);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})