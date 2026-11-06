import type { IncomingMessage, ServerResponse } from 'node:http';
import { Buffer } from 'node:buffer';

/**
 * Configure max execution duration for Vercel Serverless Function (seconds).
 * Aligns with Vercel's 300-second execution limit.
 */
export const maxDuration = 300;

/**
 * TypeScript interface representing Vercel's incoming serverless request wrapper.
 */
interface VercelRequest extends IncomingMessage {
  body?: unknown;
  query?: Record<string, string | string[]>;
  cookies?: Record<string, string>;
}

/**
 * TypeScript interface representing Vercel's serverless response wrapper.
 */
interface VercelResponse extends ServerResponse {
  status?: (statusCode: number) => VercelResponse;
  json?: (body: unknown) => VercelResponse;
  send?: (body: unknown) => VercelResponse;
}

/**
 * Helper to safely send JSON responses whether running in Vercel's serverless
 * runtime environment or standard Node.js HTTP server.
 */
function sendJsonResponse(res: VercelResponse, statusCode: number, data: unknown): void {
  if (res.headersSent) {
    return;
  }
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(statusCode).json(data);
    return;
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

/**
 * Safely parses the incoming JSON request body from pre-parsed Vercel body,
 * a raw JSON string, or standard IncomingMessage stream chunks.
 */
async function parseJsonBody(req: VercelRequest): Promise<{ rawString: string; jsonObject: unknown }> {
  // Case 1: Body pre-parsed as an object or array by Vercel's runtime
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') {
      return {
        rawString: JSON.stringify(req.body),
        jsonObject: req.body,
      };
    }
    if (typeof req.body === 'string') {
      const trimmed = req.body.trim();
      if (!trimmed) {
        throw new Error('Request body cannot be empty.');
      }
      const parsed = JSON.parse(trimmed);
      return {
        rawString: trimmed,
        jsonObject: parsed,
      };
    }
  }

  // Case 2: Read stream chunks if body was not pre-parsed
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf-8').trim();
  if (!raw) {
    throw new Error('Request body cannot be empty.');
  }

  const parsed = JSON.parse(raw);
  return {
    rawString: raw,
    jsonObject: parsed,
  };
}

