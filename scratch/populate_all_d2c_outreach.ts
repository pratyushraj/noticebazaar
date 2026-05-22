import * as fs from 'fs';
import { join } from 'path';

const localStatePath = join(process.cwd(), 'scratch', 'outreach_local_state.json');

const screenshotBrands = {
  "sweetspot.way": {
    "email": "wecare@sweetspotway.com",
    "website": "https://sweetspotway.com",
    "category": "Food, Snacks & Beverages"
  },
  "Beastberry": {
    "email": "support@beastberry.in",
    "website": "https://beastberry.in",
    "category": "Food, Snacks & Beverages"
  },
  "acmeposhan": {
    "email": "poshan.support@acme.in",
    "website": "https://acmeposhan.com",
    "category": "Food, Snacks & Beverages"
  },
  "U16 Ultimatebeauty": {
    "email": "u16ultimatebeauty@gmail.com",
    "website": "https://u16.co.in",
    "category": "Beauty, Skincare & Grooming"
  },
  "EVERPURE LIFE": {
    "email": "customercare@everpurelife.com",
    "website": "https://everpurelife.com",
    "category": "Home, Wellness & Lifestyle"
  },
  "seoulceuticalsindia": {
    "email": "cartfireindia@gmail.com",
    "website": "https://seoulceuticals.in",
    "category": "Beauty, Skincare & Grooming"
  },
  "getyuriskin": {
    "email": "support@yuriskin.com",
    "website": "https://yuriskin.com",
    "category": "Beauty, Skincare & Grooming"
  },
  "belowzero.skin": {
    "email": "belowzero836@gmail.com",
    "website": "https://belowzero.in",
    "category": "Beauty, Skincare & Grooming"
  },
  "zeniqua_india": {
    "email": "support@zeniqua.in",
    "website": "https://zeniqua.in",
    "category": "Home, Wellness & Lifestyle"
  },
  "skincentivesindia": {
    "email": "skincentivesindia@gmail.com",
    "website": "https://skincentives.in",
    "category": "Beauty, Skincare & Grooming"
  },
  "modestouzeattires": {
    "email": "care@modestouzeattires.com",
    "website": "https://modestouzeattires.com",
    "category": "Apparel & Accessories"
  }
};

