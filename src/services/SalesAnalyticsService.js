// Sales Analytics Service for handling product performance metrics
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { listSales } from '../graphql/queries';

const client = generateClient();

// Fetch sales data within the given date range
export const getSalesAnalytics = async (storeId, startDate, endDate) => {
  try {
    // Get auth user
    const { userId: ownerId } = await getCurrentUser();
    
    // Fetch sales data for the period
    const salesResponse = await client.graphql({
      query: listSales,
      variables: {
        filter: {
          and: [
            { ownerId: { eq: ownerId } },
            { status: { eq: "COMPLETED" } }, // Only count completed sales
            { createdAt: { 
              between: [startDate.toISOString(), endDate.toISOString()] 
            }}
          ]
        },
        limit: 1000, // Adjust as needed for your data volume
      },
    });
    
    const sales = salesResponse.data.listSales.items || [];
    
    // Process sales data to get product performance
    const productPerformance = processProductPerformance(sales);
    
    return productPerformance;
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    throw error;
  }
};

// Process raw sales data into product performance metrics
const processProductPerformance = (sales) => {
  // Group sales by productID
  const productMap = {};
  
  sales.forEach(sale => {
    if (!productMap[sale.productID]) {
      productMap[sale.productID] = {
        productID: sale.productID,
        productName: sale.productName || 'Unknown Product',
        totalQuantity: 0,
        totalSales: 0,
        transactionCount: 0,
      };
    }
    
    productMap[sale.productID].totalQuantity += sale.quantity || 0;
    productMap[sale.productID].totalSales += sale.total || 0;
    productMap[sale.productID].transactionCount += 1;
  });
  
  // Convert map to array and calculate averages
  const productPerformance = Object.values(productMap).map(product => {
    return {
      ...product,
      averagePrice: product.totalQuantity > 0 ? 
        product.totalSales / product.totalQuantity : 
        0
    };
  });
  
  return productPerformance;
};

// Get top selling products
export const getTopSellingProducts = async (storeId, startDate, endDate, limit = 10) => {
  const productPerformance = await getSalesAnalytics(storeId, startDate, endDate);
  
  // Sort by quantity in descending order
  return productPerformance
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit);
};

// Get least selling products
export const getLeastSellingProducts = async (storeId, startDate, endDate, limit = 10) => {
  const productPerformance = await getSalesAnalytics(storeId, startDate, endDate);
  
  // Sort by quantity in ascending order
  return productPerformance
    .sort((a, b) => a.totalQuantity - b.totalQuantity)
    .slice(0, limit);
};
