const globalLocale = "en-US";

export const formatDate = (date: string, locale: string = globalLocale) => {
  const dateObj = new Date(date);
  return dateObj.toLocaleString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDayMonthYear = (
  date: string,
  locale: string = globalLocale
) => {
  const dateObj = new Date(date);
  return dateObj.toLocaleString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
