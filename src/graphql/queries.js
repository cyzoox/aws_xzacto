/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getStaff = /* GraphQL */ `
  query GetStaff($id: ID!) {
    getStaff(id: $id) {
      id
      name
      password
      ownerId
      role
      log_status
      device_id
      device_name
      stores {
        nextToken
        __typename
      }
      transactions {
        nextToken
        __typename
      }
      cartItems {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listStaff = /* GraphQL */ `
  query ListStaff(
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
        role
        log_status
        device_id
        device_name
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getCategory = /* GraphQL */ `
  query GetCategory($id: ID!) {
    getCategory(id: $id) {
      id
      name
      storeId
      store {
        id
        name
        location
        ownerId
        createdAt
        updatedAt
        __typename
      }
      products {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listCategories = /* GraphQL */ `
  query ListCategories(
    $filter: ModelCategoryFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listCategories(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        storeId
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getWarehouseProduct = /* GraphQL */ `
  query GetWarehouseProduct($id: ID!) {
    getWarehouseProduct(id: $id) {
      id
      name
      brand
      description
      purchasePrice
      sellingPrice
      totalStock
      availableStock
      sku
      barcode
      img
      category
      subcategory
      supplier
      supplierContact
      reorderPoint
      reorderQuantity
      location
      isActive
      lastRestockDate
      storeProducts {
        nextToken
        __typename
      }
      requestItems {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listWarehouseProducts = /* GraphQL */ `
  query ListWarehouseProducts(
    $filter: ModelWarehouseProductFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listWarehouseProducts(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        name
        brand
        description
        purchasePrice
        sellingPrice
        totalStock
        availableStock
        sku
        barcode
        img
        category
        subcategory
        supplier
        supplierContact
        reorderPoint
        reorderQuantity
        location
        isActive
        lastRestockDate
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getProduct = /* GraphQL */ `
  query GetProduct($id: ID!) {
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
      warehouseProductId
      addons {
        nextToken
        __typename
      }
      variants {
        nextToken
        __typename
      }
      isActive
      store {
        id
        name
        location
        ownerId
        createdAt
        updatedAt
        __typename
      }
      category {
        id
        name
        storeId
        createdAt
        updatedAt
        __typename
      }
      warehouseProduct {
        id
        name
        brand
        description
        purchasePrice
        sellingPrice
        totalStock
        availableStock
        sku
        barcode
        img
        category
        subcategory
        supplier
        supplierContact
        reorderPoint
        reorderQuantity
        location
        isActive
        lastRestockDate
        createdAt
        updatedAt
        __typename
      }
      cartItems {
        nextToken
        __typename
      }
      sales {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listProducts = /* GraphQL */ `
  query ListProducts(
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
        warehouseProductId
        isActive
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getStore = /* GraphQL */ `
  query GetStore($id: ID!) {
    getStore(id: $id) {
      id
      name
      location
      ownerId
      products {
        nextToken
        __typename
      }
      categories {
        nextToken
        __typename
      }
      staff {
        nextToken
        __typename
      }
      transactions {
        nextToken
        __typename
      }
      expenses {
        nextToken
        __typename
      }
      customers {
        nextToken
        __typename
      }
      suppliers {
        nextToken
        __typename
      }
      cartItems {
        nextToken
        __typename
      }
      inventoryRequests {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listStores = /* GraphQL */ `
  query ListStores(
    $filter: ModelStoreFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listStores(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        location
        ownerId
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getSaleTransaction = /* GraphQL */ `
  query GetSaleTransaction($id: ID!) {
    getSaleTransaction(id: $id) {
      id
      items
      total
      discount
      points
      staffID
      staffName
      storeID
      customerID
      status
      payment_status
      cash_received
      change
      notes
      staff {
        id
        name
        password
        ownerId
        role
        log_status
        device_id
        device_name
        createdAt
        updatedAt
        __typename
      }
      store {
        id
        name
        location
        ownerId
        createdAt
        updatedAt
        __typename
      }
      customer {
        id
        name
        email
        phone
        storeId
        points
        createdAt
        updatedAt
        __typename
      }
      sales {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listSaleTransactions = /* GraphQL */ `
  query ListSaleTransactions(
    $filter: ModelSaleTransactionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSaleTransactions(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        items
        total
        discount
        points
        staffID
        staffName
        storeID
        customerID
        status
        payment_status
        cash_received
        change
        notes
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getSale = /* GraphQL */ `
  query GetSale($id: ID!) {
    getSale(id: $id) {
      id
      productID
      productName
      transactionID
      price
      quantity
      discount
      total
      status
      product {
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
        warehouseProductId
        isActive
        createdAt
        updatedAt
        __typename
      }
      transaction {
        id
        items
        total
        discount
        points
        staffID
        staffName
        storeID
        customerID
        status
        payment_status
        cash_received
        change
        notes
        createdAt
        updatedAt
        __typename
      }
      void_reason
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listSales = /* GraphQL */ `
  query ListSales(
    $filter: ModelSaleFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSales(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        productID
        productName
        transactionID
        price
        quantity
        discount
        total
        status
        void_reason
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getAddon = /* GraphQL */ `
  query GetAddon($id: ID!) {
    getAddon(id: $id) {
      id
      name
      price
      productId
      product {
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
        warehouseProductId
        isActive
        createdAt
        updatedAt
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listAddons = /* GraphQL */ `
  query ListAddons(
    $filter: ModelAddonFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listAddons(filter: $filter, limit: $limit, nextToken: $nextToken) {
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
  }
`;
export const getVariant = /* GraphQL */ `
  query GetVariant($id: ID!) {
    getVariant(id: $id) {
      id
      name
      price
      productId
      product {
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
        warehouseProductId
        isActive
        createdAt
        updatedAt
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listVariants = /* GraphQL */ `
  query ListVariants(
    $filter: ModelVariantFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listVariants(filter: $filter, limit: $limit, nextToken: $nextToken) {
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
  }
`;
export const getCustomer = /* GraphQL */ `
  query GetCustomer($id: ID!) {
    getCustomer(id: $id) {
      id
      name
      email
      phone
      storeId
      points
      purchases {
        nextToken
        __typename
      }
      store {
        id
        name
        location
        ownerId
        createdAt
        updatedAt
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listCustomers = /* GraphQL */ `
  query ListCustomers(
    $filter: ModelCustomerFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listCustomers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        email
        phone
        storeId
        points
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getSupplier = /* GraphQL */ `
  query GetSupplier($id: ID!) {
    getSupplier(id: $id) {
      id
      name
      email
      phone
      storeId
      products {
        nextToken
        __typename
      }
      store {
        id
        name
        location
        ownerId
        createdAt
        updatedAt
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listSuppliers = /* GraphQL */ `
  query ListSuppliers(
    $filter: ModelSupplierFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSuppliers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        email
        phone
        storeId
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getExpense = /* GraphQL */ `
  query GetExpense($id: ID!) {
    getExpense(id: $id) {
      id
      name
      amount
      date
      storeId
      staffId
      staffName
      category
      notes
      store {
        id
        name
        location
        ownerId
        createdAt
        updatedAt
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listExpenses = /* GraphQL */ `
  query ListExpenses(
    $filter: ModelExpenseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listExpenses(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        amount
        date
        storeId
        staffId
        staffName
        category
        notes
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getCartItem = /* GraphQL */ `
  query GetCartItem($id: ID!) {
    getCartItem(id: $id) {
      id
      name
      brand
      oprice
      sprice
      productId
      cashierId
      category
      unit
      storeId
      quantity
      store {
        id
        name
        location
        ownerId
        createdAt
        updatedAt
        __typename
      }
      product {
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
        warehouseProductId
        isActive
        createdAt
        updatedAt
        __typename
      }
      staff {
        id
        name
        password
        ownerId
        role
        log_status
        device_id
        device_name
        createdAt
        updatedAt
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listCartItems = /* GraphQL */ `
  query ListCartItems(
    $filter: ModelCartItemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listCartItems(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        brand
        oprice
        sprice
        productId
        cashierId
        category
        unit
        storeId
        quantity
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getInventoryRequest = /* GraphQL */ `
  query GetInventoryRequest($id: ID!) {
    getInventoryRequest(id: $id) {
      id
      storeId
      status
      requestDate
      fulfillmentDate
      requestedBy
      processedBy
      priority
      notes
      store {
        id
        name
        location
        ownerId
        createdAt
        updatedAt
        __typename
      }
      requestItems {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listInventoryRequests = /* GraphQL */ `
  query ListInventoryRequests(
    $filter: ModelInventoryRequestFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listInventoryRequests(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        storeId
        status
        requestDate
        fulfillmentDate
        requestedBy
        processedBy
        priority
        notes
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getRequestItem = /* GraphQL */ `
  query GetRequestItem($id: ID!) {
    getRequestItem(id: $id) {
      id
      requestId
      warehouseProductId
      requestedQuantity
      fulfilledQuantity
      status
      inventoryRequest {
        id
        storeId
        status
        requestDate
        fulfillmentDate
        requestedBy
        processedBy
        priority
        notes
        createdAt
        updatedAt
        __typename
      }
      warehouseProduct {
        id
        name
        brand
        description
        purchasePrice
        sellingPrice
        totalStock
        availableStock
        sku
        barcode
        img
        category
        subcategory
        supplier
        supplierContact
        reorderPoint
        reorderQuantity
        location
        isActive
        lastRestockDate
        createdAt
        updatedAt
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listRequestItems = /* GraphQL */ `
  query ListRequestItems(
    $filter: ModelRequestItemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listRequestItems(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        requestId
        warehouseProductId
        requestedQuantity
        fulfilledQuantity
        status
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getStaffStore = /* GraphQL */ `
  query GetStaffStore($id: ID!) {
    getStaffStore(id: $id) {
      id
      staffId
      storeId
      staff {
        id
        name
        password
        ownerId
        role
        log_status
        device_id
        device_name
        createdAt
        updatedAt
        __typename
      }
      store {
        id
        name
        location
        ownerId
        createdAt
        updatedAt
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listStaffStores = /* GraphQL */ `
  query ListStaffStores(
    $filter: ModelStaffStoreFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listStaffStores(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        staffId
        storeId
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const staffStoresByStaffId = /* GraphQL */ `
  query StaffStoresByStaffId(
    $staffId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelStaffStoreFilterInput
    $limit: Int
    $nextToken: String
  ) {
    staffStoresByStaffId(
      staffId: $staffId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        staffId
        storeId
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const staffStoresByStoreId = /* GraphQL */ `
  query StaffStoresByStoreId(
    $storeId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelStaffStoreFilterInput
    $limit: Int
    $nextToken: String
  ) {
    staffStoresByStoreId(
      storeId: $storeId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        staffId
        storeId
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
