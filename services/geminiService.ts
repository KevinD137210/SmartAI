import { GoogleGenAI } from "@google/genai";
import { PriceCheckResult, Invoice, DocumentType, Transaction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const LOCALE_CONFIG: Record<string, { lang: string, currency: string, instruction: string }> = {
  'zh-TW': { 
    lang: 'Traditional Chinese (Taiwan)', 
    currency: 'New Taiwan Dollar (TWD)',
    instruction: 'Search strictly for prices in Taiwan (TW). Use major Taiwanese e-commerce sources (e.g. PChome, Momo, Shopee Mall) and major hardware/DIY stores (e.g. B&Q 特力屋, Supermall, Tashin 振宇五金). Report in TWD.'
  },
  'en-US': { 
    lang: 'English (US)', 
    currency: 'US Dollar (USD)',
    instruction: 'Search strictly for prices in the United States (US). Use major US retailers (e.g. Amazon, BestBuy, Walmart, Target) and major home improvement/hardware chains (e.g. Home Depot, Lowe\'s, Menards, Build.com, Ace Hardware). Report in USD.'
  },
  'ja-JP': { 
    lang: 'Japanese', 
    currency: 'Japanese Yen (JPY)',
    instruction: 'Search strictly for prices in Japan (JP). Use major Japanese retailers (e.g. Rakuten, Amazon JP, Yodobashi, Bic Camera) and DIY/Home Centers (e.g. Cainz, Kohnan, DCM, Royal Home Center). Report in JPY.'
  },
  'ko-KR': { 
    lang: 'Korean', 
    currency: 'South Korean Won (KRW)',
    instruction: 'Search strictly for prices in South Korea (KR). Use major Korean retailers (e.g. Coupang, Gmarket, 11Street, SSG) and construction/DIY suppliers (e.g. Ace Hardware KR, House Step, local interior material suppliers). Report in KRW.'
  },
  'zh-CN': { 
    lang: 'Simplified Chinese', 
    currency: 'Chinese Yuan (CNY)',
    instruction: 'Search strictly for prices in Mainland China (CN). Use major Chinese retailers (e.g. JD, Tmall, Taobao) and industrial/construction suppliers (e.g. 1688, Easyhome 居然之家, Red Star Macalline 红星美凯龙). Report in CNY.'
  },
  'en-EU': { 
    lang: 'English (Europe)', 
    currency: 'Euro (EUR)',
    instruction: 'Search for prices in the Eurozone (EU). Use major European retailers (e.g. Amazon, MediaMarkt, Fnac) and DIY chains (e.g. Leroy Merlin, OBI, Castorama, Bauhaus, Hornbach). Report in EUR.'
  },
  'zh-HK': { 
    lang: 'Traditional Chinese (Hong Kong)', 
    currency: 'Hong Kong Dollar (HKD)',
    instruction: 'Search strictly for prices in Hong Kong. Use major HK retailers (e.g. HKTVmall, Price.com.hk, Fortress) and hardware/decoration suppliers (e.g. 5metal.com.hk, Mall.builderhood, Thomson Hardware). Report in HKD.'
  },
  'en-SG': { 
    lang: 'English', 
    currency: 'Singapore Dollar (SGD)',
    instruction: 'Search strictly for prices in Singapore. Use major Singaporean retailers (e.g. Shopee SG, Lazada SG, Amazon SG) and hardware suppliers (e.g. Horme Hardware, Selffix, Home-Fix). Report in SGD.'
  },
  'ru-RU': { 
    lang: 'Russian', 
    currency: 'Russian Ruble (RUB)',
    instruction: 'Search strictly for prices in Russia. Use major Russian retailers (e.g. Ozon, Wildberries, Yandex Market, DNS) and construction/DIY hypermarkets (e.g. Leroy Merlin, Petrovich, Maxidom, Vimos). Report in RUB.'
  }
};

export const checkMarketPrice = async (query: string, targetLocale: string): Promise<PriceCheckResult> => {
  try {
    const modelId = 'gemini-2.5-flash'; 
    
    // Default to US if code not found
    const config = LOCALE_CONFIG[targetLocale] || LOCALE_CONFIG['en-US'];

    // Construct a specific prompt for price checking with locale context
    const prompt = `
    Role: Professional Market Analyst & Shopping Assistant
    Task: Analyze the current market price for the product below in the specified target market.

    Product Query: "${query}"
    Target Market: ${config.instruction}
    Output Language: ${config.lang} (Ensure the entire response is translated to this language)

    **CRITICAL SEARCH STRATEGY**: 
    1. **Language Detection & Translation**: The user input "${query}" might NOT be in the local language of the Target Market. Translate if necessary.
    2. **Broad Source Search**: You MUST find and list **at least 10 different reputable sources** (retailers/websites).
       - If the item is **Construction/Hardware**, prioritize: ${config.instruction}
    3. **Links are Mandatory**: For EVERY retailer or source you list, you MUST include the **Direct Product URL** in the text response using Markdown format: [Retailer Name](URL).

    Strict Analysis Rules:
    1. **NO Second-Hand/Used Prices**: Do NOT include prices from eBay auctions or used marketplaces.
    2. **High Credibility Sources Only**: Use prices from official brand stores, major authorized retailers, and reputable e-commerce platforms.
    3. **Precise Translation**: The output must be natural and professional in ${config.lang}.

    Output Format (in ${config.lang}):
    ### Market Analysis: [Product Name]
    *(Search Term Used: [Translated Local Term])*
    
    *   **Price Range**: [Low] - [High] ${config.currency}
    *   **Average Price**: ~[Amount] ${config.currency}
    
    ### Key Retailers (New Items Only):
    *   [Retailer Name](URL): [Price] - [Brief Note]
    *   [Retailer Name](URL): [Price] - [Brief Note]
    *   [Retailer Name](URL): [Price] - [Brief Note]
    *   [Retailer Name](URL): [Price] - [Brief Note]
    *   [Retailer Name](URL): [Price] - [Brief Note]
    *   [Retailer Name](URL): [Price] - [Brief Note]
    *   [Retailer Name](URL): [Price] - [Brief Note]
    *   [Retailer Name](URL): [Price] - [Brief Note]
    *   (Aim for 8-12 distinct sources)
    
    ### Analysis:
    *   [Point 1: Availability or Price Trend]
    *   [Point 2: Best value option]
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

    // Filter and Deduplicate Sources based on Locale and Domain
    const sources = filterSources(rawSources, targetLocale);

    return { text, sources };

  } catch (error) {
    console.error("Gemini Price Check Error:", error);
    return {
      text: targetLocale === 'zh-TW' ? "查詢價格時發生錯誤。請確認您的 API 金鑰是否有效。" : "An error occurred while checking prices. Please ensure your API key is valid.",
      sources: []
    };
  }
};

// Helper function to filter sources
function filterSources(sources: { title: string; uri: string }[], targetLocale: string) {
    const seenDomains = new Set<string>();
    const localePatterns: Record<string, string[]> = {
        'zh-TW': ['.tw', '/tw/', 'zh-tw'],
        'ja-JP': ['.jp', '/jp/', 'ja-jp'],
        'ko-KR': ['.kr', '/kr/', 'ko-kr'],
        'zh-CN': ['.cn', '/cn/', 'zh-cn'],
        'en-US': ['.com', '/us/', 'en-us'], 
        'en-EU': ['.eu', '.de', '.fr', '.it', '.es', '.nl'],
        'zh-HK': ['.hk', '/hk/'],
        'en-SG': ['.sg', '/sg/'],
        'ru-RU': ['.ru', '/ru/']
    };

    const targetPatterns = localePatterns[targetLocale] || [];
    
    // Check if URI matches the target locale
    const isTargetMatch = (uri: string) => {
        const lower = uri.toLowerCase();
        return targetPatterns.some(p => lower.includes(p));
    };

    // Check if URI matches a conflicting locale
    const isConflict = (uri: string) => {
        const lower = uri.toLowerCase();
        for (const [loc, patterns] of Object.entries(localePatterns)) {
            if (loc === targetLocale) continue;
            // Ignore generic .com as a conflict indicator (e.g. .com.tw contains .com but is not a conflict for Taiwan)
            if (patterns.some(p => p !== '.com' && lower.includes(p))) {
                 return true;
            }
        }
        return false;
    };

    // Score and Sort
    const scored = sources.map(s => {
        let score = 0;
        if (isTargetMatch(s.uri)) score += 10;
        if (isConflict(s.uri)) score -= 100; // Penalize conflicting regions heavily
        return { ...s, score };
    });

    // Sort: High score first.
    scored.sort((a, b) => b.score - a.score);

    const filtered: { title: string; uri: string }[] = [];

    for (const item of scored) {
        if (item.score < -50) continue; // Skip conflicts

        try {
            // Group by hostname (stripping www) to avoid duplicates like www.apple.com and apple.com/jp
            const hostname = new URL(item.uri).hostname.replace(/^www\./, '');
            
            if (!seenDomains.has(hostname)) {
                seenDomains.add(hostname);
                filtered.push({ title: item.title, uri: item.uri });
            }
        } catch (e) {
            // fallback if URL parsing fails
            filtered.push({ title: item.title, uri: item.uri });
        }
    }

    return filtered.slice(0, 20); // Increased limit to 20 to capture more sources
}

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

export const generateTermsAndConditions = async (docLanguage: string, docType: string, userAddress?: string): Promise<string> => {
  try {
    const modelId = 'gemini-2.5-flash';
    
    const regionMap: Record<string, string> = {
      'en-US': 'United States',
      'zh-TW': 'Taiwan',
      'ja-JP': 'Japan',
      'ko-KR': 'South Korea',
      'zh-CN': 'China',
      'en-EU': 'European Union',
      'zh-HK': 'Hong Kong',
      'en-SG': 'Singapore',
      'ru-RU': 'Russia'
    };
    const defaultRegion = regionMap[docLanguage] || 'International';
    const typeStr = docType === DocumentType.INVOICE ? 'Invoice' : 'Quotation';
    
    const langMap: Record<string, string> = {
        'en-US': 'English (US)',
        'zh-TW': 'Traditional Chinese (Taiwan)',
        'ja-JP': 'Japanese',
        'ko-KR': 'Korean',
        'zh-CN': 'Simplified Chinese',
        'en-EU': 'English (Europe)',
        'zh-HK': 'Traditional Chinese (Hong Kong)',
        'en-SG': 'English',
        'ru-RU': 'Russian'
    };
    const langPrompt = langMap[docLanguage] || 'English';

    const prompt = `
    Task: Generate concise, precise, and practical standard terms and conditions for a business ${typeStr}.
    
    Context:
    - User Address: "${userAddress || 'Not provided'}"
    - Document Language Code: ${docLanguage}
    - Default Region (if address is missing): ${defaultRegion}

    Requirements:
    1. **Jurisdiction Detection**: If the User Address is provided, automatically detect the country/region from it and apply its standard commercial laws and customs. If not provided or unclear, default to ${defaultRegion}.
    2. Search for standard legal clauses used in that specific jurisdiction for commercial transactions regarding ${typeStr}s.
    3. Include key points such as Payment Terms, Delivery/Shipping, Warranty/Liability, Validity of Quote (if applicable), and Dispute Resolution.
    4. **Output Language**: The output MUST be in ${langPrompt}.
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

export const analyzeReceipt = async (imageFile: File): Promise<Partial<Transaction>> => {
  try {
    const modelId = 'gemini-2.5-flash';
    
    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onload = () => {
            const result = reader.result as string;
            // Split to get only base64 part
            resolve(result.split(',')[1]); 
        };
        reader.onerror = error => reject(error);
    });

    const prompt = `
    Analyze this receipt image to extract transaction details.
    
    Requirements:
    1. **Items Summary**: The 'items' field MUST be a very short, concise keyword summary (max 5-6 words). 
       - Do NOT list every single product. 
       - Do NOT include SKU numbers or prices in this field.
       - Example: "Grocery Shopping", "Office Stationery", "Dinner at McDonald's", "iPhone 15 Pro Case".
    2. **Merchant**: Extract the clear store name.
    3. **Date**: YYYY-MM-DD format. If missing, use today.
    4. **Amount**: Total grand total.
    
    Return JSON:
    {
      "amount": number,
      "date": "string",
      "merchant": "string",
      "items": "string",
      "location": "string",
      "category": "string", // One of: Food, Transport, Rent, Utilities, Entertainment, Shopping, Health, Other, Salary, Freelance, Investment, Sales
      "type": "string" // INCOME or EXPENSE
    }
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
        config: { responseMimeType: 'application/json' }
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
    
    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); 
        };
        reader.onerror = error => reject(error);
    });

    const config = LOCALE_CONFIG[targetLocale] || LOCALE_CONFIG['en-US'];

    const prompt = `
    Role: AI Personal Shopper
    Task: Identify the main commercial product in this image.
    Target Market Language: ${config.lang}

    Instructions:
    1. Analyze the image to identify the main object or product.
    2. Return ONLY the precise product name to be used for a shopping search.
    3. Ensure the name is in the ${config.lang}.
    4. Do not include markdown code blocks or explanations, just the plain text name.
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
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Product ID Error:", error);
    return "";
  }
};