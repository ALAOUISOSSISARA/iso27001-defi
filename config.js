// =====================================================================
//  Configuration Supabase
//  Supabase > Project Settings > API (ou "Connect") :
//   - Project URL        -> SUPABASE_URL
//   - anon / public key  -> SUPABASE_ANON_KEY
//  La clé "anon" est faite pour être publique : la sécurité repose sur
//  les politiques RLS et les fonctions de supabase/schema.sql.
//  NE METTEZ JAMAIS la clé "service_role" ici.
// =====================================================================
window.APP_CONFIG = {
  SUPABASE_URL: 'https://ewannupljexdfapmdjus.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_4o2VDTy2YHSqLw789DBx7Q_Q8BlWiMY',
  // Optionnel : URL affichée dans le QR code (par défaut : la racine du site)
  PLAYER_URL: ''
};

