// this is an auto generated file. This will be overwritten

export const onCreateStaff = /* GraphQL */ `
  subscription OnCreateStaff($filter: ModelSubscriptionStaffFilterInput) {
    onCreateStaff(filter: $filter) {
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
export const onUpdateStaff = /* GraphQL */ `
  subscription OnUpdateStaff($filter: ModelSubscriptionStaffFilterInput) {
    onUpdateStaff(filter: $filter) {
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
export const onDeleteStaff = /* GraphQL */ `
  subscription OnDeleteStaff($filter: ModelSubscriptionStaffFilterInput) {
    onDeleteStaff(filter: $filter) {
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
export const onCreateCategory = /* GraphQL */ `
  subscription OnCreateCategory($filter: ModelSubscriptionCategoryFilterInput) {
    onCreateCategory(filter: $filter) {
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
export const onUpdateCategory = /* GraphQL */ `
  subscription OnUpdateCategory($filter: ModelSubscriptionCategoryFilterInput) {
    onUpdateCategory(filter: $filter) {
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
export const onDeleteCategory = /* GraphQL */ `
  subscription OnDeleteCategory($filter: ModelSubscriptionCategoryFilterInput) {
    onDeleteCategory(filter: $filter) {
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
export const onCreateWarehouseProduct = /* GraphQL */ `
  subscription OnCreateWarehouseProduct(
    $filter: ModelSubscriptionWarehouseProductFilterInput
  ) {
    onCreateWarehouseProduct(filter: $filter) {
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
export const onUpdateWarehouseProduct = /* GraphQL */ `
  subscription OnUpdateWarehouseProduct(
    $filter: ModelSubscriptionWarehouseProductFilterInput
  ) {
    onUpdateWarehouseProduct(filter: $filter) {
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
export const onDeleteWarehouseProduct = /* GraphQL */ `
  subscription OnDeleteWarehouseProduct(
    $filter: ModelSubscriptionWarehouseProductFilterInput
  ) {
    onDeleteWarehouseProduct(filter: $filter) {
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
export const onCreateProduct = /* GraphQL */ `
  subscription OnCreateProduct($filter: ModelSubscriptionProductFilterInput) {
    onCreateProduct(filter: $filter) {
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
export const onUpdateProduct = /* GraphQL */ `
  subscription OnUpdateProduct($filter: ModelSubscriptionProductFilterInput) {
    onUpdateProduct(filter: $filter) {
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
export const onDeleteProduct = /* GraphQL */ `
  subscription OnDeleteProduct($filter: ModelSubscriptionProductFilterInput) {
    onDeleteProduct(filter: $filter) {
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
export const onCreateStore = /* GraphQL */ `
  subscription OnCreateStore($filter: ModelSubscriptionStoreFilterInput) {
    onCreateStore(filter: $filter) {
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
export const onUpdateStore = /* GraphQL */ `
  subscription OnUpdateStore($filter: ModelSubscriptionStoreFilterInput) {
    onUpdateStore(filter: $filter) {
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
export const onDeleteStore = /* GraphQL */ `
  subscription OnDeleteStore($filter: ModelSubscriptionStoreFilterInput) {
    onDeleteStore(filter: $filter) {
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
export const onCreateSaleTransaction = /* GraphQL */ `
  subscription OnCreateSaleTransaction(
    $filter: ModelSubscriptionSaleTransactionFilterInput
  ) {
    onCreateSaleTransaction(filter: $filter) {
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
export const onUpdateSaleTransaction = /* GraphQL */ `
  subscription OnUpdateSaleTransaction(
    $filter: ModelSubscriptionSaleTransactionFilterInput
  ) {
    onUpdateSaleTransaction(filter: $filter) {
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
export const onDeleteSaleTransaction = /* GraphQL */ `
  subscription OnDeleteSaleTransaction(
    $filter: ModelSubscriptionSaleTransactionFilterInput
  ) {
    onDeleteSaleTransaction(filter: $filter) {
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
export const onCreateSale = /* GraphQL */ `
  subscription OnCreateSale($filter: ModelSubscriptionSaleFilterInput) {
    onCreateSale(filter: $filter) {
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
export const onUpdateSale = /* GraphQL */ `
  subscription OnUpdateSale($filter: ModelSubscriptionSaleFilterInput) {
    onUpdateSale(filter: $filter) {
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
export const onDeleteSale = /* GraphQL */ `
  subscription OnDeleteSale($filter: ModelSubscriptionSaleFilterInput) {
    onDeleteSale(filter: $filter) {
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
export const onCreateCreditTransaction = /* GraphQL */ `
  subscription OnCreateCreditTransaction(
    $filter: ModelSubscriptionCreditTransactionFilterInput
  ) {
    onCreateCreditTransaction(filter: $filter) {
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
export const onUpdateCreditTransaction = /* GraphQL */ `
  subscription OnUpdateCreditTransaction(
    $filter: ModelSubscriptionCreditTransactionFilterInput
  ) {
    onUpdateCreditTransaction(filter: $filter) {
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
export const onDeleteCreditTransaction = /* GraphQL */ `
  subscription OnDeleteCreditTransaction(
    $filter: ModelSubscriptionCreditTransactionFilterInput
  ) {
    onDeleteCreditTransaction(filter: $filter) {
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
export const onCreateAddon = /* GraphQL */ `
  subscription OnCreateAddon($filter: ModelSubscriptionAddonFilterInput) {
    onCreateAddon(filter: $filter) {
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
export const onUpdateAddon = /* GraphQL */ `
  subscription OnUpdateAddon($filter: ModelSubscriptionAddonFilterInput) {
    onUpdateAddon(filter: $filter) {
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
export const onDeleteAddon = /* GraphQL */ `
  subscription OnDeleteAddon($filter: ModelSubscriptionAddonFilterInput) {
    onDeleteAddon(filter: $filter) {
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
export const onCreateVariant = /* GraphQL */ `
  subscription OnCreateVariant($filter: ModelSubscriptionVariantFilterInput) {
    onCreateVariant(filter: $filter) {
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
export const onUpdateVariant = /* GraphQL */ `
  subscription OnUpdateVariant($filter: ModelSubscriptionVariantFilterInput) {
    onUpdateVariant(filter: $filter) {
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
export const onDeleteVariant = /* GraphQL */ `
  subscription OnDeleteVariant($filter: ModelSubscriptionVariantFilterInput) {
    onDeleteVariant(filter: $filter) {
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
export const onCreateCustomer = /* GraphQL */ `
  subscription OnCreateCustomer($filter: ModelSubscriptionCustomerFilterInput) {
    onCreateCustomer(filter: $filter) {
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
export const onUpdateCustomer = /* GraphQL */ `
  subscription OnUpdateCustomer($filter: ModelSubscriptionCustomerFilterInput) {
    onUpdateCustomer(filter: $filter) {
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
export const onDeleteCustomer = /* GraphQL */ `
  subscription OnDeleteCustomer($filter: ModelSubscriptionCustomerFilterInput) {
    onDeleteCustomer(filter: $filter) {
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
export const onCreateSupplier = /* GraphQL */ `
  subscription OnCreateSupplier($filter: ModelSubscriptionSupplierFilterInput) {
    onCreateSupplier(filter: $filter) {
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
export const onUpdateSupplier = /* GraphQL */ `
  subscription OnUpdateSupplier($filter: ModelSubscriptionSupplierFilterInput) {
    onUpdateSupplier(filter: $filter) {
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
export const onDeleteSupplier = /* GraphQL */ `
  subscription OnDeleteSupplier($filter: ModelSubscriptionSupplierFilterInput) {
    onDeleteSupplier(filter: $filter) {
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
export const onCreateExpense = /* GraphQL */ `
  subscription OnCreateExpense($filter: ModelSubscriptionExpenseFilterInput) {
    onCreateExpense(filter: $filter) {
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
export const onUpdateExpense = /* GraphQL */ `
  subscription OnUpdateExpense($filter: ModelSubscriptionExpenseFilterInput) {
    onUpdateExpense(filter: $filter) {
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
export const onDeleteExpense = /* GraphQL */ `
  subscription OnDeleteExpense($filter: ModelSubscriptionExpenseFilterInput) {
    onDeleteExpense(filter: $filter) {
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
export const onCreateCartItem = /* GraphQL */ `
  subscription OnCreateCartItem($filter: ModelSubscriptionCartItemFilterInput) {
    onCreateCartItem(filter: $filter) {
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
export const onUpdateCartItem = /* GraphQL */ `
  subscription OnUpdateCartItem($filter: ModelSubscriptionCartItemFilterInput) {
    onUpdateCartItem(filter: $filter) {
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
export const onDeleteCartItem = /* GraphQL */ `
  subscription OnDeleteCartItem($filter: ModelSubscriptionCartItemFilterInput) {
    onDeleteCartItem(filter: $filter) {
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
export const onCreateInventoryRequest = /* GraphQL */ `
  subscription OnCreateInventoryRequest(
    $filter: ModelSubscriptionInventoryRequestFilterInput
  ) {
    onCreateInventoryRequest(filter: $filter) {
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
export const onUpdateInventoryRequest = /* GraphQL */ `
  subscription OnUpdateInventoryRequest(
    $filter: ModelSubscriptionInventoryRequestFilterInput
  ) {
    onUpdateInventoryRequest(filter: $filter) {
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
export const onDeleteInventoryRequest = /* GraphQL */ `
  subscription OnDeleteInventoryRequest(
    $filter: ModelSubscriptionInventoryRequestFilterInput
  ) {
    onDeleteInventoryRequest(filter: $filter) {
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
export const onCreateRequestItem = /* GraphQL */ `
  subscription OnCreateRequestItem(
    $filter: ModelSubscriptionRequestItemFilterInput
  ) {
    onCreateRequestItem(filter: $filter) {
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
export const onUpdateRequestItem = /* GraphQL */ `
  subscription OnUpdateRequestItem(
    $filter: ModelSubscriptionRequestItemFilterInput
  ) {
    onUpdateRequestItem(filter: $filter) {
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
export const onDeleteRequestItem = /* GraphQL */ `
  subscription OnDeleteRequestItem(
    $filter: ModelSubscriptionRequestItemFilterInput
  ) {
    onDeleteRequestItem(filter: $filter) {
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
export const onCreateSubscriptionPlan = /* GraphQL */ `
  subscription OnCreateSubscriptionPlan(
    $filter: ModelSubscriptionSubscriptionPlanFilterInput
  ) {
    onCreateSubscriptionPlan(filter: $filter) {
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
export const onUpdateSubscriptionPlan = /* GraphQL */ `
  subscription OnUpdateSubscriptionPlan(
    $filter: ModelSubscriptionSubscriptionPlanFilterInput
  ) {
    onUpdateSubscriptionPlan(filter: $filter) {
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
export const onDeleteSubscriptionPlan = /* GraphQL */ `
  subscription OnDeleteSubscriptionPlan(
    $filter: ModelSubscriptionSubscriptionPlanFilterInput
  ) {
    onDeleteSubscriptionPlan(filter: $filter) {
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
export const onCreateAccount = /* GraphQL */ `
  subscription OnCreateAccount($filter: ModelSubscriptionAccountFilterInput) {
    onCreateAccount(filter: $filter) {
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
export const onUpdateAccount = /* GraphQL */ `
  subscription OnUpdateAccount($filter: ModelSubscriptionAccountFilterInput) {
    onUpdateAccount(filter: $filter) {
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
export const onDeleteAccount = /* GraphQL */ `
  subscription OnDeleteAccount($filter: ModelSubscriptionAccountFilterInput) {
    onDeleteAccount(filter: $filter) {
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
export const onCreateSubscriptionHistory = /* GraphQL */ `
  subscription OnCreateSubscriptionHistory(
    $filter: ModelSubscriptionSubscriptionHistoryFilterInput
  ) {
    onCreateSubscriptionHistory(filter: $filter) {
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
export const onUpdateSubscriptionHistory = /* GraphQL */ `
  subscription OnUpdateSubscriptionHistory(
    $filter: ModelSubscriptionSubscriptionHistoryFilterInput
  ) {
    onUpdateSubscriptionHistory(filter: $filter) {
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
export const onDeleteSubscriptionHistory = /* GraphQL */ `
  subscription OnDeleteSubscriptionHistory(
    $filter: ModelSubscriptionSubscriptionHistoryFilterInput
  ) {
    onDeleteSubscriptionHistory(filter: $filter) {
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
export const onCreateStaffStore = /* GraphQL */ `
  subscription OnCreateStaffStore(
    $filter: ModelSubscriptionStaffStoreFilterInput
  ) {
    onCreateStaffStore(filter: $filter) {
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
export const onUpdateStaffStore = /* GraphQL */ `
  subscription OnUpdateStaffStore(
    $filter: ModelSubscriptionStaffStoreFilterInput
  ) {
    onUpdateStaffStore(filter: $filter) {
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
export const onDeleteStaffStore = /* GraphQL */ `
  subscription OnDeleteStaffStore(
    $filter: ModelSubscriptionStaffStoreFilterInput
  ) {
    onDeleteStaffStore(filter: $filter) {
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
