export function customStringify(obj) {
    if (typeof obj === 'function') {
      return obj.toString();
    }
    if (typeof obj === 'object' && obj !== null) {
      const entries = Object.entries(obj).map(([key, value]) => {
        return `${JSON.stringify(key)}: ${customStringify(value)}`;
      });
      return `{${entries.join(', ')}}`;
    }
    return JSON.stringify(obj);
  }