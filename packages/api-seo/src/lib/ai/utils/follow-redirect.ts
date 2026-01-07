const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

type RedirectStep = {
  url: string;
  status: number;
};

type FollowRedirectResult = {
  chain: RedirectStep[];
  finalUrl: string;
  finalStatus: number;
};

type FollowRedirectOptions = {
  maxHops?: number;
  signal?: AbortSignal;
};

export const followRedirects = async (
  startUrl: string,
  options: FollowRedirectOptions = {},
): Promise<FollowRedirectResult> => {
  const { maxHops = 10, signal } = options;
  const chain: RedirectStep[] = [];
  let current = startUrl;

  for (let hop = 0; hop < maxHops; hop += 1) {
    const response = await fetch(current, { redirect: "manual", signal });
    chain.push({ url: current, status: response.status });

    if (!REDIRECT_STATUSES.has(response.status)) {
      return { chain, finalUrl: current, finalStatus: response.status };
    }

    const location = response.headers.get("location");
    if (!location) {
      return { chain, finalUrl: current, finalStatus: response.status };
    }

    current = new URL(location, current).toString();
  }

  return { chain, finalUrl: current, finalStatus: 0 };
};

export const resolveFinalUrl = async (
  startUrl: string,
  options?: FollowRedirectOptions,
): Promise<string> => (await followRedirects(startUrl, options)).finalUrl;
