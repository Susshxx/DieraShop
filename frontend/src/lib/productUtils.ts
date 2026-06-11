// Helper function to check if a product is new (added in last 3 days)
export const isNewProduct = (createdAt: string | Date, daysThreshold: number = 3): boolean => {
  if (!createdAt) return false;
  const productDate = new Date(createdAt);
  const daysSinceAdded = Math.floor((Date.now() - productDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceAdded <= daysThreshold;
};
