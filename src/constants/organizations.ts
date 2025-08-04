/**
 * ORGANIZATIONAL CONSTANTS
 * 
 * Centralized constants for organization-specific logic
 */

export const ORGANIZATION_CONSTANTS = {
  SONIC_CITY: {
    FOLDER_ID: "34f3469f-02bd-4ecf-82f9-11a4e88c2d77",
    EXCLUDED_EMAILS: ["dev@soniccity.no"]
  }
} as const;

// Convenience exports
export const SONIC_CITY_FOLDER_ID = ORGANIZATION_CONSTANTS.SONIC_CITY.FOLDER_ID;
export const SONIC_CITY_EXCLUDED_EMAILS = ORGANIZATION_CONSTANTS.SONIC_CITY.EXCLUDED_EMAILS;