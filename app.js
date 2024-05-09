const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// MySQL 연결 
const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'ehdgns362',
    database: 'user_info'
});

connection.connect((err) => {
    if (err) {
        console.error('MySQL connection error:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// 회원가입 요청
app.post('/signup', (req, res) => {
    const { user_id, user_name, user_pwd, email } = req.body;

    // 아이디 유효성 검사: 최소 4자 이상
    if (user_id.length < 4) {
        return res.status(400).send('아이디는 최소 4자 이상이어야 합니다.');
    }

    // 비밀번호 유효성 검사: 최소 6자 이상
    if (user_pwd.length < 6) {
        return res.status(400).send('비밀번호는 최소 6자 이상이어야 합니다.');
    }

    // 이메일 유효성 검사: 정규 표현식 사용
    var emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
        return res.status(400).send('유효한 이메일 주소를 입력해주세요.');
    }

    connection.query(
        'INSERT INTO user (user_id, user_name, user_pwd, emails) VALUES (?, ?, ?, ?)',
        [user_id, user_name, user_pwd, email],
        (err, results) => {
            if (err) {
                console.error('삽입 중 오류가 발생했습니다.:', err);
                return res.status(500).send('회원가입 중 오류가 발생했습니다.');
            }
            console.log('새로운 회원이 가입하였습니다. 이름:', user_name);
            res.send('회원가입이 완료되었습니다.');
        }
    );
});


// 로그인 요청 처리
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    connection.query(
        'SELECT * FROM user WHERE user_id = ?',
        [username],
        (err, results) => {
            if (err) {
                console.error('조회 중 오류가 발생했습니다.:', err);
                res.status(500).send('로그인 중 오류가 발생했습니다.');
                return;
            }
            if (results.length === 0) {
                res.status(401).send('아이디 오류');
            } else {
                const user = results[0];
                if (user.user_pwd === password) {
                    res.send('로그인 성공');
                } else {
                    res.status(401).send('패스워드 오류');
                }
            }
        }
    );
});

app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 정상적으로 실행 중입니다.`);
});