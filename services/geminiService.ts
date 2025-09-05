import { GoogleGenAI, Type } from "@google/genai";
import type { SelectedItem, Round } from '../types';
import { EQUIPMENT_LIST } from '../constants';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Hard-coded, extremely conservative fuel rates (Liters per Hour)
// This gives us direct control over the final numbers.
const TIER_RATES: { [key: string]: number } = {
    LOW: 2.5,   // e.g., Light Towers, small compressors, manlifts
    MEDIUM: 8,  // e.g., Backhoes, Telehandlers, medium generators
    HIGH: 15,   // e.g., Large Excavators, Bulldozers, 500KVA+ generators
};
const IDLE_RATE = 1.5; // Universal low idle rate

export const calculateFuelConsumption = async (
    items: SelectedItem[],
    period: { from: string; to: string }
): Promise<{ 
    results: { 
        id: string; 
        fuelConsumption: number;
        rate: number;
        idleRate: number;
    }[], 
    sources: any[], 
    prompt: string, 
    justification: string 
}> => {
    
    const uniqueItems = Array.from(new Map(items.map(item => [item.name, item])).values());
    const itemList = uniqueItems.map(item => `- ${item.name} (Category: ${item.category})`).join('\n');

    const prompt = `You are an AI expert specializing in heavy machinery logistics and efficiency. Your task is to analyze a list of equipment and classify each item into a fuel consumption tier based on its typical engine size and power draw, even under light load. Your classification will be used to apply a very conservative fuel calculation.

**Primary Goal:** Classify equipment to enable the lowest plausible fuel estimates. All equipment should be considered modern, efficient, and operating under a light-to-moderate workload.

**Classification Tiers:**
You MUST classify each piece of equipment into one of these three tiers:

1.  **'LOW':** For equipment with small engines or low power draw. This includes light towers, small pumps, small air compressors, manlifts, scissor lifts, and vehicles primarily idling or moving without load.
2.  **'MEDIUM':** For general-purpose, mid-range equipment. This includes backhoes, skid steers, telehandlers, motor graders, and medium-sized cranes or generators (e.g., 60-250 KVA).
3.  **'HIGH':** ONLY for the largest, most powerful equipment which inherently consumes more fuel even at light load. This includes large hydraulic excavators, bulldozers, large mobile cranes (120+ tons), and very large generators (e.g., 500+ KVA). Be very selective with this tier.

**Equipment List to Process:**
${itemList}

**Output Requirement:**
You must return a JSON object that adheres to the provided schema. The 'name' in the results must exactly match the name from the input list. The 'justification' should be a brief explanation of your classification methodology.`;

    let response;
    try {
        response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        results: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    consumptionTier: { 
                                        type: Type.STRING,
                                        enum: ['LOW', 'MEDIUM', 'HIGH']
                                    },
                                },
                                required: ["name", "consumptionTier"]
                            }
                        },
                        justification: { type: Type.STRING }
                    },
                    required: ["results", "justification"]
                }
            },
        });

        const rawText = response.text;
        const data = JSON.parse(rawText);

        if (typeof data !== 'object' || data === null || !Array.isArray(data.results) || typeof data.justification !== 'string') {
            throw new Error("AI response was not a valid object with a 'results' array and a 'justification' string.");
        }
        
        const { results: aiTierResults, justification } = data;
        
        const tierMap = new Map(
            (aiTierResults as { name: string; consumptionTier: string }[]).map(r => [r.name, r.consumptionTier.toUpperCase()])
        );

        const finalResults = items.map(item => {
            const tier = tierMap.get(item.name) || 'MEDIUM';
            const rate = TIER_RATES[tier] || TIER_RATES['MEDIUM'];

            // Fuel for "motion resources" is calculated based on their active hours.
            const activeFuel = item.hours * rate;
            // Fuel for "idle resources" is calculated based on their idle hours.
            const idleFuel = item.idleHours * IDLE_RATE;
            
            // The total estimated fuel per unit is the sum of consumption from both active and idle periods.
            // This ensures that if a resource has both motion and idle time, both are accounted for.
            const perUnitFuel = (activeFuel || 0) + (idleFuel || 0);

            return {
                id: item.id,
                fuelConsumption: perUnitFuel,
                rate: rate,
                idleRate: IDLE_RATE,
            };
        });
        
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        return { results: finalResults, sources, prompt, justification };

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof SyntaxError) {
             console.error("Failed to parse JSON from response:", response?.text);
             throw new Error("Failed to parse AI response. The format was not valid JSON.");
        }
        throw error instanceof Error ? error : new Error("Failed to get fuel consumption estimate from AI. Please try again.");
    }
};

export interface ProcessedRow {
    name: string;
    category: string;
    hours: number;
    idleHours: number;
    roundNameCandidate: string | null;
}

export interface ProcessedFileResult {
    processedRows: ProcessedRow[];
}


