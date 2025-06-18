// src/utils/openaiVisionFetch.js
export async function extractTableFromImageWithFetch(imageFile, apiKey) {
  // 이미지를 base64로 변환
  const toBase64 = file =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });

  const base64Image = await toBase64(imageFile);

  const body = {
    model: "gpt-4-vision-preview", // 또는 최신 vision 모델명
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "이 이미지의 표 내용을 마크다운 표로 추출해줘." },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ],
    max_tokens: 1024
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Vision API Error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
