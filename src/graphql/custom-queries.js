/* eslint-disable */
// Custom queries for fetching complete data
import {gql} from '@aws-amplify/api';

// Custom query to fetch staff with their complete store information
export const listStaffWithStores = /* GraphQL */ `
  query ListStaffWithStores(
    $filter: ModelStaffFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listStaff(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        password
        ownerId
        accountId
        role
        log_status
        device_id
        device_name
        stores {
          items {
            id
            staffId
            storeId
            store {
              id
              name
              location
              ownerId
            }
            createdAt
            updatedAt
          }
        }
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;

export const listProductsWithExtras = /* GraphQL */ `
  query ListProductsWithExtras(
    $filter: ModelProductFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listProducts(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        brand
        description
        oprice
        sprice
        stock
        categoryId
        subcategory
        sku
        img
        storeId
        isActive
        variants {
          items {
            id
            name
            price
            productId
          }
          nextToken
        }
        addons {
          items {
            id
            name
            price
            productId
          }
          nextToken
        }
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;

export const getProductWithExtras = /* GraphQL */ `
  query GetProductWithExtras($id: ID!) {
    getProduct(id: $id) {
      id
      name
      brand
      description
      oprice
      sprice
      stock
      categoryId
      subcategory
      sku
      img
      storeId
      isActive
      variants {
        items {
          id
          name
          price
          productId
          createdAt
          updatedAt
          __typename
        }
        nextToken
        __typename
      }
      addons {
        items {
          id
          name
          price
          productId
          createdAt
          updatedAt
          __typename
        }
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
