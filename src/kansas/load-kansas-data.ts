import { promises as fs } from "fs";
import path from "path";
import { KansasLegislatorRaw } from "./kansas-types";

export async function loadKansasData(): Promise<KansasLegislatorRaw[]> {
  try {
    // Get the path to the CSV file
    const csvPath = path.join(process.cwd(), "src/server/kansas.csv");

    // Read the file
    const fileContent = await fs.readFile(csvPath, "utf-8");

    // Parse CSV (simple parser since we know the format)
    const rows = fileContent.split("\n").filter((row) => row.trim());
    const headers = rows[0]?.split(",") || [];

    if (headers.length === 0) {
      throw new Error("Invalid CSV format: No headers found");
    }

    // Convert rows to objects (skip header row)
    const data = rows.slice(1).map((row) => {
      const values = row.split(",");
      const record: KansasLegislatorRaw = {
        FID: values[0] || "",
        DISTRICT: values[1] || "",
        NAME: values[2] || "",
        FULLNAME: values[3] || "",
        EMAIL: values[4] || "",
        URL: values[5] || "",
        DISTRICT_N: values[6] || "",
        Shape__Area: values[7] || "",
        Shape__Length: values[8] || "",
      };
      return record;
    });

    return data;
  } catch (error) {
    console.error("Error loading Kansas data:", error);
    return [];
  }
}
