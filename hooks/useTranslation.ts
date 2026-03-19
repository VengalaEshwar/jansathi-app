import { useAppSelector } from "@/store/hooks";
import { t } from "@/translations";

export const useTranslation = () => {
  const language = useAppSelector((s) => s.app.language);
  return {
    t: t[language],
    language,
    isHindi: language === "hi",
    isTelugu: language === "te",
    isEnglish: language === "en",
  };
};