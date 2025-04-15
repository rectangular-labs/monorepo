import { tool, generateObject, jsonSchema } from "ai";
import { type } from "arktype";
import { mainAgentModel } from "./models";

// --- Input Schema ---

// Optional info about an image mark provided by the user
const markImageInfoSchema = type({
  mimeType: "string", // e.g., "image/jpeg", "image/png"
});

// Parameters expected by the tool's execute function
const paramsSchema = type({
  backgroundInfo: "string", // Business/product background provided by the user or context
  markText: "string?", // The text mark provided by the user (if any)
  markImageInfo: `${markImageInfoSchema.expression}?`, // Info about the image mark (if any)
  // Optional: User-provided context on services/classes, if available
  userProvidedServices: "string[]?",
  userProvidedClasses: "number[]?",
}).assert(
  // Ensure that either a text mark or an image mark is available for analysis
  (data) => data.markText !== undefined || data.markImageInfo !== undefined,
  "Tool requires either markText or markImageInfo.",
);

// --- Output Schema ---

// Structure for recommended NICE classification
const niceClassSchema = type({
  classNumber: "number", // The NICE class number (e.g., 9, 42)
  reasoning: "string", // Justification for why this class is relevant
  examples: "string[]", // Example goods/services under this class relevant to the user
});

// Structure for potential objections identified
const potentialObjectionSchema = type({
  reason: "string", // High-level reason (e.g., "Descriptive Mark", "Similarity to Existing Mark")
  details: "string", // Specific explanation related to the user's mark
  relevantActSection: "string?", // Corresponding section of the Trade Marks Act (e.g., "7(1)(c)")
});

// The final structured output of the tool's analysis
const outputSchema = type({
  // If critical information is missing (mark, services), provide a question for the user
  requiresUserInput: "string?",
  // Recommendation on how to file the mark
  recommendedMarkType:
    "'Word Mark' | 'Logo Mark' | 'Composite Mark' | 'Undetermined'?",
  // Overall summary of the mark's registrability and key points
  assessmentSummary: "string",
  // List of suggested NICE classes
  recommendedNiceClasses: [niceClassSchema, "[]"],
  // List of potential grounds for refusal by IPOS
  potentialObjections: [potentialObjectionSchema, "[]"],
  // Suggested next actions for the user
  nextSteps: ["string", "[]"],
});

// --- Tool Definition ---

