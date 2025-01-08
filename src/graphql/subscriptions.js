/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateTodo = /* GraphQL */ `
  subscription OnCreateTodo($filter: ModelSubscriptionTodoFilterInput) {
    onCreateTodo(filter: $filter) {
      id
      name
      description
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateTodo = /* GraphQL */ `
  subscription OnUpdateTodo($filter: ModelSubscriptionTodoFilterInput) {
    onUpdateTodo(filter: $filter) {
      id
      name
      description
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteTodo = /* GraphQL */ `
  subscription OnDeleteTodo($filter: ModelSubscriptionTodoFilterInput) {
    onDeleteTodo(filter: $filter) {
      id
      name
      description
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
      oprice
      sprice
      stock
      category
      sku
      img
      storeId
      addons {
        id
        name
        price
        cost
        __typename
      }
      variants {
        id
        name
        price
        cost
        __typename
      }
      options {
        id
        option
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
      oprice
      sprice
      stock
      category
      sku
      img
      storeId
      addons {
        id
        name
        price
        cost
        __typename
      }
      variants {
        id
        name
        price
        cost
        __typename
      }
      options {
        id
        option
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
      oprice
      sprice
      stock
      category
      sku
      img
      storeId
      addons {
        id
        name
        price
        cost
        __typename
      }
      variants {
        id
        name
        price
        cost
        __typename
      }
      options {
        id
        option
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
      contact
      address
      storeId
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
      contact
      address
      storeId
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
      contact
      address
      storeId
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
      description
      storeId
      category
      attendant
      attendantId
      amount
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
      description
      storeId
      category
      attendant
      attendantId
      amount
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
      description
      storeId
      category
      attendant
      attendantId
      amount
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
      cashierId
      storeId
      productId
      transactionId
      productName
      quantity
      price
      total
      paymentMethod
      status
      void_reason
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
      cashierId
      storeId
      productId
      transactionId
      productName
      quantity
      price
      total
      paymentMethod
      status
      void_reason
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
      cashierId
      storeId
      productId
      transactionId
      productName
      quantity
      price
      total
      paymentMethod
      status
      void_reason
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
      store_name
      branch
      owner
      password
      store_type
      lowstock
      vat
      cashierview
      allow_credit
      headers
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
      store_name
      branch
      owner
      password
      store_type
      lowstock
      vat
      cashierview
      allow_credit
      headers
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
      store_name
      branch
      owner
      password
      store_type
      lowstock
      vat
      cashierview
      allow_credit
      headers
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
      storeId
      name
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
      storeId
      name
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
      storeId
      name
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreateStaff = /* GraphQL */ `
  subscription OnCreateStaff($filter: ModelSubscriptionStaffFilterInput) {
    onCreateStaff(filter: $filter) {
      id
      name
      password
      role
      store_id
      store_name
      device_id
      device_name
      status
      log_status
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
      role
      store_id
      store_name
      device_id
      device_name
      status
      log_status
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
      role
      store_id
      store_name
      device_id
      device_name
      status
      log_status
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
      address
      mobile_no
      tel_no
      credit_balance
      store
      storeId
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
      address
      mobile_no
      tel_no
      credit_balance
      store
      storeId
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
      address
      mobile_no
      tel_no
      credit_balance
      store
      storeId
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreateList = /* GraphQL */ `
  subscription OnCreateList($filter: ModelSubscriptionListFilterInput) {
    onCreateList(filter: $filter) {
      id
      name
      brand
      oprice
      sprice
      unit
      category
      storeId
      productId
      cashierId
      quantity
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateList = /* GraphQL */ `
  subscription OnUpdateList($filter: ModelSubscriptionListFilterInput) {
    onUpdateList(filter: $filter) {
      id
      name
      brand
      oprice
      sprice
      unit
      category
      storeId
      productId
      cashierId
      quantity
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteList = /* GraphQL */ `
  subscription OnDeleteList($filter: ModelSubscriptionListFilterInput) {
    onDeleteList(filter: $filter) {
      id
      name
      brand
      oprice
      sprice
      unit
      category
      storeId
      productId
      cashierId
      quantity
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
      store
      storeId
      customerName
      customerId
      total
      cashier
      cashierId
      paymentMethod
      status
      totalItems
      discount
      discountName
      vat
      received
      change
      profit
      void_reason
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
      store
      storeId
      customerName
      customerId
      total
      cashier
      cashierId
      paymentMethod
      status
      totalItems
      discount
      discountName
      vat
      received
      change
      profit
      void_reason
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
      store
      storeId
      customerName
      customerId
      total
      cashier
      cashierId
      paymentMethod
      status
      totalItems
      discount
      discountName
      vat
      received
      change
      profit
      void_reason
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreateDiscount = /* GraphQL */ `
  subscription OnCreateDiscount($filter: ModelSubscriptionDiscountFilterInput) {
    onCreateDiscount(filter: $filter) {
      id
      transactionId
      total
      cashier
      cashierId
      store
      storeId
      customer
      customerId
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateDiscount = /* GraphQL */ `
  subscription OnUpdateDiscount($filter: ModelSubscriptionDiscountFilterInput) {
    onUpdateDiscount(filter: $filter) {
      id
      transactionId
      total
      cashier
      cashierId
      store
      storeId
      customer
      customerId
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteDiscount = /* GraphQL */ `
  subscription OnDeleteDiscount($filter: ModelSubscriptionDiscountFilterInput) {
    onDeleteDiscount(filter: $filter) {
      id
      transactionId
      total
      cashier
      cashierId
      store
      storeId
      customer
      customerId
      createdAt
      updatedAt
      __typename
    }
  }
`;
