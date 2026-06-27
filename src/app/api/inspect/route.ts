import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";

export async function GET() {
  const getTags = (filename: string) => {
    try {
      const p = path.resolve(process.cwd(), "src/templates", filename);
      const content = fs.readFileSync(p, "binary");
      const zip = new PizZip(content);
      const xml = zip.file("word/document.xml")?.asText() || "";
      
      // We will look for { and } combinations
      const rawMatches = xml.match(/\{[^}]+\}/g) || [];
      return rawMatches;
    } catch (e: any) {
      return [e.message];
    }
  };

  return NextResponse.json({
    wcr_tags: getTags("1. WCR_Undertaking_Guarantee_Aadhar.docx"),
    agreement_tags: getTags("4. NET_METERING_CONNECTION_AGREEMENT.docx")
  });
}
