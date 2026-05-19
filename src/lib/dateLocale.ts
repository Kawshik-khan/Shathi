import type { SupportedLanguage } from "@/i18n/client";

export const BANGLADESH_TIME_ZONE = "Asia/Dhaka";

const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const BENGALI_MONTHS = [
  "বৈশাখ",
  "জ্যৈষ্ঠ",
  "আষাঢ়",
  "শ্রাবণ",
  "ভাদ্র",
  "আশ্বিন",
  "কার্তিক",
  "অগ্রহায়ণ",
  "পৌষ",
  "মাঘ",
  "ফাল্গুন",
  "চৈত্র",
];

export function toBengaliDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => BENGALI_DIGITS[Number(digit)]);
}

export function formatBangladeshDateTime(
  date: Date | string | number,
  language: SupportedLanguage = "en",
): string {
  const parsedDate = new Date(date);
  return new Intl.DateTimeFormat(language === "bn" ? "bn-BD" : "en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
    timeZone: BANGLADESH_TIME_ZONE,
  }).format(parsedDate);
}

export function formatBangladeshTime(
  date: Date | string | number,
  language: SupportedLanguage = "en",
): string {
  const parsedDate = new Date(date);
  return new Intl.DateTimeFormat(language === "bn" ? "bn-BD" : "en-BD", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: BANGLADESH_TIME_ZONE,
  }).format(parsedDate);
}

export function toBengaliCalendarDate(date: Date | string | number): string {
  const parsedDate = new Date(date);
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: BANGLADESH_TIME_ZONE,
  }).formatToParts(parsedDate);

  const year = Number(parts.find((part) => part.type === "year")?.value ?? 0);
  const month = Number(parts.find((part) => part.type === "month")?.value ?? 1);
  const day = Number(parts.find((part) => part.type === "day")?.value ?? 1);

  const gregorianMonthStartDay = [14, 15, 15, 16, 16, 16, 16, 15, 15, 14, 13, 15];
  const banglaMonth = day >= gregorianMonthStartDay[month - 1] ? month - 1 : (month + 10) % 12;
  const previousGregorianMonth = month === 1 ? 12 : month - 1;
  const startDay =
    day >= gregorianMonthStartDay[month - 1]
      ? gregorianMonthStartDay[month - 1]
      : gregorianMonthStartDay[previousGregorianMonth - 1];
  const daysInPreviousMonth = new Date(year, previousGregorianMonth, 0).getDate();
  const banglaDay = day >= startDay ? day - startDay + 1 : daysInPreviousMonth - startDay + day + 1;
  const banglaYear = month > 4 || (month === 4 && day >= 14) ? year - 593 : year - 594;

  return `${toBengaliDigits(banglaDay)} ${BENGALI_MONTHS[banglaMonth]} ${toBengaliDigits(banglaYear)}`;
}
