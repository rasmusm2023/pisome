import { getRequestConfig } from "next-intl/server";
import en from "../../messages/en.json";
import es from "../../messages/es.json";
import { routing } from "./routing";

const catalogs = { en, es } as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "es" | "en")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: catalogs[locale as keyof typeof catalogs],
  };
});
