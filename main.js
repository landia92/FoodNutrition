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

const app = express();
const port = 3000;

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
  app.use(express.static('/Users/hoon/Desktop/nutrition/css'));

  // Main HTML 폼
  const html = template.HTML('Welcome',
  `<head>
    <link rel="stylesheet" href="/main.css">
  </head>
  <body>
    <!DOCTYPE html>
<html>
<link rel="stylesheet" href="PageHome.css" />
<script src="./calendar.js"></script>

<div class="home-wrap">
<div class="home-html">
    <div class="home-banner">Food Nutrition</div>
    
    <div class="home-container">
    <div class="hello">${authCheck.statusUI(req, res)}</div>
        <div class="pictex">
            <ul class = "ulpic">
                <li class="lipic">
                    <form method="post" enctype="multipart/form-data">
                        <label for="choosefile">
                            <div class="picture">
                                <img class="li-upload-image" src="UploadImage.png">
                                <a class="picname">사진을 넣어주세요</a>
                            </div>
                        </label>
                        <input type="file" id="choosefile" name="choosefile" accept="image/*" onchange="loadFile(this)">
                    </form>
                    <div class="delete">
                        <img class="delete-image" src="DeleteImage.png">
                    </div>
                </li>

                <li class="lipic">
                    <form method="post" enctype="multipart/form-data">
                        <label for="choosefile">
                            <div class="picture">
                                <img class="li-upload-image" src="UploadImage.png">
                                <a class="picname">사진을 넣어주세요</a>
                            </div>
                        </label>
                        <input type="file" id="choosefile" name="choosefile" accept="image/*" onchange="loadFile(this)">
                    </form>
                    <div class="delete">
                        <img class="delete-image" src="DeleteImage.png">
                    </div>
                </li>

                <li class="lipic">
                    <form method="post" enctype="multipart/form-data">
                        <label for="choosefile">
                            <div class="picture">
                                <img class="li-upload-image" src="UploadImage.png">
                                <a class="picname">사진을 넣어주세요</a>
                            </div>
                        </label>
                        <input type="file" id="choosefile" name="choosefile" accept="image/*" onchange="loadFile(this)">
                    </form>
                    <div class="delete">
                        <img class="delete-image" src="DeleteImage.png">
                    </div>
                </li>
            </ul>
        </div>

        <div class="calendar">
          <div class="calendarname">${formattedDate}</div>
            <div class="calendartext">오늘 먹은 식단을 확인해주세요!</div>
        </div>
    </div>
    <div class="home-footer">
        <div class="li-area">
            <ul class="li">
                <li class="li-home">
                    <a href="PageHome.html">
                        <img class="li-home-image" src="HomeImage.png">
                        <div class="li-home-name">홈</div>
                    </a>
                </li>
                <li class="li-home">
                    <a href="CalendarPage.html">
                        <img class="li-home-image" src="Calendar.png">
                        <div class="li-home-name">달력</div>
                    </a>
                </li>
            </ul>
        </div>
    </div>
</li>
</div>
</div>
</html>
  </body>`,
);
res.send(html);
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

  // 파일의 경로를 데이터베이스에 저장
  const filePath = `/uploads/${uploadedFile.filename}`;
  
  const sql = 'INSERT INTO files (filePath) VALUES (?)';
  db.query(sql, [filePath], (err, result) => {
    if (err) {
      console.error('데이터베이스 오류:', err);
      res.status(500).send('데이터베이스 오류가 발생했습니다.');
      return;
    }
    res.status(200).send('파일이 업로드되었습니다.');
  });
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
