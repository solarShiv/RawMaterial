import { useRef, useCallback } from "react";

const DRAFT_KEY = "po_create_draft_v1";
const DEBOUNCE_MS = 1500;
const MAX_AGE_DAYS = 7;

export function usePODraft() {
  const debounceRef = useRef(null);

  const saveDraft = useCallback((data) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ ...data, savedAt: new Date().toISOString() })
        );
      } catch (e) {
        console.warn("Failed to save PO draft:", e);
      }
    }, DEBOUNCE_MS);
  }, []);

  const loadDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const draft = JSON.parse(raw);
      if (draft.savedAt) {
        const ageMs = Date.now() - new Date(draft.savedAt).getTime();
        if (ageMs > MAX_AGE_DAYS * 24 * 60 * 60 * 1000) {
          localStorage.removeItem(DRAFT_KEY);
          return null;
        }
      }
      return draft;
    } catch (e) {
      return null;
    }
  }, []);

  const clearDraft = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      // ignore
    }
  }, []);

  return { saveDraft, loadDraft, clearDraft };
}
