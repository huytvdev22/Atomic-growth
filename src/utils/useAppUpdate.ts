/**
 * Re-export useAppUpdate từ UpdateContext để đảm bảo thống nhất state toàn cục
 */
export { useAppUpdate } from '../context/UpdateContext';
export type { UpdateContextType as AppUpdateState, VersionInfo } from '../context/UpdateContext';
