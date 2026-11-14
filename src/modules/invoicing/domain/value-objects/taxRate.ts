/**
 * Conversión exacta entre la tarifa de un impuesto en porcentaje (como la ve el
 * usuario: "19" = 19 %) y la fracción que guarda kali-invoice-service (0.19).
 *
 * No se multiplica ni divide por 100 (0.29 * 100 = 28.999999999999996) ni se
 * redondea: se desplaza el punto decimal sobre la representación decimal del
 * número. JavaScript escribe cada número con la cadena más corta que lo
 * identifica (String(0.0414) === "0.0414"), así que ida y vuelta
 * fracción → % → fracción devuelve exactamente el mismo número.
 */

/** Porcentaje escrito por el usuario: solo dígitos y punto decimal (sin coma ni exponente). */
const PERCENT_PATTERN = /^-?\d+(?:\.\d+)?$/;

/** Representación de String(number): admite exponente (1e-7, 1.5e+21). */
const NUMBER_STRING_PATTERN = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i;

interface DecimalParts {
  negative: boolean;
  /** Todos los dígitos significativos, sin punto. */
  digits: string;
  /** Posición del punto decimal dentro de `digits` (puede ser < 0 o > longitud). */
  point: number;
}

const parseDecimal = (value: string): DecimalParts | null => {
  const match = NUMBER_STRING_PATTERN.exec(value);
  if (!match) return null;
  const [, sign, integer, fraction = "", exponent = "0"] = match;
  return {
    negative: sign === "-",
    digits: integer + fraction,
    point: integer.length + Number(exponent),
  };
};

const formatDecimal = ({ negative, digits, point }: DecimalParts): string => {
  let padded = digits;
  let position = point;
  if (position <= 0) {
    padded = "0".repeat(1 - position) + padded;
    position = 1;
  }
  if (position > padded.length) {
    padded = padded + "0".repeat(position - padded.length);
  }
  const integer = padded.slice(0, position).replace(/^0+(?=\d)/, "");
  const fraction = padded.slice(position).replace(/0+$/, "");
  const text = fraction ? `${integer}.${fraction}` : integer;
  const isZero = /^0(?:\.0*)?$/.test(text);
  return negative && !isZero ? `-${text}` : text;
};

/** Desplaza el punto decimal `places` posiciones (positivo = a la derecha). */
export const shiftDecimalPoint = (value: string, places: number): string => {
  const parts = parseDecimal(value.trim());
  if (!parts) throw new Error(`Número decimal no válido: "${value}"`);
  return formatDecimal({ ...parts, point: parts.point + places });
};

/** true si el texto es un porcentaje válido: dígitos con punto decimal opcional (sin coma). */
export const isPercentString = (value: string): boolean => PERCENT_PATTERN.test(value.trim());

/**
 * Fracción del servidor → porcentaje para mostrar o editar, como texto exacto.
 * 0.19 → "19", 0.0414 → "4.14", 0.025 → "2.5", 0.00414 → "0.414".
 */
export const rateToPercent = (rate: number): string => {
  if (!Number.isFinite(rate)) throw new Error(`Tarifa no válida: ${rate}`);
  return shiftDecimalPoint(String(rate), 2);
};

/**
 * Porcentaje escrito por el usuario → fracción para el servidor.
 * "19" → 0.19, "4.14" → 0.0414. Solo admite punto decimal; lanza un error si
 * el texto no es un número válido (la validación del formulario lo evita).
 */
export const percentToRate = (percent: string): number => {
  if (!isPercentString(percent)) throw new Error(`Porcentaje no válido: "${percent}"`);
  return Number(shiftDecimalPoint(percent, -2));
};
