const express = require('express');    //서버 구성 편리 모듈
const cookieParser = require('cookie-parser') // 쿠키 파싱해주는 미들웨어 모듈
const morgan = require('morgan');     //파일 입출력 모듈
const path = require('path');    //경로설정 모듈
const session = require('express-session'); // 서버에서 세션 저장 유지 도와주는 모듈
const nunjucks = require('nunjucks'); //HTML에서 템플릿 문법 사용(FOR문등 사용 가능)
const dotenv = require('dotenv'); // .env에 정의된 환견변수를 사용할 수 있게 해주는 모듈
const fileUpload = require('express-fileupload'); // 파일 업로드를 위한 업로드 모듈 추가

const fs = require('fs');
const { sequelize } = require('./models'); 
const multer = require('multer');
const analyzeFile = require('./analyzeFile');
const { ProfilerData } = require('./models');

dotenv.config();
const pageRouter = require('./routes/page') // 아직 대기

const app = express(); // 서버 초기화
const upload = multer({ dest: 'uploads/' }); // uploads 폴더에 업로드

app.set('port', process.env.PORT || 8081); // 포트번호 8081 설정
app.set('view engine', 'html');

nunjucks.configure('views', { // 넌적스 템플릿 문법 사용가능하도록 조치
    express: app, // express랑 넌적스 함께 동작
    watch: true, // 템플릿 코드 변경시 새로고침 -> 변경사항 반영
});


sequelize.sync({ force: false }) // 테이블이 없을 때만 생성
  .then(() => {
    console.log('데이터베이스 연결 성공');
  })
  .catch((err) => {
    console.error('데이터베이스 연결 실패:', err);
  });


app.use(morgan('dev'));
// 삭제해도 됨 app.use(fileUpload()); // 파일 업로드 추가
app.use(express.static(path.join(__dirname,'public')));     //정적 파일 전달을 위해 사용(CSS, JS파일 제공하는데 쓰임)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // 업로드 폴더도 공개

app.use(express.json());    //JSON형식 요청 처리를 express 에서 하기 위해 사용함
app.use(express.urlencoded({extended: false}));    //URL 형식 요청 바디를 사용하기 위해 사용

// 사용자 업로드 데이터를 DB에 저장하려면 아래 코드 활성화
/*
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const raw = fs.readFileSync(req.file.path, 'utf-8');
    const lines = raw.split('\n');

    const records = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();

      // 빈 줄 또는 task 헤더 건너뜀
      if (trimmedLine === '' || trimmedLine.toLowerCase().startsWith('task')) return;

      const parts = trimmedLine.split(/\s+/);
      const core = parts[0];

      for (let i = 1; i < parts.length; i++) {
        const rawValue = parts[i].trim();
        if (rawValue === '') {
          console.log(`Skipping empty value at core=${core}, task${i}`);
          continue;
        }

        const value = Number(rawValue);

        // 반드시 finite + integer인지 확인 (NaN 방지)
        if (!Number.isFinite(value) || !Number.isInteger(value)) {
          console.log(`Skipping invalid value at core=${core}, task${i}: "${rawValue}"`);
          continue;
        }

        records.push({
          fileName: req.file.filename, // fileName 컬럼에 저장
          core,
          task: `task${i}`,
          value,
        });
      }
    });

    if (records.length === 0) {
      throw new Error('유효한 데이터가 없습니다. 파일 내용을 확인하세요.');
    }

    await ProfilerData.bulkCreate(records);

    res.json({
      message: '파일 업로드 및 DB 저장 성공',
      count: records.length,
      fileName: req.file.filename // ⭐ 꼭 포함
    });
  } catch (err) {
    console.error('업로드 실패:', err);
    res.status(500).send('파일 분석 및 DB 저장 중 에러 발생: ' + err.message);
  }
});
*/
// 아래 코드는 사용자 데이터를 db에 저장하는 대신에 uploads 폴더에 업데이트
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const raw = fs.readFileSync(req.file.path, 'utf-8');
    const lines = raw.split('\n');

    const records = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();

      if (trimmedLine === '' || trimmedLine.toLowerCase().startsWith('task')) return;

      const parts = trimmedLine.split(/\s+/);
      const core = parts[0];

      for (let i = 1; i < parts.length; i++) {
        const rawValue = parts[i].trim();
        if (rawValue === '') continue;

        const value = Number(rawValue);
        if (!Number.isFinite(value) || !Number.isInteger(value)) continue;

        records.push({
          core,
          task: `task${i}`,
          value,
        });
      }
    });

    if (records.length === 0) {
      throw new Error('유효한 데이터가 없습니다. 파일 내용을 확인하세요.');
    }

    // 통계 계산
    const statsByTask = {};

    records.forEach(({ task, value }) => {
      if (!statsByTask[task]) {
        statsByTask[task] = { min: value, max: value, sum: value, count: 1 };
      } else {
        statsByTask[task].min = Math.min(statsByTask[task].min, value);
        statsByTask[task].max = Math.max(statsByTask[task].max, value);
        statsByTask[task].sum += value;
        statsByTask[task].count++;
      }
    });

    const resultArray = Object.entries(statsByTask).map(([task, stats]) => ({
      task,
      min: stats.min,
      max: stats.max,
      avg: (stats.sum / stats.count).toFixed(2),
    }));

    res.json({
      message: '파일 업로드 및 분석 성공 (DB 저장 없음)',
      result: resultArray,
    });
  } catch (err) {
    console.error('업로드 실패:', err);
    res.status(500).send('파일 분석 중 에러 발생: ' + err.message);
  }
});

