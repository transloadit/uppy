import fs from "fs";
import path from "path";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// TUS protocol implementation for React Router 7 resource routes
export async function action({ request }: { request: Request }) {
  const url = new URL(request.url);
  const method = request.method;

  // Handle TUS OPTIONS request
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, HEAD, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Upload-Offset, Upload-Length, Tus-Resumable, Upload-Metadata, Content-Type",
        "Access-Control-Expose-Headers": "Upload-Offset, Upload-Length, Tus-Resumable, Location",
        "Tus-Resumable": "1.0.0",
        "Tus-Version": "1.0.0",
        "Tus-Extension": "creation,expiration",
      },
    });
  }

  // Handle TUS POST request (create upload)
  if (method === "POST") {
    const uploadLength = request.headers.get("Upload-Length");
    
    if (!uploadLength) {
      return new Response("Upload-Length header is required", { status: 400 });
    }

    // Generate unique upload ID
    const uploadId = Date.now().toString() + Math.random().toString(36).substring(2);
    const filePath = path.join(uploadsDir, uploadId);
    
    // Create empty file
    fs.writeFileSync(filePath, "");
    
    return new Response(null, {
      status: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "Location, Tus-Resumable",
        "Location": `/upload/${uploadId}`,
        "Tus-Resumable": "1.0.0",
      },
    });
  }

  // Handle TUS PATCH request (upload data)
  if (method === "PATCH") {
    const uploadId = url.pathname.split("/").pop();
    if (!uploadId) {
      return new Response("Upload ID is required", { status: 400 });
    }

    const filePath = path.join(uploadsDir, uploadId);
    const offset = parseInt(request.headers.get("Upload-Offset") || "0");
    
    if (!fs.existsSync(filePath)) {
      return new Response("Upload not found", { status: 404 });
    }

    try {
      const data = await request.arrayBuffer();
      const buffer = Buffer.from(data);
      
      // Append data to file
      const fd = fs.openSync(filePath, "r+");
      fs.writeSync(fd, buffer, 0, buffer.length, offset);
      fs.closeSync(fd);
      
      const newOffset = offset + buffer.length;
      
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Expose-Headers": "Upload-Offset, Tus-Resumable",
          "Upload-Offset": newOffset.toString(),
          "Tus-Resumable": "1.0.0",
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
      return new Response("Upload failed", { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const method = request.method;

  // Handle TUS HEAD request (get upload status)
  if (method === "HEAD") {
    const uploadId = url.pathname.split("/").pop();
    if (!uploadId) {
      return new Response("Upload ID is required", { status: 400 });
    }

    const filePath = path.join(uploadsDir, uploadId);
    
    if (!fs.existsSync(filePath)) {
      return new Response("Upload not found", { status: 404 });
    }

    const stats = fs.statSync(filePath);
    
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "Upload-Offset, Upload-Length, Tus-Resumable",
        "Upload-Offset": stats.size.toString(),
        "Tus-Resumable": "1.0.0",
        "Cache-Control": "no-store",
      },
    });
  }

  return new Response("Method not allowed", { status: 405 });
}
