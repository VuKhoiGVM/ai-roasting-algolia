// Roast response types for Startup Roast application

export interface RoastResponse {
  survivalProbability: number; // 0-100
  marketSaturation: 'Low' | 'Medium' | 'High';
  fundingLikelihood: number; // 0-100
  graveyard: GraveyardEntry[];
  pivots: string[];
  roast: string;
}

export interface GraveyardEntry {
  name: string;
  failure_reason: string;
  raised_amount?: number;
  shutdown_date?: string;
  sector?: string;
  years_of_operation?: string;

  // Rich data from categorized files
  what_they_did?: string;
  how_much_raised?: string;
  takeaway?: string;
  year_founded?: number;
  year_closed?: number;
  operating_years?: number;

  // Failure flags
  lost_to_giants?: boolean;
  competition?: boolean;
  poor_market_fit?: boolean;
  monetization_failure?: boolean;
  execution_flaws?: boolean;
}

// AI SDK v6 Message type
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content?: string;
  parts?: Array<{
    type: 'text' | 'reasoning' | 'file' | 'image';
    text?: string;
    url?: string;
    mediaType?: string;
  }>;
  metrics?: RoastResponse;
}

// Helper to extract text from message parts
export function getMessageText(message: Message): string {
  if (message.content) return message.content;
  return message.parts
    ?.filter(p => p.type === 'text')
    .map(p => p.text || '')
    .join('') || '';
}
