// The words of the lab page, English and Bulgarian (by the browser's language).
const en = {
  title: "Cut and shrink a clip",
  intro: "A trial for Quiz creator. Pick a video or an audio file, choose the part to keep and how small to make it. Everything happens on this device; nothing is uploaded.",
  pick: "Choose a video or audio file",
  from: "Start of the part to keep",
  to: "End of the part to keep",
  playPart: "Play the chosen part",
  pause: "Pause",
  fits: "Fits a quiz as it is (up to {{limit}}): cutting is up to you.",
  mustCut: "Too big for a quiz (up to {{limit}}): cut it or lower the quality to use it.",
  stillTooBig: "Still over {{limit}}: keep a shorter part or pick a lower quality.",
  length: "length",
  size: "Picture size",
  original: "As it is",
  quality: "Quality",
  high: "High",
  medium: "Medium",
  low: "Low (smallest file)",
  cut: "Cut and shrink",
  cancel: "Cancel",
  working: "Working…",
  result: "Result",
  download: "Download the new file",
  report: "Report",
  copy: "Copy the report",
  copied: "Copied",
  failed: "It did not work",
  unsupported: "This browser cannot re-encode here. In the app this clip would only be played from – to, without making the file smaller.",
};

const bg: typeof en = {
  title: "Изрежи и смали клип",
  intro: "Опит за Създателя на куизове. Изберете видео или аудио файл, частта, която остава, и колко малък да стане. Всичко става на това устройство; нищо не се качва.",
  pick: "Изберете видео или аудио файл",
  from: "Начало на частта, която остава",
  to: "Край на частта, която остава",
  playPart: "Пусни избраната част",
  pause: "Пауза",
  fits: "Влиза в куиз както е (до {{limit}}): рязането е по желание.",
  mustCut: "Твърде голям за куиз (до {{limit}}): изрежете го или намалете качеството, за да го ползвате.",
  stillTooBig: "Все още над {{limit}}: оставете по-къса част или изберете по-ниско качество.",
  length: "дължина",
  size: "Размер на картината",
  original: "Както е",
  quality: "Качество",
  high: "Високо",
  medium: "Средно",
  low: "Ниско (най-малък файл)",
  cut: "Изрежи и смали",
  cancel: "Отказ",
  working: "Работи…",
  result: "Резултат",
  download: "Свали новия файл",
  report: "Отчет",
  copy: "Копирай отчета",
  copied: "Копирано",
  failed: "Не се получи",
  unsupported: "Този браузър не може да прекодира тук. В приложението този клип само би се пускал от – до, без файлът да става по-малък.",
};

/** The page's words in the browser's language. */
export const words: typeof en = navigator.language.toLowerCase().startsWith("bg") ? bg : en;

/** Seconds as "m:ss.t". */
export function clock(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const minutes = Math.floor(safe / 60);
  return `${String(minutes)}:${(safe - minutes * 60).toFixed(1).padStart(4, "0")}`;
}

/** Bytes as "12.4 MB" or "830 kB", in units of 1,024 like the app's limits. */
export function megabytes(bytes: number): string {
  const megabyte = 1024 * 1024;
  return bytes >= megabyte ? `${(bytes / megabyte).toFixed(1).replace(/\.0$/, "")} MB` : `${String(Math.round(bytes / 1024))} kB`;
}
