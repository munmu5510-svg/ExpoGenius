import { GoogleGenAI, Type } from "@google/genai";
import { ExposeContent, UserSettings } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateExpose = async (settings: UserSettings): Promise<ExposeContent> => {
  const modelId = "gemini-2.5-flash";

  const prompt = `
    Tu es un assistant expert pour la rédaction d'exposés scolaires et professionnels.
    
    L'utilisateur souhaite un exposé sur le sujet : "${settings.topic}".
    Niveau scolaire / d'étude cible : "${settings.educationLevel || "Standard"}". (Adapte le ton, le vocabulaire et la complexité).
    
    Contraintes budgétaires :
    - Budget total : ${settings.budget} ${settings.currency}
    - Prix impression Noir & Blanc : ${settings.bwPrice} ${settings.currency}/page
    - Prix impression Couleur : ${settings.colorPrice} ${settings.currency}/page
    
    Tâche :
    1. Calcule approximativement combien de pages l'utilisateur peut imprimer avec son budget.
    2. Rédige un exposé complet et structuré qui tient compte de cette contrainte de longueur.
    3. Si le budget est large, propose des sections avec des suggestions visuelles riches (qui nécessitent la couleur). Si le budget est serré, reste concis et focalise sur le texte.
    4. Fournis une bibliographie pertinente adaptée au niveau scolaire.
    
    Génère la réponse au format JSON strict avec la structure suivante :
    {
      "title": "Titre de l'exposé",
      "introduction": "Paragraphe d'introduction",
      "sections": [
        { 
          "heading": "Titre de la section", 
          "content": "Contenu détaillé de la section (environ 200-400 mots selon budget)", 
          "visualSuggestion": "Description d'une image ou graphique pertinent",
          "isColor": boolean (true si cette section bénéficie grandement de l'impression couleur pour le visuel suggéré, false sinon)
        }
      ],
      "conclusion": "Paragraphe de conclusion",
      "bibliography": ["Source 1", "Source 2", "Source 3"],
      "estimatedPages": nombre (estimation du nombre de pages A4),
      "recommendation": "Conseil court à l'utilisateur concernant l'impression (ex: 'Vu votre budget, imprimez tout en N&B sauf la page 2')."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            introduction: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING },
                  content: { type: Type.STRING },
                  visualSuggestion: { type: Type.STRING },
                  isColor: { type: Type.BOOLEAN },
                },
                required: ["heading", "content", "isColor"],
              },
            },
            conclusion: { type: Type.STRING },
            bibliography: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            estimatedPages: { type: Type.NUMBER },
            recommendation: { type: Type.STRING },
          },
          required: ["title", "introduction", "sections", "conclusion", "bibliography", "estimatedPages", "recommendation"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as ExposeContent;
    } else {
      throw new Error("Réponse vide de l'IA.");
    }
  } catch (error) {
    console.error("Erreur lors de la génération de l'exposé :", error);
    throw error;
  }
};