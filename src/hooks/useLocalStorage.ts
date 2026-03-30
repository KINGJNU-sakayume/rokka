import { useState } from "react";

/**
 * Deep merge to prevent schema loss when app updates.
 *
 * [FIX] 배열 처리 결함 수정:
 * 기존 deepMerge는 Array를 { ...array } 로 spread하여
 * {"0":{...},"1":{...}} 같은 plain object로 변환함 →
 * 재접속 시 events.filter is not a function 오류 발생.
 *
 * 수정 규칙:
 *  1. defaultVal이 배열이고 saved도 배열 → saved 그대로 반환 (사용자 데이터 우선)
 *  2. defaultVal이 배열인데 saved가 배열이 아님 → defaultVal 반환 (손상된 데이터 초기화)
 *  3. 그 외 객체 → 기존 재귀 deep merge 유지 (스키마 신규 필드 보호)
 */
function deepMerge<T>(defaultVal: T, saved: unknown): T {
  if (Array.isArray(defaultVal)) {
    return (Array.isArray(saved) ? saved : defaultVal) as T;
  }

  if (saved === null || typeof saved !== "object") return defaultVal;

  const result: Record<string, unknown> = { ...(defaultVal as Record<string, unknown>) };
  const savedObj = saved as Record<string, unknown>;

  for (const key in savedObj) {
    if (
      typeof savedObj[key] === "object" &&
      savedObj[key] !== null &&
      key in (defaultVal as Record<string, unknown>)
    ) {
      result[key] = deepMerge((defaultVal as Record<string, unknown>)[key], savedObj[key]);
    } else {
      result[key] = savedObj[key];
    }
  }

  return result as T;
}

function safeParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {

  const [storedValue, setStoredValue] = useState<T>(() => {

    try {

      const item = window.localStorage.getItem(key);

      if (!item) return initialValue;

      const parsed = safeParse(item, initialValue);

      return deepMerge(initialValue, parsed);

    } catch (error) {

      console.error(`Error reading localStorage key "${key}":`, error);

      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {

    setStoredValue(prev => {

      try {

        const newValue =
          value instanceof Function ? value(prev) : value;

        window.localStorage.setItem(key, JSON.stringify(newValue));

        return newValue;

      } catch (error) {

        console.error(`Error setting localStorage key "${key}":`, error);

        return prev;
      }

    });
  };

  const resetValue = () => {

    try {

      window.localStorage.removeItem(key);

    } catch (error) {

      console.error(`Error removing localStorage key "${key}":`, error);
    }

    setStoredValue(initialValue);
  };

  return [storedValue, setValue, resetValue] as const;
}
