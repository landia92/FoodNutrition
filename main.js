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

  // Main HTML 폼
  const html = template.HTML('Welcome',
      `<head>
    <link rel="stylesheet" href="/main.css">
  </head>
  <body>
  <!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" type="text/css" href="PageHome.css" />
    <title>영양 분석기</title>
    <script>
        function displayUserName() {
            const userId = localStorage.getItem('loggedInUser');
            if (userId) {
                document.getElementById('userName').textContent = userId;
                document.getElementById('userName').style.visibility = 'visible';
            }
        }

        function getQueryParams() {
            const params = new URLSearchParams(window.location.search);
            return {
                month: params.get('month'),
                day: params.get('day'),
                dayOfWeek: params.get('dayOfWeek')
            };
        }

        function setDateInfo() {
            const params = getQueryParams();
            if (params.month && params.day && params.dayOfWeek) {
                document.getElementById('period1').innerText = params.month + "월";
                document.getElementById('period2').innerText = params.day + "일";
                document.getElementById('period3').innerText = params.dayOfWeek;
            }
        }

        window.onload = function() {
            displayUserName();
            setDateInfo();
        };
    </script>
</head>
<body>
<div class="home-wrap">
    <div class="home-html">
        <div class="home-banner">Food Nutrition</div>
        <div class="home-container">
            <div class="hello">${authCheck.statusUI(req, res)}</div>
            <div class="pictex">
                <ul class="ulpic">
                    <li class="lipic">
                        <form method="post" action="/upload" enctype="multipart/form-data">
                            <label for="choosefile1">
                                <div class="picture" id="picture1">
                                    <img id="preview1" class="li-upload-image" src="/UploadImage.png">
                                    <a class="picname">사진을 넣어주세요</a>
                                </div>
                            </label>
                            <input type="file" id="choosefile1" name="file" accept="image/*" onchange="loadFile(event, 1)">
                        </form>
                        <div class="text">가나다라마바사 아자차카타파하</div>
                        <div class="delete" onclick="deleteFile(1)">
                            <img class="delete-image" src="/DeleteImage.png">
                        </div>
                    </li>
                    <li class="lipic">
                        <form method="post" action="/upload" enctype="multipart/form-data">
                            <label for="choosefile2">
                                <div class="picture" id="picture2">
                                    <img id="preview2" class="li-upload-image" src="/UploadImage.png">
                                    <a class="picname">사진을 넣어주세요</a>
                                </div>
                            </label>
                            <input type="file" id="choosefile2" name="file" accept="image/*" onchange="loadFile(event, 2)">
                        </form>
                        <div class="text">가나다라마바사 아자차카타파하</div>
                        <div class="delete" onclick="deleteFile(2)">
                            <img class="delete-image" src="/DeleteImage.png">
                        </div>
                    </li>
                    <li class="lipic">
                        <form method="post" action="/upload" enctype="multipart/form-data">
                            <label for="choosefile3">
                                <div class="picture" id="picture3">
                                    <img id="preview3" class="li-upload-image" src="/UploadImage.png">
                                    <a class="picname">사진을 넣어주세요</a>
                                </div>
                            </label>
                            <input type="file" id="choosefile3" name="file" accept="image/*" onchange="loadFile(event, 3)">
                        </form>
                        <div class="text">가나다라마바사 아자차카타파하</div>
                        <div class="delete" onclick="deleteFile(3)">
                            <img class="delete-image" src="/DeleteImage.png">
                        </div>
                    </li>
                </ul>
            </div>
            <div class="calendar">
                <div class="calendarname">
                    <span id="period1">월</span>
                    <span id="period2">일</span>
                    <span id="period3">요일</span>
                </div>
                <div class="calendartext">오늘 먹은 식단을 확인해주세요!</div>
            </div>
        </div>
        <div class="home-footer">
            <div class="li-area">
                <ul class="li">
                    <li class="li-home">
                        <a href="/main">
                            <img class="li-home-image" src="/HomeImage.png">
                            <div class="li-home-name">홈</div>
                        </a>
                    </li>
                    <li class="li-home">
                        <a href="/CalendarPage.html">
                            <img class="li-home-image" src="/Calendar.png">
                            <div class="li-home-name">달력</div>
                        </a>
                    </li>
                    <li class="li-home">
                        <a href="/FirstPage.html">
                            <img class="li-home-image" src="/Exit.png">
                            <div class="li-home-name">나가기</div>
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</div>
    <script>
        function loadFile(event, index) {
            const output = document.getElementById('preview' + index);
            output.src = URL.createObjectURL(event.target.files[0]);
            output.onload = function() {
                URL.revokeObjectURL(output.src); // 메모리 해제
            };
            const pictureDiv = document.getElementById('picture' + index);
            pictureDiv.classList.add('uploaded');
            pictureDiv.querySelector('.picname').style.display = 'none';
        }

        function deleteFile(index) {
            const output = document.getElementById('preview' + index);
            output.src = 'UploadImage.png';
            const pictureDiv = document.getElementById('picture' + index);
            pictureDiv.classList.remove('uploaded');
            pictureDiv.querySelector('.picname').style.display = 'block';
            document.getElementById('choosefile' + index).value = '';
        }

        window.onload = function() {
            displayUserName();
            setDateInfo();
        };
    </script>
</body>
</html>
  </body>`,
  );
  res.send(html);
  
  // html 파일로 불러오기
  //res.sendFile(__dirname + '/public/PageHome.html');
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
