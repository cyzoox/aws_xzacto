// Type declarations for navigation components
import React from 'react';

declare module '*/WarehouseNavigator' {
  interface WarehouseNavigatorProps {
    staffData: any;
  }

  const WarehouseNavigator: React.FC<WarehouseNavigatorProps>;
  export default WarehouseNavigator;
}

declare module '*/DrawerNavigation' {
  interface DrawerNavigatorProps {
    route: {
      params?: {
        staffData: any;
      };
    };
  }

  const DrawerNavigator: React.FC<DrawerNavigatorProps>;
  export default DrawerNavigator;
}

declare module '*/SuperAdminNavigator' {
  interface SuperAdminNavigatorProps {
    route: {
      params?: {
        staffData: any;
      };
    };
  }

  const SuperAdminNavigator: React.FC<SuperAdminNavigatorProps>;
  export default SuperAdminNavigator;
}
