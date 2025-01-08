/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createTodo = /* GraphQL */ `
  mutation CreateTodo(
    $input: CreateTodoInput!
    $condition: ModelTodoConditionInput
  ) {
    createTodo(input: $input, condition: $condition) {
      id
      name
      description
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateTodo = /* GraphQL */ `
  mutation UpdateTodo(
    $input: UpdateTodoInput!
    $condition: ModelTodoConditionInput
  ) {
    updateTodo(input: $input, condition: $condition) {
      id
      name
      description
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteTodo = /* GraphQL */ `
  mutation DeleteTodo(
    $input: DeleteTodoInput!
    $condition: ModelTodoConditionInput
  ) {
    deleteTodo(input: $input, condition: $condition) {
      id
      name
      description
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
export const updateProduct = /* GraphQL */ `
  mutation UpdateProduct(
    $input: UpdateProductInput!
    $condition: ModelProductConditionInput
  ) {
    updateProduct(input: $input, condition: $condition) {
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
export const deleteProduct = /* GraphQL */ `
  mutation DeleteProduct(
    $input: DeleteProductInput!
    $condition: ModelProductConditionInput
  ) {
    deleteProduct(input: $input, condition: $condition) {
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
export const createSupplier = /* GraphQL */ `
  mutation CreateSupplier(
    $input: CreateSupplierInput!
    $condition: ModelSupplierConditionInput
  ) {
    createSupplier(input: $input, condition: $condition) {
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
export const updateSupplier = /* GraphQL */ `
  mutation UpdateSupplier(
    $input: UpdateSupplierInput!
    $condition: ModelSupplierConditionInput
  ) {
    updateSupplier(input: $input, condition: $condition) {
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
export const deleteSupplier = /* GraphQL */ `
  mutation DeleteSupplier(
    $input: DeleteSupplierInput!
    $condition: ModelSupplierConditionInput
  ) {
    deleteSupplier(input: $input, condition: $condition) {
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
export const createExpense = /* GraphQL */ `
  mutation CreateExpense(
    $input: CreateExpenseInput!
    $condition: ModelExpenseConditionInput
  ) {
    createExpense(input: $input, condition: $condition) {
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
export const updateExpense = /* GraphQL */ `
  mutation UpdateExpense(
    $input: UpdateExpenseInput!
    $condition: ModelExpenseConditionInput
  ) {
    updateExpense(input: $input, condition: $condition) {
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
export const deleteExpense = /* GraphQL */ `
  mutation DeleteExpense(
    $input: DeleteExpenseInput!
    $condition: ModelExpenseConditionInput
  ) {
    deleteExpense(input: $input, condition: $condition) {
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
export const createSale = /* GraphQL */ `
  mutation CreateSale(
    $input: CreateSaleInput!
    $condition: ModelSaleConditionInput
  ) {
    createSale(input: $input, condition: $condition) {
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
export const updateSale = /* GraphQL */ `
  mutation UpdateSale(
    $input: UpdateSaleInput!
    $condition: ModelSaleConditionInput
  ) {
    updateSale(input: $input, condition: $condition) {
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
export const deleteSale = /* GraphQL */ `
  mutation DeleteSale(
    $input: DeleteSaleInput!
    $condition: ModelSaleConditionInput
  ) {
    deleteSale(input: $input, condition: $condition) {
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
export const createStore = /* GraphQL */ `
  mutation CreateStore(
    $input: CreateStoreInput!
    $condition: ModelStoreConditionInput
  ) {
    createStore(input: $input, condition: $condition) {
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
export const updateStore = /* GraphQL */ `
  mutation UpdateStore(
    $input: UpdateStoreInput!
    $condition: ModelStoreConditionInput
  ) {
    updateStore(input: $input, condition: $condition) {
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
export const deleteStore = /* GraphQL */ `
  mutation DeleteStore(
    $input: DeleteStoreInput!
    $condition: ModelStoreConditionInput
  ) {
    deleteStore(input: $input, condition: $condition) {
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
export const createCategory = /* GraphQL */ `
  mutation CreateCategory(
    $input: CreateCategoryInput!
    $condition: ModelCategoryConditionInput
  ) {
    createCategory(input: $input, condition: $condition) {
      id
      storeId
      name
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
      storeId
      name
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
      storeId
      name
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createStaff = /* GraphQL */ `
  mutation CreateStaff(
    $input: CreateStaffInput!
    $condition: ModelStaffConditionInput
  ) {
    createStaff(input: $input, condition: $condition) {
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
export const updateStaff = /* GraphQL */ `
  mutation UpdateStaff(
    $input: UpdateStaffInput!
    $condition: ModelStaffConditionInput
  ) {
    updateStaff(input: $input, condition: $condition) {
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
export const deleteStaff = /* GraphQL */ `
  mutation DeleteStaff(
    $input: DeleteStaffInput!
    $condition: ModelStaffConditionInput
  ) {
    deleteStaff(input: $input, condition: $condition) {
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
export const createCustomer = /* GraphQL */ `
  mutation CreateCustomer(
    $input: CreateCustomerInput!
    $condition: ModelCustomerConditionInput
  ) {
    createCustomer(input: $input, condition: $condition) {
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
export const updateCustomer = /* GraphQL */ `
  mutation UpdateCustomer(
    $input: UpdateCustomerInput!
    $condition: ModelCustomerConditionInput
  ) {
    updateCustomer(input: $input, condition: $condition) {
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
export const deleteCustomer = /* GraphQL */ `
  mutation DeleteCustomer(
    $input: DeleteCustomerInput!
    $condition: ModelCustomerConditionInput
  ) {
    deleteCustomer(input: $input, condition: $condition) {
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
export const createList = /* GraphQL */ `
  mutation CreateList(
    $input: CreateListInput!
    $condition: ModelListConditionInput
  ) {
    createList(input: $input, condition: $condition) {
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
export const updateList = /* GraphQL */ `
  mutation UpdateList(
    $input: UpdateListInput!
    $condition: ModelListConditionInput
  ) {
    updateList(input: $input, condition: $condition) {
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
export const deleteList = /* GraphQL */ `
  mutation DeleteList(
    $input: DeleteListInput!
    $condition: ModelListConditionInput
  ) {
    deleteList(input: $input, condition: $condition) {
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
export const createSaleTransaction = /* GraphQL */ `
  mutation CreateSaleTransaction(
    $input: CreateSaleTransactionInput!
    $condition: ModelSaleTransactionConditionInput
  ) {
    createSaleTransaction(input: $input, condition: $condition) {
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
export const updateSaleTransaction = /* GraphQL */ `
  mutation UpdateSaleTransaction(
    $input: UpdateSaleTransactionInput!
    $condition: ModelSaleTransactionConditionInput
  ) {
    updateSaleTransaction(input: $input, condition: $condition) {
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
export const deleteSaleTransaction = /* GraphQL */ `
  mutation DeleteSaleTransaction(
    $input: DeleteSaleTransactionInput!
    $condition: ModelSaleTransactionConditionInput
  ) {
    deleteSaleTransaction(input: $input, condition: $condition) {
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
export const createDiscount = /* GraphQL */ `
  mutation CreateDiscount(
    $input: CreateDiscountInput!
    $condition: ModelDiscountConditionInput
  ) {
    createDiscount(input: $input, condition: $condition) {
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
export const updateDiscount = /* GraphQL */ `
  mutation UpdateDiscount(
    $input: UpdateDiscountInput!
    $condition: ModelDiscountConditionInput
  ) {
    updateDiscount(input: $input, condition: $condition) {
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
export const deleteDiscount = /* GraphQL */ `
  mutation DeleteDiscount(
    $input: DeleteDiscountInput!
    $condition: ModelDiscountConditionInput
  ) {
    deleteDiscount(input: $input, condition: $condition) {
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
