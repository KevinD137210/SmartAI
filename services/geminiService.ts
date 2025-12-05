import { GoogleGenAI, Type } from "@google/genai";
import { PriceCheckResult, Invoice, DocumentType, Transaction, PriceItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const LOCALE_CONFIG: Record<string, { lang: string, currency: string, instruction: string }> = {
  'zh-TW': { 
    lang: 'Traditional Chinese (Taiwan)', 
    currency: 'New Taiwan Dollar (TWD)',
    instruction: 'in Taiwan (TW). Sources: PChome, Momo, Shopee TW, Big Go, FindPrice.'
  },
  'en-US': { 
    lang: 'English (US)', 
    currency: 'US Dollar (USD)',
    instruction: 'in United States (US). Sources: Amazon, BestBuy, Walmart, Home Depot, Google Shopping.'
  },
  'ja-JP': { 
    lang: 'Japanese', 
    currency: 'Japanese Yen (JPY)',
    instruction: 'in Japan (JP). Sources: Rakuten, Amazon JP, Kakaku, Yodobashi.'
  },
  'ko-KR': { 
    lang: 'Korean', 
    currency: 'South Korean Won (KRW)',
    instruction: 'in South Korea (KR). Sources: Coupang, Gmarket, Naver Shopping, Danawa.'
  },
  'zh-CN': { 
    lang: 'Simplified Chinese', 
    currency: 'Chinese Yuan (CNY)',
    instruction: 'in China (CN). Sources: Taobao, JD.com, Tmall.'
  },
  'en-EU': { 
    lang: 'English (Europe)', 
    currency: 'Euro (EUR)',
    instruction: 'in Europe (EU). Sources: Amazon DE/FR, Idealo, Geizhals.'
  },
  'zh-HK': { 
    lang: 'Traditional Chinese (Hong Kong)', 
    currency: 'Hong Kong Dollar (HKD)',
    instruction: 'in Hong Kong (HK). Sources: Price.com.hk, HKTVmall, Fortress.'
  },
  'en-SG': { 
    lang: 'English', 
    currency: 'Singapore Dollar (SGD)',
    instruction: 'in Singapore (SG). Sources: Shopee SG, Lazada SG, Amazon SG.'
  },
  'ru-RU': { 
    lang: 'Russian', 
    currency: 'Russian Ruble (RUB)',
    instruction: 'in Russia (RU). Sources: Ozon, Wildberries, Yandex Market.'
  }
};

export const checkMarketPrice = async (query: string, targetLocale: string): Promise<PriceCheckResult> => {
  try {
    const modelId = 'gemini-2.5-flash'; 
    
    // Default to US if code not found
    const config = LOCALE_CONFIG[targetLocale] || LOCALE_CONFIG['en-US'];

    // Strict Anti-Hallucination Prompt
    const prompt = `
    Task: You are a Price Intelligence Agent. Search for "Buy ${query} online ${config.instruction}".
    
    CRITICAL RULES:
    1. **REAL LINKS ONLY**: You must use the ACTUAL URLs returned by the Google Search tool.
    2. **FORMAT**: Output the data in a strict pipe-separated list.
    3. **CURRENCY**: ${config.currency}.
    4. **QUANTITY**: Find 5-10 distinct offers.

    Output Format (Markdown List):
    * [Merchant Name](ACTUAL_URL) | Product Name | Price
    
    Example:
    * [Amazon](https://amazon.com/dp/123) | Sony WH-1000XM5 | $348.00 USD
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.05, // Extremely low temperature for strict adherence
        systemInstruction: "You are a helpful shopping assistant that only outputs factual price data found via Google Search.",
      },
    });

    const text = response.text || "Sorry, I couldn't retrieve price information at this time.";
    
    // Parse the text into structured items
    const items: PriceItem[] = [];
    const lines = text.split('\n');
    
    // Improved Regex to handle variations (optional spaces, bullets, different separators)
    // Matches: * [Merchant](Url) | Title | Price
    // Also allows for : or - as separators if the model drifts
    const regex = /^\s*[\*\-]?\s*\[([^\]]+)\]\(([^)]+)\)\s*(?:\||:|-)\s*(.+?)\s*(?:\||:|-)\s*(.+)$/;

    lines.forEach(line => {
        const match = line.trim().match(regex);
        if (match) {
            items.push({
                merchant: match[1].trim(),
                url: match[2].trim(),
                title: match[3].trim(),
                price: match[4].trim()
            });
        }
    });

    // Extract grounding chunks for sources (Backup)
    let rawSources: Array<{ title: string; uri: string }> = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          rawSources.push({
            title: chunk.web.title || "Source",
            uri: chunk.web.uri,
          });
        }
      });
    }

    const sources = filterSources(rawSources, targetLocale);

    return { text, sources, items };

  } catch (error) {
    console.error("Gemini Price Check Error:", error);
    return {
      text: targetLocale === 'zh-TW' ? "查詢價格時發生錯誤。請確認您的 API 金鑰是否有效或網路連線正常。" : "An error occurred while checking prices. Please ensure your API key is valid.",
      sources: []
    };
  }
};

// Optimized Helper function to filter sources
function filterSources(sources: { title: string; uri: string }[], targetLocale: string) {
    const seenDomains = new Set<string>();
    const filtered: { title: string; uri: string }[] = [];

    // Simple deduplication by hostname
    for (const item of sources) {
        try {
            const hostname = new URL(item.uri).hostname.replace(/^www\./, '');
            if (!seenDomains.has(hostname)) {
                seenDomains.add(hostname);
                filtered.push(item);
            }
        } catch (e) {
            filtered.push(item);
        }
    }

    return filtered.slice(0, 20); 
}

export const translateText = async (text: string, targetLocale: string): Promise<string> => {
    try {
        const modelId = 'gemini-2.5-flash';
        const config = LOCALE_CONFIG[targetLocale] || LOCALE_CONFIG['en-US'];
        
        const prompt = `Translate the following text to ${config.lang}. Keep technical terms or product names in original if commonly used. Text: "${text}"`;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
        });

        return response.text?.trim() || text;
    } catch (error) {
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
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING }
          },
          required: ["subject", "body"]
        }
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

export const generateTermsAndConditions = async (docLanguage: string, docType: string, userAddress?: string): Promise<string> => {
  try {
    const modelId = 'gemini-2.5-flash';
    const typeStr = docType === DocumentType.INVOICE ? 'Invoice' : 'Quotation';
    
    const prompt = `
    Generate concise standard terms and conditions for a business ${typeStr}.
    Context: User Address: "${userAddress || 'International'}". Language: ${docLanguage}.
    Include Payment Terms, Validity, and Liability. Format as bullet points.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { temperature: 0.4 },
    });

    return response.text?.trim() || "Could not generate terms at this time.";
  } catch (error) {
    return "Error generating terms. Please try again.";
  }
};

