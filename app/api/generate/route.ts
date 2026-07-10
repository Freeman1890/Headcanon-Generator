import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

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
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash-lite",
        });
        const prompt = `Write a short fan headcanon for "${charName}"${fandom ? ` from "${fandom}"` : ""}. Use 2 or 3 plain English sentences. Make it specific, grounded, and easy to imagine in a scene. Avoid sales language, big claims, em dashes, and phrases like "hidden side", "more dimensional", or "room to explore".`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        content = text?.trim().replace(/[\u2013\u2014]/g, ",") || "";
      } catch (apiError) {
        console.error("Gemini API error:", apiError);
      }
    }

    if (!content) {
      content = `Headcanon for ${charName}:\n\n${charName} keeps one small habit private${fandom ? ` in ${fandom}` : ""}. It is not dramatic. It is the kind of detail another character might notice once and remember later.`;
    }

    const shareParams = new URLSearchParams({
      headcanon: content,
    });

    if (fandom) {
      shareParams.set("work", fandom);
    }

    return NextResponse.json({
      id: `gen-${Date.now()}`,
      characterName: charName,
      workName: fandom || undefined,
      content,
      shareUrl: `/share/${encodeURIComponent(charName)}?${shareParams.toString()}`,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Generation failed. Please try again later." },
      { status: 500 }
    );
  }
}
