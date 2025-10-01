import { googleKeywordSuggestionsLive, googleOrganicLiveRegular, googleRankedKeywordsLive } from "./sdk.gen";

export async function fetchRankedKeywords(args: {
    domain: string;
    positionFrom: number;
    positionTo: number;
    locationName: string;
    languageCode: string;
    limit: number;
}) {
    const json = await googleRankedKeywordsLive({
        body:[{
            target: args.domain,
            location_name: args.locationName,
            language_code: args.languageCode,
            filters: [["rank_group", ">=", args.positionFrom.toString()], "and", ["rank_group", "<=", args.positionTo.toString()]],
            
        }]
    });
       

    return json;
}

export async function fetchKeywordSuggestions(
    args: 
    {
        seedKeyword: string, 
        locationName: string
        languageCode: string
        limit: number
    }
) {
    const json = await googleKeywordSuggestionsLive({
        body: [{
            keyword: args.seedKeyword,
            location_name: args.locationName,
            language_code: args.languageCode,
            limit: args.limit,
            
        }]
    })

    return json
}

export async function fetchSerpResults(args: {
    keyword: string;
    locationName: string;
    languageCode: string;
    depth: number;
}) {
    const json = await googleOrganicLiveRegular({
        body: [{
            keyword: args.keyword,  
            location_name: args.locationName,
            language_code: args.languageCode,
            depth: args.depth,
        }]
    })

    return json
}