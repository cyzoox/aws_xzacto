/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createStaff = /* GraphQL */ `
  mutation CreateStaff(
    $input: CreateStaffInput!
    $condition: ModelStaffConditionInput
  ) {
    createStaff(input: $input, condition: $condition) {
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
      account {
        id
        ownerId
        ownerEmail
        subscriptionPlanId
        subscriptionStatus
        subscriptionStartDate
        subscriptionEndDate
        lastModifiedBy
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
export const updateStaff = /* GraphQL */ `
  mutation UpdateStaff(
    $input: UpdateStaffInput!
    $condition: ModelStaffConditionInput
  ) {
    updateStaff(input: $input, condition: $condition) {
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
      account {
        id
        ownerId
        ownerEmail
        subscriptionPlanId
        subscriptionStatus
        subscriptionStartDate
        subscriptionEndDate
        lastModifiedBy
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
export const deleteStaff = /* GraphQL */ `
  mutation DeleteStaff(
    $input: DeleteStaffInput!
    $condition: ModelStaffConditionInput
  ) {
    deleteStaff(input: $input, condition: $condition) {
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
      account {
        id
        ownerId
        ownerEmail
        subscriptionPlanId
        subscriptionStatus
        subscriptionStartDate
        subscriptionEndDate
        lastModifiedBy
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
export const createCategory = /* GraphQL */ `
  mutation CreateCategory(
    $input: CreateCategoryInput!
    $condition: ModelCategoryConditionInput
  ) {
    createCategory(input: $input, condition: $condition) {
      id
      name
      storeId
      store {
        id
        name
        location
        ownerId
        accountId
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
export const updateCategory = /* GraphQL */ `
  mutation UpdateCategory(
    $input: UpdateCategoryInput!
    $condition: ModelCategoryConditionInput
  ) {
    updateCategory(input: $input, condition: $condition) {
      id
      name
      storeId
      store {
        id
        name
        location
        ownerId
        accountId
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
export const deleteCategory = /* GraphQL */ `
  mutation DeleteCategory(
    $input: DeleteCategoryInput!
    $condition: ModelCategoryConditionInput
  ) {
    deleteCategory(input: $input, condition: $condition) {
      id
      name
      storeId
      store {
        id
        name
        location
        ownerId
        accountId
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
export const createWarehouseProduct = /* GraphQL */ `
  mutation CreateWarehouseProduct(
    $input: CreateWarehouseProductInput!
    $condition: ModelWarehouseProductConditionInput
  ) {
    createWarehouseProduct(input: $input, condition: $condition) {
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
export const updateWarehouseProduct = /* GraphQL */ `
  mutation UpdateWarehouseProduct(
    $input: UpdateWarehouseProductInput!
    $condition: ModelWarehouseProductConditionInput
  ) {
    updateWarehouseProduct(input: $input, condition: $condition) {
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
export const deleteWarehouseProduct = /* GraphQL */ `
  mutation DeleteWarehouseProduct(
    $input: DeleteWarehouseProductInput!
    $condition: ModelWarehouseProductConditionInput
  ) {
    deleteWarehouseProduct(input: $input, condition: $condition) {
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
export const createProduct = /* GraphQL */ `
  mutation CreateProduct(
    $input: CreateProductInput!
    $condition: ModelProductConditionInput
  ) {
    createProduct(input: $input, condition: $condition) {
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
        accountId
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
export const updateProduct = /* GraphQL */ `
  mutation UpdateProduct(
    $input: UpdateProductInput!
    $condition: ModelProductConditionInput
  ) {
    updateProduct(input: $input, condition: $condition) {
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
        accountId
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
export const deleteProduct = /* GraphQL */ `
  mutation DeleteProduct(
    $input: DeleteProductInput!
    $condition: ModelProductConditionInput
  ) {
    deleteProduct(input: $input, condition: $condition) {
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
        accountId
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
export const createStore = /* GraphQL */ `
  mutation CreateStore(
    $input: CreateStoreInput!
    $condition: ModelStoreConditionInput
  ) {
    createStore(input: $input, condition: $condition) {
      id
      name
      location
      ownerId
      accountId
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
      account {
        id
        ownerId
        ownerEmail
        subscriptionPlanId
        subscriptionStatus
        subscriptionStartDate
        subscriptionEndDate
        lastModifiedBy
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
export const updateStore = /* GraphQL */ `
  mutation UpdateStore(
    $input: UpdateStoreInput!
    $condition: ModelStoreConditionInput
  ) {
    updateStore(input: $input, condition: $condition) {
      id
      name
      location
      ownerId
      accountId
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
      account {
        id
        ownerId
        ownerEmail
        subscriptionPlanId
        subscriptionStatus
        subscriptionStartDate
        subscriptionEndDate
        lastModifiedBy
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
export const deleteStore = /* GraphQL */ `
  mutation DeleteStore(
    $input: DeleteStoreInput!
    $condition: ModelStoreConditionInput
  ) {
    deleteStore(input: $input, condition: $condition) {
      id
      name
      location
      ownerId
      accountId
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
      account {
        id
        ownerId
        ownerEmail
        subscriptionPlanId
        subscriptionStatus
        subscriptionStartDate
        subscriptionEndDate
        lastModifiedBy
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
export const createSaleTransaction = /* GraphQL */ `
  mutation CreateSaleTransaction(
    $input: CreateSaleTransactionInput!
    $condition: ModelSaleTransactionConditionInput
  ) {
    createSaleTransaction(input: $input, condition: $condition) {
      id
      items
      total
      discount
      points
      staffID
      staffName
      storeID
      customerID
      ownerId
      status
      payment_status
      cash_received
      paymentMethod
      change
      notes
      staff {
        id
        name
        password
        ownerId
        accountId
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
        accountId
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
        ownerId
        points
        creditBalance
        allowCredit
        creditLimit
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
export const updateSaleTransaction = /* GraphQL */ `
  mutation UpdateSaleTransaction(
    $input: UpdateSaleTransactionInput!
    $condition: ModelSaleTransactionConditionInput
  ) {
    updateSaleTransaction(input: $input, condition: $condition) {
      id
      items
      total
      discount
      points
      staffID
      staffName
      storeID
      customerID
      ownerId
      status
      payment_status
      cash_received
      paymentMethod
      change
      notes
      staff {
        id
        name
        password
        ownerId
        accountId
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
        accountId
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
        ownerId
        points
        creditBalance
        allowCredit
        creditLimit
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
export const deleteSaleTransaction = /* GraphQL */ `
  mutation DeleteSaleTransaction(
    $input: DeleteSaleTransactionInput!
    $condition: ModelSaleTransactionConditionInput
  ) {
    deleteSaleTransaction(input: $input, condition: $condition) {
      id
      items
      total
      discount
      points
      staffID
      staffName
      storeID
      customerID
      ownerId
      status
      payment_status
      cash_received
      paymentMethod
      change
      notes
      staff {
        id
        name
        password
        ownerId
        accountId
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
        accountId
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
        ownerId
        points
        creditBalance
        allowCredit
        creditLimit
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
export const createSale = /* GraphQL */ `
  mutation CreateSale(
    $input: CreateSaleInput!
    $condition: ModelSaleConditionInput
  ) {
    createSale(input: $input, condition: $condition) {
      id
      productID
      productName
      transactionID
      price
      quantity
      discount
      total
      status
      ownerId
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
        ownerId
        status
        payment_status
        cash_received
        paymentMethod
        change
        notes
        createdAt
        updatedAt
        __typename
      }
      void_reason
      variantData
      addonData
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateSale = /* GraphQL */ `
  mutation UpdateSale(
    $input: UpdateSaleInput!
    $condition: ModelSaleConditionInput
  ) {
    updateSale(input: $input, condition: $condition) {
      id
      productID
      productName
      transactionID
      price
      quantity
      discount
      total
      status
      ownerId
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
        ownerId
        status
        payment_status
        cash_received
        paymentMethod
        change
        notes
        createdAt
        updatedAt
        __typename
      }
      void_reason
      variantData
      addonData
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteSale = /* GraphQL */ `
  mutation DeleteSale(
    $input: DeleteSaleInput!
    $condition: ModelSaleConditionInput
  ) {
    deleteSale(input: $input, condition: $condition) {
      id
      productID
      productName
      transactionID
      price
      quantity
      discount
      total
      status
      ownerId
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
        ownerId
        status
        payment_status
        cash_received
        paymentMethod
        change
        notes
        createdAt
        updatedAt
        __typename
      }
      void_reason
      variantData
      addonData
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createCreditTransaction = /* GraphQL */ `
  mutation CreateCreditTransaction(
    $input: CreateCreditTransactionInput!
    $condition: ModelCreditTransactionConditionInput
  ) {
    createCreditTransaction(input: $input, condition: $condition) {
      id
      customerID
      amount
      type
      remarks
      createdAt
      addedBy
      customer {
        id
        name
        email
        phone
        storeId
        ownerId
        points
        creditBalance
        allowCredit
        creditLimit
        createdAt
        updatedAt
        __typename
      }
      updatedAt
      __typename
    }
  }
`;
export const updateCreditTransaction = /* GraphQL */ `
  mutation UpdateCreditTransaction(
    $input: UpdateCreditTransactionInput!
    $condition: ModelCreditTransactionConditionInput
  ) {
    updateCreditTransaction(input: $input, condition: $condition) {
      id
      customerID
      amount
      type
      remarks
      createdAt
      addedBy
      customer {
        id
        name
        email
        phone
        storeId
        ownerId
        points
        creditBalance
        allowCredit
        creditLimit
        createdAt
        updatedAt
        __typename
      }
      updatedAt
      __typename
    }
  }
`;
export const deleteCreditTransaction = /* GraphQL */ `
  mutation DeleteCreditTransaction(
    $input: DeleteCreditTransactionInput!
    $condition: ModelCreditTransactionConditionInput
  ) {
    deleteCreditTransaction(input: $input, condition: $condition) {
      id
      customerID
      amount
      type
      remarks
      createdAt
      addedBy
      customer {
        id
        name
        email
        phone
        storeId
        ownerId
        points
        creditBalance
        allowCredit
        creditLimit
        createdAt
        updatedAt
        __typename
      }
      updatedAt
      __typename
    }
  }
`;
export const createAddon = /* GraphQL */ `
  mutation CreateAddon(
    $input: CreateAddonInput!
    $condition: ModelAddonConditionInput
  ) {
    createAddon(input: $input, condition: $condition) {
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
export const updateAddon = /* GraphQL */ `
  mutation UpdateAddon(
    $input: UpdateAddonInput!
    $condition: ModelAddonConditionInput
  ) {
    updateAddon(input: $input, condition: $condition) {
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
export const deleteAddon = /* GraphQL */ `
  mutation DeleteAddon(
    $input: DeleteAddonInput!
    $condition: ModelAddonConditionInput
  ) {
    deleteAddon(input: $input, condition: $condition) {
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
export const createVariant = /* GraphQL */ `
  mutation CreateVariant(
    $input: CreateVariantInput!
    $condition: ModelVariantConditionInput
  ) {
    createVariant(input: $input, condition: $condition) {
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
export const updateVariant = /* GraphQL */ `
  mutation UpdateVariant(
    $input: UpdateVariantInput!
    $condition: ModelVariantConditionInput
  ) {
    updateVariant(input: $input, condition: $condition) {
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
export const deleteVariant = /* GraphQL */ `
  mutation DeleteVariant(
    $input: DeleteVariantInput!
    $condition: ModelVariantConditionInput
  ) {
    deleteVariant(input: $input, condition: $condition) {
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
export const createCustomer = /* GraphQL */ `
  mutation CreateCustomer(
    $input: CreateCustomerInput!
    $condition: ModelCustomerConditionInput
  ) {
    createCustomer(input: $input, condition: $condition) {
      id
      name
      email
      phone
      storeId
      ownerId
      points
      creditBalance
      allowCredit
      creditLimit
      purchases {
        nextToken
        __typename
      }
      store {
        id
        name
        location
        ownerId
        accountId
        createdAt
        updatedAt
        __typename
      }
      creditTransactions {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateCustomer = /* GraphQL */ `
  mutation UpdateCustomer(
    $input: UpdateCustomerInput!
    $condition: ModelCustomerConditionInput
  ) {
    updateCustomer(input: $input, condition: $condition) {
      id
      name
      email
      phone
      storeId
      ownerId
      points
      creditBalance
      allowCredit
      creditLimit
      purchases {
        nextToken
        __typename
      }
      store {
        id
        name
        location
        ownerId
        accountId
        createdAt
        updatedAt
        __typename
      }
      creditTransactions {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteCustomer = /* GraphQL */ `
  mutation DeleteCustomer(
    $input: DeleteCustomerInput!
    $condition: ModelCustomerConditionInput
  ) {
    deleteCustomer(input: $input, condition: $condition) {
      id
      name
      email
      phone
      storeId
      ownerId
      points
      creditBalance
      allowCredit
      creditLimit
      purchases {
        nextToken
        __typename
      }
      store {
        id
        name
        location
        ownerId
        accountId
        createdAt
        updatedAt
        __typename
      }
      creditTransactions {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createSupplier = /* GraphQL */ `
  mutation CreateSupplier(
    $input: CreateSupplierInput!
    $condition: ModelSupplierConditionInput
  ) {
    createSupplier(input: $input, condition: $condition) {
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
        accountId
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
export const updateSupplier = /* GraphQL */ `
  mutation UpdateSupplier(
    $input: UpdateSupplierInput!
    $condition: ModelSupplierConditionInput
  ) {
    updateSupplier(input: $input, condition: $condition) {
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
        accountId
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
export const deleteSupplier = /* GraphQL */ `
  mutation DeleteSupplier(
    $input: DeleteSupplierInput!
    $condition: ModelSupplierConditionInput
  ) {
    deleteSupplier(input: $input, condition: $condition) {
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
        accountId
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
export const createExpense = /* GraphQL */ `
  mutation CreateExpense(
    $input: CreateExpenseInput!
    $condition: ModelExpenseConditionInput
  ) {
    createExpense(input: $input, condition: $condition) {
      id
      name
      amount
      date
      storeId
      staffId
      staffName
      ownerId
      category
      notes
      store {
        id
        name
        location
        ownerId
        accountId
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
export const updateExpense = /* GraphQL */ `
  mutation UpdateExpense(
    $input: UpdateExpenseInput!
    $condition: ModelExpenseConditionInput
  ) {
    updateExpense(input: $input, condition: $condition) {
      id
      name
      amount
      date
      storeId
      staffId
      staffName
      ownerId
      category
      notes
      store {
        id
        name
        location
        ownerId
        accountId
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
export const deleteExpense = /* GraphQL */ `
  mutation DeleteExpense(
    $input: DeleteExpenseInput!
    $condition: ModelExpenseConditionInput
  ) {
    deleteExpense(input: $input, condition: $condition) {
      id
      name
      amount
      date
      storeId
      staffId
      staffName
      ownerId
      category
      notes
      store {
        id
        name
        location
        ownerId
        accountId
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
export const createCartItem = /* GraphQL */ `
  mutation CreateCartItem(
    $input: CreateCartItemInput!
    $condition: ModelCartItemConditionInput
  ) {
    createCartItem(input: $input, condition: $condition) {
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
      variantData
      addonData
      addon
      store {
        id
        name
        location
        ownerId
        accountId
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
        accountId
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
export const updateCartItem = /* GraphQL */ `
  mutation UpdateCartItem(
    $input: UpdateCartItemInput!
    $condition: ModelCartItemConditionInput
  ) {
    updateCartItem(input: $input, condition: $condition) {
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
      variantData
      addonData
      addon
      store {
        id
        name
        location
        ownerId
        accountId
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
        accountId
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
export const deleteCartItem = /* GraphQL */ `
  mutation DeleteCartItem(
    $input: DeleteCartItemInput!
    $condition: ModelCartItemConditionInput
  ) {
    deleteCartItem(input: $input, condition: $condition) {
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
      variantData
      addonData
      addon
      store {
        id
        name
        location
        ownerId
        accountId
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
        accountId
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
export const createInventoryRequest = /* GraphQL */ `
  mutation CreateInventoryRequest(
    $input: CreateInventoryRequestInput!
    $condition: ModelInventoryRequestConditionInput
  ) {
    createInventoryRequest(input: $input, condition: $condition) {
      id
      storeId
      status
      requestDate
      fulfillmentDate
      requestedBy
      processedBy
      ownerId
      priority
      notes
      store {
        id
        name
        location
        ownerId
        accountId
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
export const updateInventoryRequest = /* GraphQL */ `
  mutation UpdateInventoryRequest(
    $input: UpdateInventoryRequestInput!
    $condition: ModelInventoryRequestConditionInput
  ) {
    updateInventoryRequest(input: $input, condition: $condition) {
      id
      storeId
      status
      requestDate
      fulfillmentDate
      requestedBy
      processedBy
      ownerId
      priority
      notes
      store {
        id
        name
        location
        ownerId
        accountId
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
export const deleteInventoryRequest = /* GraphQL */ `
  mutation DeleteInventoryRequest(
    $input: DeleteInventoryRequestInput!
    $condition: ModelInventoryRequestConditionInput
  ) {
    deleteInventoryRequest(input: $input, condition: $condition) {
      id
      storeId
      status
      requestDate
      fulfillmentDate
      requestedBy
      processedBy
      ownerId
      priority
      notes
      store {
        id
        name
        location
        ownerId
        accountId
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
export const createRequestItem = /* GraphQL */ `
  mutation CreateRequestItem(
    $input: CreateRequestItemInput!
    $condition: ModelRequestItemConditionInput
  ) {
    createRequestItem(input: $input, condition: $condition) {
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
        ownerId
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
export const updateRequestItem = /* GraphQL */ `
  mutation UpdateRequestItem(
    $input: UpdateRequestItemInput!
    $condition: ModelRequestItemConditionInput
  ) {
    updateRequestItem(input: $input, condition: $condition) {
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
        ownerId
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
export const deleteRequestItem = /* GraphQL */ `
  mutation DeleteRequestItem(
    $input: DeleteRequestItemInput!
    $condition: ModelRequestItemConditionInput
  ) {
    deleteRequestItem(input: $input, condition: $condition) {
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
        ownerId
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
export const createSubscriptionPlan = /* GraphQL */ `
  mutation CreateSubscriptionPlan(
    $input: CreateSubscriptionPlanInput!
    $condition: ModelSubscriptionPlanConditionInput
  ) {
    createSubscriptionPlan(input: $input, condition: $condition) {
      id
      name
      description
      price
      interval
      storeLimit
      staffPerStoreLimit
      adminPerStoreLimit
      features
      isActive
      accounts {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateSubscriptionPlan = /* GraphQL */ `
  mutation UpdateSubscriptionPlan(
    $input: UpdateSubscriptionPlanInput!
    $condition: ModelSubscriptionPlanConditionInput
  ) {
    updateSubscriptionPlan(input: $input, condition: $condition) {
      id
      name
      description
      price
      interval
      storeLimit
      staffPerStoreLimit
      adminPerStoreLimit
      features
      isActive
      accounts {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteSubscriptionPlan = /* GraphQL */ `
  mutation DeleteSubscriptionPlan(
    $input: DeleteSubscriptionPlanInput!
    $condition: ModelSubscriptionPlanConditionInput
  ) {
    deleteSubscriptionPlan(input: $input, condition: $condition) {
      id
      name
      description
      price
      interval
      storeLimit
      staffPerStoreLimit
      adminPerStoreLimit
      features
      isActive
      accounts {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createAccount = /* GraphQL */ `
  mutation CreateAccount(
    $input: CreateAccountInput!
    $condition: ModelAccountConditionInput
  ) {
    createAccount(input: $input, condition: $condition) {
      id
      ownerId
      ownerEmail
      subscriptionPlanId
      subscriptionStatus
      subscriptionStartDate
      subscriptionEndDate
      lastModifiedBy
      stores {
        nextToken
        __typename
      }
      staff {
        nextToken
        __typename
      }
      subscriptionPlan {
        id
        name
        description
        price
        interval
        storeLimit
        staffPerStoreLimit
        adminPerStoreLimit
        features
        isActive
        createdAt
        updatedAt
        __typename
      }
      subscriptionHistory {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateAccount = /* GraphQL */ `
  mutation UpdateAccount(
    $input: UpdateAccountInput!
    $condition: ModelAccountConditionInput
  ) {
    updateAccount(input: $input, condition: $condition) {
      id
      ownerId
      ownerEmail
      subscriptionPlanId
      subscriptionStatus
      subscriptionStartDate
      subscriptionEndDate
      lastModifiedBy
      stores {
        nextToken
        __typename
      }
      staff {
        nextToken
        __typename
      }
      subscriptionPlan {
        id
        name
        description
        price
        interval
        storeLimit
        staffPerStoreLimit
        adminPerStoreLimit
        features
        isActive
        createdAt
        updatedAt
        __typename
      }
      subscriptionHistory {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteAccount = /* GraphQL */ `
  mutation DeleteAccount(
    $input: DeleteAccountInput!
    $condition: ModelAccountConditionInput
  ) {
    deleteAccount(input: $input, condition: $condition) {
      id
      ownerId
      ownerEmail
      subscriptionPlanId
      subscriptionStatus
      subscriptionStartDate
      subscriptionEndDate
      lastModifiedBy
      stores {
        nextToken
        __typename
      }
      staff {
        nextToken
        __typename
      }
      subscriptionPlan {
        id
        name
        description
        price
        interval
        storeLimit
        staffPerStoreLimit
        adminPerStoreLimit
        features
        isActive
        createdAt
        updatedAt
        __typename
      }
      subscriptionHistory {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createSubscriptionHistory = /* GraphQL */ `
  mutation CreateSubscriptionHistory(
    $input: CreateSubscriptionHistoryInput!
    $condition: ModelSubscriptionHistoryConditionInput
  ) {
    createSubscriptionHistory(input: $input, condition: $condition) {
      id
      accountId
      changeDate
      changedBy
      previousPlanId
      newPlanId
      account {
        id
        ownerId
        ownerEmail
        subscriptionPlanId
        subscriptionStatus
        subscriptionStartDate
        subscriptionEndDate
        lastModifiedBy
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
export const updateSubscriptionHistory = /* GraphQL */ `
  mutation UpdateSubscriptionHistory(
    $input: UpdateSubscriptionHistoryInput!
    $condition: ModelSubscriptionHistoryConditionInput
  ) {
    updateSubscriptionHistory(input: $input, condition: $condition) {
      id
      accountId
      changeDate
      changedBy
      previousPlanId
      newPlanId
      account {
        id
        ownerId
        ownerEmail
        subscriptionPlanId
        subscriptionStatus
        subscriptionStartDate
        subscriptionEndDate
        lastModifiedBy
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
export const deleteSubscriptionHistory = /* GraphQL */ `
  mutation DeleteSubscriptionHistory(
    $input: DeleteSubscriptionHistoryInput!
    $condition: ModelSubscriptionHistoryConditionInput
  ) {
    deleteSubscriptionHistory(input: $input, condition: $condition) {
      id
      accountId
      changeDate
      changedBy
      previousPlanId
      newPlanId
      account {
        id
        ownerId
        ownerEmail
        subscriptionPlanId
        subscriptionStatus
        subscriptionStartDate
        subscriptionEndDate
        lastModifiedBy
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
export const createStaffStore = /* GraphQL */ `
  mutation CreateStaffStore(
    $input: CreateStaffStoreInput!
    $condition: ModelStaffStoreConditionInput
  ) {
    createStaffStore(input: $input, condition: $condition) {
      id
      staffId
      storeId
      staff {
        id
        name
        password
        ownerId
        accountId
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
        accountId
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
export const updateStaffStore = /* GraphQL */ `
  mutation UpdateStaffStore(
    $input: UpdateStaffStoreInput!
    $condition: ModelStaffStoreConditionInput
  ) {
    updateStaffStore(input: $input, condition: $condition) {
      id
      staffId
      storeId
      staff {
        id
        name
        password
        ownerId
        accountId
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
        accountId
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
export const deleteStaffStore = /* GraphQL */ `
  mutation DeleteStaffStore(
    $input: DeleteStaffStoreInput!
    $condition: ModelStaffStoreConditionInput
  ) {
    deleteStaffStore(input: $input, condition: $condition) {
      id
      staffId
      storeId
      staff {
        id
        name
        password
        ownerId
        accountId
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
        accountId
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
