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
const FormData = require("form-data");
const fs = require("fs");
const axios = require("axios");

var monDay=null; //날짜를 DB에 전달하기 위한 변수
var savedFile = null

const app = express();
const port = 3000;


//오늘 날짜 출력
const today = new Date();
const dayOfWeekNumber = today.getDay();
const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
let month = today.getMonth() + 1; // 월 (0부터 시작하므로 +1)
let day = today.getDate();
let dayOfWeek = days[dayOfWeekNumber];


/*app.set('view engine', 'ejs');
app.set('views', './public');*/

app.use(bodyParser.urlencoded({ extended: false }));
app.use('/uploads', express.static('uploads'));
app.use(express.json());
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
    res.redirect(`/main?month=${month}&day=${day}&dayOfWeek=${dayOfWeek}`);
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

  const nickname = req.session.nickname;  // 세션에서 사용자 닉네임 가져오기
  const { month, day } = req.query; //월과 일
  monDay = month + day              //월과 일을 전달하기 위한 값
  console.log(monDay);

  connection.query('SELECT file_path FROM file_storage WHERE username = ?', [nickname], (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).send('사용자 정보를 가져오는 데 실패했습니다.');
      return;
    }
    if(isNaN(monDay)){
      res.sendFile(__dirname + '/public/PageHome.html');
      return;
    }
    connection.query('SELECT file_path, file_name FROM file_storage WHERE username = ? AND date = ?', [nickname, monDay], (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).send('파일 정보를 데이터베이스에 저장하지 못했습니다.');
        return;
      }
      else if(monDay == null){
        console.error(error);
        res.status(500).send('파일 정보를 데이터베이스에 저장하지 못했습니다. 날짜를 선택하세요.');
        return;
      }

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
                <form id="uploadForm" action="/upload" method="post" enctype="multipart/form-data">
                    <input type="file" name="file">
                    <button type="submit" id="submitButton">파일 업로드</button>
                </form>
                <ul class="ulpic" id="dynamicList"></ul>
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
        document.getElementById('uploadForm').onsubmit = async function(event) {
            event.preventDefault();  // 폼의 기본 제출 동작을 방지
            var formData = new FormData(this);
            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData,
                });
                const result = await response.text();
                document.getElementById('message').innerText = result;
            } catch (error) {
                document.getElementById('message').innerText = 'Failed to upload image.';
            }
        }
        
        document.getElementById('submitButton').onclick = function (){
            setTimeout(function() {
                window.location.reload();
            }, 1000); // 밀리초 후에 페이지를 새로 고침
        }
        
        function readAllFile(file){
            const list = document.getElementById("dynamicList");
            for(i = 0; i <file.length; i++){
            let li = document.createElement("li");
                li.className = "lipic";
                li.innerHTML = \`
                    <form id="deleteForm" method="delete" action="/delete" enctype="multipart/form-data">
                        <div class="picture">
                                <img id="preview" class="li-upload-image" src="/UploadImage.png" style="width: 100px; height: auto;">
                        </div>
                        <input id="deleteId" type="hidden" name="file_name" value="">
                    </form>
                    <div class="text"><a></a></div>
                    <div class="delete">
                        <img class="delete-image" src="/DeleteImage.png" onclick="deleteItem(this)">
                    </div>
                    \`;
                    
                    let foodInfo = [
  {"name": "Chicken", "k_name":"치킨", "kcal": "530"},
  {"name": "Donut", "k_name":"도넛", "kcal": "296"},
  {"name": "Dumpling", "k_name":"만두", "kcal": "397"},
  {"name": "Lobster", "k_name":"랍스터", "kcal": "286"},
  {"name": "Madeleine", "k_name":"마들렌", "kcal": "110"},
  {"name": "Pizza", "k_name":"피자", "kcal": "255"},
  {"name": "Pork_cutlet", "k_name":"돈가스", "kcal": "651"},
  {"name": "Rolled_omelet", "k_name":"계란말이", "kcal": "154"},
  {"name": "Sandwich", "k_name":"샌드위치", "kcal": "304"},
  {"name": "Sausage", "k_name":"소시지", "kcal": "262"}
]
                li.querySelector('img').src = "./"+file[i].file_path;
                for(j=0;j<foodInfo.length;j++){
                    if(file[i].file_name == foodInfo[j].name){
                        li.querySelector('a').innerText = "이름 : " + foodInfo[j].k_name + "    kcal : " + foodInfo[j].kcal;
                        li.querySelector('input').value = foodInfo[j].name;
                        break;
                    }                 
                }
                list.appendChild(li);
                
            }
        }
        
        function deleteItem(element) {
                const file_name = element.closest('li').querySelector('input[name="file_name"]').value;
                
                fetch('/delete', {
                    method: 'DELETE',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ file_name: file_name })
                })
                .then(response => response.text())
                .then(data => {
                    alert(data); // 서버로부터 받은 응답을 사용자에게 알림
                    if (data === '레코드가 성공적으로 삭제되었습니다.') {
                      element.closest('li').remove(); // 클릭된 이미지의 부모인 div를 찾고, 그 부모의 부모인 li를 삭제
                    }
                })
                .catch(error => console.error('Error:', error));
            }
        
        window.onload = function() {
            displayUserName();
            setDateInfo();
            readAllFile(${JSON.stringify(results)});
        };
    </script>
</body>
</html>
  </body>`,
      );
      res.send(html);
    });
  })

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

  const filePath = `./uploads/${req.file.filename}`;
  const formData = new FormData();
  formData.append('image', fs.createReadStream(filePath));
  const nickname = req.session.nickname;  // 세션에서 사용자 닉네임 가져오기

  axios.post('http://localhost:5000/upload/yolov5s-food', formData, {
    headers: {
      ...formData.getHeaders()
    }
  })
      .then(response => {
        // EJS 템플릿을 사용해 응답 데이터를 렌더링
        //res.render('result', { data: response.data });
        // EJS 없고 메시지만 표시
        //console.log('Image successfully uploaded:', response.data);
        //res.send(response.data[0].name)
        // 사용자 정보 가져오기
        connection.query('SELECT file_path FROM file_storage WHERE username = ?', [nickname], (error, results) => {
          if (error) {
            console.error(error);
            res.status(500).send('사용자 정보를 가져오는 데 실패했습니다.');
            return;
          }
          connection.query('INSERT INTO file_storage (username, file_path, file_name, date) VALUES (?, ?, ?, ?)', [nickname, uploadedFile.path, response.data[0].name, monDay], (error, results) => {
            if (error) {
              console.error(error);
              res.status(500).send('파일 정보를 데이터베이스에 저장하지 못했습니다.');
              return;
            }
            else if(monDay == null){
              console.error(error);
              res.status(500).send('파일 정보를 데이터베이스에 저장하지 못했습니다. 날짜를 선택하세요.');
              return;
            }
            /*res.set('Content-Type', 'text/plain; charset=utf-8');
            res.send(`파일이 업로드되었으며 경로가 저장되었습니다: ${uploadedFile.originalname}`);*/
          });
        });
        /*res.send('이미지가 성공적으로 업로드 되었습니다.');*/
      })
      .catch(error => {
        console.error('Failed to upload image:', error);
        res.status(500).send('Failed to upload image.');
      });
});

app.delete('/delete', (req, res) => {
  const { file_name } = req.body; // 클라이언트에서 보낸 파일 이름

  if (!file_name) {
    return res.status(400).send('파일 이름이 필요합니다.');
  }

  connection.query('DELETE FROM file_storage WHERE file_name = ?', [file_name], (error, results) => {
    if (error) {
      console.error('레코드 삭제 오류:', error);
      return res.status(500).send('레코드 삭제 오류');
    }

    if (results.affectedRows === 0) {
      return res.status(404).send('해당 파일 이름의 레코드를 찾을 수 없습니다.');
    }

    res.send('레코드가 성공적으로 삭제되었습니다.');
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
