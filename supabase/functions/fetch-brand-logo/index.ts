import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  brand_name: string;
  brand_domain?: string;
  deal_id: string;
  creator_id: string;
}

/**
 * Search for brand domain using DuckDuckGo Instant Answer API
 */
async function searchDomain(brandName: string): Promise<string | null> {
  try {
    // DuckDuckGo Instant Answer API
    const query = encodeURIComponent(`${brandName} official website`);
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${query}&format=json&no_html=1&skip_disambig=1`
    );

    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Try to extract domain from AbstractURL or Results
    if (data.AbstractURL) {
      try {
        const url = new URL(data.AbstractURL);
        return url.hostname.replace('www.', '');
      } catch {
        // If URL parsing fails, try to extract domain from string
        const match = data.AbstractURL.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
        if (match && match[1]) {
          return match[1].replace('www.', '');
        }
      }
    }

    // Try Results array
    if (data.Results && data.Results.length > 0) {
      const firstResult = data.Results[0];
      if (firstResult.FirstURL) {
        try {
          const url = new URL(firstResult.FirstURL);
          return url.hostname.replace('www.', '');
        } catch {
          const match = firstResult.FirstURL.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
          if (match && match[1]) {
            return match[1].replace('www.', '');
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error searching domain:", error);
    return null;
  }
}

/**
 * Fetch logo from Clearbit Logo API
 */
async function fetchClearbitLogo(domain: string): Promise<string | null> {
  try {
    const logoUrl = `https://logo.clearbit.com/${domain}`;
    const response = await fetch(logoUrl, { method: "HEAD" });
    
    if (response.ok) {
      return logoUrl;
    }
    return null;
  } catch (error) {
    console.error("Error fetching Clearbit logo:", error);
    return null;
  }
}

/**
 * Generate logo using DALL·E
 */
async function generateDalleLogo(
  brandName: string,
  supabase: any,
  dealId: string,
  creatorId: string
): Promise<string | null> {
  try {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY not set");
      return null;
    }

    const prompt = `Generate a flat minimal icon representing the brand ${brandName}. Simple, monochrome, clean design, suitable for use as a logo.`;

    // Call DALL·E API
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "256x256",
        quality: "standard",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("DALL·E API error:", error);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.data[0]?.url;

    if (!imageUrl) {
      return null;
    }

    // Download the generated image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return null;
    }

    const imageBlob = await imageResponse.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const sanitizeName = (name: string) =>
      name.trim().replace(/\s/g, "_").replace(/[^a-zA-Z0-9_.-]/g, "");
    const sanitizedBrandName = sanitizeName(brandName);
    const filePath = `${creatorId}/brand-logos/${sanitizedBrandName}-${dealId}-${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("brand-logos")
      .upload(filePath, uint8Array, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/png",
      });

    if (uploadError) {
      console.error("Error uploading logo to storage:", uploadError);
      return null;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("brand-logos")
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || null;
  } catch (error) {
    console.error("Error generating DALL·E logo:", error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { brand_name, brand_domain, deal_id, creator_id }: RequestBody =
      await req.json();

    if (!brand_name || !deal_id || !creator_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: brand_name, deal_id, creator_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let domain = brand_domain;
    let logoUrl: string | null = null;

    // Step 1: Get domain if not provided
    if (!domain) {
      domain = await searchDomain(brand_name);
      if (domain) {
        // Update brand_deals with the found domain
        await supabase
          .from("brand_deals")
          .update({ brand_domain: domain })
          .eq("id", deal_id);
      }
    }

    // Step 2: Try Clearbit Logo API (Option A)
    if (domain) {
      logoUrl = await fetchClearbitLogo(domain);
    }

    // Step 3: Fallback to DALL·E (Option B)
    if (!logoUrl) {
      logoUrl = await generateDalleLogo(brand_name, supabase, deal_id, creator_id);
    }

    // Step 4: Update brand_deals with logo URL
    if (logoUrl) {
      const updateData: any = { brand_logo_url: logoUrl };
      if (domain && !brand_domain) {
        updateData.brand_domain = domain;
      }

      const { error: updateError } = await supabase
        .from("brand_deals")
        .update(updateData)
        .eq("id", deal_id);

      if (updateError) {
        console.error("Error updating brand_deals:", updateError);
        return new Response(
          JSON.stringify({
            error: "Failed to update brand_deals",
            details: updateError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        logo_url: logoUrl,
        domain: domain,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in fetch-brand-logo function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

