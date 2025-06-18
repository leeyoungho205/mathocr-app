import React, { useState } from 'react';
import PdfUploader from './components/PdfUploader';
import Tesseract from 'tesseract.js';

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

      // 1. 우선 무료 Tesseract로 인식 시도
      const { data: { text, confidence } } = await Tesseract.recognize(
        imageUrl,
        'kor+eng',
        { logger: m => console.log(m) }
      );

      // 2. 결과가 너무 짧거나 신뢰도가 낮으면 구글 Vision API로 재시도
      if (!text || text.length < 10 || (typeof confidence === 'number' && confidence < 60)) {
        try {
          // FormData 생성
          const formData = new FormData();
          formData.append('image', uploadedFile);

          // 백엔드 서버로 이미지 전송
          const response = await fetch('http://localhost:5001/api/ocr', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error('Vision API 요청 실패');
          }

          const result = await response.json();
          if (result.error) {
            throw new Error(result.error);
          }

          setOcrResult(result.text);
        } catch (visionError) {
          console.error('Vision API 에러:', visionError);
          setOcrResult('OCR 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
      } else {
        setOcrResult(text);
      }
      setIsEditing(true);
    } catch (error) {
      console.error('OCR 에러:', error);
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
              {isLoading ? '인식 중...' : '텍스트 인식(OCR) 시작'}
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
        © {new Date().getFullYear()} MathOCR. Powered by React & Google Cloud Vision
      </footer>
    </div>
  );
}

export default App;
