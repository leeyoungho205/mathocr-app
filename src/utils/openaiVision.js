import OpenAI from "openai";

// 환경변수 또는 직접 입력 (보안을 위해 .env 사용 권장)
const apiKey = process.env.REACT_APP_OPENAI_API_KEY || "여기에_본인_API_KEY_입력";

// ⚠️ 브라우저에서 API 키 노출 위험! 실제 서비스에서는 백엔드 프록시를 사용하세요.
const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

export async function extractTableFromImage(imageFile) {
  // 이미지를 base64로 변환
  const toBase64 = file =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });

  const base64Image = await toBase64(imageFile);

  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview", // Vision 지원 모델
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "이 이미지의 표 내용을 마크다운 표로 추출해줘." },
          {
            type: "image_url",
            image_url: {
              "url": `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ],
    max_tokens: 1024
  });

  return response.choices[0].message.content;
}
