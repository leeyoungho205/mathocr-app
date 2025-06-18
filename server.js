const express = require('express');
const vision = require('@google-cloud/vision');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const app = express();

// CORS 및 파일 업로드 미들웨어 설정
app.use(cors());
app.use(fileUpload());

// Google Cloud Vision 클라이언트 생성
// 주의: keyFilename은 서비스 계정 키 JSON 파일의 실제 경로로 변경해야 합니다
const client = new vision.ImageAnnotatorClient({
  keyFilename: './google-vision-key.json' // JSON 키 파일 경로를 실제 파일 경로로 변경하세요
});

// OCR 엔드포인트
app.post('/api/ocr', async (req, res) => {
  try {
    // 파일 체크
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
    }

    const imageBuffer = req.files.image.data;

    // Vision API로 텍스트 감지
    const [result] = await client.textDetection(imageBuffer);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      return res.json({ text: '' });
    }

    // 첫 번째 detection이 전체 텍스트를 포함
    const text = detections[0].description;

    // 결과 반환
    res.json({ 
      text,
      confidence: detections[0].confidence || 0,
      success: true
    });

  } catch (error) {
    console.error('Vision API 에러:', error);
    res.status(500).json({ 
      error: '이미지 처리 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 서버 상태 확인용 엔드포인트
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 서버 시작
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log('OCR 엔드포인트: POST http://localhost:' + PORT + '/api/ocr');
  console.log('상태 확인: GET http://localhost:' + PORT + '/api/health');
}); 