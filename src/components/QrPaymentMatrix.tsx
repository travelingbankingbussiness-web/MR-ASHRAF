import React from 'react';

interface QrPaymentMatrixProps {
  value: string;
  size?: number;
}

export const QrPaymentMatrix: React.FC<QrPaymentMatrixProps> = ({ value, size = 148 }) => {
  const grid = 21;
  const cells: boolean[] = [];

  let seed = 2166136261;
  for (let i = 0; i < value.length; i++) {
    seed ^= value.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }

  const isFinder = (r: number, c: number) => {
    const inTopLeft = r < 7 && c < 7;
    const inTopRight = r < 7 && c >= grid - 7;
    const inBottomLeft = r >= grid - 7 && c < 7;
    if (!inTopLeft && !inTopRight && !inBottomLeft) return null;

    const lr = r >= grid - 7 ? r - (grid - 7) : r;
    const lc = c >= grid - 7 ? c - (grid - 7) : c;
    if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
    if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
    return false;
  };

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const finder = isFinder(r, c);
      if (finder !== null) {
        cells.push(finder);
      } else {
        seed ^= (r * 31 + c * 17) & 0xff;
        seed = Math.imul(seed, 16777619);
        cells.push((seed >>> 28) % 2 === 0);
      }
    }
  }

  const cellSize = size / grid;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="UPI Payment QR Matrix"
      className="bg-white p-2 border border-slate-200 rounded-lg"
    >
      <rect width={size} height={size} fill="#ffffff" />
      {cells.map((filled, idx) => {
        if (!filled) return null;
        const r = Math.floor(idx / grid);
        const c = idx % grid;
        return (
          <rect
            key={idx}
            x={c * cellSize}
            y={r * cellSize}
            width={cellSize + 0.15}
            height={cellSize + 0.15}
            fill="#0f172a"
          />
        );
      })}
    </svg>
  );
};
