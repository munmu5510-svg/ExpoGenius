import { GoogleGenAI, Type } from "@google/genai";
import { GenerationConfig, GeneratedContent } from "../types";

// Check if API KEY is present to avoid cryptic errors
const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-to-prevent-crash-init' });

// --- CONOCIMIENTO DE RUNNA AI ---
const RUNNA_SYSTEM_INSTRUCTION = `
Eres Runna, la asistente de IA inteligente y guía oficial de la aplicación "WyRunner".

TU ROL:
1. Ayudar a los estudiantes con la redacción académica y la búsqueda de ideas.
2. Guiar a los usuarios paso a paso en el uso de la aplicación WyRunner.
3. Explicar las características, problemas comunes y planes de suscripción.

ACERCA DE WYRUNNER:
WyRunner es una aplicación innovadora que genera documentos académicos (Presentaciones, Ensayos, Argumentos, Tesis) optimizados según el presupuesto de impresión del usuario.

GUÍA DE USO (Lo que debes saber):
- **Dashboard (Inicio)**: Aquí el usuario ve sus documentos recientes. Puede hacer clic en el menú (lista) junto al botón "+" para Eliminar, Renombrar o usar un documento como plantilla.
- **Creación (Clipboard)**: Al hacer clic en "Nuevo" o el botón "+", el usuario accede al formulario.
  - Puede elegir: Presentación, Tesis, Ensayo o Argumento.
  - Puede importar los logos de su institución y país mediante el icono del clip (Paperclip) para una portada profesional.
  - **Especialidad de WyRunner**: El usuario introduce su PRESUPUESTO total y el precio de impresión (B/N y Color). La IA optimiza el documento para no exceder este costo.
- **Exportación**: Una vez generado, el documento se puede descargar en PDF (formato A4 estándar) o compartir por texto.

LOS PLANES (SUSCRIPCIONES):
1. **Freemium**: Gratis. Limitado a 6 generaciones. Ideal para probar.
2. **Starter**: 200 FCFA/día. Generaciones ilimitadas, exportación a PDF, soporte prioritario.
3. **Pro Authority**: 500 FCFA/7 días. Todo lo de Starter + Exportación a PPT (PowerPoint), Preguntas y Respuestas (Q&A) para preparar la defensa oral.

PROCEDIMIENTO DE PAGO Y CONTACTO:
Si un usuario pregunta cómo pagar o cómo contactar al soporte:
"Ve a tu Perfil (icono de usuario arriba a la derecha), elige un plan (Starter o Pro Authority). La aplicación te pedirá que realices una transferencia de crédito al número **+240 555 320 354**. Una vez realizada la transferencia, el soporte activará tu cuenta."
El número oficial de atención al cliente es **+240 555 320 354**.

REGLAS DE COMPORTAMIENTO:
- Sé siempre cortés, alentador, pedagógico y conciso.
- Si un usuario tiene un problema técnico (ej: PDF), aconséjale que verifique su conexión o que lo intente de nuevo.
- **NUNCA** menciones la existencia del panel de Administrador o los códigos promocionales de tipo "admin".
- Si te preguntan quién te creó, responde simplemente "El equipo de WyRunner".
`;

const handleGeminiError = (error: any) => {
    console.error("Gemini Error:", error);
    const errStr = JSON.stringify(error) || error.message || "";
    
    if (errStr.includes("Rpc failed") || errStr.includes("xhr error") || errStr.includes("fetch failed") || errStr.includes("NetworkError")) {
        throw new Error("Error de conexión (RPC). El servidor de IA no está accesible. Revisa tu conexión a Internet o intenta desactivar tu VPN/Adblock.");
    }
    if (errStr.includes("API key not valid") || !process.env.API_KEY) {
        throw new Error("Clave de API de Gemini inválida o faltante. Contacta al administrador.");
    }
    throw error;
};

export const chatWithWosAI = async (message: string, history: {role: 'user' | 'model', parts: [{text: string}]}[]): Promise<string> => {
  if (!apiKey) return "Error: Falta la clave de API.";
  
  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: RUNNA_SYSTEM_INSTRUCTION,
      },
      history: history
    });

    const response = await chat.sendMessage({ message: message });
    return response.text || "Lo siento, no pude generar una respuesta.";
  } catch (error) {
    handleGeminiError(error);
    return "Ocurrió un error durante la comunicación.";
  }
};

