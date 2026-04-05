import { NextResponse } from "next/server";
import {
  getSubmissions,
  updateSubmission,
  updateAllSubmissions,
  VALID_SUBMISSION_TYPES,
} from "@/app/lib/services/admin/submittedData";

const handleError = (error, status = 500) =>
  NextResponse.json(
    { error: error.message || "Internal server error" },
    { status },
  );

export async function GET(request, { params }) {
  const { type } = await params;

  if (!VALID_SUBMISSION_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `Unknown type: ${type}` },
      { status: 400 },
    );
  }

  try {
    const result = await getSubmissions(type);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request, { params }) {
  const { type } = await params;

  if (!VALID_SUBMISSION_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `Unknown type: ${type}` },
      { status: 400 },
    );
  }

  try {
    const { id, action } = await request.json();
    if (!action) {
      return NextResponse.json(
        { error: "action is required" },
        { status: 400 },
      );
    }

    if (action === "approve_all") {
      const result = await updateAllSubmissions(type, "approve");
      return NextResponse.json(result);
    }

    if (!id) {
      return NextResponse.json(
        { error: "id is required for single submission update" },
        { status: 400 },
      );
    }

    const result = await updateSubmission(type, id, action);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error, error.message?.includes("Unknown") ? 400 : 500);
  }
}
