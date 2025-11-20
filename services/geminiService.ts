import { GoogleGenAI, Chat, Type } from "@google/genai";
import { MODES, MODELS } from '../constants';
import { AppMode, Message, Sender } from '../types';

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface ChatSessionConfig {
  mode: AppMode;
  history?: Message[];
}

export class GeminiService {
  private chatSession: Chat | null = null;
  private currentMode: AppMode | null = null;

  private convertHistoryToContent(messages: Message[]) {
    // Filter out system messages or error messages if necessary
    // Map internal Message type to API Content format if manually managing,
    // but here we rely on the Chat object state mostly, 
    // however, when switching modes we might want to carry over context or start fresh.
    // For this app, switching modes resets context to ensure specialized behavior.
    return messages
      .filter(m => m.sender !== Sender.System && !m.isError)
      .map(m => ({
        role: m.sender === Sender.User ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));
  }

  public async startChat(mode: AppMode) {
    this.currentMode = mode;
    const config = MODES[mode];
    
    const modelId = config.model;

    // Configure tools. 
    // We add Google Search for General and Legal modes to get up-to-date rates/laws.
    const tools = (mode === AppMode.GeneralAdvisor || mode === AppMode.LegalExpert) 
      ? [{ googleSearch: {} }] 
      : [];

    this.chatSession = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: config.systemInstruction,
        temperature: 0.7,
        tools: tools,
      },
      history: [] // Start fresh when mode changes
    });
  }

  public async *sendMessageStream(text: string): AsyncGenerator<string | {groundingMetadata: any}, void, unknown> {
    if (!this.chatSession) {
      throw new Error("Chat session not initialized.");
    }

    try {
      const resultStream = await this.chatSession.sendMessageStream({
        message: text
      });

      for await (const chunk of resultStream) {
        // Check for grounding metadata in the chunk to extract URLs
        const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
        if (groundingMetadata) {
            yield { groundingMetadata };
        }
        
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error) {
      console.error("Error in Gemini stream:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();