export const analyzeReceipt = async (imageFile: File): Promise<Partial<Transaction>> => {
  try {
    const modelId = 'gemini-2.5-flash';
    
    const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); 
        };
        reader.onerror = error => reject(error);
    });

    const prompt = `
    Analyze this receipt image. Extract data into the specified JSON structure.
    
    Rules:
    1. Field 'type' should be 'EXPENSE'.
    2. Field 'date' MUST be in 'YYYY-MM-DD' format. If unsure of year, use current year.
    3. Field 'amount' must be a number.
    4. Summarize items into a string.
    `;

    const response = await ai.models.generateContent({
        model: modelId,
        contents: [
            {
                role: 'user',
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: imageFile.type, data: base64Data } }
                ]
            }
        ],
        config: { 
            systemInstruction: "You are an expert financial accountant data entry specialist.",
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    amount: { type: Type.NUMBER },
                    date: { type: Type.STRING },
                    merchant: { type: Type.STRING },
                    items: { type: Type.STRING },
                    location: { type: Type.STRING },
                    category: { type: Type.STRING },
                    type: { type: Type.STRING }
                },
                required: ["amount", "date"]
            }
        }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Receipt Analysis Error:", error);
    return {};
  }
};

export const identifyProductFromImage = async (imageFile: File, targetLocale: string): Promise<string> => {
  try {
    const modelId = 'gemini-2.5-flash';
    
    const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); 
        };
        reader.onerror = error => reject(error);
    });

    const prompt = `Identify the main commercial product. Return ONLY the specific product model name in the language of ${targetLocale}. Do not add extra words.`;

    const response = await ai.models.generateContent({
        model: modelId,
        contents: [
            {
                role: 'user',
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: imageFile.type, data: base64Data } }
                ]
            }
        ],
    });

    return response.text?.trim() || "";
  } catch (error) {
    return "";
  }
};