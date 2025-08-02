import React from 'react';
import OriginalWarehouseNavigator from './WarehouseNavigator';
import {RouteProp} from '@react-navigation/native';

// Define the param list type for all screens
type RootStackParamList = {
  WarehouseApp: {staffData: any | null};
};

// Define the props type for the wrapper component
type WarehouseScreenRouteProp = RouteProp<RootStackParamList, 'WarehouseApp'>;

type Props = {
  route: WarehouseScreenRouteProp;
};

// This wrapper component properly handles the route params and passes staffData
const WarehouseNavigatorWrapper: React.FC<Props> = ({route}) => {
  // Extract staffData from route params
  const {staffData} = route.params;

  // Pass staffData directly to original navigator
  return <OriginalWarehouseNavigator staffData={staffData} />;
};

export default WarehouseNavigatorWrapper;
