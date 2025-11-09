import { type searchItemSchema, serpTypes } from "@rectangular-labs/db/parsers";
import { type } from "arktype";
import type { SerpGoogleOrganicLiveAdvancedResultInfo } from "../types.gen";

interface IRating {
  rating_type: "Max5";
  value: number;
  votes_count: number;
  rating_max: number;
}

interface IPrice {
  current: number;
  regular: number;
  max_value: number;
  displayed_price: string;
  currency: string;
}
interface IImage {
  type: "images_element";
  alt: string;
  url: string;
  image_url: string;
}

// Narrow item shapes we read from DataForSEO responses (only fields we use)
type IOrganicItem = {
  type: "organic";
  rank_absolute: number | null;
  title: string | null;
  description: string | null;
  url: string | null;
  pre_snippet: string | null;
  extended_snippet: string | null;
  rating: IRating | null;
  price: IPrice | null;
  images: IImage[] | null;
};
interface IPaidItem {
  type: "paid";
  rank_absolute: number | null;
  title: string | null;
  description: string | null;
  url: string | null;
}

interface IFeaturedSnippetTable {
  headers: string[] | null;
  rows: string[][] | null;
}
interface IFeaturedSnippetItem {
  type: "featured_snippet";
  rank_absolute: number | null;
  featured_title: string | null;
  description: string | null;
  table: IFeaturedSnippetTable | null;
  title: string | null;
  url: string | null;
  images: IImage[] | null;
  timestamp: string | null;
}

interface ILocalPackBusiness {
  title: string | null;
  description: string | null;
  url: string | null;
  rating: IRating | null;
  is_paid: boolean | null;
}
interface ILocalPackItem {
  type: "local_pack";
  rank_absolute: number | null;
  title: string | null;
  items: ILocalPackBusiness[] | null;
}

interface ITopStoriesStory {
  title: string | null;
  source: string | null;
  timestamp: string | null;
  url: string | null;
  image_url: string | null;
}
interface ITopStoriesItem {
  type: "top_stories";
  rank_absolute: number | null;
  title: string | null;
  items: ITopStoriesStory[] | null;
}

interface IPeopleAlsoAskQA {
  question: string | null;
  answer: string | null;
  url: string | null;
  image: IImage | null;
  timestamp: string | null;
  table: IFeaturedSnippetTable | null;
}
interface IPeopleAlsoAskItem {
  type: "people_also_ask";
  rank_absolute: number | null;
  items: IPeopleAlsoAskQA[] | null;
}

interface IImagesItem {
  type: "images";
  rank_absolute: number | null;
  title: string | null;
  items: IImage[] | null;
}

interface IVideoDetail {
  title: string | null;
  source: string | null;
  timestamp: string | null;
  url: string | null;
}
interface IVideoItem {
  type: "video";
  rank_absolute: number | null;
  items: IVideoDetail[] | null;
}

interface IShoppingDetail {
  title: string | null;
  description: string | null;
  source: string | null;
  rating: IRating | null;
  price: IPrice | null;
  url: string | null;
}
interface IShoppingItem {
  type: "shopping";
  rank_absolute: number | null;
  title: string | null;
  items: IShoppingDetail[] | null;
}

interface IPopularProductDetail {
  title: string | null;
  description: string | null;
  seller: string | null;
  rating: IRating | null;
  price: IPrice | null;
  image_url: string | null;
}
interface IPopularProductsItem {
  type: "popular_products";
  rank_absolute: number | null;
  title: string | null;
  items: IPopularProductDetail[] | null;
}

// Based on DataForSEO recipes shape:
// See: https://docs.dataforseo.com/v3/serp/google/organic/live/advanced/#recipes
interface IRecipeDetail {
  title: string | null;
  description: string | null;
  source: string | null;
  url: string | null;
  time: string | null;
  rating: IRating | null;
}
interface IRecipesItem {
  type: "recipes";
  rank_absolute: number | null;
  items: IRecipeDetail[] | null;
}

interface IPerspectiveDetail {
  title: string | null;
  description: string | null;
  url: string | null;
  source: string | null;
  timestamp: string | null;
}
interface IPerspectivesItem {
  type: "perspectives";
  rank_absolute: number | null;
  title: string | null;
  items: IPerspectiveDetail[] | null;
}

interface IDiscussionDetail {
  title: string | null;
  description: string | null;
  url: string | null;
  source: string | null;
  posts_count: number | null;
  timestamp: string | null;
}
interface IDiscussionsItem {
  type: "discussions_and_forums";
  rank_absolute: number | null;
  title: string | null;
  items: IDiscussionDetail[] | null;
}

