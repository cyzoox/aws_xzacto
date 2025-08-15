import { Schema } from '@aws-amplify/datastore';

export const schema = {
  models: {
    StoreSettings: {
      name: "StoreSettings",
      fields: {
        id: {
          name: "id",
          isArray: false,
          type: "ID",
          isRequired: true,
          attributes: []
        },
        storeId: {
          name: "storeId",
          isArray: false,
          type: "ID",
          isRequired: true,
          attributes: []
        },
        address: {
          name: "address",
          isArray: false,
          type: "String",
          isRequired: false,
          attributes: []
        },
        phone: {
          name: "phone",
          isArray: false,
          type: "String",
          isRequired: false,
          attributes: []
        },
        email: {
          name: "email",
          isArray: false,
          type: "String",
          isRequired: false,
          attributes: []
        },
        logoUrl: {
          name: "logoUrl",
          isArray: false,
          type: "String",
          isRequired: false,
          attributes: []
        },
        vatPercentage: {
          name: "vatPercentage",
          isArray: false,
          type: "Float",
          isRequired: false,
          attributes: []
        },
        lowStockThreshold: {
          name: "lowStockThreshold",
          isArray: false,
          type: "Int",
          isRequired: false,
          attributes: []
        },
        allowCashierSalesView: {
          name: "allowCashierSalesView",
          isArray: false,
          type: "Boolean",
          isRequired: false,
          attributes: []
        },
        allowCreditSales: {
          name: "allowCreditSales",
          isArray: false,
          type: "Boolean",
          isRequired: false,
          attributes: []
        },
        currencySymbol: {
          name: "currencySymbol",
          isArray: false,
          type: "String",
          isRequired: false,
          attributes: []
        },
        receiptFooterText: {
          name: "receiptFooterText",
          isArray: false,
          type: "String",
          isRequired: false,
          attributes: []
        },
        businessHours: {
          name: "businessHours",
          isArray: false,
          type: "String",
          isRequired: false,
          attributes: []
        },
        createdAt: {
          name: "createdAt",
          isArray: false,
          type: "AWSDateTime",
          isRequired: false,
          attributes: []
        },
        updatedAt: {
          name: "updatedAt",
          isArray: false,
          type: "AWSDateTime",
          isRequired: false,
          attributes: []
        }
      },
      syncable: true,
      pluralName: "StoreSettings",
      attributes: [
        {
          type: "model",
          properties: {}
        },
        {
          type: "key",
          properties: {
            name: "byStoreId",
            fields: ["storeId"]
          }
        },
        {
          type: "auth",
          properties: {
            rules: [
              {
                provider: "userPools",
                ownerField: "owner",
                allow: "owner",
                identityClaim: "cognito:username",
                operations: [
                  "create",
                  "update",
                  "delete",
                  "read"
                ]
              },
              {
                allow: "public",
                operations: [
                  "create",
                  "update",
                  "delete",
                  "read"
                ]
              }
            ]
          }
        }
      ]
    }
  },
  enums: {},
  nonModels: {},
  codegenVersion: "3.4.4",
  version: "LATEST"
};