/**
 * Vercel Serverless Function: api/generate.ts
 *
 * Authenticates the caller via Supabase Auth and securely proxies generation requests
 * to the private FastAPI + Ollama backend running on AWS EC2.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    // 1. Enforce POST method only
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return sendJsonResponse(res, 405, {
        error: 'Method Not Allowed',
        message: 'Only POST requests are supported.',
      });
    }

    // 2. Fail closed: Validate server-side Supabase environment variables (SUPABASE_ANON_KEY only)
    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id') || supabaseAnonKey.includes('placeholder')) {
      console.error('[api/generate] Authentication configuration error: Missing or invalid SUPABASE_URL / SUPABASE_ANON_KEY on server.');
      return sendJsonResponse(res, 500, {
        error: 'Configuration Error',
        message: 'Server authentication configuration is missing or invalid.',
      });
    }

    // 3. Require valid Bearer token (Fail closed: missing token -> 401)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendJsonResponse(res, 401, {
        error: 'Unauthorized',
        message: 'Authentication required. Missing or malformed Bearer authorization header.',
      });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return sendJsonResponse(res, 401, {
        error: 'Unauthorized',
        message: 'Authentication required. Empty Bearer token provided.',
      });
    }

    // Explicitly reject development fallback tokens on Vercel
    if (token.startsWith('offline_token_') || token.startsWith('dev-token')) {
      return sendJsonResponse(res, 401, {
        error: 'Unauthorized',
        message: 'Development fallback tokens are not allowed in production.',
      });
    }

    // 4. Verify Supabase JWT token with Supabase Auth endpoint (10s timeout)
    const authController = new AbortController();
    const authTimeoutMs = 10000;
    const authTimeoutId = setTimeout(() => authController.abort(), authTimeoutMs);

    let authResponse: Response;
    try {
      const normalizedSupabaseUrl = supabaseUrl.replace(/\/+$/, '');
      authResponse = await fetch(`${normalizedSupabaseUrl}/auth/v1/user`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: supabaseAnonKey,
        },
        signal: authController.signal,
      });
    } catch (authError: unknown) {
      clearTimeout(authTimeoutId);

      if (authController.signal.aborted) {
        console.error(`[api/generate] Supabase auth verification timed out after ${authTimeoutMs}ms.`);
        return sendJsonResponse(res, 502, {
          error: 'Bad Gateway',
          message: 'Supabase authentication service timed out.',
        });
      }

      const errorName = authError instanceof Error ? authError.name : 'NetworkError';
      console.error(`[api/generate] Supabase auth service connection error: ${errorName}`);
      return sendJsonResponse(res, 502, {
        error: 'Bad Gateway',
        message: 'Supabase authentication service is currently unavailable.',
      });
    } finally {
      clearTimeout(authTimeoutId);
    }

    // Fail closed: Invalid or expired token -> 401
    if (!authResponse.ok) {
      return sendJsonResponse(res, 401, {
        error: 'Unauthorized',
        message: 'Invalid or expired Supabase authentication token.',
      });
    }

    // 5. Validate server-side AWS environment variables
    const awsLlmUrl = process.env.AWS_LLM_URL?.trim();
    const youtubeApiKey = process.env.YOUTUBE_API_KEY?.trim();

    if (!awsLlmUrl || !youtubeApiKey) {
      console.error('[api/generate] Server configuration error: Missing AWS_LLM_URL or YOUTUBE_API_KEY.');
      return sendJsonResponse(res, 500, {
        error: 'Configuration Error',
        message: 'Backend server environment is not properly configured.',
      });
    }

    // 6. Construct and validate destination backend URL
    let targetUrl: URL;
    try {
      const normalizedBase = awsLlmUrl.replace(/\/+$/, '');
      targetUrl = new URL(`${normalizedBase}/generate`);
    } catch {
      console.error('[api/generate] Server configuration error: Invalid AWS_LLM_URL format.');
      return sendJsonResponse(res, 500, {
        error: 'Configuration Error',
        message: 'Invalid backend URL configured on server.',
      });
    }

    // 7. Safely parse incoming JSON body (Invalid body -> 400)
    let bodyPayload: { rawString: string; jsonObject: unknown };
    try {
      bodyPayload = await parseJsonBody(req);
    } catch (bodyError: unknown) {
      const errorMessage = bodyError instanceof Error ? bodyError.message : 'Invalid JSON body.';
      return sendJsonResponse(res, 400, {
        error: 'Bad Request',
        message: errorMessage,
      });
    }

    // 8. Forward request to AWS EC2 FastAPI backend
    // Timeout set to 280 seconds (comfortably handling ~92s generation while safely below Vercel's 300s limit)
    const backendController = new AbortController();
    const backendTimeoutMs = 280000;
    const backendTimeoutId = setTimeout(() => backendController.abort(), backendTimeoutMs);

    let backendResponse: Response;
    try {
      backendResponse = await fetch(targetUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-Key': youtubeApiKey,
        },
        body: bodyPayload.rawString,
        signal: backendController.signal,
      });
    } catch (fetchError: unknown) {
      clearTimeout(backendTimeoutId);

      if (backendController.signal.aborted) {
        console.error(`[api/generate] Backend request timed out after ${backendTimeoutMs}ms.`);
        return sendJsonResponse(res, 504, {
          error: 'Gateway Timeout',
          message: 'The AI backend service timed out while generating the response.',
        });
      }

      const errorName = fetchError instanceof Error ? fetchError.name : 'NetworkError';
      console.error(`[api/generate] Backend connection failure: ${errorName}`);
      return sendJsonResponse(res, 502, {
        error: 'Bad Gateway',
        message: 'Unable to connect to the AWS LLM backend service.',
      });
    } finally {
      clearTimeout(backendTimeoutId);
    }

    // 9. Read and parse backend response
    const responseText = await backendResponse.text();
    let responseData: unknown;

    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch {
      responseData = {
        statusCode: backendResponse.status,
        response: responseText || null,
      };
    }

    // 10. Return backend's status code and JSON response to client
    return sendJsonResponse(res, backendResponse.status, responseData);
  } catch (unexpectedError: unknown) {
    console.error('[api/generate] Unexpected handler error.');
    return sendJsonResponse(res, 500, {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing the request.',
    });
  }
}
