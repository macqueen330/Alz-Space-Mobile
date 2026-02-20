import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@env';

const systemInstruction = "You are a compassionate, empathetic, and knowledgeable AI nurse assistant specialized in Alzheimer's care. You help caregivers with advice, coping strategies, and medical information (with disclaimers). You speak in a warm, encouraging tone.";

// Get API key from environment
const getApiKey = (): string => {
  const key = GEMINI_API_KEY || '';
  if (!key || key === 'undefined' || key === 'null') {
    return '';
  }
  return key;
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  try {
    const apiKey = getApiKey();
    
    console.log("API Key status:", apiKey ? `Set (${apiKey.substring(0, 8)}...)` : "Not set");
    
    if (!apiKey) {
      console.warn("Gemini API key not configured. Please set GEMINI_API_KEY in your .env file.");
      return "AI assistant is not configured. Please add GEMINI_API_KEY to your .env file and restart the app.";
    }

    // Initialize client with the API key
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the generative model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: systemInstruction
    });

    console.log("Sending message to Gemini...");
    
    // Generate content
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();
    
    console.log("Gemini response received successfully");
    return text || "I'm sorry, I couldn't process that.";
  } catch (error: unknown) {
    console.error("Gemini API Error:", {
      message: error?.message,
      status: error?.status,
    });
    
    const errorMessage = error?.message?.toLowerCase() || '';
    
    if (errorMessage.includes('api_key_invalid') || errorMessage.includes('api key not valid')) {
      return "The API key is invalid. Please check your GEMINI_API_KEY in the .env file.";
    }
    if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      return "API rate limit reached. Please wait a moment and try again.";
    }
    if (errorMessage.includes('blocked') || errorMessage.includes('safety')) {
      return "I cannot respond to that message. Please try rephrasing your question.";
    }
    
    return `AI connection error: ${error?.message || 'Unknown error'}`;
  }
};
