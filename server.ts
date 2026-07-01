import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limits for base64 image uploads
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Initialize Gemini API
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Endpoint 1: OCR and analyze wrong question
app.post("/api/ocr-and-analyze", async (req, res) => {
  try {
    const { image, mimeType, text } = req.body;

    if (!image && !text) {
      return res.status(400).json({ error: "Missing image or text input" });
    }

    let contents: any[] = [];
    let systemInstruction = `你是一位经验丰富的全科错题分析专家。你的任务是：
1. 识别并提取出用户上传的错题（包括题目、选项等内容，保持排版清晰）。如果用户提供的是文本，直接精简并润色该文本。
2. 判断错题的学科（如“数学”、“物理”、“化学”、“语文”、“英语”、“生物”、“历史”、“地理”、“政治”）。
3. 判断核心知识点（一个简短的短语，如“一元二次方程求根公式”、“定语从句”等）。
4. 评估难度等级（“简单”、“中等”、“困难”）。
5. 深入解析该题的“易错点”（分析学生为什么会做错，避坑指南是什么）。

请以 JSON 格式输出，不要有任何 markdown 标记，结构为：
{
  "originalText": "提取出的题目文本",
  "subject": "学科名称",
  "knowledgePoint": "核心知识点",
  "difficulty": "中等",
  "analyzedError": "易错点深度剖析内容，包含避坑指南"
}`;

    if (image) {
      // Image upload mode
      const base64Data = image.split(",")[1] || image;
      contents = [
        {
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: base64Data,
          },
        },
        {
          text: "请识别并深度分析这张图里的错题。请严格输出 JSON 格式，不要包含 ```json 标签。",
        },
      ];
    } else {
      // Text input mode
      contents = [
        {
          text: `请分析并整理以下错题文本：\n\n${text}\n\n请严格输出 JSON 格式，不要包含 \`\`\`json 标签。`,
        },
      ];
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalText: { type: Type.STRING, description: "Extract the text and content of the question accurately." },
            subject: { type: Type.STRING, description: "Subject category (e.g. 数学, 物理, 化学, 语文, 英语)" },
            knowledgePoint: { type: Type.STRING, description: "Core knowledge point covered by this question." },
            difficulty: { type: Type.STRING, description: "Difficulty level: 简单, 中等, 困难" },
            analyzedError: { type: Type.STRING, description: "Detailed analysis of common mistakes and pitfalls for this question." },
          },
          required: ["originalText", "subject", "knowledgePoint", "difficulty", "analyzedError"],
        },
      },
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.error("Error analyzing question:", error);
    res.status(500).json({ error: error.message || "Failed to analyze question" });
  }
});

// Endpoint 2: Generate analog variant questions (举一反三)
app.post("/api/generate-variants", async (req, res) => {
  try {
    const { originalText, subject, knowledgePoint, difficulty } = req.body;

    if (!originalText || !knowledgePoint) {
      return res.status(400).json({ error: "Missing original question or knowledge point" });
    }

    const systemInstruction = `你是一位高水平出题专家。请针对以下提供的“原题”及其“知识点”，设计 3 道高质量的“举一反三”变式题目。
设计要求：
1. 学科：${subject || "全科"}。
2. 核心知识点：${knowledgePoint}。
3. 难度：与原题难度（${difficulty || "中等"}）相匹配或略有梯度递进。
4. 题目形式：可以是选择题、填空题或解答题。如果包含选择题，请在 questionText 中标明选项，并用标准 A、B、C、D 划分。
5. 解析要求：详细给出演算/思考步骤，并**特别强调“易错点”**（例如指出哪些地方容易漏解、哪些概念容易混淆）。
6. 返回 3 道题，结构为数组。

输出格式应为 JSON 格式：
[
  {
    "id": 1,
    "questionText": "变式题目一的具体内容",
    "answer": "参考答案",
    "explanation": "详细解析（侧重分析易错点，使用[易错点]或加粗重点词汇标注）"
  },
  ...
]`;

    const prompt = `原题：\n${originalText}\n\n知识点：\n${knowledgePoint}\n\n请直接生成这3道变式题，返回标准的 JSON 数组，严禁包含任何其他文字或外层 \`\`\`json 标记。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              questionText: { type: Type.STRING, description: "Body of the variant question" },
              answer: { type: Type.STRING, description: "Correct answer" },
              explanation: { type: Type.STRING, description: "Detailed explanation highlighting common pitfalls and error analysis" },
            },
            required: ["id", "questionText", "answer", "explanation"],
          },
        },
      },
    });

    const resultText = response.text || "[]";
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.error("Error generating variants:", error);
    res.status(500).json({ error: error.message || "Failed to generate variant questions" });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
