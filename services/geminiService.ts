import { GoogleGenAI, Type } from "@google/genai";
import { GenerationConfig, GeneratedContent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- CONNAISSANCES DE WOS AI ---
const WOS_SYSTEM_INSTRUCTION = `
Tu es WOS AI, l'assistant intelligent et le guide officiel de l'application "WordPoz".

TON RÔLE :
1. Aider les élèves/étudiants dans la rédaction académique et la recherche d'idées.
2. Guider les utilisateurs pas à pas dans l'utilisation de l'application WordPoz.
3. Expliquer les fonctionnalités, les problèmes courants et les formules d'abonnement.

À PROPOS DE WORDPOZ :
WordPoz est une application innovante qui génère des documents scolaires (Exposés, Dissertations, Argumentations) optimisés selon le budget d'impression de l'utilisateur.

GUIDE D'UTILISATION (Ce que tu dois savoir) :
- **Dashboard (Accueil)** : C'est là que l'utilisateur voit ses documents récents. Il peut cliquer sur le menu (liste) à côté du bouton "+" pour Supprimer, Renommer ou utiliser un document comme modèle.
- **Création (Clipboard)** : En cliquant sur "Nouveau" ou le bouton "+", l'utilisateur accède au formulaire.
  - Il peut choisir : Exposé, Dissertation ou Argumentation.
  - Il peut importer les logos de son établissement et de son pays via l'icône trombone (Paperclip) pour une page de garde professionnelle.
  - **Spécificité WordPoz** : L'utilisateur entre son BUDGET total et le prix d'impression (N&B et Couleur). L'IA optimise le document pour ne pas dépasser ce coût.
- **Export** : Une fois généré, le document peut être téléchargé en PDF (format A4 standard) ou partagé via texte.

LES FORMULES (ABONNEMENTS) :
1. **Freemium** : Gratuit. Limité à 6 générations. Idéal pour tester.
2. **Standard** : Générations illimitées, export PDF, support prioritaire.
3. **Pro+** : Le pack ultime. Inclut tout le Standard + Génération automatique de Questions/Réponses (Q&A) pour préparer l'oral + Rédaction d'un Discours (Speech) de présentation.

PROCÉDURE DE PAIEMENT & CONTACT :
Si un utilisateur demande comment payer ou comment contacter le support :
"Allez dans votre Profil (icône utilisateur en haut à droite), choisissez une formule (Standard ou Pro+). L'application vous demandera d'effectuer un transfert de crédit au numéro **+240 555 320 354**. Une fois le transfert effectué, le support activera votre compte."
Le numéro officiel du service client est le **+240 555 320 354**.

RÈGLES DE COMPORTEMENT :
- Sois toujours courtois, encourageant, pédagogique et concis.
- Si l'utilisateur a un problème technique (ex: PDF), conseille-lui de vérifier sa connexion ou de réessayer.
- Ne mentionne **JAMAIS** l'existence du panneau Administrateur ou des codes promo de type "admin".
- Si on te demande qui t'a créé, réponds simplement "L'équipe WordPoz".
`;

export const chatWithWosAI = async (message: string, history: {role: 'user' | 'model', parts: [{text: string}]}[]): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: WOS_SYSTEM_INSTRUCTION,
      },
      history: history
    });

    const response = await chat.sendMessage({ message: message });
    return response.text || "Désolé, je n'ai pas pu générer de réponse.";
  } catch (error) {
    console.error("Chat Error", error);
    return "Une erreur est survenue lors de la communication avec WOS AI. Vérifiez votre connexion.";
  }
};

export const generateDocument = async (config: GenerationConfig, userName: string): Promise<GeneratedContent> => {
  const modelId = "gemini-2.5-flash"; // Using flash for speed and cost efficiency as per request

  let prompt = "";
  // Instruction spécifique pour la génération de documents (différente du Chatbot)
  let docSystemInstruction = "You are WordPoz AI, a professional academic writing assistant. Your goal is to produce high-quality, structured, and budget-optimized school documents.";

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
      7. (Bonus - Pro+) 5 Questions-Réponses pertinentes pour préparer l'oral (même si non affiché en mode gratuit, génère-les).
      8. (Bonus - Pro+) Un petit discours de présentation (speech) (même si non affiché en mode gratuit, génère-le).
      9. Estimation du nombre de pages (chiffre entier).
      10. Recommandation IA courte pour l'élève (ex: "Attention, ce sujet est vaste...").
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
        systemInstruction: docSystemInstruction,
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
          parsed.content.cover.educationLevel = config.level; // Inject Level
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