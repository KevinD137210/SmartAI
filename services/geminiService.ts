import { GoogleGenAI } from "@google/genai";
import { PriceCheckResult, Invoice, DocumentType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const LOCALE_CONFIG: Record<string, { lang: string, currency: string, instruction: string }> = {
  'zh-TW': { 
    lang: 'Traditional Chinese (Taiwan)', 
    currency: 'New Taiwan Dollar (TWD)',
    instruction: 'Search for prices in Taiwan. Report in TWD.'
  },
  'en-US': { 
    lang: 'English (US)', 
    currency: 'US Dollar (USD)',
    instruction: 'Search for global/US prices. Report in USD.'
  },
  'ja-JP': { 
    lang: 'Japanese', 
    currency: 'Japanese Yen (JPY)',
    instruction: 'Search for prices in Japan. Report in JPY.'
  },
  'ko-KR': { 
    lang: 'Korean', 
    currency: 'South Korean Won (KRW)',
    instruction: 'Search for prices in South Korea. Report in KRW.'
  },
  'zh-CN': { 
    lang: 'Simplified Chinese', 
    currency: 'Chinese Yuan (CNY)',
    instruction: 'Search for prices in China. Report in CNY.'
  },
  'en-EU': { 
    lang: 'English (Europe)', 
    currency: 'Euro (EUR)',
    instruction: 'Search for prices in Europe. Report in EUR.'
  }
};

export const checkMarketPrice = async (query: string, targetLocale: string): Promise<PriceCheckResult> => {
  try {
    const modelId = 'gemini-2.5-flash'; 
    
    // Default to US if code not found
    const config = LOCALE_CONFIG[targetLocale] || LOCALE_CONFIG['en-US'];

    // Construct a specific prompt for price checking with locale context
    const prompt = `
    Task: Market Price Analysis
    Product: "${query}"
    Target Market: ${config.instruction}
    Output Language: ${config.lang}

    Instructions:
    1. Search for the current market price or price range for the product in the target market.
    2. Prioritize local e-commerce sites or retailers for the region.
    3. State prices clearly in ${config.currency}. If local currency is absolutely unavailable, convert approx USD to ${config.currency}.
    4. List key specifications if they affect the price significantly.
    5. Provide a concise summary.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3, // Lower temperature for more factual data
      },
    });

    const text = response.text || "Sorry, I couldn't retrieve price information at this time.";
    
    // Extract grounding chunks for sources
    const sources: Array<{ title: string; uri: string }> = [];
    
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Source",
            uri: chunk.web.uri,
          });
        }
      });
    }

    return { text, sources };

  } catch (error) {
    console.error("Gemini Price Check Error:", error);
    return {
      text: targetLocale === 'zh-TW' ? "查詢價格時發生錯誤。請確認您的 API 金鑰是否有效。" : "An error occurred while checking prices. Please ensure your API key is valid.",
      sources: []
    };
  }
};

export const translateText = async (text: string, targetLocale: string): Promise<string> => {
    try {
        const modelId = 'gemini-2.5-flash';
        const config = LOCALE_CONFIG[targetLocale] || LOCALE_CONFIG['en-US'];
        
        const prompt = `
        Role: Professional Business Translator
        Task: Translate the invoice/quotation item description below to ${config.lang}.
        Source Text: "${text}"
        
        Requirements:
        1. Maintain professional business terminology.
        2. Keep product model numbers, technical specs, or proper nouns unchanged if appropriate.
        3. Output ONLY the translated text, no explanations.
        4. If the text is already in the target language, improve its professional tone.
        `;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
        });

        return response.text?.trim() || text;
    } catch (error) {
        console.error("Translation Error:", error);
        return text;
    }
};

export const generateInvoiceEmail = async (invoice: Invoice, tone: 'professional' | 'friendly' | 'urgent', language: 'en' | 'zh-TW'): Promise<{ subject: string; body: string }> => {
  try {
    const modelId = 'gemini-2.5-flash';
    const typeStr = invoice.type === DocumentType.INVOICE ? (language === 'zh-TW' ? '發票' : 'Invoice') : (language === 'zh-TW' ? '報價單' : 'Quotation');
    const actionStr = invoice.type === DocumentType.INVOICE ? (language === 'zh-TW' ? '付款' : 'payment') : (language === 'zh-TW' ? '審閱' : 'review');
    const langName = language === 'zh-TW' ? 'Traditional Chinese (Taiwan)' : 'English';

    const prompt = `
      Act as a professional business assistant. Write a short, clear email for ${typeStr} #${invoice.number}.
      
      Details:
      - Client Name: ${invoice.clientName}
      - Total Amount: $${invoice.total}
      - Due Date: ${invoice.dueDate}
      - Tone: ${tone} (professional, friendly, or urgent reminder)
      - Language: ${langName}

      The email should politely ask the client to review the attached ${typeStr} (PDF) and proceed with ${actionStr}.
      
      Important: Output strictly in JSON format with keys "subject" and "body".
      The "body" should contain the email content. Use \\n for line breaks. Do not include markdown code blocks in the output, just the raw JSON.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { 
        responseMimeType: "application/json" 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Email Gen Error:", error);
    return {
      subject: `Regarding ${invoice.type} #${invoice.number}`,
      body: language === 'zh-TW' 
        ? "抱歉，AI 無法產生郵件內容。請手動撰寫。" 
        : "Sorry, AI could not generate the email content. Please write manually."
    };
  }
};

export const generateTermsAndConditions = async (docLanguage: string, docType: string): Promise<string> => {
  try {
    const modelId = 'gemini-2.5-flash';
    // Map docLanguage code to a region name for better search context
    const regionMap: Record<string, string> = {
      'en-US': 'United States',
      'zh-TW': 'Taiwan',
      'ja-JP': 'Japan',
      'ko-KR': 'South Korea',
      'zh-CN': 'China',
      'en-EU': 'European Union'
    };
    const region = regionMap[docLanguage] || 'International';
    const typeStr = docType === DocumentType.INVOICE ? 'Invoice' : 'Quotation';

    const prompt = `
    Task: Generate concise, precise, and practical standard terms and conditions for a business ${typeStr} in ${region}.
    
    Requirements:
    1. Search for standard legal clauses used in ${region} for commercial transactions regarding ${typeStr}s.
    2. Focus on clauses that protect BOTH the supplier (seller) and the client (buyer) fairly.
    3. Include key points such as Payment Terms, Delivery/Shipping, Warranty/Liability, Validity of Quote (if applicable), and Dispute Resolution.
    4. The output must be in the target language: ${docLanguage === 'zh-TW' || docLanguage === 'zh-CN' ? 'Traditional Chinese' : 'English'}.
    5. Format as a professional list of bullet points.
    6. Do not include introductory text like "Here are the terms...", just the terms themselves.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Enable grounding to find real treaty/clause examples
        temperature: 0.4,
      },
    });

    return response.text?.trim() || "Could not generate terms at this time.";
  } catch (error) {
    console.error("Gemini Terms Gen Error:", error);
    return "Error generating terms. Please try again.";
  }
};