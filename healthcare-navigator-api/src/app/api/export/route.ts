import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "doctors";

    let data: any[] = [];

    const seedData = await import("@/data/seed");

    switch (type) {
      case "doctors":
        data = seedData.doctors;
        break;
      case "hospitals":
        data = seedData.hospitals;
        break;
      case "specialties":
        data = seedData.specialties;
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (data.length === 0) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row: any) =>
        headers.map((h) => {
          const val = row[h];
          if (Array.isArray(val)) return `"${val.join("; ")}"`;
          if (typeof val === "string" && (val.includes(",") || val.includes('"')))
            return `"${val.replace(/"/g, '""')}"`;
          return val ?? "";
        }).join(",")
      ),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${type}_export.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
