/**
 * Números decimales escritos en formato es-CO: la coma es el ÚNICO separador
 * decimal y no se admiten separadores de miles. El texto nunca se reinterpreta
 * como otro valor ("1.234" no se lee como 1,234 ni como 1234): si no es
 * inequívoco se rechaza con un mensaje que explica cómo escribirlo.
 *
 * El signo menos se admite para que las reglas de rango del formulario puedan
 * decir "no puede ser negativo" en lugar de "formato inválido".
 */

import { shiftDecimalPoint } from "@modules/invoicing/domain/value-objects/taxRate";

export const ES_CO_DECIMAL_MESSAGES = {
  dot: "Usa coma (,) para los decimales y no uses puntos de miles. Ejemplo: 1234,5",
  manyCommas: "Usa una sola coma decimal. No uses separadores de miles.",
  invalidChars: "Escribe solo números y, si hace falta, una coma decimal.",
  empty: "Escribe un número.",
} as const;

export type EsCoDecimalResult =
  | { ok: true; value: number; /** Mismo número con punto decimal (exacto, sin redondeo). */ canonical: string }
  | { ok: false; error: string };

const ES_CO_DECIMAL_PATTERN = /^-?\d+(,\d+)?$/;

/**
 * Lee un decimal es-CO. Solo se recortan los espacios exteriores; cualquier
 * otro carácter (puntos, letras, "$", "%", espacios internos, NBSP, apóstrofos,
 * exponentes) hace que el valor se rechace. Un texto vacío devuelve
 * `ES_CO_DECIMAL_MESSAGES.empty`; cada formulario decide su propio mensaje de
 * "obligatorio".
 */
export const parseEsCoDecimal = (text: string): EsCoDecimalResult => {
  const trimmed = text.trim();
  if (trimmed === "") return { ok: false, error: ES_CO_DECIMAL_MESSAGES.empty };
  if (ES_CO_DECIMAL_PATTERN.test(trimmed)) {
    const canonical = trimmed.replace(",", ".");
    return { ok: true, value: Number(canonical), canonical };
  }
  if (trimmed.includes(".")) return { ok: false, error: ES_CO_DECIMAL_MESSAGES.dot };
  if ((trimmed.match(/,/g) ?? []).length > 1) return { ok: false, error: ES_CO_DECIMAL_MESSAGES.manyCommas };
  return { ok: false, error: ES_CO_DECIMAL_MESSAGES.invalidChars };
};

/**
 * Decimal (en notación con punto, p. ej. "4.14" o "-0.5") → texto es-CO
 * ("4,14"). No agrupa miles ni redondea.
 */
export const dotDecimalToEsCo = (dotText: string): string => dotText.replace(".", ",");

/**
 * Número → texto es-CO exacto para precargar un campo (formulario de edición,
 * precio copiado del producto): coma decimal, sin agrupar miles, sin redondear
 * y sin exponente. 1234.5 → "1234,5"; 0.0000001 → "0,0000001"; -0 → "0".
 */
export const formatEsCoDecimal = (n: number): string => {
  if (!Number.isFinite(n)) throw new Error(`Número no válido: ${n}`);
  return dotDecimalToEsCo(shiftDecimalPoint(String(n), 0));
};

