import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const identifyTruck = async (base64Image: string): Promise<{ licensePlate: string; confidence: number }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image, // Remove header if present
            },
          },
          {
            text: "Extract the license plate number from this truck image. If no plate is clearly visible, return 'UNKNOWN'. Return JSON."
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            licensePlate: { type: Type.STRING },
            confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1" }
          },
          required: ["licensePlate", "confidence"]
        }
      }
    });

    const text = response.text;
    if (!text) return { licensePlate: "UNKNOWN", confidence: 0 };
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini recognition error:", error);
    return { licensePlate: "MANUAL_CHECK", confidence: 0 };
  }
};