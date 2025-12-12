import { safeSync } from "@rectangular-labs/result";

export const getFaviconUrl = (url: string) => {
  const hostname = safeSync(() => new URL(url).hostname);
  if (!hostname.ok) {
    return null;
  }
  return `https://www.google.com/s2/favicons?domain=${hostname.value}&sz=48`;
};

export const getUrlDomain = (url: string) => {
  const hostname = safeSync(() => new URL(url).hostname);
  if (!hostname.ok) {
    return null;
  }
  return hostname.value.split(".").slice(-2).join(".");
};

export const convertBlobUrlToDataUrl = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
