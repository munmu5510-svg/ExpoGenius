import { GoogleGenAI, Type } from "@google/genai";
import { GenerationConfig, GeneratedContent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const chatWithWosAI = async (message: string, history: {role: 'user' | 'model', parts: [{text: string}]}[]): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: "You are WOS AI, the intelligent assistant for WordPoz. You help students with their writing projects, offer academic advice, and explain how to use the WordPoz app. Keep answers concise and helpful.",
      },
      history: history
    });

    const response = await chat.sendMessage({ message: message });
    return response.text || "Désolé, je n'ai pas pu générer de réponse.";
  } catch (error) {
    console.error("Chat Error", error);
    return "Une erreur est survenue lors de la communication avec WOS AI.";
  }
};

export const generateDocument = async (config: GenerationConfig, userName: string): Promise<GeneratedContent> => {
  const modelId = "gemini-2.5-flash"; // Using flash for speed and cost efficiency as per request

  let prompt = "";
  let systemInstruction = "You are WordPoz AI, a professional academic writing assistant.";

  if (config.type === 'expose') {
    prompt = `
      Génère un exposé structuré sur le thème : "${config.topic}".
      Contexte :
      - Niveau : ${config.level || "Standard"}
      - Pays : ${config.country || "Non spécifié"}
      - Établissement : ${config.school || "Non spécifié"}
      - Budget impression : ${config.budget} ${config.currency} (Prix N&B: ${config.bwPrice}, Couleur: ${config.colorPrice}). Adapte la longueur et l'usage de la couleur (images) selon ce budget.
      
      Structure requise (JSON) :
      1. Infos de couverture (titre, sous-titre).
      2. Sommaire (estime les pages). IMPORTANT : La liste du sommaire doit contenir UNIQUEMENT : Introduction, les Titres des Sections, Conclusion et Bibliographie. Ne JAMAIS inclure "Couverture", "Sommaire", "Questions-Réponses", "Discours" ni "Speech" dans cette liste.
      3. Introduction.
      4. Sections détaillées (titre, contenu, suggestions visuelles). Marque les termes techniques ou importants.
      5. Conclusion.
      6. Bibliographie.
      7. (Bonus) 5 Questions-Réponses pertinentes pour préparer l'oral.
      8. (Bonus) Un petit discours de présentation (speech).
      9. Estimation du nombre de pages (chiffre entier).
      10. Recommandation IA courte pour l'élève.
    `;
  } else if (config.type === 'dissertation') {
    prompt = `
      Rédige une dissertation complète.
      Sujet/Citation : "${config.citation || config.topic}".
      Consigne : "${config.instructions || "Traiter le sujet de manière dialectique ou analytique selon pertinence."}".
      Longueur visée : Environ ${config.pageCount || 3} pages.
      Structure : Introduction (Amorce, Problématique, Annonce plan), Développement (Thèse, Antithèse, Synthèse ou Thématique), Conclusion.
      Inclus une estimation du nombre de pages et une recommandation.
    `;
  } else if (config.type === 'argumentation') {
    prompt = `
      Rédige un texte argumentatif sur : "${config.topic}".
      Consigne : "${config.instructions}".
      Longueur : ${config.pageCount || 2} pages.
      Structure : Introduction, Arguments Pour/Contre structurés, Conclusion.
      Inclus une estimation du nombre de pages et une recommandation.
    `;
  }

  // Common Schema for all types to simplify parsing
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      content: {
        type: Type.OBJECT,
        properties: {
          cover: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              countrySymbol: { type: Type.STRING, description: "Nom du symbole ou devise du pays" },
              schoolName: { type: Type.STRING }
            }
          },
          toc: {
             type: Type.ARRAY,
             items: {
                 type: Type.OBJECT,
                 properties: { title: {type: Type.STRING}, page: {type: Type.NUMBER}}
             }
          },
          introduction: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                heading: { type: Type.STRING },
                subheading: { type: Type.STRING },
                content: { type: Type.STRING },
                visualSuggestion: { type: Type.STRING },
                isColor: { type: Type.BOOLEAN },
                isImportant: { type: Type.BOOLEAN },
              },
              required: ["heading", "content"]
            }
          },
          conclusion: { type: Type.STRING },
          bibliography: { type: Type.ARRAY, items: { type: Type.STRING } },
          qa: { 
              type: Type.ARRAY, 
              items: { type: Type.OBJECT, properties: { question: {type: Type.STRING}, answer: {type: Type.STRING} }}
          },
          speech: { type: Type.STRING },
          estimatedPages: { type: Type.NUMBER, description: "Estimation du nombre de pages du document" },
          recommendation: { type: Type.STRING, description: "Conseil court pour l'élève" }
        },
        required: ["introduction", "sections", "conclusion", "estimatedPages"]
      }
    },
    required: ["title", "content"]
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      // Inject user data into cover if it exists
      if (parsed.content.cover) {
          parsed.content.cover.studentName = userName;
          parsed.content.cover.professorName = config.professor;
          parsed.content.cover.date = config.date;
          if(!parsed.content.cover.schoolName) parsed.content.cover.schoolName = config.school;
      }
      return {
          type: config.type,
          title: parsed.title,
          content: parsed.content,
          createdAt: Date.now()
      };
    } else {
      throw new Error("Empty response from AI");
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};