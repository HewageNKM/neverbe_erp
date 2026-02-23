export const generateId = (type: string, name: string) => {
  switch (type) {
    case "item":
      return `${name.trim().substring(0, 3)}-${window.crypto.randomUUID().replace(/-/g, "").substring(0, 5)}`.toLowerCase();
    case "variant":
      return `VA-${window.crypto.randomUUID().replace(/-/g, "").substring(0, 5)}`.toLowerCase();
    default:
      return "";
  }
};
