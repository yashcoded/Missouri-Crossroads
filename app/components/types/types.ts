export interface Location {
  id: string;
  organizationName: string;
  yearEstablished?: string;
  builtPlaced?: string;
  address: string;
  siteTypeCategory?: string;
  tertiaryCategories?: string;
  lat?: number;
  lng?: number;
  fullAddress?: string;
  needsGeocoding?: boolean;
  [key: string]: any; // Allow additional properties
}


