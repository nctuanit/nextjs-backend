import { Injectable } from '../di/injectable.decorator';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export interface JwtModuleOptions {
  secret: string;
  signOptions?: {
    expiresIn?: string | number; // e.g. '1h', '2 days', 3600
    issuer?: string;
    audience?: string | string[];
    algorithm?: string;
  };
}

@Injectable()
export class JwtService {
  private readonly secretKey: Uint8Array;

  constructor(private readonly options: JwtModuleOptions) {
    if (!options.secret) {
      throw new Error('JwtModule requires a secret key for signing tokens.');
    }
    this.secretKey = new TextEncoder().encode(options.secret);
  }

  /**
   * Synchronously signs a token payload.
   * Note: While jose generally operates async, we provide a signature abstraction 
   * that awaits natively inside modern Promise contexts.
   */
  async signAsync(payload: JWTPayload, options?: JwtModuleOptions['signOptions']): Promise<string> {
    const combinedOptions = { ...this.options.signOptions, ...options };
    const alg = combinedOptions.algorithm || 'HS256';

    let signer = new SignJWT(payload)
      .setProtectedHeader({ alg })
      .setIssuedAt();

    if (combinedOptions.expiresIn) {
      signer = signer.setExpirationTime(combinedOptions.expiresIn);
    }
    if (combinedOptions.issuer) {
      signer = signer.setIssuer(combinedOptions.issuer);
    }
    if (combinedOptions.audience) {
      signer = signer.setAudience(combinedOptions.audience);
    }

    return await signer.sign(this.secretKey);
  }

  /**
   * Verifies a JWT token asynchronously and returns the decoded payload.
   */
  async verifyAsync<T extends JWTPayload = JWTPayload>(token: string): Promise<T> {
    try {
      const { payload } = await jwtVerify(token, this.secretKey, {
        issuer: this.options.signOptions?.issuer,
        audience: this.options.signOptions?.audience,
      });
      return payload as T;
    } catch (e: unknown) {
      throw new Error(`Invalid or expired token: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}