interface IRelatedSearchesItem {
  type: "related_searches";
  rank_absolute: number | null;
  items: string[] | null;
}

interface ICompareSiteDetail {
  title: string | null;
  url: string | null;
  source: string | null;
  image_url: string | null;
}
interface ICompareSitesItem {
  type: "compare_sites";
  rank_absolute: number | null;
  title: string | null;
  items: ICompareSiteDetail[] | null;
}

interface IAiOverviewReference {
  url: string | null;
  title: string | null;
  text: string | null;
  source: string | null;
}
interface IAiOverviewItemPiece {
  title: string | null;
  text: string | null;
}
interface IAiOverviewItem {
  type: "ai_overview";
  rank_absolute: number | null;
  references: IAiOverviewReference[] | null;
  items: IAiOverviewItemPiece[] | null;
}

interface ICommercialUnitDetail {
  title: string | null;
  source: string | null;
  url: string | null;
  rating: IRating | null;
  price: IPrice | null;
}
interface ICommercialUnitsItem {
  type: "commercial_units";
  rank_absolute: number | null;
  title: string | null;
  items: ICommercialUnitDetail[] | null;
}

interface IFoundOnWebDetail {
  title: string | null;
  subtitle: string | null;
  image: IImage | null;
}
interface IFoundOnWebItem {
  type: "found_on_web";
  rank_absolute: number | null;
  title: string | null;
  items: IFoundOnWebDetail[] | null;
}

interface IProductConsiderationDetail {
  title: string | null;
  description: string | null;
  consideration_category: string | null;
  article_title: string | null;
  article_url: string | null;
  article_timestamp: string | null;
  related_searches: string[] | null;
}
interface IProductConsiderationItem {
  type: "product_considerations" | "product_consideration";
  rank_absolute: number | null;
  title: string | null;
  items: IProductConsiderationDetail[] | null;
}

interface IHotelDetail {
  title: string | null;
  description: string | null;
  url: string | null;
  is_paid: boolean | null;
  rating: IRating | null;
  price: IPrice | null;
}
interface IHotelPackItem {
  type: "hotels_pack" | "hotel_pack";
  rank_absolute: number | null;
  title: string | null;
  items: IHotelDetail[] | null;
}

interface ITweetDetail {
  tweet?: string | null; // sometimes named 'tweet' or 'text'
  text?: string | null;
  timestamp: string | null;
  url: string | null;
}
interface ITwitterItem {
  type: "twitter";
  rank_absolute: number | null;
  items: ITweetDetail[] | null;
}

interface IMentioningSite {
  title: string | null;
  description: string | null;
  url: string | null;
}
interface IMentionDetail {
  title: string | null;
  rating: IRating | null;
  price: IPrice | null;
  image_url: string | null;
  mentioning_sites: IMentioningSite[] | null;
}
interface IMentionCarouselItem {
  type: "mention_carousel";
  rank_absolute: number | null;
  title: string | null;
  items: IMentionDetail[] | null;
}

interface IPeopleAlsoSearchItem {
  type: "people_also_search";
  rank_absolute: number | null;
  items: string[] | null;
}

interface IQuestionsAndAnswersDetail {
  question: string | null;
  answer: string | null;
  url: string | null;
  source: string | null;
  votes: number | null;
}
interface IQuestionsAndAnswersItem {
  type: "questions_and_answers";
  rank_absolute: number | null;
  items: IQuestionsAndAnswersDetail[] | null;
}

