export interface KansasDistrict {
  districtNumber: string;
  representative: string;
  counties: string[];
  officeAddress: string;
}

export interface KansasDistrictMap {
  [key: string]: KansasDistrict;
}

export interface KansasDistrictResponse {
  state: string;
  stateCode: string;
  districtNumber: string;
  fullDistrict: string;
  representative: string;
  officeAddress: string;
  email?: string;
  url?: string;
}

export interface KansasLookupResult {
  found: boolean;
  district?: KansasDistrict;
  error?: string;
}

export interface KansasLegislatorRaw {
  FID: string;
  DISTRICT: string;
  NAME: string;
  FULLNAME: string;
  EMAIL: string;
  URL: string;
  DISTRICT_N: string;
  Shape__Area: string;
  Shape__Length: string;
}
