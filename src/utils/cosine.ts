export function cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((acc, val, i) => acc + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0));
    const magB = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0));
    return dot / (magA * magB);
  }