export function parseSerpAdvancedToItems(
  serpResult: SerpGoogleOrganicLiveAdvancedResultInfo,
): (typeof searchItemSchema.infer)[] {
  const result: (typeof searchItemSchema.infer)[] = [];
  for (const item of serpResult.items ?? []) {
    const serpType = serpTypes(item?.type);
    if (serpType instanceof type.errors) {
      continue;
    }
    switch (serpType) {
      case "organic": {
        const organicItem = item as IOrganicItem;
        result.push({
          type: "organic",
          absolutePosition: organicItem.rank_absolute,
          title: organicItem.title,
          description: organicItem.description,
          url: organicItem.url,
          preSnippet: organicItem.pre_snippet,
          extendedSnippet: organicItem.extended_snippet,
          rating: organicItem.rating
            ? {
                value: organicItem.rating.value,
                max: organicItem.rating.rating_max,
                votes: organicItem.rating.votes_count,
              }
            : null,
          price: organicItem.price
            ? {
                current: organicItem.price.current,
                regular: organicItem.price.regular,
                max: organicItem.price.max_value,
                displayPrice: organicItem.price.displayed_price,
                currency: organicItem.price.currency,
              }
            : null,
          images: organicItem.images
            ? organicItem.images.map((image) => ({
                alt: image.alt,
                url: image.url,
                imageUrl: image.image_url,
              }))
            : [],
        });
        break;
      }
      case "paid": {
        const paidItem = item as IPaidItem;
        result.push({
          type: "paid",
          absolutePosition: paidItem.rank_absolute,
          title: paidItem.title,
          description: paidItem.description,
          url: paidItem.url,
        });
        break;
      }
      case "featured_snippet": {
        const fsItem = item as IFeaturedSnippetItem;
        result.push({
          type: "featured_snippet",
          absolutePosition: fsItem.rank_absolute ?? null,
          featuredTitle: fsItem.featured_title ?? null,
          description: fsItem.description ?? null,
          table: fsItem.table
            ? {
                headers: fsItem.table.headers ?? [],
                rows: fsItem.table.rows ?? [],
              }
            : null,
          title: fsItem.title ?? null,
          url: fsItem.url ?? null,
          images:
            fsItem.images?.map((image) => ({
              alt: image.alt,
              url: image.url,
              imageUrl: image.image_url,
            })) ?? [],
          timestamp: fsItem.timestamp ? new Date(fsItem.timestamp) : null,
        });
        break;
      }
      case "local_pack": {
        const lpItem = item as ILocalPackItem;
        // Expand each business within the local pack into its own entry
        for (const biz of lpItem.items ?? []) {
          result.push({
            type: "local_pack",
            absolutePosition: lpItem.rank_absolute ?? null,
            title: biz.title ?? null,
            description: biz.description ?? null,
            url: biz.url ?? null,
            rating: biz.rating
              ? {
                  value: biz.rating.value,
                  max: biz.rating.rating_max,
                  votes: biz.rating.votes_count,
                }
              : null,
            isPaid: biz.is_paid ?? null,
          });
        }
        break;
      }
      case "top_stories": {
        const tsItem = item as ITopStoriesItem;
        result.push({
          type: "top_stories",
          absolutePosition: tsItem.rank_absolute ?? null,
          title: tsItem.title ?? null,
          stories:
            tsItem.items?.map((s) => ({
              title: s.title ?? null,
              source: s.source ?? null,
              timestamp: s.timestamp ? new Date(s.timestamp) : null,
              url: s.url ?? null,
              imageUrl: s.image_url ?? null,
            })) ?? [],
        });
        break;
      }
      case "people_also_ask": {
        const paaItem = item as IPeopleAlsoAskItem;
        result.push({
          type: "people_also_ask",
          absolutePosition: paaItem.rank_absolute ?? null,
          items:
            paaItem.items?.map((qa) => ({
              question: qa.question ?? null,
              answer: qa.answer ?? null,
              url: qa.url ?? null,
              image: qa.image
                ? {
                    alt: qa.image.alt,
                    url: qa.image.url,
                    imageUrl: qa.image.image_url,
                  }
                : null,
              timestamp: qa.timestamp ? new Date(qa.timestamp) : null,
              table: qa.table
                ? {
                    headers: qa.table.headers ?? [],
                    rows: qa.table.rows ?? [],
                  }
                : null,
            })) ?? [],
        });
        break;
      }
      case "images": {
        const imagesItem = item as IImagesItem;
        result.push({
          type: "images",
          absolutePosition: imagesItem.rank_absolute ?? null,
          title: imagesItem.title ?? null,
          images:
            imagesItem.items?.map((img) => ({
              alt: img.alt,
              url: img.url,
              imageUrl: img.image_url,
            })) ?? [],
        });
        break;
      }
      case "video": {
        const videoItem = item as IVideoItem;
        result.push({
          type: "video",
          absolutePosition: videoItem.rank_absolute ?? null,
          videos:
            videoItem.items?.map((v) => ({
              title: v.title ?? null,
              source: v.source ?? null,
              timestamp: v.timestamp ? new Date(v.timestamp) : null,
              url: v.url ?? null,
            })) ?? [],
        });
        break;
      }
      case "shopping": {
        const shoppingItem = item as IShoppingItem;
        result.push({
          type: "shopping",
          absolutePosition: shoppingItem.rank_absolute ?? null,
          title: shoppingItem.title ?? null,
          items:
            shoppingItem.items?.map((it) => ({
              title: it.title ?? null,
              description: it.description ?? null,
              source: it.source ?? null,
              rating: it.rating
                ? {
                    value: it.rating.value,
                    max: it.rating.rating_max,
                    votes: it.rating.votes_count,
                  }
                : null,
              price: it.price
                ? {
                    current: it.price.current,
                    regular: it.price.regular,
                    max: it.price.max_value,
                    displayPrice: it.price.displayed_price,
                    currency: it.price.currency,
                  }
                : null,
              url: it.url ?? null,
              isPaid: "true",
            })) ?? [],
        });
        break;
      }
      case "popular_products": {
        const ppItem = item as IPopularProductsItem;
        result.push({
          type: "popular_products",
          absolutePosition: ppItem.rank_absolute ?? null,
          title: ppItem.title ?? null,
          products:
            ppItem.items?.map((p) => ({
              title: p.title ?? null,
              description: p.description ?? null,
              seller: p.seller ?? null,
              rating: p.rating
                ? {
                    value: p.rating.value,
                    max: p.rating.rating_max,
                    votes: p.rating.votes_count,
                  }
                : null,
              price: p.price
                ? {
                    current: p.price.current,
                    regular: p.price.regular,
                    max: p.price.max_value,
                    displayPrice: p.price.displayed_price,
                    currency: p.price.currency,
                  }
                : null,
              imageUrl: p.image_url ?? null,
            })) ?? [],
        });
        break;
      }
      case "recipes": {
        const recipesItem = item as IRecipesItem;
        result.push({
          type: "recipes",
          absolutePosition: recipesItem.rank_absolute ?? null,
          recipes:
            recipesItem.items?.map((r) => ({
              title: r.title ?? null,
              description: r.description ?? null,
              source: r.source ?? null,
              url: r.url ?? null,
              time: r.time ?? null,
              rating: r.rating
                ? {
                    value: r.rating.value,
                    max: r.rating.rating_max,
                    votes: r.rating.votes_count,
                  }
                : null,
            })) ?? [],
        });
        break;
      }
      case "perspectives": {
        const perspectivesItem = item as IPerspectivesItem;
        result.push({
          type: "perspectives",
          absolutePosition: perspectivesItem.rank_absolute ?? null,
          title: perspectivesItem.title ?? null,
          perspectives:
            perspectivesItem.items?.map((p) => ({
              title: p.title ?? null,
              description: p.description ?? null,
              url: p.url ?? null,
              source: p.source ?? null,
              timestamp: p.timestamp ? new Date(p.timestamp) : null,
            })) ?? [],
        });
        break;
      }
      case "discussions_and_forums": {
        const discItem = item as IDiscussionsItem;
        result.push({
          type: "discussions_and_forums",
          absolutePosition: discItem.rank_absolute ?? null,
          title: discItem.title ?? null,
          discussions:
            discItem.items?.map((d) => ({
              title: d.title ?? null,
              description: d.description ?? null,
              url: d.url ?? null,
              source: d.source ?? null,
              timestamp: d.timestamp ? new Date(d.timestamp) : null,
              postsCount: d.posts_count ?? null,
            })) ?? [],
        });
        break;
      }
      case "related_searches": {
        const relatedItem = item as IRelatedSearchesItem;
        result.push({
          type: "related_searches",
          absolutePosition: relatedItem.rank_absolute ?? null,
          items: relatedItem.items ?? [],
        });
        break;
      }
      case "compare_sites": {
        const csItem = item as ICompareSitesItem;
        result.push({
          type: "compare_sites",
          absolutePosition: csItem.rank_absolute ?? null,
          title: csItem.title ?? null,
          sites:
            csItem.items?.map((s) => ({
              title: s.title ?? null,
              url: s.url ?? null,
              source: s.source ?? null,
              imageUrl: s.image_url ?? null,
            })) ?? [],
        });
        break;
      }
      case "ai_overview": {
        const aioItem = item as IAiOverviewItem;
        result.push({
          type: "ai_overview",
          absolutePosition: aioItem.rank_absolute ?? null,
          references: aioItem.references
            ? aioItem.references.map((ref) => ({
                url: ref.url ?? null,
                title: ref.title ?? null,
                text: ref.text ?? null,
                source: ref.source ?? null,
              }))
            : null,
          items: aioItem.items
            ? aioItem.items.map((it) => ({
                title: it.title ?? null,
                text: it.text ?? null,
              }))
            : null,
        });
        break;
      }
      case "commercial_units": {
        const cuItem = item as ICommercialUnitsItem;
        result.push({
          type: "commercial_units",
          absolutePosition: cuItem.rank_absolute ?? null,
          title: cuItem.title ?? null,
          commercialUnits:
            cuItem.items?.map((cu) => ({
              title: cu.title ?? null,
              source: cu.source ?? null,
              url: cu.url ?? null,
              rating: cu.rating
                ? {
                    value: cu.rating.value,
                    max: cu.rating.rating_max,
                    votes: cu.rating.votes_count,
                  }
                : null,
              price: cu.price
                ? {
                    current: cu.price.current,
                    regular: cu.price.regular,
                    max: cu.price.max_value,
                    displayPrice: cu.price.displayed_price,
                    currency: cu.price.currency,
                  }
                : null,
            })) ?? [],
        });
        break;
      }
      case "found_on_web": {
        const fowItem = item as IFoundOnWebItem;
        result.push({
          type: "found_on_web",
          absolutePosition: fowItem.rank_absolute ?? null,
          title: fowItem.title ?? null,
          items:
            fowItem.items?.map((i) => ({
              title: i.title ?? null,
              subtitle: i.subtitle ?? null,
              image: i.image
                ? {
                    alt: i.image.alt,
                    url: i.image.url,
                    imageUrl: i.image.image_url,
                  }
                : null,
            })) ?? [],
        });
        break;
      }
      case "product_consideration": {
        const pcItem = item as IProductConsiderationItem;
        result.push({
          type: "product_consideration",
          absolutePosition: pcItem.rank_absolute ?? null,
          title: pcItem.title ?? null,
          considerations:
            pcItem.items?.map((c) => ({
              title: c.title ?? null,
              description: c.description ?? null,
              considerationCategory: c.consideration_category ?? null,
              articleTitle: c.article_title ?? null,
              articleUrl: c.article_url ?? null,
              articleTimestamp: c.article_timestamp
                ? new Date(c.article_timestamp)
                : null,
              relatedSearches: c.related_searches ?? null,
            })) ?? [],
        });
        break;
      }
      case "hotel_pack": {
        const hpItem = item as IHotelPackItem;
        result.push({
          type: "hotel_pack",
          absolutePosition: hpItem.rank_absolute ?? null,
          title: hpItem.title ?? null,
          hotels:
            hpItem.items?.map((h) => ({
              title: h.title ?? null,
              description: h.description ?? null,
              url: h.url ?? null,
              isPaid: h.is_paid ?? null,
              rating: h.rating
                ? {
                    value: h.rating.value,
                    max: h.rating.rating_max,
                    votes: h.rating.votes_count,
                  }
                : null,
              price: h.price
                ? {
                    current: h.price.current,
                    regular: h.price.regular,
                    max: h.price.max_value,
                    displayPrice: h.price.displayed_price,
                    currency: h.price.currency,
                  }
                : null,
            })) ?? [],
        });
        break;
      }
      case "twitter": {
        const twItem = item as ITwitterItem;
        result.push({
          type: "twitter",
          absolutePosition: twItem.rank_absolute ?? null,
          tweets:
            twItem.items?.map((t) => ({
              tweet: t.tweet ?? t.text ?? null,
              timestamp: t.timestamp ? new Date(t.timestamp) : null,
              url: t.url ?? null,
            })) ?? [],
        });
        break;
      }
      case "mention_carousel": {
        const mcItem = item as IMentionCarouselItem;
        result.push({
          type: "mention_carousel",
          absolutePosition: mcItem.rank_absolute ?? null,
          title: mcItem.title ?? null,
          mentions:
            mcItem.items?.map((m) => ({
              title: m.title ?? null,
              rating: m.rating
                ? {
                    value: m.rating.value,
                    max: m.rating.rating_max,
                    votes: m.rating.votes_count,
                  }
                : null,
              price: m.price
                ? {
                    current: m.price.current,
                    regular: m.price.regular,
                    max: m.price.max_value,
                    displayPrice: m.price.displayed_price,
                    currency: m.price.currency,
                  }
                : null,
              imageUrl: m.image_url ?? null,
              mentioningSites:
                m.mentioning_sites?.map((s) => ({
                  title: s.title ?? null,
                  description: s.description ?? null,
                  url: s.url ?? null,
                })) ?? [],
            })) ?? [],
        });
        break;
      }
      case "people_also_search": {
        const pasItem = item as IPeopleAlsoSearchItem;
        result.push({
          type: "people_also_search",
          absolutePosition: pasItem.rank_absolute ?? null,
          items: pasItem.items ?? [],
        });
        break;
      }
      case "questions_and_answers": {
        const qaItem = item as IQuestionsAndAnswersItem;
        result.push({
          type: "questions_and_answers",
          absolutePosition: qaItem.rank_absolute ?? null,
          questions:
            qaItem.items?.map((q) => ({
              question: q.question ?? null,
              answer: q.answer ?? null,
              url: q.url ?? null,
              source: q.source ?? null,
              votes: q.votes ?? null,
            })) ?? [],
        });
        break;
      }
      default: {
        continue;
      }
    }
  }
  return result;
}