const freshD2CBrands = {
  "TagZ Foods": {
    "email": "help@tagzfoods.com",
    "website": "https://tagzfoods.com",
    "category": "Food, Snacks & Beverages"
  },
  "Eat Better Co.": {
    "email": "care@eatbetterco.com",
    "website": "https://eatbetterco.com",
    "category": "Food, Snacks & Beverages"
  },
  "The Whole Truth Foods": {
    "email": "partnerships@thewholetruthfoods.com",
    "website": "https://thewholetruthfoods.com",
    "category": "Food, Snacks & Beverages"
  },
  "Slurrp Farm": {
    "email": "mail@slurrpfarm.com",
    "website": "https://slurrpfarm.com",
    "category": "Food, Snacks & Beverages"
  },
  "Troo Good": {
    "email": "support@troogood.com",
    "website": "https://troogood.com",
    "category": "Food, Snacks & Beverages"
  },
  "Beyond Snack": {
    "email": "crc@drjackfruit.com",
    "website": "https://beyondsnack.in",
    "category": "Food, Snacks & Beverages"
  },
  "Blue Tea": {
    "email": "contact@bluetea.co.in",
    "website": "https://bluetea.co.in",
    "category": "Food, Snacks & Beverages"
  },
  "Sleepy Owl Coffee": {
    "email": "marketing@sleepyowl.co",
    "website": "https://sleepyowl.co",
    "category": "Food, Snacks & Beverages"
  },
  "Rage Coffee": {
    "email": "help@ragecoffee.com",
    "website": "https://ragecoffee.com",
    "category": "Food, Snacks & Beverages"
  },
  "Anveshan": {
    "email": "business@anveshan.farm",
    "website": "https://anveshan.farm",
    "category": "Food, Snacks & Beverages"
  },
  "Good Monk": {
    "email": "care@goodmonk.in",
    "website": "https://goodmonk.in",
    "category": "Food, Snacks & Beverages"
  },
  "Teafit": {
    "email": "hi@tea.fit",
    "website": "https://tea.fit",
    "category": "Food, Snacks & Beverages"
  },
  "Snitch": {
    "email": "collab@snitch.co.in",
    "website": "https://snitch.co.in",
    "category": "Apparel & Accessories"
  },
  "DaMENSCH": {
    "email": "support@damensch.com",
    "website": "https://damensch.com",
    "category": "Apparel & Accessories"
  },
  "Clovia": {
    "email": "marketing@clovia.com",
    "website": "https://clovia.com",
    "category": "Apparel & Accessories"
  },
  "Miraggio": {
    "email": "support@miraggiolife.com",
    "website": "https://miraggiolife.com",
    "category": "Apparel & Accessories"
  },
  "Suta": {
    "email": "marketing@suta.in",
    "website": "https://suta.in",
    "category": "Apparel & Accessories"
  },
  "TrueBrowns": {
    "email": "info@truebrowns.com",
    "website": "https://truebrowns.com",
    "category": "Apparel & Accessories"
  },
  "BlissClub": {
    "email": "hi@myblissclub.in",
    "website": "https://myblissclub.in",
    "category": "Apparel & Accessories"
  },
  "Aastey": {
    "email": "happy@aastey.com",
    "website": "https://aastey.com",
    "category": "Apparel & Accessories"
  },
  "Nicobar": {
    "email": "care@nicobar.com",
    "website": "https://nicobar.com",
    "category": "Apparel & Accessories"
  },
  "Maati by Neha Kabra": {
    "email": "info@maatibyneha.com",
    "website": "https://maatibyneha.com",
    "category": "Apparel & Accessories"
  },
  "Okhai": {
    "email": "okhaicfe@okhai.org",
    "website": "https://okhai.org",
    "category": "Apparel & Accessories"
  },
  "The Summer House": {
    "email": "hello@thesummerhouse.in",
    "website": "https://thesummerhouse.in",
    "category": "Apparel & Accessories"
  },
  "Deconstruct": {
    "email": "wecare@thedeconstruct.in",
    "website": "https://thedeconstruct.in",
    "category": "Beauty, Skincare & Grooming"
  },
  "Dot & Key": {
    "email": "care@dotandkey.com",
    "website": "https://dotandkey.com",
    "category": "Beauty, Skincare & Grooming"
  },
  "Earth Rhythm": {
    "email": "business@earthrhythm.com",
    "website": "https://earthrhythm.com",
    "category": "Beauty, Skincare & Grooming"
  },
  "Vilvah Store": {
    "email": "sales@vilvahstore.com",
    "website": "https://vilvahstore.com",
    "category": "Beauty, Skincare & Grooming"
  },
  "Inde Wild": {
    "email": "indiacare@indewild.com",
    "website": "https://indewild.com",
    "category": "Beauty, Skincare & Grooming"
  },
  "Arata": {
    "email": "marketing@arata.in",
    "website": "https://arata.in",
    "category": "Beauty, Skincare & Grooming"
  },
  "Bella Vita Organic": {
    "email": "shop@bellavitaorganic.com",
    "website": "https://bellavitaorganic.com",
    "category": "Beauty, Skincare & Grooming"
  },
  "mCaffeine": {
    "email": "support@mcaffeine.com",
    "website": "https://mcaffeine.com",
    "category": "Beauty, Skincare & Grooming"
  },
  "Plum": {
    "email": "hi@plumgoodness.com",
    "website": "https://plumgoodness.com",
    "category": "Beauty, Skincare & Grooming"
  },
  "The Moms Co.": {
    "email": "support@themomsco.com",
    "website": "https://themomsco.com",
    "category": "Beauty, Skincare & Grooming"
  },
  "The Man Company": {
    "email": "support@themancompany.com",
    "website": "https://themancompany.com",
    "category": "Beauty, Skincare & Grooming"
  },
  "Plix": {
    "email": "hello@plixlife.com",
    "website": "https://plixlife.com",
    "category": "Home, Wellness & Lifestyle"
  },
  "Wellbeing Nutrition": {
    "email": "care@wellbeingnutrition.com",
    "website": "https://wellbeingnutrition.com",
    "category": "Home, Wellness & Lifestyle"
  },
  "Supply6": {
    "email": "care@supplysix.com",
    "website": "https://supplysix.com",
    "category": "Home, Wellness & Lifestyle"
  },
  "Fast&Up": {
    "email": "customercare@fastandup.in",
    "website": "https://fastandup.in",
    "category": "Home, Wellness & Lifestyle"
  },
  "Fitspire": {
    "email": "support@fitspire.fit",
    "website": "https://fitspire.fit",
    "category": "Home, Wellness & Lifestyle"
  },
  "OZiva": {
    "email": "community@oziva.in",
    "website": "https://oziva.in",
    "category": "Home, Wellness & Lifestyle"
  },
  "MuscleBlaze": {
    "email": "info@muscleblaze.com",
    "website": "https://muscleblaze.com",
    "category": "Home, Wellness & Lifestyle"
  },
  "Nutrabay": {
    "email": "support@nutrabay.com",
    "website": "https://nutrabay.com",
    "category": "Home, Wellness & Lifestyle"
  },
  "Nestasia": {
    "email": "info@nestasia.in",
    "website": "https://nestasia.in",
    "category": "Home, Wellness & Lifestyle"
  },
  "Byora Homes": {
    "email": "care@byorahomes.com",
    "website": "https://byorahomes.com",
    "category": "Home, Wellness & Lifestyle"
  },
  "Nappa Dori": {
    "email": "customercare@nappadori.com",
    "website": "https://nappadori.com",
    "category": "Home, Wellness & Lifestyle"
  },
  "RAD Living": {
    "email": "hello@radlvng.com",
    "website": "https://radlvng.com",
    "category": "Home, Wellness & Lifestyle"
  },
  "Karma Kettle": {
    "email": "sales@karmakettle.com",
    "website": "https://karmakettle.com",
    "category": "Food, Snacks & Beverages"
  },
  "Scrapshala": {
    "email": "support@scrapshala.com",
    "website": "https://scrapshala.com",
    "category": "Home, Wellness & Lifestyle"
  },
  "ExclusiveLane": {
    "email": "care@exclusivelane.com",
    "website": "https://exclusivelane.com",
    "category": "Home, Wellness & Lifestyle"
  }
};

