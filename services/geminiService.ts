import { GoogleGenAI } from "@google/genai";
import type { ExcelRow, Source } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

interface AnalysisResponse {
    status: 'SAME' | 'DIFFERENT' | 'ERROR';
    sources: Source[];
}

export const analyzeRow = async (row: ExcelRow): Promise<AnalysisResponse> => {
  const prompt = `
    Analyze if the following two names refer to the same person.
    Name 1: "${row.Original}"
    Name 2: "${row.Duplicates}"

    Use Google Search to verify their identities.

    Your response MUST be one of these two words, and nothing else: "SAME" or "DIFFERENT".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text.trim();
    const sources: Source[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => ({
            uri: chunk.web?.uri,
            title: chunk.web?.title,
        }))
        .filter((source: any) => source.uri) ?? [];

    const upperCaseText = text.toUpperCase();

    if (upperCaseText.includes("SAME")) {
      return {
        status: 'SAME',
        sources: sources,
      };
    } else if (upperCaseText.includes("DIFFERENT")) {
      return {
        status: 'DIFFERENT',
        sources: sources,
      };
    } else {
        // Fallback if the model doesn't follow the format perfectly
        console.warn(`Unexpected response format. Model returned: "${text}"`);
        return {
            status: 'ERROR',
            sources: sources,
        };
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      status: 'ERROR',
      sources: [],
    };
  }
};