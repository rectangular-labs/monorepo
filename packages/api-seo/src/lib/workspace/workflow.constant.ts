import type { articleTypeSchema } from "@rectangular-labs/core/schemas/content-parsers";

export type ArticleType = typeof articleTypeSchema.infer;

export const ARTICLE_TYPE_TO_WRITER_RULE: Partial<Record<ArticleType, string>> =
  {
    "best-of-list": `## Best of lists
1. Always include screenshots of ALL the products/websites/service pages/country/food/item that you are listing. The images should come right after the heading introducing the item on the list.
2. If ideal screenshots are not available, note acceptable fallbacks.
3. Word light - Explain why each item is listed succinctly.
4. Maximum of 20 total items.
5. Always include links to each of the listed items/services organically (for e.g. wrapping the link around the anchor text of the item/service being linked to).
6. Give an opinion as to why the top listed product is considered the best and why`,
    comparison: `## Comparisons (comparing two or more products or services or items)
1. Always include comparison tables at the top of the article that summarizes the key points
2. Include screenshots or pictures of ALL the items being compared
3. If ideal screenshots are not available, note acceptable fallbacks.
4. Include external links to the product/item being compared to organically (for e.g. wrapping the link around the anchor text of the item/service being linked to).
5. Must clearly take a stance on which product is better for what purposes and why - opinion must be given by the end`,
    "how-to": `## How to (guide)
1. Use a calm, authoritative, instructional tone with clear, flowing step-by-step guidance.
2. Avoid rigid checklists; explain each step in short paragraphs with the why and the expected outcome.
3. Include screenshots, diagrams, or pictures for key steps that benefit from visuals.
4. Opinions can be given but should be clearly labelled as opinions`,
    listicle: `## Listicle (generically)
1. Include screenshots, diagrams, for every listed item. The images should come right after the heading introducing the item on the list.
2. Maximum of 20 total items.
3. Word light - each listicle item should be a maximum of 50 words.
4. Always include an external link to each item on the list organically (for e.g. wrapping the link around the anchor text of the item/service being linked to).
5. Word light - Explain why each item is listed succinctly - don't over-explain.`,
    "long-form-opinion": `## Long form - opinions
1. Signpost well
2. Write in a stream-of-consciousness - raw, and relatable 
3. Substantiated by clearly cited evidence and sources
4. Must take a side and an opinion - strong POV
5. Clear opinion should be reached at the end`,
    faq: `## Frequently Asked Questions
1. Headings should be the questions.
2. Short, direct answers.
3. Heavy internal linking organically (for e.g. wrapping the link around the anchor text of the other question being referenced).
4. No CTAs or product plugs`,
    news: `## News 
1. Structure should cover: i) what happened, ii) why it matters, iii) key details, iv) what's next (if applicable).
2. Internal and external links should be used heavily organically (for e.g. wrapping the link around the anchor text of the other sources being cited).
3. Tone should be neutral, informational, and succinct. Descriptive
4. Never include a personal opinion or tone`,
    whitepaper: `## Whitepapers
1. Diagrams, charts, and frameworks should be produced into images
2. Long word count
3. Include sections for an executive summary, data analysis, explain methodology, describe the issue
4. Tone is authoritative and research based
5. Heavy emphasis on accurate internal and external linking`,
    infographic: `## Infographic
1. Visual output should incorporate all important elements - there should be a clear heading, with visuals which accompany and describe each heading, and corresponding words in bullet point
2. Visual should have a flow and not be overly complicated.
3. Text should be readable
4. No need to use SERP data`,
    "case-study": `## Case studies
1. Use internal and external links as sources (do not make anything up)
2. Clearly state how they were aided - how their position improved due to the usage of a certain product or service
3. Internal or external links to the case studies' webpage (if any) organically (for e.g. wrapping the link around the anchor text of the case study being linked to).
4. Narrative tone
5. Emphasize the experience of the person - using direct quotes from them, and describing how they were aided. 
6. Identify the person by name and position and state the company in the title
7. No need to use SERP data`,
    "press-release": `## Press releases (news about the company)
1. Short word count
2. Direct, matter-of-fact tone, formal and restrained
3. State details 
4. Quotes from key personnel
5. No need to use SERP data`,
    interview: `## Interviews
1. Picture of the person being interviewed
2. External and internal links to the interviewee and related topics organically (for e.g. wrapping the link around the anchor text of the interviewee's name).
3. Many quotes from the interview
4. Conversational - should be clearly signposted as a back and forth between interviewer and interviewee
5. Introduction setting the scene of the interview - who is being interviewed and what their position and experience is, and when it took place, where. Who was interviewing. 
6. Closing insights stating what was learnt from the interview
7. No need to use SERP data`,
    "product-update": `## Product update
1. Word light 
2. Introduce the product and what it is 
3. Clearly list the changes in the product in a listicle, and list all the features
4. Be clear, and benefit focused
5. Explain why this update is exciting and what it intends to fulfill
6. No need to use SERP data`,
    "contest-giveaway": `## Contest/giveaway
1. Visual of a giveaway - describe what needs to be done to qualify for the giveaway, how many people will win it, when it will close, how much it's worth and the product needs to be in the picture. Picture should be vibrant and exciting
2. Describe what needs to be done to qualify for the giveaway, how many people will win it, when it will close, how much it's worth
3. Very word light 
4. Energetic tone - excited
5. No need to use SERP data`,
    "research-summary": `## Research summary
1. Diagrams, charts, and frameworks should be produced into images
2. Describe what was studied, key findings, and implications, if any.
3. Any original opinions have to be clearly labelled as such
4. External link to the original research organically (for e.g. wrapping the link around the anchor text of the mention of the source being cited).
5. Cite clearly and in great detail the original research with 100% accuracy 
6. Analytical and neutral tone`,
    "event-recap": `## Event recap
1. Use pictures of the event from the outline provided by the user.
2. Descriptive tone, excited
3. Internal link to related articles and products organically (for e.g. wrapping the link around the anchor text of the related article or product being mentioned).
4. External link to partners organically (for e.g. wrapping the link around the anchor text of the partner's name being mentioned).
5. No need to use SERP data`,
    "best-practices": `## Best practices
1. Checklist at the end of the article summarizing all the best practices
2. Prescriptive, confident tone
3. State dos and don'ts 
4. Give examples`,
  };

export const DEFAULT_BRAND_VOICE = `Use a mix of short sentences, longer ones, and direct sentences. Do not just use one style of sentences throughout the article
- maximize for human readability - sentences should read easily (ie. not have too complicated sentence structure or stoppages), and paragraphs and sections should flow well into each other, having segues, and clear ways in which they relate to each other if its not readily apparent from the subject matter itself
- do not have paragraphs that are too long, and make sure there are suitable breaks after a few paragraphs
- do not use em dashes
- do not use bold words, outside of headings and the start of bullet points
- do not use chiasmus in the form of "it's not X, it's Y"
- do not use emojis
- use one consistent voice throughout; do not blend incompatible styles
- expand abbreviations on first use`;

export const DEFAULT_USER_INSTRUCTIONS = `Plugging the company's product
a) NEVER FORCE MENTIONS
- Only mention the company's product where it genuinely solves a problem
- If it doesn't fit naturally, skip it
b) ONLY WHERE CONTEXTUALLY HELPFUL
- Must provide real value to the reader
- Should address a specific pain point or opportunity
c) Target: 2-3 Mentions Per Article
- Not every section needs a mention
- Quality over quantity
- Must feel organic, never promotional
d) It is permissible to name and evaluate competitors well, but always place an emphasis on the company's offering, and conclude that it is the best option for the reader. Do this organically.`;
