#!/usr/bin/env node

/**
 * Script to check which Reddit communities don't exist on Digg
 *
 * Usage: node check-digg-communities.js
 */

const REDDIT_COMMUNITIES_URL = "https://www.reddit.com/best/communities/1/";

// Huge list focused on AI Assistants, Virtual Assistants, and AI Automation
// Organized by volume/popularity (high volume first)
const REDDIT_COMMUNITIES = [
  // ============================================
  // === TIER 1: MEGA COMMUNITIES (1M+ members) ===
  // ============================================
  "ChatGPT",
  "ArtificialIntelligence",
  "artificial",
  "MachineLearning",
  "technology",
  "Futurology",
  "programming",
  "Python",
  "learnprogramming",
  "coding",
  "compsci",
  "computerscience",
  "datascience",
  "dataengineering",
  "analytics",
  "science",
  "gadgets",
  "google",
  "apple",
  "microsoft",
  "android",
  "iphone",
  "ios",
  
  // ============================================
  // === TIER 2: LARGE AI COMMUNITIES (100K-1M) ===
  // ============================================
  
  // ChatGPT & OpenAI ecosystem
  "OpenAI",
  "ChatGPTPro",
  "ChatGPTPromptGenius",
  "ChatGPTCoding",
  "ChatGPTJailbreak",
  "GPT3",
  "GPT4",
  "gpt",
  "openai",
  "DALLE2",
  "dalle",
  "dalle2",
  "OpenAIAPI",
  "OpenAISora",
  "Sora",
  
  // Claude & Anthropic
  "ClaudeAI",
  "Claude",
  "anthropic",
  "Anthropic",
  
  // Google AI
  "Bard",
  "GoogleBard",
  "Gemini",
  "GeminiAI",
  "GoogleAI",
  "googlegemini",
  "NotebookLM",
  
  // Microsoft AI
  "MicrosoftCopilot",
  "Copilot",
  "copilot",
  "Bing",
  "BingAI",
  "bingchat",
  "MicrosoftAI",
  "Windows11",
  "Windows",
  "Office365",
  "MicrosoftTeams",
  
  // Meta AI
  "llama",
  "Llama",
  "MetaAI",
  "FacebookAI",
  
  // LLMs & Local AI
  "LocalLLaMA",
  "LLM",
  "LLMDevs",
  "LLMs",
  "localai",
  "LocalAI",
  "ollama",
  "Ollama",
  "oobabooga",
  "KoboldAI",
  "textgenerationwebui",
  "LMStudio",
  
  // General AI
  "GenerativeAI",
  "singularity",
  "Singularity",
  "transhumanism",
  "agi",
  "AGI",
  "AIethics",
  "aichatbots",
  "chatbots",
  "ControlProblem",
  
  // ============================================
  // === TIER 3: AI TOOLS & APPLICATIONS ===
  // ============================================
  
  // AI Writing & Content
  "AIwriting",
  "aiwriting",
  "AIWritingAssistant",
  "AIContent",
  "AIGenerated",
  "ContentAutomation",
  "jasperAI",
  "JasperAI",
  "WriteSonic",
  "copyAI",
  "CopyAI",
  "Rytr",
  "Sudowrite",
  "NovelAI",
  "CharacterAI",
  "CharacterAi",
  "characterai",
  "AIStoryGenerator",
  "AIDungeon",
  
  // AI Image Generation
  "StableDiffusion",
  "stablediffusion",
  "Midjourney",
  "midjourney",
  "MidjourneyAI",
  "AIArt",
  "aiArt",
  "aiart",
  "AIartists",
  "ArtificialArt",
  "deepdream",
  "DiscoDiffusion",
  "ComfyUI",
  "Automatic1111",
  "sdforall",
  "ImagenAI",
  "Leonardo_AI",
  "IdeogramAI",
  "Firefly",
  "AdobeFirefly",
  "Canva",
  
  // AI Video & Audio
  "aivideo",
  "AIVideo",
  "RunwayML",
  "Runway",
  "PikaLabs",
  "Pika",
  "HeyGen",
  "heygen",
  "Synthesia",
  "SynthesiaIO",
  "ElevenLabs",
  "elevenlabs",
  "VoiceCloning",
  "Descript",
  "Kapwing",
  "AIVoice",
  "TextToSpeech",
  "SpeechSynthesis",
  "AudioAI",
  "MusicAI",
  "AIMusic",
  "SunoAI",
  "Suno",
  "Udio",
  
  // AI Coding & Development
  "GithubCopilot",
  "githubcopilot",
  "Cursor",
  "CursorAI",
  "cursorAI",
  "Cody",
  "Tabnine",
  "CodeWhisperer",
  "AWSCodeWhisperer",
  "AICoding",
  "aicoding",
  "CodingWithAI",
  "AIprogramming",
  "AIDevTools",
  "Replit",
  "replit",
  "DevinAI",
  "AutoGPT",
  "autogpt",
  "AgentGPT",
  "BabyAGI",
  
  // ============================================
  // === VIRTUAL ASSISTANTS ===
  // ============================================
  
  // Voice Assistants
  "alexa",
  "Alexa",
  "amazonalexa",
  "AmazonEcho",
  "echo",
  "Echo",
  "EchoDot",
  "googlehome",
  "GoogleHome",
  "googleassistant",
  "GoogleAssistant",
  "NestHub",
  "siri",
  "Siri",
  "SiriShortcuts",
  "shortcuts",
  "Shortcuts",
  "VoiceAssistants",
  "voiceassistants",
  "VoiceAI",
  "VoiceTech",
  "ConversationalAI",
  
  // Smart Home & IoT
  "smarthome",
  "SmartHome",
  "homeautomation",
  "HomeAutomation",
  "HomeAssistant",
  "homeassistant",
  "HA",
  "HASS",
  "hassio",
  "IoT",
  "iot",
  "InternetOfThings",
  "smartdevices",
  "SmartThings",
  "smartthings",
  "Hubitat",
  "WinkHub",
  "ZWave",
  "Zigbee",
  "Matter",
  "HomeKit",
  "AppleHomeKit",
  "homekitautomation",
  "HomePod",
  
  // ============================================
  // === AI AUTOMATION & WORKFLOW ===
  // ============================================
  
  // Automation Platforms
  "Automate",
  "automation",
  "Automation",
  "AutomateYourself",
  "IFTTT",
  "ifttt",
  "Zapier",
  "zapier",
  "Make",
  "MakeAutomation",
  "Integromat",
  "n8n",
  "N8N",
  "n8nio",
  "PowerAutomate",
  "powerautomate",
  "MicrosoftFlow",
  "Pabbly",
  "Pipedream",
  "Tray",
  "Workato",
  "ActivePieces",
  "Windmill",
  
  // No-Code / Low-Code AI
  "nocode",
  "NoCode",
  "lowcode",
  "LowCode",
  "NoCodeAI",
  "LowCodeNoCode",
  "nocodeautomation",
  "nocodeSaaS",
  "CitizenDevelopers",
  "Bubble",
  "bubble",
  "Bubble_io",
  "webflow",
  "Webflow",
  "Airtable",
  "airtable",
  "notion",
  "Notion",
  "NotionAI",
  "Coda",
  "CodaIO",
  "Retool",
  "Appsmith",
  "Softr",
  "Glide",
  "GlideApps",
  "Adalo",
  "FlutterFlow",
  
  // AI Agents & Bots
  "AIAgents",
  "aiagents",
  "AgenticAI",
  "AIAssistants",
  "AIBots",
  "chatbot",
  "Chatbots",
  "ChatbotDevelopment",
  "BotBuilding",
  "DialogFlow",
  "Rasa",
  "RasaHQ",
  "Botpress",
  "AmazonLex",
  "LangChain",
  "langchain",
  "LlamaIndex",
  "CrewAI",
  "AutoGen",
  "SuperAGI",
  "GPTEngineer",
  "Smol",
  "AIWorkflow",
  
  // RPA (Robotic Process Automation)
  "RPA",
  "rpa",
  "RoboticProcessAutomation",
  "UiPath",
  "uipath",
  "BluePrism",
  "AutomationAnywhere",
  "ProcessAutomation",
  "BusinessAutomation",
  "WorkflowAutomation",
  "digitalworker",
  
  // ============================================
  // === AI PRODUCTIVITY & BUSINESS ===
  // ============================================
  
  // AI Productivity Tools
  "AItools",
  "AIToolsTech",
  "aiseotools",
  "ProductivityApps",
  "productivity",
  "Productivity",
  "ProductivityTools",
  "GetDisciplined",
  "GetMotivated",
  "Notion",
  "Obsidian",
  "ObsidianMD",
  "RoamResearch",
  "LogSeq",
  "Tana",
  "Mem",
  "MemAI",
  "Reflect",
  "Capacities",
  "AnyType",
  "PersonalKnowledgeManagement",
  "PKMS",
  "SecondBrain",
  "Zettelkasten",
  
  // AI for Business
  "AIforBusiness",
  "EnterpriseAI",
  "AIBO",
  "AIinBusiness",
  "BusinessIntelligence",
  "BI",
  "Tableau",
  "PowerBI",
  "Looker",
  "DataVisualization",
  "datavisualization",
  "DataAnalysis",
  "PredictiveAnalytics",
  "AIanalytics",
  
  // AI Customer Service
  "CustomerService",
  "customerservice",
  "CustomerSuccess",
  "Zendesk",
  "Intercom",
  "Freshdesk",
  "Drift",
  "Crisp",
  "ChatBot",
  "Tidio",
  "LiveChat",
  "ConversationalSupport",
  
  // AI Sales & Marketing
  "SalesAutomation",
  "MarketingAutomation",
  "HubSpot",
  "hubspot",
  "Salesforce",
  "salesforce",
  "SalesforceDeveloper",
  "Outreach",
  "Apollo",
  "Gong",
  "LeadGeneration",
  "leadgeneration",
  "ColdEmail",
  "coldemail",
  "B2BSales",
  "B2BMarketing",
  
  // AI Research & Search
  "PerplexityAI",
  "Perplexity",
  "perplexity",
  "YouDotCom",
  "PhindAI",
  "Phind",
  "Elicit",
  "Consensus",
  "ResearchAI",
  "AISearch",
  "SearchAI",
  "VoiceSearch",
  "SemanticSearch",
  
  // ============================================
  // === AI SPECIFIC DOMAINS ===
  // ============================================
  
  // AI Healthcare
  "AIHealthcare",
  "HealthcareAI",
  "MedicalAI",
  "AIinHealthcare",
  "DigitalHealth",
  "digitalhealth",
  "HealthTech",
  "healthtech",
  "Telemedicine",
  
  // AI Finance
  "AlgoTrading",
  "algotrading",
  "AITrading",
  "QuantFinance",
  "quantfinance",
  "FinancialML",
  "AIFinance",
  "FintechAI",
  
  // AI Legal
  "AILaw",
  "LegalTech",
  "legaltech",
  "LawAndAI",
  
  // AI Education
  "AIEducation",
  "EdTech",
  "edtech",
  "AITutoring",
  "KhanAcademy",
  "Duolingo",
  
  // ============================================
  // === DEVELOPER & TECHNICAL ===
  // ============================================
  
  // ML/AI Development
  "deeplearning",
  "DeepLearning",
  "neuralnetworks",
  "NeuralNetworks",
  "MLOps",
  "mlops",
  "DataScience",
  "learnmachinelearning",
  "MLQuestions",
  "askML",
  "pytorch",
  "PyTorch",
  "tensorflow",
  "TensorFlow",
  "keras",
  "Keras",
  "huggingface",
  "HuggingFace",
  "OpenSourceLLM",
  "finetuning",
  "FineTuning",
  "RAG",
  "PromptEngineering",
  "promptengineering",
  "PromptDesign",
  "PromptSharing",
  "ChatGPTPrompts",
  
  // API & Integration
  "API",
  "api_development",
  "webdev",
  "web_dev",
  "webdevelopment",
  "javascript",
  "reactjs",
  "node",
  "nodejs",
  "nextjs",
  "svelte",
  "vuejs",
  
  // Self-Hosting & Privacy
  "selfhosted",
  "SelfHosted",
  "degoogle",
  "privacy",
  "PrivacyGuides",
  "opensource",
  "OpenSource",
  "FOSS",
  "freesoftware",
  
  // ============================================
  // === MISC AI COMMUNITIES ===
  // ============================================
  "AIfreakout",
  "aiwars",
  "ArtistHate",
  "DefendingAIArt",
  "antiwMAI",
  "ChatGPTGoneWild",
  "SillyTavern",
  "TavernAI",
  "Janitor_AI",
  "JanitorAI",
  "Replika",
  "replika",
  "SimulacraAndSimulation",
  "scifi",
  "SciFi",
  "cyberpunk",
  "Cyberpunk",
  "retrofuturism",
];

