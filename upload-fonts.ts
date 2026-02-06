import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load env from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Missing SUPABASE env vars.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
});

async function uploadFonts() {
    console.log("--- Uploading Fonts ---");
    const bucketName = "report-assets"; // Use a generic assets bucket

    // Ensure Bucket
    const { data: buckets } = await supabase.storage.listBuckets();
    const targetBucket = buckets?.find(b => b.name === bucketName);

    if (!targetBucket) {
        console.log(`Creating bucket '${bucketName}'...`);
        await supabase.storage.createBucket(bucketName, { public: true });
    } else {
        // Ensure public
        if (!targetBucket.public) {
            await supabase.storage.updateBucket(bucketName, { public: true });
        }
    }

    // Upload Files
    const fontDir = path.resolve(process.cwd(), "font");
    const filesToUpload = [
        { name: "Freesentation-4Regular.ttf", uploadName: "Freesentation-Regular.ttf" },
        { name: "Freesentation-7Bold.ttf", uploadName: "Freesentation-Bold.ttf" }
    ];

    const urls: Record<string, string> = {};

    for (const file of filesToUpload) {
        const filePath = path.join(fontDir, file.name);
        const fileBuffer = fs.readFileSync(filePath);

        console.log(`Uploading ${file.name}...`);
        const { error } = await supabase.storage
            .from(bucketName)
            .upload(`fonts/${file.uploadName}`, fileBuffer, {
                contentType: "font/ttf",
                upsert: true,
            });

        if (error) {
            console.error(`Failed to upload ${file.name}:`, error);
        } else {
            const { data } = supabase.storage
                .from(bucketName)
                .getPublicUrl(`fonts/${file.uploadName}`);

            console.log(`Uploaded! URL: ${data.publicUrl}`);
            urls[file.name] = data.publicUrl;
        }
    }
}

uploadFonts();
