/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getTodo = /* GraphQL */ `
  query GetTodo($id: ID!) {
    getTodo(id: $id) {
      id
      name
      description
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listTodos = /* GraphQL */ `
  query ListTodos(
    $filter: ModelTodoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTodos(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        description
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
        oprice
        sprice
        stock
        category
        sku
        img
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
export const getSupplier = /* GraphQL */ `
  query GetSupplier($id: ID!) {
    getSupplier(id: $id) {
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
        contact
        address
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
export const listExpenses = /* GraphQL */ `
  query ListExpenses(
    $filter: ModelExpenseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listExpenses(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getSale = /* GraphQL */ `
  query GetSale($id: ID!) {
    getSale(id: $id) {
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
export const listSales = /* GraphQL */ `
  query ListSales(
    $filter: ModelSaleFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSales(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getStore = /* GraphQL */ `
  query GetStore($id: ID!) {
    getStore(id: $id) {
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
export const listStores = /* GraphQL */ `
  query ListStores(
    $filter: ModelStoreFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listStores(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getCategory = /* GraphQL */ `
  query GetCategory($id: ID!) {
    getCategory(id: $id) {
      id
      storeId
      name
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
        storeId
        name
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getStaff = /* GraphQL */ `
  query GetStaff($id: ID!) {
    getStaff(id: $id) {
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
      nextToken
      __typename
    }
  }
`;
export const getList = /* GraphQL */ `
  query GetList($id: ID!) {
    getList(id: $id) {
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
export const listLists = /* GraphQL */ `
  query ListLists(
    $filter: ModelListFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listLists(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getSaleTransaction = /* GraphQL */ `
  query GetSaleTransaction($id: ID!) {
    getSaleTransaction(id: $id) {
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
      nextToken
      __typename
    }
  }
`;
export const getDiscount = /* GraphQL */ `
  query GetDiscount($id: ID!) {
    getDiscount(id: $id) {
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
export const listDiscounts = /* GraphQL */ `
  query ListDiscounts(
    $filter: ModelDiscountFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listDiscounts(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
