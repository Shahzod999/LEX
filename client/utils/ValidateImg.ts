export const getValidatedUrl = (userId: string, url: string) =>
  url?.includes("http")
    ? url
    : `${process.env.EXPO_PUBLIC_URL}/upload/${userId}${url}`;
