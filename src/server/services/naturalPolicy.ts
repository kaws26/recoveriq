// RecoverIQ — Natural Language Policy Assistant Engine
import { PolicyConfig } from '../../types';

export interface NaturalPolicyParseResult {
  proposed_policy: Partial<PolicyConfig>;
  explanation: string;
  extracted_rules: Array<{
    parameter: string;
    old_value: any;
    new_value: any;
    description: string;
  }>;
  safety_check: {
    valid: boolean;
    warnings: string[];
  };
}

export class NaturalPolicyEngine {
  /**
   * Translates plain English merchant instructions into validated policy parameters.
   */
  public static parsePrompt(prompt: string, currentPolicy: PolicyConfig): NaturalPolicyParseResult {
    const lower = prompt.toLowerCase();
    const changes: Partial<PolicyConfig> = {};
    const extractedRules: NaturalPolicyParseResult['extracted_rules'] = [];
    const warnings: string[] = [];

    // Parse Max Retries
    const retryMatch = lower.match(/(?:max|limit|allow)?\s*(\d+)\s*(?:retries|retry|attempts)/);
    if (retryMatch && retryMatch[1]) {
      const num = parseInt(retryMatch[1], 10);
      if (num >= 1 && num <= 6) {
        changes.max_retries = num;
        extractedRules.push({
          parameter: 'max_retries',
          old_value: currentPolicy.max_retries,
          new_value: num,
          description: `Set maximum retry attempts to ${num}`,
        });
      } else {
        warnings.push(`Retry count ${num} is out of safe range (1-6). Capped to safe bound.`);
        changes.max_retries = Math.min(6, Math.max(1, num));
      }
    }

    // Parse Auto-Recovery Amount Cap
    const capMatch = lower.match(/(?:auto(?:-|\s*)recovery|auto|cap|limit).*?(?:above|over|exceeding|up to|capped at|of)?\s*(?:₹|inr|rs\.?)?\s*([\d,]+)/);
    if (capMatch && capMatch[1]) {
      const rawNum = parseInt(capMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(rawNum) && rawNum > 0) {
        changes.max_auto_recovery_amount = rawNum;
        extractedRules.push({
          parameter: 'max_auto_recovery_amount',
          old_value: currentPolicy.max_auto_recovery_amount,
          new_value: rawNum,
          description: `Auto-recovery maximum amount set to ₹${rawNum.toLocaleString('en-IN')}`,
        });
      }
    }

    // Parse High Value Review Threshold
    const reviewMatch = lower.match(/(?:review|escalate|human|manual).*?(?:above|over|exceeding|threshold of)?\s*(?:₹|inr|rs\.?)?\s*([\d,]+)/);
    if (reviewMatch && reviewMatch[1]) {
      const rawNum = parseInt(reviewMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(rawNum) && rawNum > 0) {
        changes.high_value_review_threshold = rawNum;
        extractedRules.push({
          parameter: 'high_value_review_threshold',
          old_value: currentPolicy.high_value_review_threshold,
          new_value: rawNum,
          description: `High-value review threshold set to ₹${rawNum.toLocaleString('en-IN')}`,
        });
      }
    }

    // Parse Quiet Hours
    if (lower.includes('quiet') || lower.includes('night') || lower.includes('pm') || lower.includes('no messages')) {
      const pmMatch = lower.match(/(?:after|from)\s*(\d{1,2})\s*(?:pm|:00\s*pm)/);
      const amMatch = lower.match(/(?:before|until|to)\s*(\d{1,2})\s*(?:am|:00\s*am)/);
      if (pmMatch && pmMatch[1]) {
        let hour = parseInt(pmMatch[1], 10);
        if (hour < 12) hour += 12;
        changes.quiet_hours_start = hour;
        extractedRules.push({
          parameter: 'quiet_hours_start',
          old_value: `${currentPolicy.quiet_hours_start}:00`,
          new_value: `${hour}:00`,
          description: `Quiet hours start at ${hour}:00 (${pmMatch[1]} PM)`,
        });
      }
      if (amMatch && amMatch[1]) {
        const hour = parseInt(amMatch[1], 10);
        changes.quiet_hours_end = hour;
        extractedRules.push({
          parameter: 'quiet_hours_end',
          old_value: `0${currentPolicy.quiet_hours_end}:00`,
          new_value: `0${hour}:00`,
          description: `Quiet hours end at 0${hour}:00 (${amMatch[1]} AM)`,
        });
      }
    }

    // Fallback if generic prompt
    if (extractedRules.length === 0) {
      if (lower.includes('conservative') || lower.includes('safe') || lower.includes('strict')) {
        changes.max_retries = 2;
        changes.max_auto_recovery_amount = 15000;
        changes.high_value_review_threshold = 8000;
        extractedRules.push({
          parameter: 'preset',
          old_value: 'Balanced',
          new_value: 'Conservative Guardrails',
          description: 'Applied Conservative safety profile: 2 retries max, ₹15,000 auto cap, ₹8,000 human review.',
        });
      } else if (lower.includes('aggressive') || lower.includes('maximize') || lower.includes('growth')) {
        changes.max_retries = 4;
        changes.max_auto_recovery_amount = 45000;
        changes.high_value_review_threshold = 20000;
        extractedRules.push({
          parameter: 'preset',
          old_value: 'Balanced',
          new_value: 'Growth Recovery Profile',
          description: 'Applied Aggressive recovery profile: 4 retries max, ₹45,000 auto cap, ₹20,000 review threshold.',
        });
      }
    }

    return {
      proposed_policy: changes,
      explanation:
        extractedRules.length > 0
          ? `Interpreted ${extractedRules.length} policy adjustment(s) from your instruction.`
          : 'Could not extract specific numeric policy rules. Try mentioning limits like "max 3 retries", "cap auto-recovery at 20000", or "quiet hours after 9 PM".',
      extracted_rules: extractedRules,
      safety_check: {
        valid: extractedRules.length > 0,
        warnings,
      },
    };
  }
}
