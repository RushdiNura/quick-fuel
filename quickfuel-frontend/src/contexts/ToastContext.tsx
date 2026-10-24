import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

interface ToastCtx {
  toast: (message: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((msg: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(msg);
    setShow(true);
    timer.current = setTimeout(() => setShow(false), 1800);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div
        className={`toast-message ${show ? "opacity-100 bottom-[34px]" : "opacity-0 bottom-6"}`}
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}
