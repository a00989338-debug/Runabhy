import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export async function generateEditedImage(
  base64Img1: string,
  mimeType1: string,
  base64Img2: string,
  mimeType2: string,
  prompt: string
): Promise<string> {
  const model = 'gemini-2.5-flash-image';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Img1,
              mimeType: mimeType1,
            },
          },
          {
            inlineData: {
              data: base64Img2,
              mimeType: mimeType2,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
    }
      
    throw new Error("No image was generated in the API response.");
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`API Error: ${error.message}`);
    }
    throw new Error("An unexpected error occurred while contacting the Gemini API.");
  }
}