import { GoogleGenerativeAI } from "@google/generative-ai";

async function test() {
  const genAI = new GoogleGenerativeAI("");
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("hola");
    console.log(result.response.text());
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();