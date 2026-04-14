import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const lambdaUrl = process.env.NEXTSPORT_LAMBDA_URL;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION ?? "us-west-2";

    if (!lambdaUrl || !accessKeyId || !secretAccessKey) {
      return NextResponse.json({ 
        error: "Missing env vars",
        lambdaUrl: !!lambdaUrl,
        accessKeyId: !!accessKeyId,
        secretAccessKey: !!secretAccessKey
      }, { status: 500 });
    }

    const crypto = await import("crypto");
    const testBody = JSON.stringify({ test: true, analysisId: "test-from-vercel", videoPath: "test/path.mp4", userId: "test-user-123", videoDownloadUrl: null });
    const lambdaUrlParsed = new URL(lambdaUrl);
    const service = "lambda";

    const now = new Date();
    const amzdate = now.toISOString().replace(/[:\-]/g, "").slice(0, 15) + "Z";
    const datestamp = amzdate.slice(0, 8);

    const payloadHash = crypto.createHash("sha256").update(testBody).digest("hex");
    const canonicalHeaders = `content-type:application/json\nhost:${lambdaUrlParsed.hostname}\nx-amz-date:${amzdate}\n`;
    const signedHeaders = "content-type;host;x-amz-date";
    const canonicalRequest = ["POST", "/", "", canonicalHeaders, signedHeaders, payloadHash].join("\n");

    const credentialScope = `${datestamp}/${region}/${service}/aws4_request`;
    const stringToSign = ["AWS4-HMAC-SHA256", amzdate, credentialScope,
      crypto.createHash("sha256").update(canonicalRequest).digest("hex")].join("\n");

    const hmac = (key: Buffer | string, data: string) =>
      crypto.createHmac("sha256", key).update(data).digest();
    const kDate = hmac(`AWS4${secretAccessKey}`, datestamp);
    const kRegion = hmac(kDate, region);
    const kService = hmac(kRegion, service);
    const kSigning = hmac(kService, "aws4_request");
    const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

    const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const res = await fetch(lambdaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-amz-date": amzdate,
        "Authorization": authHeader,
      },
      body: testBody,
    });

    const responseText = await res.text();
    return NextResponse.json({
      success: true,
      lambdaStatus: res.status,
      lambdaResponse: responseText.slice(0, 500),
      usedUrl: lambdaUrl.slice(0, 60),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack?.slice(0, 300) }, { status: 500 });
  }
}
