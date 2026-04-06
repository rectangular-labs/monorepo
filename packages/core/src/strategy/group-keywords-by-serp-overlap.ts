function normalizeSerpUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${hostname}${pathname}`;
  } catch {
    return url.trim().toLowerCase();
  }
}

type KeywordSerpOverlapItem = {
  keyword: string;
  urls: string[];
};

type KeywordSerpOverlapPair = {
  leftKeyword: string;
  rightKeyword: string;
  sharedUrls: string[];
  overlapScore: number;
};

function getSerpOverlapScore(leftUrls: string[], rightUrls: string[]) {
  const normalizedLeft = Array.from(new Set(leftUrls.map(normalizeSerpUrl)));
  const normalizedRight = Array.from(new Set(rightUrls.map(normalizeSerpUrl)));

  if (normalizedLeft.length === 0 || normalizedRight.length === 0) {
    return {
      sharedUrls: [] as string[],
      overlapScore: 0,
    };
  }

  const rightSet = new Set(normalizedRight);
  const sharedUrls = normalizedLeft.filter((url) => rightSet.has(url));
  const overlapScore =
    sharedUrls.length / Math.min(normalizedLeft.length, normalizedRight.length);

  return {
    sharedUrls,
    overlapScore,
  };
}

function buildKeywordSerpOverlapPairs(
  items: KeywordSerpOverlapItem[],
): KeywordSerpOverlapPair[] {
  const pairs: KeywordSerpOverlapPair[] = [];

  for (let leftIndex = 0; leftIndex < items.length; leftIndex += 1) {
    const left = items[leftIndex];
    if (!left) continue;

    for (
      let rightIndex = leftIndex + 1;
      rightIndex < items.length;
      rightIndex += 1
    ) {
      const right = items[rightIndex];
      if (!right) continue;

      const { sharedUrls, overlapScore } = getSerpOverlapScore(
        left.urls,
        right.urls,
      );

      pairs.push({
        leftKeyword: left.keyword,
        rightKeyword: right.keyword,
        sharedUrls,
        overlapScore,
      });
    }
  }

  return pairs;
}

export function groupKeywordsBySerpOverlap(args: {
  items: KeywordSerpOverlapItem[];
  minOverlapScore?: number;
}) {
  const minOverlapScore = args.minOverlapScore ?? 0.5;
  const pairs = buildKeywordSerpOverlapPairs(args.items);

  const adjacency = new Map<string, Set<string>>();

  for (const item of args.items) {
    adjacency.set(item.keyword, new Set());
  }

  for (const pair of pairs) {
    if (pair.overlapScore < minOverlapScore) continue;

    adjacency.get(pair.leftKeyword)?.add(pair.rightKeyword);
    adjacency.get(pair.rightKeyword)?.add(pair.leftKeyword);
  }

  const visited = new Set<string>();
  const groups: string[][] = [];

  for (const item of args.items) {
    if (visited.has(item.keyword)) continue;

    const queue = [item.keyword];
    const group: string[] = [];
    visited.add(item.keyword);

    while (queue.length > 0) {
      const currentKeyword = queue.shift();
      if (!currentKeyword) continue;

      group.push(currentKeyword);

      for (const neighbor of adjacency.get(currentKeyword) ?? []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }

    groups.push(group);
  }

  return {
    groups,
    pairs,
  };
}
