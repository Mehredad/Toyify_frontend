import { supabase } from "./lib/supabase";

async function testConnection() {
  // Table `users` exists after Phase 3 migration — run `supabase gen types` to add it to Database
  const { error } = await supabase
    // @ts-expect-error public.users not yet in generated Database type
    .from("users")
    .select("id")
    .limit(1);

  if (error) {
    console.error("❌ Database connection failed:", error);
  } else {
    console.log("✅ Database connected successfully!");
  }
}

void testConnection();
