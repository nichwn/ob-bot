export const compareCaseInsensitive = (a: string, b: string) =>
  a.localeCompare(b, undefined, {
    sensitivity: 'base',
  });
