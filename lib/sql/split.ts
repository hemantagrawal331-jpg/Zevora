export function splitSql(source: string) {
  const statements: string[] = [];
  let current = "";
  let index = 0;
  let quote: string | null = null;

  while (index < source.length) {
    if (quote) {
      if (source.startsWith(quote, index)) {
        current += quote;
        index += quote.length;
        quote = null;
        continue;
      }
      current += source[index];
      index += 1;
      continue;
    }

    const tag = /^\$[A-Za-z0-9_]*\$/.exec(source.slice(index));
    if (tag) {
      quote = tag[0];
      current += quote;
      index += quote.length;
      continue;
    }

    if (source[index] === ";") {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = "";
      index += 1;
      continue;
    }

    current += source[index];
    index += 1;
  }

  const statement = current.trim();
  if (statement) statements.push(statement);
  return statements;
}
