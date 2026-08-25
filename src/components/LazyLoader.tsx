// Code-split heavy screens for faster initial load
import { Suspense, lazy, ComponentType } from "react";
import { motion } from "framer-motion";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="h-8 w-8 rounded-full border-2 border-[var(--signal)] border-t-transparent"
      />
    </div>
  );
}

function ErrorFallback({ error }: { error?: Error }) {
  return (
    <div className="panel p-8 text-center">
      <p className="font-heading text-lg font-bold text-[var(--short)]">Ошибка загрузки</p>
      <p className="text-sm text-[var(--inkSoft)] mt-2">{error?.message || "Попробуйте обновить страницу"}</p>
      <button onClick={() => window.location.reload()} className="btn-primary mt-4 text-sm">Обновить</button>
    </div>
  );
}

export function LazyScreen(importFn: () => Promise<{ default: ComponentType<any> }>) {
  const LazyComponent = lazy(importFn);
  return function LazyWrapper(props: any) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Preload hint — call on hover/intersection
export function preloadScreen(importFn: () => Promise<any>) {
  importFn();
}