function run() {
  if (!fs.existsSync(localStatePath)) {
    console.error(`❌ Error: outreach_local_state.json not found at ${localStatePath}`);
    process.exit(1);
  }

  const localState = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
  const d2cBrands = localState.d2c_brands || {};

  console.log(`📊 Initial D2C Brands count: ${Object.keys(d2cBrands).length}`);

  let addedScreenshot = 0;
  let addedFresh = 0;

  // Add screenshot brands
  for (const [name, info] of Object.entries(screenshotBrands)) {
    if (!d2cBrands[name]) {
      d2cBrands[name] = {
        ...info,
        status: "pending",
        outreach_count: 0
      };
      addedScreenshot++;
    } else {
      console.log(`⚠️ Screenshot brand "${name}" already exists. Skipping.`);
    }
  }

  // Add fresh D2C brands
  for (const [name, info] of Object.entries(freshD2CBrands)) {
    if (!d2cBrands[name]) {
      d2cBrands[name] = {
        ...info,
        status: "pending",
        outreach_count: 0
      };
      addedFresh++;
    } else {
      console.log(`⚠️ Fresh D2C brand "${name}" already exists. Skipping.`);
    }
  }

  localState.d2c_brands = d2cBrands;
  fs.writeFileSync(localStatePath, JSON.stringify(localState, null, 2), 'utf8');

  console.log(`\n✅ Completed Population:`);
  console.log(`- Added Screenshot Brands: ${addedScreenshot}`);
  console.log(`- Added Fresh D2C Brands: ${addedFresh}`);
  console.log(`- Total D2C Brands now: ${Object.keys(d2cBrands).length}`);
}

run();
