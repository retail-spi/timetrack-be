import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'http://localhost:3000/api/v1';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const url = `${API_URL}/${path}${req.nextUrl.search}`;
  const headers: any = {};
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;
  const res = await fetch(url, { headers });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const url = `${API_URL}/${path}`;
  const body = await req.json();
  const headers: any = { 'Content-Type': 'application/json' };
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const url = `${API_URL}/${path}`;
  const headers: any = { 'Content-Type': 'application/json' };
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;
  const res = await fetch(url, { method: 'PATCH', headers });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const url = `${API_URL}/${path}`;
  const body = await req.json();
  const headers: any = { 'Content-Type': 'application/json' };
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;
  const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const url = `${API_URL}/${path}`;
  const headers: any = {};
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;
  const res = await fetch(url, { method: 'DELETE', headers });
  return NextResponse.json({}, { status: res.status });
}