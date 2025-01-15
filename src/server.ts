import express from "express";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import { Response, Request } from "express";

import dotenv from "dotenv";

dotenv.config();

const key = process.env.KEY;

if (!key) {
  console.error("SERVER ERROR: Key is not in .env");
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

const app = express();
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

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
