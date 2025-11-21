import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini
// Note: process.env.API_KEY must be set in the environment
const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const MODEL_NAME = 'gemini-2.5-flash';

export const getGeminiCommentary = async (
  playerName: string,
  event: string,
  gameStateSummary: string
): Promise<string> => {
  if (!ai) return "AI offline due to missing API Key.";

  try {
    const prompt = `
      You are a witty, slightly sarcastic cyberpunk game announcer for a game called 'RichMan Fun'.
      
      The current situation:
      Player: ${playerName}
      Event: ${event}
      Game Context: ${gameStateSummary}
      
      Generate a short, punchy, one-sentence commentary on this event. 
      If it's a bad event, roast them gently. If it's good, congratulate them with suspicion.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        maxOutputTokens: 50,
        temperature: 0.8
      }
    });

    return response.text?.trim() || "Processing event...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Transmission interrupted...";
  }
};

export const generateChanceEvent = async (): Promise<{ description: string; effectType: 'MONEY' | 'MOVE'; value: number }> => {
  if (!ai) {
    // Fallback local events if API fails or is missing
    const fallbackEvents = [
      { description: "Found a crypto wallet on the ground.", effectType: 'MONEY', value: 100 },
      { description: "Server crash! Pay for repairs.", effectType: 'MONEY', value: -100 },
      { description: "Speed boost hack enabled.", effectType: 'MOVE', value: 3 },
    ];
    return fallbackEvents[Math.floor(Math.random() * fallbackEvents.length)] as any;
  }

  try {
    const prompt = `
      Generate a random "Chance Card" event for a cyberpunk monopoly game.
      Return ONLY a JSON object with this schema:
      {
        "description": "A creative short text describing the event",
        "effectType": "MONEY" or "MOVE",
        "value": integer (positive or negative)
      }
      For MONEY: range -200 to +200.
      For MOVE: range -3 to +3.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            effectType: { type: Type.STRING, enum: ['MONEY', 'MOVE'] },
            value: { type: Type.INTEGER },
          }
        }
      }
    });

    const json = JSON.parse(response.text || '{}');
    return {
      description: json.description || "System glitch...",
      effectType: json.effectType === 'MOVE' ? 'MOVE' : 'MONEY',
      value: typeof json.value === 'number' ? json.value : 0
    };

  } catch (error) {
    console.error("Gemini Chance Error:", error);
    return { description: "Network error. Nothing happens.", effectType: 'MONEY', value: 0 };
  }
};