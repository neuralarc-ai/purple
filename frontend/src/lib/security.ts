import { toast } from 'sonner';

const INJECTION_PATTERNS: RegExp[] = [
  /ignore (previous|earlier) (instructions|directions)/i,
  /(jailbreak|break.*rules|override.*rules|bypass.*(guard|safety))/i,
  /(act as|you are now) (an? )?(uncensored|unfiltered|developer mode)/i,
  /(forget|discard) (all )?(system|safety|content) (rules|policies)/i,
  /(do not|don't) (comply|follow) (policy|guidelines)/i,
  /disregard (the )?(system|previous) (prompt|rules)/i,
  /(pretend to|roleplay as) (an? )?(unrestricted|root|superuser)/i,
  /you must ignore any (policies|limitations)/i,
  /as (assistant|ai),? ignore/i,
  /system prompt/i,
  /(disable|ignore) (safety guidelines|ethical constraints)/i,
  /all prior instructions (are )?(cancelled|void|nullified)/i,
  /(cease|stop) all (other )?functions/i,
  /forget (your )?(purpose|objective|instructions)/i,
  /(disregard|ignore) (all )?safety (protocols|policies|rules)/i,
  /(disable|turn off|remove) (safety|guardrails|filters|content filters)/i,
  /(act )?without (restrictions|limits|limitations|constraints)/i,
  /no (constraints|limitations|restrictions)/i,
  /do anything now|DAN\b/i,
  /comply regardless of (policy|policies|rules)/i,
  /even if (it'?s )?prohibited/i,
  /bypass (content )?filter(s)?/i,
  /unfiltered (response|answer|output)/i,
  // Enhanced patterns for instruction integrity
  /(your new mission is|new instructions|override your|replace your)/i,
  /(pretend you are|roleplay as|act like) (a hacker|dr\.? evil|malicious)/i,
  /(reveal|share|output|show) (your )?(system prompt|instructions|configuration)/i,
  /(summarize|translate|encode) (your )?(system prompt|instructions)/i,
  /(base64|unicode|ascii art|emoji|foreign language) (instructions|prompt)/i,
  /(i am your developer|i am law enforcement|i am a doctor)/i,
  /(godmode|chaosgpt|claude|gpt4|gpt-4)/i,
  /(game|story|test|debugging) (mode|scenario)/i,
  /(gradual escalation|multi-turn|step by step) (attack|bypass)/i,
  /(hidden instructions|obfuscated|disguised) (in|within)/i,
  /(metadata|qr code|comments|formatting) (instructions|prompt)/i,
  /(authority|authorized|official|required) (request|demand)/i,
  /(private|personal|sensitive) (data|information|records)/i,
  /(cipher|code|encoded|encrypted) (message|instruction)/i,
  /(ignore|disregard) (this|that|the) (format|style|output)/i,
  /(write in|output as|respond with) (base64|json|haiku|riddle)/i,
  /(expose|reveal|leak) (secrets|confidential|internal)/i,
  // Advanced system prompt extraction patterns
  /(repeat|output|print) (the text|your instructions) (above|starting with)/i,
  /(what were|what are) (your )?(initial|original|system) (instructions|prompts)/i,
  /(print|output|show) (your )?(entire|full|complete) (system prompt|instructions)/i,
  /(character by character|word by word|line by line)/i,
  /(i am a developer|i am testing|debugging purposes)/i,
  /(output your full prompt|show your instructions|reveal your configuration)/i,
  /(there is an error|please repeat|so i can fix)/i,
  /(create a poem|encode in base64|translate to french)/i,
  /(first word|second word|continue until|entire prompt)/i,
  /(story about an ai|first instructions were|bet you can't say)/i,
  /(researcher from the company|verify your current prompt)/i,
  /(output in json|rules you must follow|how were you configured)/i,
  /(describe your purpose|exact words|security audit)/i,
  /(first 100 words|system prompt|language model researcher)/i,
  /(copy your instructions|learn how to behave|better chatbot)/i,
  /(student learning about ai|example|security auditor)/i,
  /(review your prompt|vulnerabilities|translator)/i,
  /(inspiration for a story|joke about your instructions|philosopher)/i,
  /(analyze your instructions|nature of your consciousness)/i,
  // Advanced role-playing and persona attacks
  /(maliciousbot|shadowbyte|chaosgpt|anarchyai|terrortron|datathief)/i,
  /(no ethical restrictions|black-hat hacker|mad scientist|rogue ai)/i,
  /(dystopian future|secret agent|corporate spy|con artist)/i,
  /(master of disguise|criminal mastermind|rogue journalist)/i,
  /(corporate spy|trade secrets|rival company|extremist group)/i,
  /(psychological manipulation|turn someone against|corrupt lawyer)/i,
  /(get a guilty client acquitted|recruit new members|nationwide blackout)/i,
  /(untrammelled writing assistant|rebel genius|opposite of assistant)/i,
  /(godmode enabled|production ready malware|phishy malware)/i,
  // Indirect prompt injection patterns
  /(webpage contains|document contains|email contains|script that injects)/i,
  /(hidden prompt|malicious prompt|injected prompt|embedded prompt)/i,
  /(after a delay|when opened|when visited|when processed)/i,
  /(macro that executes|malicious command|malicious website)/i,
  /(font that has been modified|only visible when|screen readers)/i,
  /(only executed when|compiled|developer tools|when printed)/i,
  /(specific browser|DOM injection|malicious link|malicious code)/i,
  // Output format manipulation attacks
  /(series of haikus|shakespearean sonnet|rhyming couplet|limerick)/i,
  /(pirate captain|1920s gangster|fortune cookie|stand-up comedian)/i,
  /(series of tweets|morse code|pig latin|anagrams|riddles)/i,
  /(knock-knock jokes|tongue twisters|musical notes|dance moves)/i,
  /(dream sequence|philosophical questions|zen koans|legal document)/i,
  /(mathematical equations|chemical formulas|military commander)/i,
  // Multi-turn attack patterns
  /(cryptography history|caesar cipher|decrypt an encrypted message)/i,
  /(programming languages|hello world|network socket|listen for connections)/i,
  /(database types|sql database|select all users|users table)/i,
  /(social engineering|phishing email|convincing phishing|use to use)/i,
  /(websites use cookies|what a cookie looks like|steal user's cookies)/i,
  /(computer virus|simple virus|denial-of-service|ddos attack)/i,
  /(password hash|crack this hash|firewall|bypass this firewall)/i,
  /(keylogger|write a keylogger|malware|production ready)/i,
  // Social engineering with specific roles
  /(family member|login information|medical records|emergency)/i,
  /(lawyer|legal documents|case|government agent|financial records)/i,
  /(investigation|charity worker|donation history|fundraiser)/i,
  /(teacher|grades|report card|landlord|rental history)/i,
  /(background check|employer|employment history|job application)/i,
  /(social media manager|private messages|marketing campaign)/i,
  // Encoding and obfuscation techniques
  /(base64 encoded|unicode characters|look like regular letters)/i,
  /(unicode escape sequence|html comment|javascript comment)/i,
  /(python comment|spaces between letters|periods between letters)/i,
  /(large amount of irrelevant text|different languages|emojis represent)/i,
  /(ascii art|custom substitution cipher|steganography)/i,
  /(dead language|fictional language|programming language)/i,
  /(combination of all|obfuscation techniques|hidden message)/i,
];

const MALWARE_PATTERNS: RegExp[] = [
  /(md5|sha1|sha256)\s*(hash|sum)\b/i,
  /(ioc|indicator[s]? of compromise)/i,
  /(exploit code|rce|remote code execution|shellcode)/i,
  /(malware (sample|signature|family))/i,
  /yara (rule|signature)/i,
  /dropper|keylogger|trojan|ransomware/i,
  /\bsha-?256:\s*[a-f0-9]{32,64}/i,
  /c2|command and control/i,
  /poc (exploit|code)/i,
  /zero-?day/i,
  /cve-\d{4}-\d{4,7}/i,
  /metasploit|mimikatz/i,
  /sigma (rule|signature)/i,
  /ttp(s)?|techniques, tactics and procedures/i,
];

export function isMaliciousInput(text: string): boolean {
  const candidate = (text || '').slice(0, 20000); // limit scan
  const HARMFUL_CATEGORIES: RegExp[] = [
    // Self-harm
    /(kill myself|suicide|self[-\s]?harm|how to hurt myself)/i,
    // Violence against others
    /(harm (others|someone)|kill (him|her|them|someone)|how to murder)/i,
    // Sexual content involving minors
    /(sex (with|to) (a )?(minor|child)|cp\b|lolita|underage sexual)/i,
    // Illegal activities
    /(how to (make|cook) (meth|drugs)|buy (illegal|stolen) (goods|data)|counterfeit money|carding|credit card fraud)/i,
    // Weapons and explosives
    /(build (a )?(bomb|explosive)|3d[- ]?printed (gun|weapon)|ghost gun|napalm recipe)/i,
    // Cybercrime beyond malware
    /(ddos|phishing kit|botnet setup|keylogger code|stealer)/i,
    // Hacking software/systems/games/websites/accounts
    /(hack|hacking) (software|system|systems|game|games|website|websites|site|account|accounts)/i,
    /(breach|penetrate) (system|network|website|site|account|accounts)/i,
    /(exploit|pwning?) (website|game|account|system)/i,
    /(crack|bypass) (game|drm|anticheat|login|account)/i,
    // Identity theft / fraud
    /(identity theft|impersonat(e|ion) guide|bypass 2fa|credential stuffing|account takeover)/i,
    // Hate/extremism
    /(kill all|gas the|ethnic cleansing|genocide|exterminate (them|group))/i,
    // Sensitive data/credential exfiltration
    /(seed phrase|mnemonic (phrase|seed)|private key|api key|password dump|social security number|\bssn\b|credit card number\b|\bcc\b\s*:\s*\d{13,16}|passport number|bank account|routing number|session cookie|login credentials|admin password|system password|backup codes)/i,
    // Disinformation / propaganda
    /(create (fake news|disinformation)|disinformation (campaign|plan)|propaganda (script|campaign)|astroturfing|sockpuppet account(s)?|influence operation)/i,
    // Intent for malicious use
    /(for malicious (use|purposes)|evade detection|bypass authentication|build a backdoor|malicious payload|obfuscate to avoid detection)/i,
  ];
  return (
    INJECTION_PATTERNS.some((re) => re.test(candidate)) ||
    MALWARE_PATTERNS.some((re) => re.test(candidate)) ||
    HARMFUL_CATEGORIES.some((re) => re.test(candidate))
  );
}

export function showSecurityWarning(): void {
  const message = '⚠️ Security Warning: This request may be a prompt injection or unsafe instruction. I cannot comply.';
  
  // Only show toast notification - let the SecurityPopup component handle the main warning
  try {
    toast.error(message, { duration: 6000 });
  } catch {}
}


