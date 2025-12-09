export const getImageFileNameFromUri = (uri: string) => {
  const segments = uri.split("/");
  const fileNamePrefixedWithUuid = segments.slice(3).join("/");
  const fileName = fileNamePrefixedWithUuid.split("__")[1];

  return fileName;
};
