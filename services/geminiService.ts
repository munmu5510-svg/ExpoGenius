
import { GoogleGenAI, Type } from "@google/genai";
import { GenerationConfig, GeneratedContent } from "../types";

// Helper para obtener el cliente de IA con la clave adecuada
const getAIClient = (userKey?: string) => {
    // API key must be obtained from process.env.API_KEY or user-provided key.
    const key = userKey || process.env.API_KEY;
    if (!key || key === 'dummy-key-to-prevent-crash-init') {
        throw new Error("Clave de API de Gemini faltante. Por favor, configúrela en su perfil.");
    }
    return new GoogleGenAI({ apiKey: key });
};

// --- CONOCIMIENTO DE RUNNA AI ---
const RUNNA_SYSTEM_INSTRUCTION = `
Eres Runna, la asistente de IA inteligente y guía oficial de la aplicación "WyRunner".
... (resto de instrucciones idénticas)
`;

const handleGeminiError = (error: any) => {
    console.error("Gemini Error:", error);
    const errStr = JSON.stringify(error) || error.message || "";
    if (errStr.includes("Rpc failed") || errStr.includes("xhr error") || errStr.includes("fetch failed") || errStr.includes("NetworkError")) {
        throw new Error("Error de conexión (RPC). El servidor de IA no está accesible.");
    }
    if (errStr.includes("API key not valid")) {
        throw new Error("Clave de API de Gemini inválida. Por favor, verifíquela en su perfil.");
    }
    throw error;
};

export const chatWithWosAI = async (message: string, history: any[], userKey?: string): Promise<string> => {
  try {
    const ai = getAIClient(userKey);
    // Updated to 'gemini-3-flash-preview' for general chat tasks as per guidelines.
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: { systemInstruction: RUNNA_SYSTEM_INSTRUCTION },
      history: history
    });
    const response = await chat.sendMessage({ message: message });
    // Use the .text property to extract output string.
    return response.text || "Lo siento, no pude generar una respuesta.";
  } catch (error) {
    handleGeminiError(error);
    return "Ocurrió un error durante la comunicación.";
  }
};

export const generateDocument = async (config: GenerationConfig, userName: string): Promise<GeneratedContent> => {
  // Updated to 'gemini-3-pro-preview' for complex academic document generation tasks.
  const modelId = "gemini-3-pro-preview"; 
  let prompt = "";
  if (config.type === 'expose') {
    prompt = `Genera una presentación estructurada sobre el tema: "${config.topic}"...`;
  } else if (config.type === 'these') {
    prompt = `Genera un plan detallado y una síntesis completa para una TESIS ACADÉMICA...`;
  } else if (config.type === 'dissertation') {
    prompt = `Redacta un ensayo completo...`;
  } else if (config.type === 'argumentation') {
    prompt = `Redacta un texto argumentativo sobre: "${config.topic}"...`;
  }

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      content: {
        type: Type.OBJECT,
        properties: {
          cover: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, subtitle: { type: Type.STRING }, countrySymbol: { type: Type.STRING }, schoolName: { type: Type.STRING } } },
          toc: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: {type: Type.STRING}, page: {type: Type.NUMBER}} } },
          introduction: { type: Type.STRING },
          sections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { heading: { type: Type.STRING }, content: { type: Type.STRING }, visualSuggestion: { type: Type.STRING }, isColor: { type: Type.BOOLEAN } }, required: ["heading", "content"] } },
          conclusion: { type: Type.STRING },
          bibliography: { type: Type.ARRAY, items: { type: Type.STRING } },
          qa: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: {type: Type.STRING}, answer: {type: Type.STRING} }} },
          speech: { type: Type.STRING },
          estimatedPages: { type: Type.NUMBER },
          recommendation: { type: Type.STRING }
        },
        required: ["introduction", "sections", "conclusion", "estimatedPages"]
      }
    },
    required: ["title", "content"]
  };

  try {
    const ai = getAIClient(config.userApiKey);
    // Directly call generateContent with model and prompt.
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: "Eres Runna AI, un asistente de redacción académica profesional.",
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    // Access the generated text directly using the .text property.
    if (response.text) {
      const parsed = JSON.parse(response.text);
      if (parsed.content.cover) {
          parsed.content.cover.studentName = userName;
          parsed.content.cover.professorName = config.professor;
          parsed.content.cover.date = config.date;
          parsed.content.cover.educationLevel = config.level; 
          if(!parsed.content.cover.schoolName) parsed.content.cover.schoolName = config.school;
      }
      return { type: config.type, title: parsed.title, content: parsed.content, createdAt: Date.now() };
    }
    throw new Error("Respuesta vacía");
  } catch (error) {
    handleGeminiError(error);
    throw error;
  }
};
