interface GeoPoint {
  lat: number;
  lng: number;
}

// Census API Response Types
interface CensusApiResponse {
  result: {
    input: CensusInput;
    addressMatches: CensusAddressMatch[];
  };
}

interface CensusInput {
  address: {
    zip: string;
    city: string;
    street: string;
    state: string;
  };
  vintage: {
    isDefault: boolean;
    id: string;
    vintageName: string;
    vintageDescription: string;
  };
  benchmark: {
    isDefault: boolean;
    benchmarkDescription: string;
    id: string;
    benchmarkName: string;
  };
}

interface CensusAddressMatch {
  tigerLine: {
    side: string;
    tigerLineId: string;
  };
  geographies: {
    States?: Array<CensusState>;
    "2024 State Legislative Districts - Upper"?: Array<CensusLegislativeDistrict>;
    [key: string]: any; // For other geography types we don't need
  };
  coordinates: {
    x: number; // longitude
    y: number; // latitude
  };
  addressComponents: {
    zip: string;
    streetName: string;
    preType: string;
    city: string;
    preDirection: string;
    suffixDirection: string;
    fromAddress: string;
    state: string;
    suffixType: string;
    toAddress: string;
    suffixQualifier: string;
    preQualifier: string;
  };
  matchedAddress: string;
}

interface CensusState {
  STATENS: string;
  GEOID: string;
  STATE: string;
  STUSAB: string;
  NAME: string;
  [key: string]: string; // For other state properties we don't need
}

interface CensusLegislativeDistrict {
  GEOID: string;
  SLDU: string;
  NAME: string;
  STATE: string;
  [key: string]: string; // For other district properties we don't need
}

export interface KansasGeoResponse {
  found: boolean;
  districtNumber?: string;
  error?: string;
  coordinates?: GeoPoint;
}

export async function getKansasDistrictFromGeo(
  censusData: CensusApiResponse
): Promise<KansasGeoResponse> {
  try {
    const addressMatch = censusData.result.addressMatches[0];
    if (!addressMatch) {
      return {
        found: false,
        error: "No address match found in Census data",
      };
    }

    // Get the state legislative district info
    const legislativeDistrict =
      addressMatch.geographies["2024 State Legislative Districts - Upper"]?.[0];

    if (!legislativeDistrict) {
      return {
        found: false,
        error: "No Kansas legislative district found for this address",
      };
    }

    // Extract the district number from SLDU (removes leading zeros)
    const districtNumber = parseInt(legislativeDistrict.SLDU).toString();

    // Get the coordinates from the address match
    const coordinates: GeoPoint = {
      lat: addressMatch.coordinates.y,
      lng: addressMatch.coordinates.x,
    };

    return {
      found: true,
      districtNumber,
      coordinates,
    };
  } catch (error) {
    console.error("Error processing Kansas district geo data:", error);
    return {
      found: false,
      error: "Failed to process Kansas district geographical data",
    };
  }
}
