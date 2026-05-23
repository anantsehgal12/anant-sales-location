import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export function unauthorized(message: string = "Unauthorized") {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function notFound(resource = "Resource") {
  return NextResponse.json(
    { success: false, error: `${resource} not found` },
    { status: 404 }
  );
}

export function serverError(error: unknown) {
  console.error(error);
  const message =
    error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}
