import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// This endpoint receives webhook events from Thirdweb/Alchemy when PrivateTransfer events are confirmed on-chain
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate webhook signature (if using Thirdweb/Alchemy signed webhooks)
    // For now, accepting all events (add HMAC validation in production)

    const {
      txHash,
      senderWallet,
      recipientWallet,
      amountEncrypted,
      status = "pending",
      auditorDecision,
      riskScore,
      timestamp = new Date().toISOString(),
    } = body;

    // Validate required fields
    if (!txHash || !senderWallet || !recipientWallet || !amountEncrypted) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert into Supabase transactions table
    const { data, error } = await supabase.from("transactions").insert([
      {
        tx_hash: txHash,
        sender_wallet: senderWallet,
        recipient_wallet: recipientWallet,
        amount_encrypted: amountEncrypted,
        status,
        auditor_decision: auditorDecision || null,
        risk_score: riskScore || null,
        timestamp: timestamp || new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error inserting transaction:", error);
      return NextResponse.json(
        { error: "Failed to insert transaction" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, transaction: data },
      { status: 201 }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
