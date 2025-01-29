import express from "express";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import cors from "cors";
import { Response, Request } from "express";
import dotenv from "dotenv";
import { parse } from "csv-parse/sync";
import {
  getKansasDistrictFromGeo,
  type KansasGeoResponse,
} from "./kansas/kansas-geo";
import {
  KANSAS_STATE_CODE,
  KANSAS_STATE_NAME,
  isValidKansasDistrict,
  getKansasDistrict,
  kansasLegislators,
} from "./kansas/kansas-districts";
import {
  type KansasDistrictResponse,
  type KansasDistrict,
} from "./kansas/kansas-types";

dotenv.config();

const key = process.env.KEY;

if (!key) {
  console.error("SERVER ERROR: Key is not in .env");
}

// Kansas related interfaces
interface GeoPoint {
  lat: number;
  lng: number;
}

interface CensusAddressMatch {
  geographies: {
    "2024 State Legislative Districts - Upper"?: Array<{
      GEOID: string;
      SLDU: string;
      NAME: string;
      INTPTLAT: string;
      INTPTLON: string;
      AREAWATER: string;
      AREALAND: string;
    }>;
  };
  coordinates: {
    x: number; // longitude
    y: number; // latitude
  };
}

// Define interfaces for the legislator data structure
interface Legislator {
  id: {
    bioguide: string;
    fec?: string[];
    govtrack?: number;
    wikipedia?: string;
    wikidata?: string;
    google_entity_id?: string;
    ballotpedia?: string;
  };
  name: {
    first: string;
    middle?: string;
    last: string;
    official_full?: string;
    nickname?: string;
  };
  bio: {
    gender: string;
    birthday: string;
  };
  terms: Array<{
    type: string;
    start: string;
    end: string;
    state: string;
    district?: string;
    party: string;
    url?: string;
    address?: string;
    phone?: string;
    contact_form?: string;
    office?: string;
    state_rank?: string;
  }>;
}

// New interface for the response
interface LegislatorAddress {
  name: string;
  officeAddress?: string;
  error?: string;
}

const app = express();

// Add CORS middleware
app.use(
  cors({
    origin: true, // Allow all origins
    methods: ["GET", "POST"], // Allow only GET and POST methods
    allowedHeaders: ["Content-Type"], // Allow Content-Type header
    credentials: true, // Allow credentials
  })
);

app.use(express.json());

// Load YAML data file
const loadLegislators = (): Legislator[] => {
  try {
    const filePath = path.join(
      __dirname,
      "..",
      "congress-legislators",
      "legislators-current.yaml"
    );
    const fileContents = fs.readFileSync(filePath, "utf8");
    return yaml.load(fileContents) as Legislator[];
  } catch (error) {
    console.error("Error loading legislators file:", error);
    return [];
  }
};

// Load legislators data
const legislators = loadLegislators();

// Helper function to normalize strings for comparison
const normalizeString = (str: string): string => {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

// Helper function to find legislator by name
const findLegislatorByName = (searchName: string): Legislator | undefined => {
  const normalizedSearch = normalizeString(searchName);

  return legislators.find((legislator) => {
    // Check first + last name combination
    const fullName = `${legislator.name.first} ${legislator.name.last}`;
    if (normalizeString(fullName) === normalizedSearch) return true;

    // Check official full name if available
    if (
      legislator.name.official_full &&
      normalizeString(legislator.name.official_full) === normalizedSearch
    ) {
      return true;
    }

    // Check nickname + last name if available
    if (legislator.name.nickname) {
      const nicknameFull = `${legislator.name.nickname} ${legislator.name.last}`;
      if (normalizeString(nicknameFull) === normalizedSearch) return true;
    }

    return false;
  });
};

// API endpoint
app.get("/api/legislator", (req: Request, res: Response): void => {
  const { name, key } = req.query;

  if (!key) {
    res.status(400).json({ error: "key required" });
  }

  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "Name parameter is required" });
    return;
  }

  try {
    const legislator = findLegislatorByName(name);

    if (!legislator) {
      res.status(404).json({
        error: `No legislator found with name: ${name}`,
      });
      return;
    }

    // Get current term
    const currentTerm = legislator.terms[legislator.terms.length - 1];

    // Format response
    const response = {
      name: {
        first: legislator.name.first,
        middle: legislator.name.middle,
        last: legislator.name.last,
        official_full: legislator.name.official_full,
        nickname: legislator.name.nickname,
      },
      bio: legislator.bio,
      ids: legislator.id,
      current_role: {
        type: currentTerm.type,
        state: currentTerm.state,
        district: currentTerm.district,
        party: currentTerm.party,
        start: currentTerm.start,
        end: currentTerm.end,
        url: currentTerm.url,
        address: currentTerm.address,
        phone: currentTerm.phone,
        contact_form: currentTerm.contact_form,
        office: currentTerm.office,
        state_rank: currentTerm.state_rank,
      },
      all_terms: legislator.terms,
    };

    res.json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error finding legislator" });
  }
});

