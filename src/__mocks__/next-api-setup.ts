// Setup mock for Next.js API route testing

// Mock NextRequest
class MockNextRequest {
  private url: string;
  private method: string;
  private reqBody: any;
  private headers: Headers;

  constructor(url: string, options: { method?: string; body?: string; headers?: HeadersInit } = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.reqBody = options.body ? JSON.parse(options.body) : null;
    this.headers = new Headers(options.headers);
  }

  async json() {
    return this.reqBody;
  }

  get nextUrl() {
    return new URL(this.url);
  }

  get searchParams() {
    return new URL(this.url).searchParams;
  }
}

// Mock NextResponse
class MockNextResponse {
  status: number;
  private responseBody: any;
  private responseHeaders: Headers;

  constructor(body: any, options: { status?: number; headers?: HeadersInit } = {}) {
    this.responseBody = body;
    this.status = options.status || 200;
    this.responseHeaders = new Headers(options.headers);
  }

  async json() {
    return this.responseBody;
  }

  static json(body: any, options: { status?: number; headers?: HeadersInit } = {}) {
    return new MockNextResponse(body, options);
  }
}

// Add to global scope
(global as any).Request = MockNextRequest;
(global as any).NextRequest = MockNextRequest;
(global as any).Response = MockNextResponse;
(global as any).NextResponse = MockNextResponse;

export {}; 