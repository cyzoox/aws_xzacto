import { ModelInit, MutableModel, Schema, SchemaModel } from '@aws-amplify/datastore';

// Define store interface for TypeScript type checking
export interface StoreInterface {
  id: string;
  name: string;
  location?: string;
}

// Interface for StoreSettings for TypeScript type checking
export interface StoreSettingsInterface {
  id: string;
  storeId: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  vatPercentage?: number | null;
  lowStockThreshold?: number | null;
  allowCashierSalesView?: boolean | null;
  allowCreditSales?: boolean | null;
  currencySymbol?: string | null;
  receiptFooterText?: string | null;
  businessHours?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  store?: StoreInterface | null;
}

// Actual implementation class for DataStore
export class StoreSettings implements StoreSettingsInterface {
  public id: string;
  public storeId: string;
  public address?: string | null;
  public phone?: string | null;
  public email?: string | null;
  public logoUrl?: string | null;
  public vatPercentage?: number | null;
  public lowStockThreshold?: number | null;
  public allowCashierSalesView?: boolean | null;
  public allowCreditSales?: boolean | null;
  public currencySymbol?: string | null;
  public receiptFooterText?: string | null;
  public businessHours?: string | null;
  public createdAt?: string | null;
  public updatedAt?: string | null;
  public store?: StoreInterface | null;
  
  constructor(init: Partial<StoreSettingsInterface>) {
    this.id = init.id!;
    this.storeId = init.storeId!;
    this.address = init.address;
    this.phone = init.phone;
    this.email = init.email;
    this.logoUrl = init.logoUrl;
    this.vatPercentage = init.vatPercentage;
    this.lowStockThreshold = init.lowStockThreshold;
    this.allowCashierSalesView = init.allowCashierSalesView;
    this.allowCreditSales = init.allowCreditSales;
    this.currencySymbol = init.currencySymbol;
    this.receiptFooterText = init.receiptFooterText;
    this.businessHours = init.businessHours;
    this.createdAt = init.createdAt;
    this.updatedAt = init.updatedAt;
    this.store = init.store;
  }
  
  // Static copyOf method for DataStore compatibility
  static copyOf(
    source: StoreSettings, 
    mutator: (draft: MutableModel<StoreSettings>) => MutableModel<StoreSettings> | void
  ): StoreSettings {
    const copy = new StoreSettings({...source});
    mutator(copy as unknown as MutableModel<StoreSettings>);
    return copy;
  }
}

export const schema = {
  models: {
    StoreSettings: {
      name: "StoreSettings",
      pluralName: "StoreSettings",
      fields: {
        id: { name: "id", type: "ID", isRequired: true, isArray: false },
        storeId: { name: "storeId", type: "ID", isRequired: true, isArray: false },
        address: { name: "address", type: "String", isRequired: false, isArray: false },
        phone: { name: "phone", type: "String", isRequired: false, isArray: false },
        email: { name: "email", type: "String", isRequired: false, isArray: false },
        logoUrl: { name: "logoUrl", type: "String", isRequired: false, isArray: false },
        vatPercentage: { name: "vatPercentage", type: "Float", isRequired: false, isArray: false },
        lowStockThreshold: { name: "lowStockThreshold", type: "Int", isRequired: false, isArray: false },
        allowCashierSalesView: { name: "allowCashierSalesView", type: "Boolean", isRequired: false, isArray: false },
        allowCreditSales: { name: "allowCreditSales", type: "Boolean", isRequired: false, isArray: false },
        currencySymbol: { name: "currencySymbol", type: "String", isRequired: false, isArray: false },
        receiptFooterText: { name: "receiptFooterText", type: "String", isRequired: false, isArray: false },
        businessHours: { name: "businessHours", type: "String", isRequired: false, isArray: false },
        createdAt: { name: "createdAt", type: "AWSDateTime", isRequired: true, isArray: false },
        updatedAt: { name: "updatedAt", type: "AWSDateTime", isRequired: true, isArray: false },
        store: { name: "store", type: { model: "Store" }, isRequired: false, isArray: false },
      },
      syncable: true,
      hasRelationships: true,
    }
  },
  enums: {},
  version: "1",
  codegenVersion: "3.4.4"
};