export const normalizeImportedDataWithAI = async (
    rows: Array<{ [key: string]: any }>
): Promise<ProcessedFileResult> => {
    const equipmentListString = EQUIPMENT_LIST.map(e => `- ${e.name} (Category: ${e.category})`).join('\n');
    const rowsString = JSON.stringify(rows, null, 2);

    const prompt = `You are an AI data normalization and enhancement engine. Your task is to process a pre-parsed JSON array of spreadsheet rows, clean up the data in each row, and return it in a structured format.

---
**Golden Rule (Non-Negotiable):** The number of objects in your output \`processedRows\` array MUST EXACTLY match the number of objects in the input JSON array. You are performing a 1-to-1 transformation, not filtering or creating data. If a row cannot be fully processed, return it with default values (0 for hours, "Unknown Equipment" for name) but DO NOT omit it.
---

**Step 1: The Official Equipment List**
This is your ground truth for equipment names.

<OfficialEquipmentList>
${equipmentListString}
</OfficialEquipmentList>

---

**Step 2: The Input Data (Pre-parsed Rows)**
You will receive a JSON array of objects. Each object is a row. The object keys are the column headers from the original file. Column names can vary.

<InputData>
${rowsString}
</InputData>

---

**Step 3: Per-Row Transformation Logic**
For EACH object in the <InputData> array, create a corresponding object for your output array by performing these actions:

1.  **Extract Equipment Name:**
    *   Look for a key that represents the equipment name (e.g., "Grouping", "Equipment", "Equipment Name", "Description"). The key name will vary.
    *   Take the string value from that key (e.g., "TELEHANDLERS [115-0023]").
    *   Perform a case-insensitive, fuzzy match against the <OfficialEquipmentList>.
    *   Return the OFFICIAL name (e.g., "Telehandler") and its corresponding category.
    *   If no plausible match is found, use "Unknown Equipment" for the name and "General" for the category.

2.  **Parse Durations into Decimal Hours:**
    *   **Active Hours:** Find the key for active hours (e.g., "Active hours", "Active Time", "Usage"). Parse its string value (e.g., "1 days 10:15:04" or "4:12:29") into a decimal number of hours. If the key/value is missing or invalid, use 0.
    *   **Idle Hours:** Find the key for idle hours (e.g., "Idling hours", "Idle Time"). Parse its string value into a decimal number of hours. If missing or invalid, use 0.

3.  **Extract Round Name Candidate:**
    *   Look for a key for a round name (e.g., "Round Name", "Project Name").
    *   If it exists and has a non-empty text value, include that value. Otherwise, use \`null\`.

---

**Step 4: Final Output Requirement (MANDATORY):**
Your entire response MUST be a single, valid JSON object with one key: \`processedRows\`.
- \`processedRows\`: An array of objects.
- Each object must have: \`name\`, \`category\`, \`hours\`, \`idleHours\`, and \`roundNameCandidate\` (string or null).
- **CRITICAL:** \`processedRows.length\` must equal \`InputData.length\`.

**Example for a single input row \`{ "Grouping": "SKID_STEER [119-0023]", "Active hours": "1 days 8:08:33", ... }\`:**
You would produce one output object: \`{ "name": "Skid Steer Loader", "category": "Earthmoving", "hours": 32.14, "idleHours": ..., "roundNameCandidate": ... }\`

DO NOT wrap the JSON in markdown.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        processedRows: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    category: { type: Type.STRING },
                                    hours: { type: Type.NUMBER },
                                    idleHours: { type: Type.NUMBER },
                                    roundNameCandidate: { type: Type.STRING, nullable: true },
                                },
                                required: ["name", "category", "hours", "idleHours"],
                            },
                        }
                    },
                    required: ["processedRows"],
                },
                temperature: 0,
            },
        });

        const jsonString = response.text;
        const results = JSON.parse(jsonString);

        if (typeof results !== 'object' || results === null || !Array.isArray(results.processedRows)) {
            throw new Error("AI response was not a valid object with a processedRows array.");
        }
        
        return {
            processedRows: results.processedRows as ProcessedRow[],
        };

    } catch (error) {
        console.error("Error processing XLSX with Gemini API:", error);
        if (error instanceof SyntaxError) {
             console.error("Failed to parse JSON from AI response:", (error as any).response?.text);
             throw new Error("Failed to parse AI response. The format was not valid JSON.");
        }
        throw error instanceof Error ? error : new Error("AI failed to process the spreadsheet data. Please check the file format and content.");
    }
};

export const getAiInsights = async (rounds: Round[]): Promise<string> => {
    // Sanitize and summarize the data to send to the AI
    const summaryData = rounds.map(round => ({
        roundName: round.name,
        totalFuel: round.totalFuel,
        period: round.period,
        itemCount: round.items.length,
        // Summarize items to avoid sending too much data
        itemsSummary: round.items.map(item => ({
            name: item.name,
            category: item.category,
            totalHours: item.hours * item.quantity,
            totalIdleHours: item.idleHours * item.quantity,
            totalFuel: (item.fuel || 0) * item.quantity
        }))
    }));

    const prompt = `You are a senior logistics and operations analyst AI. Your task is to analyze the following fuel consumption data from a heavy equipment operation and provide actionable business insights.

**Data Summary (JSON format):**
${JSON.stringify(summaryData, null, 2)}

**Analysis Requirements:**
Based on the data provided, generate a concise report in markdown format. Address the following points:

1.  **Top Consumers:** Identify the top 2-3 equipment categories or specific machines that are consuming the most fuel across all rounds.
2.  **Key Trends & Patterns:** Is there a noticeable trend in fuel consumption over time (if multiple rounds exist)? Are there any surprising or anomalous data points (e.g., extremely high idle hours for a particular machine)?
3.  **Actionable Recommendations:** Provide at least two specific, actionable recommendations for how the operation could potentially reduce fuel consumption. Examples could include optimizing equipment allocation, addressing high idle times, or suggesting training for operators.

Your tone should be professional, data-driven, and helpful. Focus on providing insights that a manager could use to make real-world decisions.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.5,
            },
        });
        
        return response.text;
    } catch (error) {
        console.error("Error getting AI insights from Gemini API:", error);
        throw error instanceof Error ? error : new Error("Failed to generate insights from AI. Please try again.");
    }
};