const { Sequelize } = require('sequelize'); // 필요

app.get('/results/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const taskResults = await ProfilerData.findAll({
      where: { fileName: fileId },
      attributes: [
        'task',
        [Sequelize.fn('MIN', Sequelize.col('value')), 'min'],
        [Sequelize.fn('MAX', Sequelize.col('value')), 'max'],
        [Sequelize.fn('AVG', Sequelize.col('value')), 'avg'],
      ],
      group: ['task'],
      raw: true,
    });

    const coreResults = await ProfilerData.findAll({
      where: { fileName: fileId },
      attributes: [
        'core',
        [Sequelize.fn('MIN', Sequelize.col('value')), 'min'],
        [Sequelize.fn('MAX', Sequelize.col('value')), 'max'],
        [Sequelize.fn('AVG', Sequelize.col('value')), 'avg'],
      ],
      group: ['core'],
      raw: true,
    });

    if (taskResults.length === 0 && coreResults.length === 0) {
      return res.status(404).send('분석 결과가 없습니다.');
    }

    res.json({
      taskData: taskResults,
      coreData: coreResults,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '결과 조회 중 에러 발생: ' + err.message });
  }
});


app.get('/analyze-db', async (req, res) => {
  try {
    const record = await YourModel.findOne(); // 혹은 조건에 맞게 불러오기
    if (!record || !record.fileContent) {
      return res.status(404).send('DB에 저장된 파일이 없습니다.');
    }

    const rawText = record.fileContent;
    const result = analyzeRawText(rawText); // 텍스트 분석 함수 호출
    res.json(result);
  } catch (err) {
    res.status(500).send("DB 분석 중 오류 발생: " + err.message);
  }
});



// '/' 경로 이하의 요청을 pageRouter로 라우팅
app.use('/', pageRouter);

// 존재하지 않는 라우터 요청(잘못된 URL 접속시)이 들어왔을 때 404 에러 처리 미들웨어
app.use((req, res, next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    next(error);
});

// 에러 처리 미들웨어
app.use((err, req, res, next) => {
    res.locals.message = err.message; 
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});


// 8081번 포트를 활용해 서버 구동
app.listen(app.get('port'), () =>{
    console.log("http://localhost:"+app.get('port')+" server open");
});
/* 여기까지는 전부 7장 DB MySQL연결하기 파트*/

