import React, { useState } from 'react';
import PdfUploader from './components/PdfUploader';
import Tesseract from 'tesseract.js';
import { extractTableFromImageWithFetch } from './utils/openaiVisionFetch';

function App() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [ocrResult, setOcrResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageRotation, setImageRotation] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [finalResult, setFinalResult] = useState('');

  // 이미지 회전 핸들러
  const handleImageRotate = () => {
    setImageRotation((prev) => (prev + 90) % 360);
  };

  // OCR 실행 함수
  const handleOcr = async () => {
    if (!uploadedFile) {
      alert('먼저 파일을 업로드해주세요.');
      return;
    }
    setIsLoading(true);
    setOcrResult('');
    setIsEditing(false);
    setFinalResult('');
    try {
      let imageUrl = '';
      if (uploadedFile.type === 'image/jpeg') {
        imageUrl = URL.createObjectURL(uploadedFile);
      } else if (uploadedFile.type === 'application/pdf') {
        alert('PDF의 경우, 현재는 JPG만 OCR이 지원됩니다.');
        setIsLoading(false);
        return;
      }
      // 회전된 이미지를 캔버스에 그려서 OCR
      const img = new window.Image();
      img.src = imageUrl;
      await new Promise((resolve) => { img.onload = resolve; });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (imageRotation % 180 === 0) {
        canvas.width = img.width;
        canvas.height = img.height;
      } else {
        canvas.width = img.height;
        canvas.height = img.width;
      }
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((imageRotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
      const rotatedUrl = canvas.toDataURL('image/jpeg');

      const { data: { text } } = await Tesseract.recognize(
        rotatedUrl,
        'kor+eng',
        { logger: m => console.log(m) }
      );
      setOcrResult(text);
      setIsEditing(true); // 인식 후 바로 수정 모드
    } catch (error) {
      setOcrResult('OCR 처리 중 오류가 발생했습니다.');
    }
    setIsLoading(false);
  };

  // 인식 결과 수정 핸들러
  const handleResultChange = (e) => {
    setOcrResult(e.target.value);
  };

  // 수정 완료
  const handleEditDone = () => {
    setIsEditing(false);
    setFinalResult(ocrResult);
  };

  // 재수정
  const handleEditAgain = () => {
    setIsEditing(true);
  };

  // 반응형 레이아웃 스타일
  const isMobile = window.innerWidth < 700;
  const containerStyle = isMobile
    ? { display: 'block' }
    : { display: 'flex', gap: 24, alignItems: 'stretch' };

  const leftBoxStyle = {
    flex: 1,
    minWidth: isMobile ? '100%' : 240,
    background: '#fafbfc',
    borderRadius: 12,
    boxShadow: '0 2px 8px #eee',
    padding: 16,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 320
  };

  const rightBoxStyle = {
    flex: 2,
    background: '#f5f5f5',
    borderRadius: 12,
    boxShadow: '0 2px 8px #eee',
    padding: 16,
    boxSizing: 'border-box',
    minHeight: 320,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start'
  };

  const handleVisionExtract = async () => {
    if (!uploadedFile) {
      alert('이미지를 먼저 업로드하세요.');
      return;
    }
    setIsLoading(true);
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      const result = await extractTableFromImageWithFetch(uploadedFile, apiKey);
      setOcrResult(result);
      setIsEditing(false);
      setFinalResult(result);
    } catch (e) {
      setOcrResult('Vision API 처리 중 오류가 발생했습니다.');
    }
    setIsLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e3f2fd 0%, #fce4ec 100%)',
      fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
      padding: 32
    }}>
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px #e3e3e3',
        padding: 32
      }}>
        <h1 style={{ color: '#1976d2', marginBottom: 24 }}>수학 문제 자동 채점 웹앱</h1>
        <div style={containerStyle}>
          {/* 왼쪽: PdfUploader (미리보기만) */}
          <div style={leftBoxStyle}>
            <PdfUploader
              onFileSelect={setUploadedFile}
              onImageRotate={handleImageRotate}
              imageRotation={imageRotation}
            />
          </div>
          {/* 오른쪽: 인식 결과 및 수정 */}
          <div style={rightBoxStyle}>
            <button
              onClick={handleOcr}
              style={{
                background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8,
                padding: '12px 24px', fontSize: 16, cursor: 'pointer', marginBottom: 16
              }}
              disabled={isLoading || !uploadedFile}
            >
              {isLoading ? '인식 중...' : '손글씨/숫자 인식(OCR) 시작'}
            </button>
            <button
              onClick={handleVisionExtract}
              style={{
                background: '#8e24aa', color: '#fff', border: 'none', borderRadius: 8,
                padding: '12px 24px', fontSize: 16, cursor: 'pointer', marginBottom: 16, marginLeft: 8
              }}
              disabled={isLoading || !uploadedFile}
            >
              Vision API로 표 추출
            </button>
            {(ocrResult || finalResult) && uploadedFile && uploadedFile.type === 'image/jpeg' && (
              <div style={{ width: '100%' }}>
                <h3 style={{ color: '#388e3c' }}>인식 결과 (수정 가능)</h3>
                {isEditing ? (
                  <>
                    <textarea
                      value={ocrResult}
                      onChange={handleResultChange}
                      rows={10}
                      style={{
                        width: '100%',
                        fontSize: 16,
                        borderRadius: 8,
                        border: '1px solid #ccc',
                        padding: 12,
                        resize: 'vertical'
                      }}
                    />
                    <div style={{ marginTop: 8 }}>
                      <button
                        onClick={handleEditDone}
                        style={{
                          background: '#388e3c', color: '#fff', border: 'none', borderRadius: 8,
                          padding: '8px 20px', fontSize: 15, cursor: 'pointer', marginRight: 8
                        }}
                      >완료</button>
                    </div>
                  </>
                ) : (
                  <>
                    <pre style={{
                      background: '#fff', padding: 16, borderRadius: 8,
                      whiteSpace: 'pre-wrap', fontSize: 16
                    }}>{finalResult}</pre>
                    <button
                      onClick={handleEditAgain}
                      style={{
                        background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8,
                        padding: '8px 20px', fontSize: 15, cursor: 'pointer', marginTop: 8
                      }}
                    >재수정</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <footer style={{ textAlign: 'center', marginTop: 48, color: '#888' }}>
        © {new Date().getFullYear()} MathOCR. Powered by React & Tesseract.js
      </footer>
    </div>
  );
}

export default App;
