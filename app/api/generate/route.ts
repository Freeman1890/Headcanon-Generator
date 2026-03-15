import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Live API: Gemini 2.0 Flash-Lite for headcanon generation
 * TODO: Add Context Caching to reduce API cost
 */
export async function POST(request: NextRequest) {
  try {
    const { characterName, workName } = await request.json();

    if (!characterName?.trim()) {
      return NextResponse.json(
        { error: "Character name is required" },
        { status: 400 }
      );
    }

    const charName = characterName.trim();
    const fandom = workName?.trim();
    let content = "";

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        const prompt = `Generate a short, creative headcanon (fan interpretation) for the character "${charName}"${fandom ? ` from "${fandom}"` : ""}. Write 2-4 sentences in English. Focus on a quirky habit, hidden trait, or fun detail not in the official story.`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        content = text?.trim() || "";
      } catch (apiError) {
        console.error("Gemini API error:", apiError);
      }
    }

    if (!content) {
      content = `Headcanon for ${charName}:\n\n${charName} has a hidden side ${fandom ? `in ${fandom}` : "in the story"}. They do small things in private that contrast with their usual image — these details make the character more dimensional and give fan creators room to explore.`;
    }

    return NextResponse.json({
      id: `gen-${Date.now()}`,
      characterName: charName,
      workName: fandom || undefined,
      content,
      shareUrl: `/share/${encodeURIComponent(charName)}`,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Generation failed. Please try again later." },
      { status: 500 }
    );
  }
}
