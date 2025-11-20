export enum Sender {
  User = 'user',
  Bot = 'bot',
  System = 'system'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  isError?: boolean;
  groundingUrls?: Array<{uri: string, title: string}>;
}

export enum AppMode {
  GeneralAdvisor = 'general', // Consultor Geral
  HSClassifier = 'ncm',       // Classificador NCM
  LegalExpert = 'legal',      // Especialista Legal/Aduaneiro
  DocumentGen = 'docs',       // Gerador de Documentos
}

export interface ModeConfig {
  id: AppMode;
  name: string;
  description: string;
  icon: string;
  systemInstruction: string;
  model: string;
  suggestedQueries: string[];
}

export interface GeminiConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
}