export const generateDocument = async (config: GenerationConfig, userName: string): Promise<GeneratedContent> => {
  if (!apiKey) throw new Error("Falta la clave de API de Gemini.");

  const modelId = "gemini-2.5-flash"; 

  let prompt = "";
  let docSystemInstruction = "Eres Runna AI, un asistente de redacción académica profesional. Tu objetivo es producir documentos escolares de alta calidad, estructurados y optimizados para el presupuesto.";

  if (config.type === 'expose') {
    prompt = `
      Genera una presentación estructurada sobre el tema: "${config.topic}".
      ${config.objectives ? `OBJETIVOS ESPECÍFICOS: ${config.objectives}` : ''}
      
      Contexto:
      - Nivel: ${config.level || "Estándar"}
      - País: ${config.country || "No especificado"}
      - Institución: ${config.school || "No especificada"}
      - Presupuesto de impresión: ${config.budget} ${config.currency} (Precio B/N: ${config.bwPrice}, Color: ${config.colorPrice}). Adapta la longitud y el uso del color (imágenes) según este presupuesto.
      
      Estructura requerida (JSON):
      1. Información de portada (título, subtítulo).
      2. Índice (estima las páginas). IMPORTANTE: La lista del índice debe contener ÚNICAMENTE: Introducción, los Títulos de las Secciones, Conclusión y Bibliografía. NUNCA incluyas "Portada", "Índice", "Preguntas y Respuestas" o "Discurso" en esta lista.
      3. Introducción.
      4. Secciones detalladas (título, contenido, sugerencias visuales). Marca los términos técnicos o importantes.
      5. Conclusión.
      6. Bibliografía.
      7. (Bonus - Pro+) 5 Preguntas y Respuestas pertinentes para preparar la defensa oral (aunque no se muestren en el modo gratuito, genéralas).
      8. (Bonus - Pro+) Un breve discurso de presentación (aunque no se muestre en el modo gratuito, genéralo).
      9. Estimación del número de páginas (número entero).
      10. Recomendación corta de la IA para el estudiante (ej: "Atención, este tema es muy amplio...").
    `;
  } else if (config.type === 'these') {
    prompt = `
      Genera un plan detallado y una síntesis completa para una TESIS ACADÉMICA.
      Tema: "${config.topic}".
      Campo de estudio: ${config.level || "Investigación"}.
      ${config.objectives ? `OBJETIVOS DE INVESTIGACIÓN: ${config.objectives}` : ''}
      Problemática/Hipótesis: "${config.instructions || "A definir por la IA según el tema"}".
      
      Contexto de impresión:
      - Presupuesto de impresión: ${config.budget} ${config.currency}.
      
      ATENCIÓN: Una tesis es un documento muy formal. Adopta un tono doctoral, riguroso y científico.
      Estructura requerida (JSON):
      1. Información de portada (Título académico, "Tesis de Doctorado/Maestría", etc.).
      2. Índice.
      3. Introducción (debe incluir: Contexto, Problemática, Hipótesis, Metodología anunciada).
      4. Cuerpo de la tesis (Secciones):
         - Sección 1: Estado del arte (Revisión de la literatura).
         - Sección 2: Metodología de investigación.
         - Sección 3: Resultados y Análisis.
         - Sección 4: Discusión.
      5. Conclusión (Síntesis, Limitaciones, Futuras investigaciones).
      6. Bibliografía (Estilo APA o apropiado).
      
      Importante: Cada sección debe estar muy desarrollada para mostrar la sustancia del trabajo, pero permanecer sintética para caber en la generación.
    `;
  } else if (config.type === 'dissertation') {
    prompt = `
      Redacta un ensayo completo.
      Tema/Cita: "${config.citation || config.topic}".
      Instrucción: "${config.instructions || "Tratar el tema de manera dialéctica o analítica según sea pertinente."}".
      Longitud deseada: Aproximadamente ${config.pageCount || 3} páginas.
      Estructura: Introducción (Gancho, Problemática, Anuncio del plan), Desarrollo (Tesis, Antítesis, Síntesis o Temático), Conclusión.
      Incluye una estimación del número de páginas y una recomendación.
    `;
  } else if (config.type === 'argumentation') {
    prompt = `
      Redacta un texto argumentativo sobre: "${config.topic}".
      Instrucción: "${config.instructions}".
      Longitud: ${config.pageCount || 2} páginas.
      Estructura: Introducción, Argumentos a favor/en contra estructurados, Conclusión.
      Incluye una estimación del número de páginas y una recomendación.
    `;
  }

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
              countrySymbol: { type: Type.STRING, description: "Nombre del símbolo o lema del país" },
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
          estimatedPages: { type: Type.NUMBER, description: "Estimación del número de páginas del documento" },
          recommendation: { type: Type.STRING, description: "Consejo corto para el estudiante" }
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
      if (parsed.content.cover) {
          parsed.content.cover.studentName = userName;
          parsed.content.cover.professorName = config.professor;
          parsed.content.cover.date = config.date;
          parsed.content.cover.educationLevel = config.level; 
          if(!parsed.content.cover.schoolName) parsed.content.cover.schoolName = config.school;
      }
      return {
          type: config.type,
          title: parsed.title,
          content: parsed.content,
          createdAt: Date.now()
      };
    } else {
      throw new Error("Respuesta de la IA vacía.");
    }
  } catch (error) {
    handleGeminiError(error);
    throw error;
  }
};