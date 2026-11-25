"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // A previous production worker can intercept Next.js auth routes while
      // developing locally. Remove this app's worker and its own caches.
      void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
        await Promise.all(registrations.map((registration) => registration.unregister()));
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter((name) => name.startsWith("aetheris-health-"))
            .map((name) => caches.delete(name))
        );
      }).catch(() => {});
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
