import { GoogleGenAI } from "@google/genai";
import { PriceCheckResult, Invoice, DocumentType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const checkMarketPrice = async (query: string, language: 'en' | 'zh-TW'): Promise<PriceCheckResult> => {
  try {
    const modelId = 'gemini-2.5-flash'; 
    
    let langInstruction = '';
    if (language === 'zh-TW') {
        langInstruction = 'Please answer in Traditional Chinese (Taiwan). Prioritize finding prices in New Taiwan Dollar (TWD). If TWD is unavailable, provide USD.';
    } else {
        langInstruction = 'Provide a concise summary of the prices found in New Taiwan Dollar (TWD) or USD if local not available.';
    }

    // Construct a specific prompt for price checking
    const prompt = `Find the current market price or price range for: "${query}". 
    ${langInstruction}
    List key specifications if relevant to the price difference.`;

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
      text: language === 'zh-TW' ? "查詢價格時發生錯誤。請確認您的 API 金鑰是否有效。" : "An error occurred while checking prices. Please ensure your API key is valid.",
      sources: []
    };
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