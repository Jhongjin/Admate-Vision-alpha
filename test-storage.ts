import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load env from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.warn(".env.local not found at", envPath);
    dotenv.config(); // try default
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log("Supabase URL:", SUPABASE_URL);
console.log("Service Key defined:", !!SERVICE_KEY);

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Missing SUPABASE env vars.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

async function testUpload() {
    console.log("--- Starting Storage Upload Test ---");
    const bucketName = "report-images";

    // 1. List Buckets
    const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
    if (bucketErr) {
        console.error("Failed to list buckets:", bucketErr);
        return;
    }
    console.log("Existing buckets:", buckets.map(b => `${b.name} (public: ${b.public})`));

    const targetBucket = buckets.find(b => b.name === bucketName);

    // 2. Ensure Bucket
    if (!targetBucket) {
        console.log(`Bucket '${bucketName}' not found. Creating...`);
        const { error: createErr } = await supabase.storage.createBucket(bucketName, { public: true });
        if (createErr) {
            console.error("Create bucket failed:", createErr);
        } else {
            console.log("Bucket created successfully.");
        }
    } else {
        console.log(`Bucket '${bucketName}' exists. Updating to ensure public...`);
        const { error: updateErr } = await supabase.storage.updateBucket(bucketName, { public: true });
        if (updateErr) {
            console.error("Update bucket failed:", updateErr);
        } else {
            console.log("Bucket updated to public.");
        }
    }

    // 3. Upload Test File
    const fileName = `test-${Date.now()}.txt`;
    console.log(`Uploading ${fileName}...`);
    const { data, error: uploadErr } = await supabase.storage
        .from(bucketName)
        .upload(fileName, Buffer.from("Hello Report Image"), {
            contentType: "text/plain",
            upsert: true,
        });

    if (uploadErr) {
        console.error("UPLOAD FAILED:", uploadErr);
        // Print RLS or Policy hint
        if (uploadErr.message.includes("security policy")) {
            console.error("HIT RLS POLICY! Need to add explicit INSERT policy.");
        }
    } else {
        console.log("Upload success:", data);

        // 4. Get Public URL
        const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        console.log("Generated Public URL:", urlData.publicUrl);

        // 5. Try fetching it
        try {
            const fetchRes = await fetch(urlData.publicUrl);
            console.log(`Fetch check: ${fetchRes.status} ${fetchRes.statusText}`);
            if (fetchRes.ok) {
                console.log("Content:", await fetchRes.text());
            } else {
                console.error("Fetch failed. Bucket might be private or policy restricts select.");
            }
        } catch (e) {
            console.error("Fetch error:", e);
        }
    }
}

testUpload();
