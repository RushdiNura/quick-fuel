import { createContext, useContext, useState, type ReactNode } from "react";
import { I18N, type Lang } from "../lib/i18n";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const Ctx = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>((localStorage.getItem("qf_lang") as Lang) || "en");
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem("qf_lang", l); };
  const t = (key: string) => I18N[lang]?.[key] ?? I18N.en[key] ?? key;
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useLang() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
