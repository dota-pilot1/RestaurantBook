export const formatPrice = (value: number) => value.toLocaleString("ko-KR");

export const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

export const getTableBadgeLabel = (tableName: string) => {
  const normalized = tableName.trim();
  if (!normalized) return "-";

  const number = normalized.match(/\d+/)?.[0];
  if (number) return number;

  return normalized.slice(0, 2);
};
