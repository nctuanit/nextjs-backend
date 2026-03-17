/**
 * A utility class to build standard Web API Request objects for testing.
 * Simplifies testing endpoints by providing a fluent builder pattern.
 * 
 * @example
 * ```ts
 * const req = new TestRequestBuilder()
 *   .method('POST')
 *   .path('/users')
 *   .body({ name: 'Bob' })
 *   .build();
 * 
 * const res = await app.handle(req);
 * ```
 */
export class TestRequestBuilder {
  private _method: string = 'GET';
  private _path: string = '/';
  private _body: any = null;
  private _headers: Record<string, string> = {
    'Host': 'localhost'
  };
  private _url: string = 'http://localhost';
  private _query: Record<string, string> = {};

  method(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD') {
    this._method = method;
    return this;
  }

  path(path: string) {
    this._path = path.startsWith('/') ? path : `/${path}`;
    return this;
  }

  body(body: Record<string, any>) {
    this._body = body;
    if (body instanceof FormData) {
      // Fetch API will automatically set the correct multipart/form-data content type with boundary
    } else if (typeof body === 'object' && body !== null) {
      this._headers['Content-Type'] = 'application/json';
    }
    return this;
  }

  headers(headers: Record<string, string>) {
    this._headers = { ...this._headers, ...headers };
    return this;
  }

  query(query: Record<string, string>) {
    this._query = { ...this._query, ...query };
    return this;
  }

  build(): Request {
    let finalUrl = `${this._url}${this._path}`;
    
    // Append query params if any
    const queryKeys = Object.keys(this._query);
    if (queryKeys.length > 0) {
      const sp = new URLSearchParams(this._query);
      finalUrl += `?${sp.toString()}`;
    }

    const init: RequestInit = {
      method: this._method,
      headers: this._headers,
    };

    if (this._body !== null && this._body !== undefined) {
      if (this._body instanceof FormData || typeof this._body === 'string') {
        init.body = this._body;
      } else {
        init.body = JSON.stringify(this._body);
      }
    }

    return new Request(finalUrl, init);
  }
}
