const express = require('express');
const session = require('express-session')
const bodyParser = require('body-parser');
const FileStore = require('session-file-store')(session)
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const app = express();
const port = 3000;

var authRouter = require('./lib_login/auth.js');
var authCheck = require('./lib_login/authCheck.js');
var template = require('./lib_login/template.js');

// EJS 템플릿 엔진 설정
app.set('view engine', 'ejs');

// 파일 저장 위치와 이름 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // 'uploads/' 폴더에 파일 저장
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname) // 원본 파일 이름으로 저장
    }
});

const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: '~~~',	// 원하는 문자 입력
    resave: false,
    saveUninitialized: true,
    store:new FileStore()
}))


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
    <form id="uploadForm" enctype="multipart/form-data">
      <input type="file" name="image">
      <button type="submit">파일 업로드</button>
    </form>
    <p id = "message"></p>
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
    </script>`,
        authCheck.statusUI(req, res)
    );
    res.send(html);
});

// 파일을 받아서 Flask 서버로 전송
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = `./uploads/${req.file.filename}`;
    const formData = new FormData();
    formData.append('image', fs.createReadStream(filePath));

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
            res.send('이미지가 성공적으로 업로드 되었습니다.');
        })
        .catch(error => {
            console.error('Failed to upload image:', error);
            res.status(500).send('Failed to upload image.');
        });
});

function returnMessage(result){
    foodInfo = [
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
    for(i=0;i++;i<foodInfo.length){
        if(result.equal(foodInfo[i].name)){
            return "업로드된 음식은 "
        }
    }
}

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});