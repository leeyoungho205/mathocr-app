import React, { useState } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

function PdfUploader({ onFileSelect, onImageRotate, imageRotation }) {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);

  // 파일 업로드 핸들러
  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    if (
      uploadedFile.type === 'application/pdf' ||
      uploadedFile.type === 'image/jpeg'
    ) {
      setFile(uploadedFile);
      onFileSelect(uploadedFile);
    } else {
      alert('PDF 또는 JPG 파일만 업로드 가능합니다.');
    }
  };

  // PDF 로드 성공 시 페이지 수 저장
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // 반응형: PC는 왼쪽, 모바일은 위쪽에 미리보기
  const isMobile = window.innerWidth < 700;
  const previewStyle = {
    maxWidth: isMobile ? '100%' : 220,
    maxHeight: 300,
    borderRadius: 8,
    boxShadow: '0 2px 8px #eee',
    marginTop: 16,
    marginBottom: 8,
    objectFit: 'contain',
    display: 'block',
    background: '#fff',
  };

  return (
    <div style={{ minWidth: isMobile ? '100%' : 240, textAlign: 'center' }}>
      <h2 style={{ color: '#1976d2', fontSize: 18, marginBottom: 8 }}>문제 풀이 파일 업로드</h2>
      <input type="file" accept=".pdf,.jpg" onChange={handleFileChange} style={{ marginBottom: 8 }} />
      {/* 미리보기: PDF 또는 이미지 */}
      {file && file.type === 'application/pdf' && (
        <div style={{ ...previewStyle, padding: 4, border: '1px solid #eee' }}>
          <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
            <Page pageNumber={1} width={isMobile ? undefined : 200} />
          </Document>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            (1페이지 미리보기)
          </div>
        </div>
      )}
      {file && file.type === 'image/jpeg' && (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={URL.createObjectURL(file)}
            alt="업로드된 이미지 미리보기"
            style={{ ...previewStyle, transform: `rotate(${imageRotation}deg)`, transition: 'transform 0.2s' }}
          />
          <button
            onClick={onImageRotate}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              fontSize: 18,
              cursor: 'pointer',
              boxShadow: '0 2px 8px #bbb',
              zIndex: 2
            }}
            title="이미지 90도 회전"
          >⟳</button>
        </div>
      )}
    </div>
  );
}

export default PdfUploader;