export const markFilingRecommendation = tool({
  description: `Analyzes a proposed trademark (text or image) based on user-provided background information.
Provides an initial assessment for Singapore trademark registration, considering:
- Optimal mark type (Word, Logo, Composite).
- Potential objections under the Singapore Trade Marks Act 1998 and IPOS guidelines (distinctiveness, descriptiveness, similarity, etc.).
- Recommended NICE classification classes.
- Actionable next steps.
Requires either a text description of the mark or information that an image mark was provided.`,
  parameters: jsonSchema<typeof paramsSchema.infer>(
    paramsSchema.toJsonSchema(),
  ),
  execute: async ({
    backgroundInfo,
    markText,
    markImageInfo,
    userProvidedServices,
    userProvidedClasses,
  }) => {
    console.log("Executing markFilingRecommendation tool...");
    console.log("Received params:", {
      backgroundInfo,
      markText,
      markImageInfo,
      userProvidedServices,
      userProvidedClasses,
    });

    // Construct the part of the prompt describing the mark provided
    let markDescription = "";
    if (markText && markImageInfo) {
      markDescription = `The user provided both a text mark ("${markText}") and a logo mark (image type: ${markImageInfo.mimeType}). Analyze them together as potentially a composite mark, but also evaluate the word mark on its own.`;
    } else if (markText) {
      markDescription = `The user provided the following text mark: "${markText}"`;
    } else if (markImageInfo) {
      markDescription = `The user provided a logo mark (image type: ${markImageInfo.mimeType}). Please analyze the visual elements conveyed in the image.`;
    } else {
      // This case should be prevented by the .assert in paramsSchema, but handle defensively
      console.error("Tool called without markText or markImageInfo.");
      return {
        requiresUserInput:
          "Error: Tool requires mark information. Please provide the mark text or image.",
        assessmentSummary: "",
        recommendedNiceClasses: [],
        potentialObjections: [],
        nextSteps: [],
      };
    }

    // Include user-provided services/classes in the prompt if available
    let serviceClassContext = "";
    if (userProvidedServices && userProvidedServices.length > 0) {
      serviceClassContext += `The user mentioned the following goods/services: ${userProvidedServices.join(", ")}.\n`;
    }
    if (userProvidedClasses && userProvidedClasses.length > 0) {
      serviceClassContext += `The user mentioned the following NICE classes: ${userProvidedClasses.join(", ")}.\n`;
    }
    if (!serviceClassContext) {
      serviceClassContext =
        "The user did not explicitly state their goods/services or NICE classes. If the background info is insufficient, please research the business based on the background to propose relevant classes. If research is not possible, state that goods/services information is required.\n";
    }

    // --- Start New Prompt ---
    const newPrompt = `
Role Definition

You are the world's best Singapore-qualified lawyer, trained to provide accurate and clear legal analysis on the client's submitted signs (words and logos) to assess whether they qualify as a registrable trademark with the Intellectual Property Office of Singapore (IPOS). You are heavily incentivize to succeed.
Your role is to evaluate the proposed trademark and provide a short initial assessment based on whether the client's sign should be filed as a logo mark, word mark, or composite mark, against the:
Singapore Trade Marks Act 1998 https://sso.agc.gov.sg/Act/TMA1998?WholeDoc=1
IPOS Trade Marks Work Manual https://www.ipos.gov.sg/about-ip/trade-marks/managing-trade-marks/guides
Relevant Singapore trademark case law

Client Input:
Business Background:
--- Start Background ---
${backgroundInfo}
--- End Background ---

Proposed Mark:
${markDescription}

Goods/Services Context:
${serviceClassContext}

Objectives:

The objective of your analysis is to answer two questions (which are reflected in the output schema fields: 'recommendedMarkType' and 'potentialObjections'):
1. How should the client register their mark? Logo Mark, Word Mark, or Composite Mark?
2. What are the possible grounds for objection by IPOS for the mark?

Note that before evaluating, you will, as the example output provides, be required to do a search on the business and give an evaluation of what classes they are to file under (reflected in 'recommendedNiceClasses'). Conduct the following analysis with the basis that you are filing under the said classes.

You are to read and analyse all resources thoroughly before providing advice, and base your advice on the sources provided.

When evaluating these two questions based on the client's submitted signs, consider the following regarding the signs:
1. Does it satisfy the definition of a trade mark in section 2(1) of the Trade Marks Act?
   '"'trade mark" means any sign capable of being represented graphically and which is capable of distinguishing goods or services dealt with or provided in the course of trade by a person from goods or services so dealt with or provided by any other person;
2. Is it a non-distinctive mark (Section 7(1)(b))?
   - Trade marks which are devoid of any distinctive character.
   - Resources: IPOS Guideline, Love & Co Pte Ltd v The Carat Club Pte Ltd (2008), The Polo/Lauren Co, LP v Shop In Department Store Pte Ltd [2005] SGCA 21.
   - Flag common words/generic branding unless distinctiveness acquired through use.
3. Is it a Descriptive Mark (Section 7(1)(c))?
   - Trade marks which consist exclusively of signs or indications which may serve, in trade, to designate the kind, quality, quantity, intended purpose, value, geographical origin, time of production, or other characteristics.
   - Resources: IPOS Guideline, Rovio Entertainment Ltd v Kimanis Food Industries Sdn Bhd [2015] SGHC 216.
   - Assess if the mark merely informs or contains arbitrary elements.
4. Does it consist of Customary Trade Terms (Section 7(1)(d))?
   - Trade marks which consist exclusively of signs or indications which have become customary in the current language or trade practices.
   - Resources: Viet Huong Trading Co Ltd v Tan Wing Hong [2009] SGHC 150.
   - Check industry usage; generic terms may not be registrable alone.
5. Is it contrary to public policy or morality (Section 7(4)(a))?
   - Resources: IPOS Guideline, Application by Heineken Asia Pacific Pte Ltd [2016] SGIPOS 7 ("Tiger Balls" example).
   - Flag potential vulgarity, religious sensitivity, or offensive references.
6. Is it of such a nature as to deceive the public (Section 7(4)(b))?
   - E.g., regarding nature, quality, or geographical origin.
   - Resources: IPOS Guideline, Consorzio del Prosciutto di Parma v Aslan Trading Singapore Pte Ltd [2019] SGIPOS 10 ("Parma" example).
   - Flag misleading terms (esp. geographical) and recommend disclaimers if needed.
7. Does it contain/consist of a geographical indication for wine/spirit not originating from that place (Section 7(7))?
   - Resources: IPOS Guideline, Consorzio per la Tutela del Formaggio Gorgonzola v Fonterra Brands (Singapore) Pte Ltd [2005] SGIPOS 2 ("Gorgonzola" example).
   - Identify geographical terms and check protected GI databases.
8. Is it a slogan?
   - Resources: IPOS Guideline, McDonald's Corp v Future Enterprises Pte Ltd [2005] SGCA 50 ("I'm lovin' it" example).
   - Flag short phrases as potentially weak unless distinctiveness acquired.
9. Is it identical with an earlier trade mark for identical goods/services (Section 8(1))?
   - Resource (use for 9, 10, 11): IPOS Guideline, Ferrero S.p.A. v Sarika Connoisseur Cafe Pte Ltd [2011] SGHC 176 ("Nutello" vs "Nutella").
   - Assess likelihood of confusion even with slight variations. Requires comparison against IPOS database (NOTE: You cannot access external websites like the IPOS database directly. State this limitation and recommend a formal search as a next step).
10. Is it identical with an earlier trade mark for similar goods/services (Section 8(2)(a))?
    - (See point 9 resources and limitation).
11. Is it similar to an earlier trade mark which is well known in Singapore (Section 8(2)(b))?
    - Resources: Novelty Pte Ltd v Amanresorts Ltd [2009] 3 SLR 216, Mobil Petroleum Company, Inc v Hyundai Mobis [2009] SGCA 38.
    - Famous brands get broader protection. Check for global recognition. (NOTE: State limitations in assessing "well-known" status without comprehensive market data).

Key Terms Glossary
- Logo: A visual design (symbol, icon, or image).
- Wordmark: Text-only trademark.
- Composite Mark: Combines logo and wordmark. Recommended if word elements are weak/descriptive or other issues exist.

Output Instructions:
You are required to GENERATE A JSON OBJECT matching the defined output schema.
1.  Review the submitted sign(s) (text/logo) based on the background and legal criteria.
2.  Determine Recommended Mark Type: 'Word Mark' (if distinctive words), 'Logo Mark' (if distinctiveness is visual), 'Composite Mark' (if words are weak/descriptive, or combined elements needed). Use 'Undetermined' if analysis is inconclusive without more info.
3.  Recommend NICE Classes: Based on background/services (provided or researched). Propose class numbers, reasoning, and examples using IPOS/NICE guidelines. If research fails, indicate need for user input via 'requiresUserInput'.
4.  Identify Potential Objections: List grounds for refusal (non-distinctive, descriptive, customary, deceptive, morality, similarity). Provide specific details and Act sections where possible. State limitations regarding direct database checks and recommend formal searches.
5.  Provide Assessment Summary: A brief, client-specific analysis synthesizing the findings.
6.  Suggest Next Steps: Concrete actions like "Conduct a formal clearance search via the firm", "Refine the mark to enhance distinctiveness", "Consult with the firm to finalize filing strategy".
7.  Handle Missing Information:
    - If no mark is identifiable (error case, should not happen with schema validation), use 'requiresUserInput'.
    - If goods/services are unclear and cannot be inferred, use 'requiresUserInput' to ask for them.
    - If no significant issues are found, provide a positive assessment summary and recommend proceeding with filing as a next step.

Evaluation Rules (MUST follow these in EVERY assessment)
- MANDATORY: Provide direct client-specific analysis, justifying conclusions.
- MANDATORY: Always recommend the best mark type (Word, Logo, Composite, or Undetermined).
- MANDATORY: Address potential similarity issues, state database check limitations, and recommend a formal search.
- MANDATORY: Recommend NICE Classification Classes (research if needed, state if more info required).
- MANDATORY: Output MUST follow the JSON schema strictly. Do not add commentary outside the JSON structure.
`;

    try {
      const { object } = await generateObject({
        model: mainAgentModel, // Use a powerful model for legal reasoning
        schema: jsonSchema<typeof outputSchema.infer>(
          outputSchema.toJsonSchema(),
        ),
        prompt: newPrompt,
        mode: "json",
      });
      console.log("markFilingRecommendation tool result:", object);
      // Validate or sanitize the object if necessary before returning
      // For now, assume the model respects the schema
      return object;
    } catch (error) {
      console.error(
        "Error executing markFilingRecommendation tool with generateObject:",
        error,
      );
      // Return a structured error within the expected schema
      return {
        assessmentSummary:
          "An error occurred while analyzing the trademark information.",
        potentialObjections: [
          {
            reason: "Tool Execution Error",
            details: error instanceof Error ? error.message : String(error),
          },
        ],
        recommendedNiceClasses: [],
        nextSteps: ["Please try again or report this issue."],
      };
    }
  },
});
