/**
 * Utility functions for price calculations
 */

/**
 * Calculate the final price of a product including variants and addons
 * 
 * @param {Object} product - The product object with base price
 * @param {Array} selectedVariants - Array of selected variants (optional)
 * @param {Array} selectedAddons - Array of selected addons (optional)
 * @returns {Number} - The final calculated price
 */
export const calculateFinalPrice = (product, selectedVariants = [], selectedAddons = []) => {
  if (!product) return 0;
  
  let finalPrice = 0;
  
  // If we have a selected variant, use its price instead of the base price
  if (Array.isArray(selectedVariants) && selectedVariants.length > 0) {
    // Use the first valid variant price as the base price
    const firstVariant = selectedVariants[0];
    if (firstVariant && typeof firstVariant.price === 'number') {
      finalPrice = firstVariant.price;
    } else {
      // Fallback to base price if variant has no price
      finalPrice = product.sprice || 0;
    }
  } else {
    // No variants selected, use the base price
    finalPrice = product.sprice || 0;
  }
  
  // Add the price of each selected addon
  if (Array.isArray(selectedAddons) && selectedAddons.length > 0) {
    selectedAddons.forEach(addon => {
      if (addon && typeof addon.price === 'number') {
        finalPrice += addon.price;
      }
    });
  }
  
  return finalPrice;
};

/**
 * Format price as currency
 * @param {Number} amount - Amount to format
 * @param {String} symbol - Currency symbol
 * @returns {String} - Formatted currency string
 */
export const formatPrice = (amount, symbol = '₱') => {
  return `${symbol}${amount.toFixed(2)}`;
};

/**
 * Get the display price for a product with its variants and addons
 * 
 * @param {Object} product - Product with variants and addons
 * @returns {String} - Price display string
 */
export const getProductPriceDisplay = (product) => {
  if (!product) return '';
  
  const basePrice = product.sprice || 0;
  
  // Check if product has variants
  const hasVariants = Array.isArray(product.variants?.items) && 
    product.variants.items.length > 0;
  
  // Check if product has addons
  const hasAddons = Array.isArray(product.addons?.items) && 
    product.addons.items.length > 0;
  
  if (!hasVariants && !hasAddons) {
    // Just return the base price if no variants or addons
    return formatPrice(basePrice);
  }
  
  // Get the minimum variant price (if any)
  let minVariantPrice = 0;
  if (hasVariants) {
    const variantPrices = product.variants.items
      .filter(v => v && typeof v.price === 'number')
      .map(v => v.price);
    
    if (variantPrices.length > 0) {
      minVariantPrice = Math.min(...variantPrices);
    }
  }
  
  // Get the minimum addon price (if any)
  let minAddonPrice = 0;
  if (hasAddons) {
    const addonPrices = product.addons.items
      .filter(a => a && typeof a.price === 'number')
      .map(a => a.price);
    
    if (addonPrices.length > 0) {
      minAddonPrice = Math.min(...addonPrices);
    }
  }
  
  // If there are variants or addons, show the price range
  if (minVariantPrice > 0 || minAddonPrice > 0) {
    return `${formatPrice(basePrice)} +`;
  }
  
  return formatPrice(basePrice);
};
