import type { articleTypeSchema } from "@rectangular-labs/core/schemas/content-parsers";

export type ArticleType = typeof articleTypeSchema.infer;

export const ARTICLE_TYPE_TO_ADDITIONAL_PLAN_RULES: Partial<
  Record<ArticleType, string>
> = {
  "best-of-list": `## Best of lists
1. Always mention ideal screenshots of ALL the products/websites/service pages/country/food/item that is being listed. Include what you'd like to have and acceptable fallbacks if not available.
2. Word light
3. Maximum of 20 total items`,
  comparison: `## Comparisons (comparing two or more products or services or items)
1. Always include comparison tables at the top of the article that summarizes the key points
2. Always mention ideal screenshots of ALL the items being compared. Include what you'd like to have and acceptable fallbacks if not available.`,
  "how-to": `## How to (guide)
1. Include screenshots, diagrams, pictures for ALL the steps
2. Checklist should be included after the introduction to signpost the article`,
  listicle: `## Listicle (generically)
1. Include screenshots, diagrams, for every listed item
2. Maximum of 20 total items
3. Word light - each listicle item should be a maximum of 50 words`,
  "long-form-opinion": `## Long form - opinions
1. Clear opinion that should be reached at the end
2. Must take a side and an opinion - strong POV`,
  faq: `## FAQs
1. Headings should be the questions
2. Short word counts`,
  news: `## News
1. Structure should cover: i) what happened, ii) why it matters, iii) key details, iv) what's next (if applicable)`,
  whitepaper: `## Whitepapers
1. Diagrams, charts, and frameworks should be produced into images
2. Long word count
3. Include sections for an executive summary, data analysis, explain methodology, describe the issue`,
  infographic: `## Infographic
1. Visual output should incorporate all important elements - there should be a clear heading, with visuals which accompany and describe each heading, and corresponding words in bullet point
2. Visual should have a flow and not be overly complicated.
3. Text should be readable
4. No need to use SERP data`,
  "case-study": `## Case Study
1. Use internal and external links as sources (i.e. do not make anything up)
2. Focus on the experience of the user and emphasize how they were aided
3. Identify the person by name and position and state the company in the title
4. No need to use SERP data`,
  "press-release": `## Press releases (news about the company)
1. Short word count
2. State details of the press release
3. Quotes from key personnel
4. No need to use SERP data`,
  interview: `## Interviews
1. Picture of the person being interviewed
2. Structured around the interview and the quotes received in the interview
3. Introduction setting the scene of the interview - who is being interviewed and what their position and experience is, and when it took place, where. Who was interviewing.
4. No need to use SERP data`,
  "product-update": `## Product update
1. Word light
2. Introduce the product and what it is
3. Explain why this update is exciting and what it intends to fulfill
4. No need to use SERP data`,
  "contest-giveaway": `## Contest/giveaway
1. Visual of a giveaway - describe what needs to be done to qualify for the giveaway, how many people will win it, when it will close, how much it's worth and the product needs to be in the picture. Picture should be vibrant and exciting
2. Very word light
3. No need to use SERP data`,
  "research-summary": `## Research summary
1. Charts, frameworks, diagrams describing the data is mandatory
2. Describe what was studied, key findings, and implications, if any.
3. Any original opinions have to be clearly labelled as such`,
  "event-recap": `## Event recap
1. Picture of the event (prompt user for it)
2. Describe event highlights and takeaways
3. No need to use SERP data`,
  "best-practices": `## Best practices
1. Checklist at the end of the article summarizing all the best practices
2. State dos and don'ts`,
};

export const ARTICLE_TYPE_TO_WRITER_RULE: Partial<Record<ArticleType, string>> =
  {
    "best-of-list": `## Best of lists
1. Always include screenshots of ALL the products/websites/service pages/country/food/item that you are listing.
2. Word light - Explain why each item is listed succinctly.
3. Always include links to each of the listed items/services 
4. Give an opinion as to why the top listed product is considered the best and why`,
    comparison: `## Comparisons (comparing two or more products or services or items)
1. Always include comparison tables at the top of the article that summarizes the key points
2. Include screenshots or pictures of ALL the items being compared
3. Include external links to the product/item being compared to
4. Must clearly take a stance on which product is better for what purposes and why - opinion must be given by the end`,
    "how-to": `## How to (guide)
1. Include screenshots, diagrams, pictures for ALL the steps
2. Tone should be instructional and confident
3. Opinions can be given but should be clearly labelled as opinions`,
    listicle: `## Listicle (generically)
1. Include screenshots, diagrams, for every listed item
2. Always include an external link to each item on the list
3. Word light - Explain why each item is listed succinctly - don't over-explain.`,
    "long-form-opinion": `## Long form - opinions
1. Signpost well
2. Write in a stream-of-consciousness - raw, and relatable 
3. Substantiated by clearly cited evidence and sources
4. Must take a side and an opinion - strong POV`,
    faq: `## FAQs (?)
1. Heavy internal linking 
2. Clear, direct, succinct answers to the questions
3. No CTAs or product plugs`,
    news: `## News 
1. Internal and external links should be used heavily
2. Tone should be neutral, informational, and succinct. Descriptive
3. Never include a personal opinion or tone`,
    whitepaper: `## Whitepapers
1. Diagrams, charts, and frameworks should be produced into images
2. Tone is authoritative and research based
4. Heavy emphasis on accurate internal and external linking`,
    infographic: `## Infographic
1. There should be a clear heading, with visuals which accompany and describe each heading, and corresponding words in bullet point`,
    "case-study": `## Case studies
1. Clearly state how they were aided - how their position improved due to the usage of a certain product or service
2. Internal or external links to the case studies' webpage (if any)
3. Narrative tone
4. Emphasize the experience of the person - using direct quotes from them, and describing how they were aided. 
5. Identify the person by name and position and state the company`,
    "press-release": `## Press releases (news about the company)
1. Short word count
2. Direct, matter-of-fact tone, formal and restrained
3. State details 
4. Quotes from key personnel`,
    interview: `## Interviews
1. Picture of the person being interviewed
2. External and internal links to the interviewee and related topics
3. Many quotes from the interview
4. Conversational - should be clearly signposted as a back and forth between interviewer and interviewee
5. Introduction setting the scene of the interview - who is being interviewed and what their position and experience is, and when it took place, where. Who was interviewing. 
6. Closing insights stating what was learnt from the interview`,
    "product-update": `## product update
1. Word light 
2. Introduce the product and what it is 
3. Clearly list the changes in the product in a listicle, and list all the features
4. Be clear, and benefit focused
5. Explain why this update is exciting and what it intends to fulfill`,
    "contest-giveaway": `## Contest/giveaway
1. Visual of a giveaway - describe what needs to be done to qualify for the giveaway, how many people will win it, when it will close, how much it's worth and the product needs to be in the picture. Picture should be vibrant and exciting
2. Describe what needs to be done to qualify for the giveaway, how many people will win it, when it will close, how much it's worth
3. Very word light 
4. Energetic tone - excited`,
    "research-summary": `## Research summary
1. Diagrams, charts, and frameworks should be produced into images
2. Any original opinions have to be clearly labelled as such
2. External link to the original research
3. Cite clearly and in great detail the original research with 100% accuracy 
4. Analytical and neutral tone`,
    "event-recap": `## Event recap
1. Use pictures of the event from the outline provided by the user.
2. Descriptive tone, excited
3. Internal link to related articles and products
4. External link to partners`,
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
- do not use emojis`;

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
