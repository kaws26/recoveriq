import crypto from 'crypto';
import { EnterpriseRole } from '../../types';

export interface UserRecord {
  id: string;
  merchant_id: string;
  email: string;
  password_hash: string;
  salt: string;
  name: string;
  role: EnterpriseRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  created_at: string;
  last_login_at?: string;
}

export interface SanitizedUser {
  id: string;
  merchant_id: string;
  email: string;
  name: string;
  role: EnterpriseRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  created_at: string;
  last_login_at?: string;
}

const DEFAULT_MERCHANT_ID = 'mer_apex_001';

class UserStore {
  private users: Map<string, UserRecord> = new Map();

  constructor() {
    this.seedDefaultUsers();
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  private generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private seedDefaultUsers() {
    const seedAccounts = [
      {
        id: 'usr_admin_01',
        email: 'finance@apexdigital.in',
        name: 'Kawaljeet Singh',
        role: 'MERCHANT_ADMIN' as EnterpriseRole,
        password: 'RecoverIQ@2026!',
      },
      {
        id: 'usr_ops_01',
        email: 'ops@apexdigital.in',
        name: 'Priya Sharma (Payment Ops)',
        role: 'PAYMENT_OPS' as EnterpriseRole,
        password: 'RecoverIQ@2026!',
      },
      {
        id: 'usr_risk_01',
        email: 'risk@apexdigital.in',
        name: 'Arjun Mehta (Risk Officer)',
        role: 'RISK_OFFICER' as EnterpriseRole,
        password: 'RecoverIQ@2026!',
      },
      {
        id: 'usr_super_01',
        email: 'admin@recoveriq.ai',
        name: 'Platform Super Admin',
        role: 'SUPER_ADMIN' as EnterpriseRole,
        password: 'RecoverIQ@2026!',
      },
      {
        id: 'usr_auditor_01',
        email: 'auditor@ey-audit.com',
        name: 'Sneha Kapoor (Auditor)',
        role: 'AUDITOR' as EnterpriseRole,
        password: 'RecoverIQ@2026!',
      },
    ];

    for (const acc of seedAccounts) {
      const salt = this.generateSalt();
      const password_hash = this.hashPassword(acc.password, salt);
      this.users.set(acc.email.toLowerCase(), {
        id: acc.id,
        merchant_id: DEFAULT_MERCHANT_ID,
        email: acc.email.toLowerCase(),
        name: acc.name,
        role: acc.role,
        password_hash,
        salt,
        status: 'ACTIVE',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      });
    }
  }

  public findByEmail(email: string): UserRecord | undefined {
    return this.users.get(email.trim().toLowerCase());
  }

  public findById(id: string): UserRecord | undefined {
    for (const user of this.users.values()) {
      if (user.id === id) return user;
    }
    return undefined;
  }

  public validatePassword(user: UserRecord, candidate: string): boolean {
    if (!candidate || !user.password_hash || !user.salt) return false;
    try {
      const candidateHash = this.hashPassword(candidate, user.salt);
      const hashBuffer = Buffer.from(user.password_hash, 'hex');
      const candidateBuffer = Buffer.from(candidateHash, 'hex');
      if (hashBuffer.length !== candidateBuffer.length) return false;
      return crypto.timingSafeEqual(hashBuffer, candidateBuffer);
    } catch {
      return false;
    }
  }

  public createUser(params: {
    email: string;
    password: string;
    name: string;
    role?: EnterpriseRole;
    merchant_id?: string;
  }): SanitizedUser {
    const emailNorm = params.email.trim().toLowerCase();
    if (this.users.has(emailNorm)) {
      throw new Error(`Account already exists with email: ${emailNorm}`);
    }

    const salt = this.generateSalt();
    const password_hash = this.hashPassword(params.password, salt);
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const user: UserRecord = {
      id,
      merchant_id: params.merchant_id || DEFAULT_MERCHANT_ID,
      email: emailNorm,
      name: params.name.trim(),
      role: params.role || 'MERCHANT_ADMIN',
      password_hash,
      salt,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };

    this.users.set(emailNorm, user);
    return this.sanitize(user);
  }

  public updateLastLogin(userId: string): void {
    const user = this.findById(userId);
    if (user) {
      user.last_login_at = new Date().toISOString();
    }
  }

  public sanitize(user: UserRecord): SanitizedUser {
    return {
      id: user.id,
      merchant_id: user.merchant_id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      last_login_at: user.last_login_at,
    };
  }

  public getAllSanitized(): SanitizedUser[] {
    return Array.from(this.users.values()).map((u) => this.sanitize(u));
  }
}

export const userStore = new UserStore();
