export const getImageFileNameFromUri = (uri: string) => {
  try {
    const url = new URL(uri);
    const pathname = url.pathname;
    const segments = pathname.split("/");
    const fileNamePrefixedWithUuid = segments.slice(3).join("/");
    const fileName = fileNamePrefixedWithUuid.split("__")[1];

    return fileName;
  } catch {
    const segments = uri.split("/");
    const fileNamePrefixedWithUuid = segments.slice(3).join("/");
    const fileName = fileNamePrefixedWithUuid.split("__")[1];

    return fileName;
  }
};
