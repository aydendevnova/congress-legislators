import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import {
  type KansasDistrict,
  type KansasDistrictMap,
  type KansasLegislatorRaw,
} from "./kansas-types";

export const KANSAS_STATE_CODE = "KS";
export const KANSAS_STATE_NAME = "Kansas";

// Load Kansas legislators data
export const loadKansasLegislators = (): Map<string, any> => {
  try {
    // In production, the CSV file will be in dist/kansas
    const filePath = path.join(process.cwd(), "dist", "kansas", "kansas.csv");
    console.log("Attempting to load Kansas CSV from:", filePath);

    const csvContent = fs.readFileSync(filePath, "utf8");
    console.log("Successfully loaded Kansas CSV");

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    }) as KansasLegislatorRaw[];

    const legislatorsMap = new Map();
    records.forEach((record) => {
      legislatorsMap.set(record.DISTRICT_N, {
        name: record.NAME,
        fullName: record.FULLNAME,
        email: record.EMAIL,
        url: record.URL,
        district: record.DISTRICT_N,
        shape: {
          area: parseFloat(record.Shape__Area),
          length: parseFloat(record.Shape__Length),
        },
      });
    });
    return legislatorsMap;
  } catch (error) {
    console.error("Error loading Kansas legislators file:", error);
    console.error("Current directory:", process.cwd());
    console.error("__dirname:", __dirname);
    throw new Error("Failed to load Kansas legislators data");
  }
};

// Create Kansas Districts Map from legislators data
export const createKansasDistrictsMap = (
  legislators: Map<string, any>
): KansasDistrictMap => {
  const districts: KansasDistrictMap = {};

  legislators.forEach((legislator, districtNumber) => {
    districts[districtNumber] = {
      districtNumber,
      representative: legislator.fullName,
      counties: [], // TODO: Add counties when available
      officeAddress: "300 SW 10th Ave, Topeka, KS 66612", // Default office address
    };
  });

  return districts;
};

// Load the data
export const kansasLegislators = loadKansasLegislators();
export const KANSAS_DISTRICTS = createKansasDistrictsMap(kansasLegislators);

// Helper function to check if a district exists
export function isValidKansasDistrict(districtNumber: string): boolean {
  return KANSAS_DISTRICTS.hasOwnProperty(districtNumber);
}

// Helper function to get district information
export function getKansasDistrict(
  districtNumber: string
): KansasDistrict | undefined {
  return KANSAS_DISTRICTS[districtNumber];
}
