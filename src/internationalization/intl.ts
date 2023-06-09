import { en } from "@/internationalization/locale.en";
import { hr } from "@/internationalization/locale.hr";
import { computed, ref, watch } from "vue";
import type { IntlMessages } from "@/internationalization/messages";

type LocaleRecord = { key: string; label: string; messages: IntlMessages };
type LocaleKeys = (typeof localeList)[number]["key"];

const persist = {
  key: "localization-key",
  set(value: LocaleKeys) {
    localStorage.setItem(persist.key, value);
  },
  get() {
    const key = localStorage.getItem(persist.key) as LocaleKeys | null;
    return !key || !localeKeys.includes(key) ? defaultLocale : key;
  },
};

const defaultLocale: LocaleKeys = "en";
export const localeList = [
  { key: "en", label: "EN", messages: en },
  { key: "hr", label: "HR", messages: hr },
] as const satisfies Readonly<LocaleRecord[]>;
const localeKeys = localeList.map(({ key }) => key);
const activeKey = ref<LocaleKeys>(persist.get());
watch(activeKey, persist.set);
function getLocale(key: LocaleKeys) {
  return localeList.find((locale) => locale.key === key) as LocaleRecord;
}

export const activeLocale = computed(() => getLocale(activeKey.value));
export const setLocale = (key: LocaleKeys) => (activeKey.value = key);
export const intl = computed(() => getLocale(activeKey.value).messages);
