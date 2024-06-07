const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const FileStore = require('session-file-store')(session);
const multer = require('multer');
const db = require('./lib_login/db');
const currentDate = new Date();
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
const formattedDate = currentDate.toLocaleDateString('ko-KR', options);

var authRouter = require('./lib_login/auth');
var authCheck = require('./lib_login/authCheck.js');
var template = require('./lib_login/template.js');
const connection = require("./lib_login/db");

const app = express();
const port = 3000;

/*app.set('view engine', 'ejs');
app.set('views', './public');*/

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: '~~~',  // 원하는 문자 입력
  resave: false,
  saveUninitialized: true,
  store: new FileStore(),
}));

app.get('/', (req, res) => {
  if (!authCheck.isOwner(req, res)) {
    res.redirect('/auth/login');
    return false;
  } else {
    res.redirect('/main');
    return false;
  }
});

// 인증 라우터
app.use('/auth', authRouter);

// 메인 페이지
app.get('/main', (req, res) => {
  if (!authCheck.isOwner(req, res)) {
    res.redirect('/auth/login');
    return false;
  }
  app.use(express.static('./css'));
  app.use(express.static('./public'));

  const authStatus = authCheck.statusUI(req, res); // 인증 상태 함수 실행
  //res.render('PageHome', { authStatus: authStatus });
  // Main HTML 폼
  res.sendFile(__dirname + '/public/PageHome.html');
});



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), (req, res) => {
  const uploadedFile = req.file;
  if (!uploadedFile) {
    res.status(400).send('파일을 업로드하지 못했습니다.');
    return;
  }

  const nickname = req.session.nickname;  // 세션에서 사용자 닉네임 가져오기

  // 사용자 정보 가져오기
  connection.query('SELECT files FROM user WHERE username = ?', [nickname], (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).send('사용자 정보를 가져오는 데 실패했습니다.');
      return;
    }

    if (results.length > 0) {
      // 기존 파일 경로에 새 파일 경로 추가
      let files = results[0].files ? results[0].files.split(',') : [];
      files.push(uploadedFile.path);

      // 업데이트된 파일 경로를 데이터베이스에 저장
      const updatedFiles = files.join(',');
      connection.query('UPDATE user SET files = ? WHERE username = ?', [updatedFiles, nickname], (error, results) => {
        if (error) {
          console.error(error);
          res.status(500).send('파일 정보를 데이터베이스에 저장하지 못했습니다.');
          return;
        }
        res.set('Content-Type', 'text/plain; charset=utf-8');
        res.send(`파일이 업로드되었으며 경로가 저장되었습니다: ${uploadedFile.originalname}`);
      });
    } else {
      res.status(404).send('사용자를 찾을 수 없습니다.');
    }
  });
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
