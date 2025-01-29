import {
  type KansasDistrictResponse,
  type KansasLookupResult,
} from "./kansas-types";
import {
  KANSAS_STATE_CODE,
  KANSAS_STATE_NAME,
  isValidKansasDistrict,
  getKansasDistrict,
} from "./kansas-districts";

export function isKansasState(stateCode: string): boolean {
  return stateCode.toUpperCase() === KANSAS_STATE_CODE;
}

export function lookupKansasDistrict(
  districtNumber: string
): KansasLookupResult {
  if (!isValidKansasDistrict(districtNumber)) {
    return {
      found: false,
      error: `Invalid Kansas district number: ${districtNumber}`,
    };
  }

  const district = getKansasDistrict(districtNumber);
  if (!district) {
    return {
      found: false,
      error: `District ${districtNumber} not found in Kansas database`,
    };
  }

  return {
    found: true,
    district,
  };
}

export function formatKansasDistrictResponse(
  districtNumber: string
): KansasDistrictResponse | null {
  const result = lookupKansasDistrict(districtNumber);

  if (!result.found || !result.district) {
    return null;
  }

  return {
    state: KANSAS_STATE_NAME,
    stateCode: KANSAS_STATE_CODE,
    districtNumber: result.district.districtNumber,
    fullDistrict: `${KANSAS_STATE_NAME}'s ${
      result.district.districtNumber
    }${getOrdinalSuffix(result.district.districtNumber)} Senate District`,
    representative: result.district.representative,
    officeAddress: result.district.officeAddress,
  };
}

// Helper function to get ordinal suffix
function getOrdinalSuffix(num: string): string {
  const n = parseInt(num);
  if (n > 3 && n < 21) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
