import type { articleTypeSchema } from "@rectangular-labs/core/schemas/content-parsers";

type ArticleType = typeof articleTypeSchema.infer;

export const ARTICLE_TYPE_TO_ADDITIONAL_RULES: Partial<
  Record<ArticleType, string>
> = {
  "best-of-list": `## Best of lists
1. Always include screenshots if ALL the products/websites/service pages/country/food/item that you are listing.
2. Word light
3. Maximum of 20 total items`,
  comparison: `## Comparisons (comparing two or more products or services or items)
1. Always include comparison tables at the top of the article that summarizes the key points
2. Include screenshots or pictures of ALL the items being compared`,
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
3. Include an executive summary, data analysis, explain methodology, describe the issue`,
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