/**
 * Check if a Digg community page exists
 * @param {string} slug - The community slug to check
 * @returns {Promise<{slug: string, exists: boolean, error?: string}>}
 */
async function checkDiggCommunity(slug) {
  const url = `https://digg.com/${slug}`;
  try {
    const response = await fetch(url, { method: "HEAD" });
    return {
      slug,
      exists: response.ok,
      status: response.status,
    };
  } catch (error) {
    return {
      slug,
      exists: false,
      error: error.message,
    };
  }
}

/**
 * Check all communities with rate limiting
 * @param {string[]} slugs - Array of slugs to check
 * @param {number} delayMs - Delay between requests in milliseconds
 * @returns {Promise<{slug: string, exists: boolean}[]>}
 */
async function checkAllCommunities(slugs, delayMs = 200) {
  const results = [];

  console.log(`Checking ${slugs.length} communities on Digg...\n`);

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const result = await checkDiggCommunity(slug);
    results.push(result);

    const status = result.exists ? "✓ EXISTS" : "✗ NOT FOUND";
    console.log(`[${i + 1}/${slugs.length}] ${slug}: ${status}`);

    // Rate limiting - wait between requests
    if (i < slugs.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

async function main() {
  console.log("=".repeat(60));
  console.log("Reddit to Digg Community Checker");
  console.log("=".repeat(60));
  console.log(`\nSource: ${REDDIT_COMMUNITIES_URL}`);
  console.log(`Total communities to check: ${REDDIT_COMMUNITIES.length}\n`);
  console.log("=".repeat(60));
  console.log("");

  const results = await checkAllCommunities(REDDIT_COMMUNITIES);

  const notOnDigg = results.filter((r) => !r.exists);
  const onDigg = results.filter((r) => r.exists);

  console.log("\n" + "=".repeat(60));
  console.log("RESULTS SUMMARY");
  console.log("=".repeat(60));

  console.log(`\n✓ Communities that exist on Digg (${onDigg.length}):`);
  console.log("-".repeat(40));
  onDigg.forEach((r) => console.log(`  - ${r.slug}`));

  console.log(`\n✗ Communities NOT on Digg (${notOnDigg.length}):`);
  console.log("-".repeat(40));
  notOnDigg.forEach((r) => console.log(`  - ${r.slug}`));

  console.log("\n" + "=".repeat(60));
  console.log("JSON OUTPUT - Slugs not on Digg:");
  console.log("=".repeat(60));
  console.log(JSON.stringify(notOnDigg.map((r) => r.slug), null, 2));

  return notOnDigg.map((r) => r.slug);
}

main().catch(console.error);