// Update the API endpoint to handle array of names
app.post("/api/legislators/addresses", (req: Request, res: Response): void => {
  const { names, key } = req.body;

  if (!key) {
    res.status(400).json({ error: "key required" });
  }

  if (!Array.isArray(names)) {
    res.status(400).json({ error: "Names must be provided as an array" });
    return;
  }

  try {
    const results: LegislatorAddress[] = names.map((name) => {
      const legislator = findLegislatorByName(name);

      if (!legislator) {
        return {
          name,
          error: `No legislator found with name: ${name}`,
        };
      }

      // Get current term
      const currentTerm = legislator.terms[legislator.terms.length - 1];

      return {
        name:
          legislator.name.official_full ||
          `${legislator.name.first} ${legislator.name.last}`,
        officeAddress: currentTerm.address || "No office address available",
      };
    });

    res.json(results);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error finding legislators" });
  }
});

// Kansas District by Address endpoint
app.post(
  "/api/kansas/district/address",
  async (req: Request, res: Response): Promise<void> => {
    console.log("Received request to /api/kansas/district/address");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const { censusData, key } = req.body;

    if (!key) {
      console.log("Missing required key");
      res.status(400).json({ error: "key required" });
      return;
    }

    if (!censusData || !censusData.result) {
      console.log("Invalid census data:", censusData);
      res.status(400).json({
        error: "Valid Census API response is required",
      });
      return;
    }

    try {
      const geoResponse = await getKansasDistrictFromGeo(censusData);
      console.log("Geo response:", geoResponse);

      if (!geoResponse.found || !geoResponse.districtNumber) {
        console.log("No district found in geo response");
        res.status(404).json({
          error:
            geoResponse.error ||
            "No Kansas legislative district found for this address",
        });
        return;
      }

      console.log(
        "Looking up district info for district:",
        geoResponse.districtNumber
      );
      const district = getKansasDistrict(geoResponse.districtNumber);

      if (!district) {
        console.log("No district information found");
        res.status(404).json({
          error: `No district information found for district ${geoResponse.districtNumber}`,
        });
        return;
      }

      // Get additional information from our Kansas legislators map
      console.log(
        "Looking up legislator info for district:",
        geoResponse.districtNumber
      );
      const legislator = kansasLegislators.get(geoResponse.districtNumber);
      console.log("Found legislator:", legislator);

      const response = {
        state: KANSAS_STATE_NAME,
        stateCode: KANSAS_STATE_CODE,
        districtNumber: district.districtNumber,
        fullDistrict: `KS Senate District ${district.districtNumber}`,
        coordinates: geoResponse.coordinates,
        representative: district.representative,
        officeAddress: district.officeAddress,
        email: legislator?.email,
        url: legislator?.url,
      };
      console.log("Sending response:", response);
      res.json(response);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Error finding Kansas district" });
    }
  }
);

// Update coordinates endpoint to use getKansasDistrictFromGeo
app.post(
  "/api/kansas/representative/coordinates",
  async (req: Request, res: Response): Promise<void> => {
    const { addressMatch, key } = req.body;

    if (!key) {
      res.status(400).json({ error: "key required" });
      return;
    }

    if (!addressMatch || !addressMatch.geographies) {
      res.status(400).json({
        error: "addressMatch with Census geographic data is required",
      });
      return;
    }

    try {
      const geoResponse = await getKansasDistrictFromGeo(addressMatch);

      if (!geoResponse.found || !geoResponse.districtNumber) {
        res.status(404).json({
          error:
            geoResponse.error ||
            "No Kansas legislative district found for these coordinates",
        });
        return;
      }

      const district = getKansasDistrict(geoResponse.districtNumber);

      if (!district) {
        res.status(404).json({
          error: `No representative found for district ${geoResponse.districtNumber}`,
        });
        return;
      }

      // Get additional information from our Kansas legislators map
      const legislator = kansasLegislators.get(geoResponse.districtNumber);

      const response: KansasDistrictResponse = {
        state: KANSAS_STATE_NAME,
        stateCode: KANSAS_STATE_CODE,
        districtNumber: district.districtNumber,
        fullDistrict: `KS Senate District ${district.districtNumber}`,
        representative: district.representative,
        officeAddress: district.officeAddress,
        email: legislator?.email,
        url: legislator?.url,
      };

      res.json(response);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Error finding Kansas representative" });
    }
  }
);

// Kansas Representative by District endpoint
app.get(
  "/api/kansas/representative/district/:districtNumber",
  async (req: Request, res: Response): Promise<void> => {
    const { districtNumber } = req.params;
    const { key } = req.query;

    if (!key) {
      res.status(400).json({ error: "key required" });
      return;
    }

    if (!districtNumber) {
      res.status(400).json({ error: "district number is required" });
      return;
    }

    try {
      if (!isValidKansasDistrict(districtNumber)) {
        res.status(404).json({
          error: `Invalid Kansas district number: ${districtNumber}`,
        });
        return;
      }

      const district = getKansasDistrict(districtNumber);

      if (!district) {
        res.status(404).json({
          error: `No representative found for district ${districtNumber}`,
        });
        return;
      }

      // Get additional information from our Kansas legislators map
      const legislator = kansasLegislators.get(districtNumber);

      const response: KansasDistrictResponse = {
        state: KANSAS_STATE_NAME,
        stateCode: KANSAS_STATE_CODE,
        districtNumber: district.districtNumber,
        fullDistrict: `KS Senate District ${district.districtNumber}`,
        representative: district.representative,
        officeAddress: district.officeAddress,
        email: legislator?.email,
        url: legislator?.url,
      };

      res.json(response);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Error finding Kansas representative" });
    }
  }
);

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
