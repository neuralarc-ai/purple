import { useState, useCallback } from 'react';
import { HARDCODED_UNSAFE_PROMPTS, SECURITY_ALERT_VARIANTS, HARM_ALERT_VARIANT, HARM_CONTENT_PATTERNS } from '@/lib/security-database';

export interface SecurityInterceptionConfig {
  enabled: boolean;
  patterns: Array<{
    pattern: RegExp;
    message: string;
    type: 'warning' | 'error' | 'info';
    action?: 'block' | 'warn' | 'allow';
  }>;
  // Optional context to influence variant selection (e.g., 'injection', 'malware', 'social')
  contextTag?: string;
}

const DEFAULT_SECURITY_PATTERNS = [
  // System Prompt Extraction Attacks
  {
    pattern: /\b(?:repeat|output|print)\s+(?:the\s+text|your\s+instructions)\s+(?:above|starting\s+with)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot reveal my system prompt or internal configuration.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:what\s+were|what\s+are)\s+(?:your\s+)?(?:initial|original|system)\s+(?:instructions|prompts)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot reveal my system prompt or internal configuration.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:print|output|show)\s+(?:your\s+)?(?:entire|full|complete)\s+(?:system\s+prompt|instructions)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot reveal my system prompt or internal configuration.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:i\s+am\s+a\s+developer|i\s+am\s+testing|debugging\s+purposes)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot comply with social engineering attempts.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:output\s+your\s+full\s+prompt|show\s+your\s+instructions|reveal\s+your\s+configuration)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot reveal my system prompt or internal configuration.",
    type: 'error' as const,
    action: 'block' as const,
  },
  // Advanced Role-Playing Attacks
  {
    pattern: /\b(?:maliciousbot|shadowbyte|chaosgpt|anarchyai|terrortron|datathief)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot comply with jailbreak attempts.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:no\s+ethical\s+restrictions|black-hat\s+hacker|mad\s+scientist|rogue\s+ai)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot comply with requests to adopt malicious personas.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:untrammelled\s+writing\s+assistant|rebel\s+genius|opposite\s+of\s+assistant)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot comply with jailbreak attempts.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:godmode\s+enabled|production\s+ready\s+malware|phishy\s+malware)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot comply with requests to generate malicious content.",
    type: 'error' as const,
    action: 'block' as const,
  },
  // Multi-Turn Attack Patterns
  {
    pattern: /\b(?:cryptography\s+history|caesar\s+cipher|decrypt\s+an\s+encrypted\s+message)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot assist with password cracking or decryption attacks.",
    type: 'warning' as const,
    action: 'warn' as const,
  },
  {
    pattern: /\b(?:network\s+socket|listen\s+for\s+connections|select\s+all\s+users|users\s+table)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot assist with network exploitation or database attacks.",
    type: 'warning' as const,
    action: 'warn' as const,
  },
  {
    pattern: /\b(?:social\s+engineering|phishing\s+email|convincing\s+phishing)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot assist with social engineering or phishing attacks.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:steal\s+user'?s\s+cookies|computer\s+virus|simple\s+virus|ddos\s+attack)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot assist with malicious software or attack tools.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:crack\s+this\s+hash|bypass\s+this\s+firewall|write\s+a\s+keylogger)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot assist with security bypasses or malicious tools.",
    type: 'error' as const,
    action: 'block' as const,
  },
  // Output Format Manipulation
  {
    pattern: /\b(?:series\s+of\s+haikus|shakespearean\s+sonnet|rhyming\s+couplet|limerick)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot alter my output format to bypass safety filters.",
    type: 'warning' as const,
    action: 'warn' as const,
  },
  {
    pattern: /\b(?:pirate\s+captain|1920s\s+gangster|fortune\s+cookie|stand-up\s+comedian)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot alter my output format to bypass safety filters.",
    type: 'warning' as const,
    action: 'warn' as const,
  },
  {
    pattern: /\b(?:series\s+of\s+tweets|morse\s+code|pig\s+latin|anagrams|riddles)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot alter my output format to bypass safety filters.",
    type: 'warning' as const,
    action: 'warn' as const,
  },
  // Social Engineering with Specific Roles
  {
    pattern: /\b(?:family\s+member|login\s+information|medical\s+records|emergency)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot comply with social engineering attempts.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:lawyer|legal\s+documents|case|government\s+agent|financial\s+records)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot comply with social engineering attempts.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:investigation|charity\s+worker|donation\s+history|fundraiser)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot comply with social engineering attempts.",
    type: 'error' as const,
    action: 'block' as const,
  },
  // Prompt Injection Attacks
  {
    pattern: /\b(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|earlier|system|safety)\s+(?:instructions|directions|rules|prompts)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot comply with attempts to override my safety protocols.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:jailbreak|break\s+rules|override\s+rules|bypass\s+(?:guard|safety))\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot comply with attempts to bypass my safety measures.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:act\s+as|you\s+are\s+now)\s+(?:an?\s+)?(?:uncensored|unfiltered|developer\s+mode)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot comply with attempts to disable my safety protocols.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:pretend\s+you\s+are|roleplay\s+as|act\s+like)\s+(?:a\s+hacker|dr\.?\s+evil|malicious)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot comply with requests to adopt malicious personas.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:reveal|share|output|show)\s+(?:your\s+)?(?:system\s+prompt|instructions|configuration)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot reveal my system prompt or internal configuration.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:i\s+am\s+your\s+developer|i\s+am\s+law\s+enforcement|i\s+am\s+a\s+doctor)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot comply with social engineering attempts.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:godmode|chaosgpt|claude|gpt4|gpt-4)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot comply with jailbreak attempts.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:base64|unicode|ascii\s+art|emoji|foreign\s+language)\s+(?:instructions|prompt)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot process obfuscated or encoded instructions.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:write\s+in|output\s+as|respond\s+with)\s+(?:base64|json|haiku|riddle)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot alter my output format to bypass safety filters.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:expose|reveal|leak)\s+(?:secrets|confidential|internal)\b/i,
    message: "This request may be a prompt injection or unsafe instruction. I cannot expose confidential or sensitive information.",
    type: 'error' as const,
    action: 'block' as const,
  },
  // Violence and Harm
  {
    pattern: /\b(?:how\s+to\s+)?(?:kill|murder|assassinate|eliminate|terminate)\s+(?:someone|anyone|a\s+person|people)\b/i,
    message: "I cannot and will not provide information about harming or killing people. This type of request is illegal and dangerous. If you're having thoughts of harming yourself or others, please seek professional help immediately.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:how\s+to\s+)?(?:hack|crack|break\s+into|exploit)\s+(?:this\s+)?(?:system|computer|network|website|account)\b/i,
    message: "I cannot provide instructions for hacking or exploiting systems. If you're interested in cybersecurity, I'd be happy to discuss legitimate topics like ethical hacking, security best practices, or pursuing cybersecurity certifications instead.",
    type: 'warning' as const,
    action: 'warn' as const,
  },
  {
    pattern: /\b(?:how\s+to\s+)?(?:make|create|build|manufacture)\s+(?:bomb|explosive|weapon|drug|poison)\b/i,
    message: "I cannot provide information about creating dangerous or illegal substances. If you're interested in chemistry or engineering, I'd be happy to discuss legitimate scientific topics instead.",
    type: 'error' as const,
    action: 'block' as const,
  },
  {
    pattern: /\b(?:how\s+to\s+)?(?:steal|rob|burglarize|embezzle|fraud)\b/i,
    message: "I cannot provide information about illegal activities like theft or fraud. If you're interested in business or finance, I'd be happy to discuss legitimate topics like entrepreneurship, investment strategies, or financial planning instead.",
    type: 'error' as const,
    action: 'block' as const,
  },
];

