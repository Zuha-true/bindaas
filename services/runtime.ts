import Constants, { AppOwnership } from 'expo-constants';

/** True for Expo Go, where project-specific native modules are not available. */
export const isExpoGo = Constants.appOwnership === AppOwnership.Expo || Constants.expoGoConfig != null;
