
import { GoogleGenAI } from "@google/genai";
import { Stock } from '../types';

const getGenAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable is not set.");
    }
    return new GoogleGenAI({ apiKey });
};

export const getMarketInsight = async (stock: Stock): Promise<string> => {
    try {
        const ai = getGenAI();
        const prompt = `
        Provide a concise, expert-level market analysis for the stock: ${stock.name} (${stock.symbol}).
        Assume this is for an automated trading dashboard. Structure your response in Markdown.

        Include the following sections:
        - **Outlook**: A brief summary of the potential short-term outlook (bullish, bearish, or neutral) based on common technical and market sentiment indicators.
        - **Key Factors**: 2-3 bullet points on key factors that could influence the stock's price.
        - **Potential Risks**: 1-2 bullet points on potential risks.

        Keep the language professional and direct. Do not include any investment advice disclaimer.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Gemini API call failed:", error);
        if (error instanceof Error) {
            return `Failed to get analysis from Gemini. Reason: ${error.message}`;
        }
        return "An unknown error occurred while fetching analysis.";
    }
};