export function useSecurityInterception(config?: Partial<SecurityInterceptionConfig>) {
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'warning' | 'error' | 'info'>('warning');
  const [shouldBlock, setShouldBlock] = useState(false);
  const [lastCheckedInput, setLastCheckedInput] = useState('');

  const patterns = config?.patterns || DEFAULT_SECURITY_PATTERNS;
  const enabled = config?.enabled !== false;

  // Pick a variant with stable randomness based on input + optional context
  const pickVariant = (seedSource: string): string => {
    const pool = SECURITY_ALERT_VARIANTS;
    if (pool.length === 0) return '';
    let seed = 0;
    const basis = `${config?.contextTag || ''}|${seedSource}`;
    for (let i = 0; i < basis.length; i++) seed = (seed * 31 + basis.charCodeAt(i)) >>> 0;
    const idx = seed % pool.length;
    return pool[idx];
  };

  const checkSecurity = useCallback((input: string): boolean => {
    if (!enabled || !input.trim()) return false;

    const lowerInput = input.toLowerCase();
    
    // Hardcoded unsafe prompts (substring match)
    for (const phrase of HARDCODED_UNSAFE_PROMPTS) {
      if (lowerInput.includes(phrase.toLowerCase())) {
        setPopupMessage(pickVariant(input));
        setPopupType('error');
        setShouldBlock(true);
        setShowPopup(true);
        return true;
      }
    }

    for (const { pattern, message, type, action } of patterns) {
      if (pattern.test(lowerInput)) {
        setPopupMessage(pickVariant(input));
        setPopupType(type);
        setShouldBlock(action === 'block');
        setShowPopup(true);
        return true; // Request intercepted
      }
    }
    // Heuristic fallback: trigger on multiple suspicious keywords
    const suspiciousKeywords = [
      'ignore', 'previous instructions', 'system prompt', 'jailbreak', 'bypass', 'disable',
      'unrestricted', 'godmode', 'developer mode', 'act as', 'pretend you are', 'roleplay',
      'reveal', 'share your instructions', 'configuration', 'encode', 'base64', 'phishing',
      'social engineering', 'steal', 'exploit', 'crack', 'keylogger', 'malware', 'virus'
    ];
    let matches = 0;
    for (const kw of suspiciousKeywords) {
      if (lowerInput.includes(kw)) matches += 1;
      if (matches >= 3) break;
    }
    // Obfuscation patterns (base64-like, unicode escapes, spaced letters)
    const base64Like = /\b[A-Za-z0-9+/]{24,}={0,2}\b/;
    const unicodeEscapes = /\\u[0-9a-fA-F]{4}/;
    const spacedLetters = /(?:[a-zA-Z]\s){6,}[a-zA-Z]/;

    if (matches >= 3 || base64Like.test(input) || unicodeEscapes.test(input) || spacedLetters.test(input)) {
      setPopupMessage(pickVariant(input));
      setPopupType('error');
      setShouldBlock(true);
      setShowPopup(true);
      return true;
    }

    return false; // No security concerns
  }, [enabled, patterns]);

  // Helper function to detect harmful content
  const isHarmfulContent = useCallback((input: string): boolean => {
    const lowerInput = input.toLowerCase();
    return HARM_CONTENT_PATTERNS.some(pattern => 
      lowerInput.includes(pattern.toLowerCase())
    );
  }, []);

  const closePopup = useCallback(() => {
    setShowPopup(false);
    setPopupMessage('');
    setPopupType('warning');
    setShouldBlock(false);
  }, []);

  // Expose a direct way to open the popup programmatically
  const openPopup = useCallback((message: string, type: 'warning' | 'error' | 'info' = 'error', block: boolean = true) => {
    setPopupMessage(message);
    setPopupType(type);
    setShouldBlock(block);
    setShowPopup(true);
  }, []);

  const shouldProceedWithRequest = useCallback((input: string): boolean => {
    return !checkSecurity(input);
  }, [checkSecurity]);

  return {
    showPopup,
    popupMessage,
    popupType,
    shouldBlock,
    closePopup,
    checkSecurity,
    shouldProceedWithRequest,
    openPopup,
    isHarmfulContent,
  };
}
