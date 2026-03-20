import { GoogleGenerativeAI } from "@google/generative-ai";

async function test() {
  const genAI = new GoogleGenerativeAI("");
  const prompt = `Identify the language of the following text (it will be German or Spanish). 
      1. If the text is in Spanish, translate it to German and English.
      2. If the text is in German, translate it to Spanish and English.
      
      Return ONLY a JSON object with this format, no markdown blocks:
      {
        "detected": "Spanish" | "German",
        "transA": "Translation A text",
        "langA": "Language Name A",
        "transB": "Translation B text",
        "langB": "Language Name B"
      }
      
      Text: "Hola, como estas hoy?"`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    console.log("Raw response:", raw);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const response = JSON.parse(cleaned);
    console.log("Parsed JSON:", response);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();