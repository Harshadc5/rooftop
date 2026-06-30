import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  
  if (!lat || !lon) return new NextResponse("Missing lat/lon", { status: 400 });

  try {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    let response;
    let url = "";

    const fetchEsri = async () => {
      // Calculate OSM Tile X and Y from Lat/Lon
      const zoom = 17;
      const n = Math.pow(2, zoom);
      const x = Math.floor((lonNum + 180) / 360 * n);
      const latRad = latNum * Math.PI / 180;
      const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
      const esriUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
      return await fetch(esriUrl, { headers: { 'User-Agent': 'Rooftop-Solar-App/1.0' } });
    };

    if (apiKey) {
      url = `https://maps.googleapis.com/maps/api/staticmap?center=${latNum},${lonNum}&zoom=18&size=256x256&maptype=satellite&key=${apiKey}&markers=color:red%7C${latNum},${lonNum}`;
      response = await fetch(url);
      
      // If Google Maps fails (e.g. billing issue), fallback to Esri
      if (!response.ok) {
        console.warn("Google Maps Static API failed, falling back to Esri Satellite...", response.statusText);
        response = await fetchEsri();
      }
    } else {
      response = await fetchEsri();
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch map tile: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Return as Base64 to avoid CORS Canvas Tainting issues on the frontend
    const base64 = `data:image/png;base64,${buffer.toString("base64")}`;
    
    return NextResponse.json({ base64 });
  } catch (e: any) {
    console.error("Map Proxy Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
