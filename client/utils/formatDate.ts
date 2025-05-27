export const formatDate = (date: string, locale: string = "en-US") => {
  const dateObj = new Date(date);
  return dateObj.toLocaleString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
