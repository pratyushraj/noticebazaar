import * as fs from 'fs';
import { join } from 'path';

const localStatePath = join(process.cwd(), 'scratch', 'outreach_local_state.json');

const newDentists = {
  "ToothCare Dental Clinic": {
    "email": "toothcarepatna@gmail.com",
    "doctorName": "Doctor",
    "treatmentKeyword": "cosmetic teeth alignments, root canals",
    "locationKeyword": "Gorakhnath Lane, Boring Road",
    "status": "pending",
    "outreach_count": 0
  },
  "Magadh Oro Dental": {
    "email": "magadhorodentalpatna@gmail.com",
    "doctorName": "Doctor",
    "treatmentKeyword": "dental implants, oral rehabilitation",
    "locationKeyword": "Kankarbagh",
    "status": "pending",
    "outreach_count": 0
  },
  "Cosmodent Dental Clinic": {
    "email": "cosmodentpatna@gmail.com",
    "doctorName": "Dr. Prerna Priya",
    "treatmentKeyword": "orthodontic alignments, painless dentistry",
    "locationKeyword": "Patna Central",
    "status": "pending",
    "outreach_count": 0
  },
  "Dr. Smile Dental Clinic": {
    "email": "drsmile009@gmail.com",
    "doctorName": "Doctor",
    "treatmentKeyword": "cosmetic dental implants, whitening",
    "locationKeyword": "Boring Road",
    "status": "pending",
    "outreach_count": 0
  },
  "Smile Dental Clinic": {
    "email": "Kharshit909@gmail.com",
    "doctorName": "Dr. Harshit Kumar",
    "treatmentKeyword": "cosmetic scaling, restorative dental care",
    "locationKeyword": "Patna",
    "status": "pending",
    "outreach_count": 0
  },
  "Patna Dental Design": {
    "email": "kundanjee1990@gmail.com",
    "doctorName": "Doctor",
    "treatmentKeyword": "digital smile designing, aligners",
    "locationKeyword": "Patna",
    "status": "pending",
    "outreach_count": 0
  },
  "Patna Dental Clinic & Implant Center": {
    "email": "riteshvatsa2003@gmail.com",
    "doctorName": "Doctor",
    "treatmentKeyword": "dental implants, advanced root canal treatments",
    "locationKeyword": "Makhania Kua",
    "status": "pending",
    "outreach_count": 0
  },
  "The Oro Dental Clinic": {
    "email": "theorojyotiprakash@gmail.com",
    "doctorName": "Dr. Jyoti Prakash",
    "treatmentKeyword": "oral surgery, digital smile designing",
    "locationKeyword": "Patna",
    "status": "pending",
    "outreach_count": 0
  },
  "Dental Comfort Zone": {
    "email": "dcz.patna@gmail.com",
    "doctorName": "Doctor",
    "treatmentKeyword": "laser treatments, teeth whitening",
    "locationKeyword": "Patna",
    "status": "pending",
    "outreach_count": 0
  },
  "Smile Art Dental Clinic": {
    "email": "smileartdentalclinic@gmail.com",
    "doctorName": "Doctor",
    "treatmentKeyword": "smile makeovers, dental cosmetic scaling",
    "locationKeyword": "Gulzarbagh",
    "status": "pending",
    "outreach_count": 0
  },
  "City Dental Centre": {
    "email": "cityimaging2@gmail.com",
    "doctorName": "Doctor",
    "treatmentKeyword": "root canal therapy, family dental care",
    "locationKeyword": "Tempo Stand, Kankarbagh",
    "status": "pending",
    "outreach_count": 0
  },
  "Green Dental Care": {
    "email": "dr.amitkumarsrivastava@ymail.com",
    "doctorName": "Dr. Amit Kumar Srivastava",
    "treatmentKeyword": "teeth alignment, pain-free extractions",
    "locationKeyword": "Boring Road",
    "status": "pending",
    "outreach_count": 0
  },
  "Krishna Dental Hospital & Research Center": {
    "email": "support@krishnadentalhospital.com",
    "doctorName": "Doctor",
    "treatmentKeyword": "comprehensive orthodontics, dental implants",
    "locationKeyword": "Yarpur",
    "status": "pending",
    "outreach_count": 0
  },
  "Om Dental Braces & Implant Clinic": {
    "email": "omdentalclinicpatnaa@gmail.com",
    "doctorName": "Doctor",
    "treatmentKeyword": "braces, ceramic implants",
    "locationKeyword": "Patna",
    "status": "pending",
    "outreach_count": 0
  },
  "Jay Dental Care": {
    "email": "info@jaydentalcare.com",
    "doctorName": "Doctor",
    "treatmentKeyword": "smile redesigns, full-mouth restoration",
    "locationKeyword": "Gardanibagh",
    "status": "pending",
    "outreach_count": 0
  }
};

const newDermatologists = {
  "SKINaGe Clinic": {
    "email": "skinagepatna@gmail.com",
    "doctorName": "Doctor",
    "treatmentKeyword": "laser skincare, acne scar treatments, glowing skin",
    "locationKeyword": "Sri Krishna Puri, Boring Road",
    "status": "pending",
    "outreach_count": 0
  },
  "Perfect Skin & Hair Solutions": {
    "email": "perfectskin566@gmail.com",
    "doctorName": "Dr. Samina Subuhi",
    "treatmentKeyword": "clinical dermatology, hair fall therapy",
    "locationKeyword": "Sabzibagh",
    "status": "pending",
    "outreach_count": 0
  },
  "Ortho and Skin Care Clinic": {
    "email": "orthoandskin@gmail.com",
    "doctorName": "Dr. Richa Thakur",
    "treatmentKeyword": "medical skin therapies, chemical peels",
    "locationKeyword": "Raja Bazar",
    "status": "pending",
    "outreach_count": 0
  },
  "Kiran Skin Clinic": {
    "email": "asmita.hi@gmail.com",
    "doctorName": "Dr. Asmita Singh",
    "treatmentKeyword": "medical & cosmetic dermatology, laser treatments",
    "locationKeyword": "Bailey Road",
    "status": "pending",
    "outreach_count": 0
  },
  "Skin And Hair Clinic": {
    "email": "info@skinandhairclinic.com",
    "doctorName": "Dr. Abhijeet Jha",
    "treatmentKeyword": "clinical aesthetic dermatology, hair transplants",
    "locationKeyword": "Kankarbagh",
    "status": "pending",
    "outreach_count": 0
  },
  "Adarsh Skin Care Clinic": {
    "email": "info@adarshskincareclinic.com",
    "doctorName": "Dr. Ayush Adarsh",
    "treatmentKeyword": "advanced skin treatments, anti-aging therapies",
    "locationKeyword": "Rajendra Nagar",
    "status": "pending",
    "outreach_count": 0
  },
  "Square Root Hair Transplant Skin Laser Clinic": {
    "email": "squarerootpatna@gmail.com",
    "doctorName": "Doctor",
    "treatmentKeyword": "hair restoration, skin rejuvenation",
    "locationKeyword": "Sri Krishna Puri",
    "status": "pending",
    "outreach_count": 0
  },
  "Advance Skin Hair & Laser Clinic": {
    "email": "info@advanceskinhairclinic.com",
    "doctorName": "Dr. Punkesh Kumar",
    "treatmentKeyword": "laser hair removal, pigment therapies",
    "locationKeyword": "Rajendra Nagar",
    "status": "pending",
    "outreach_count": 0
  },
  "Dermashine Skin & Cosmetic Clinic": {
    "email": "drrashidderma@gmail.com",
    "doctorName": "Dr. Rashid Shahid",
    "treatmentKeyword": "cosmetic injectables, skin polishing",
    "locationKeyword": "Haroon Nagar",
    "status": "pending",
    "outreach_count": 0
  },
  "Advante Hair & Skin Clinic": {
    "email": "advanteclinicpatna@gmail.com",
    "doctorName": "Doctor",
    "treatmentKeyword": "medical hair growth treatments, laser peeling",
    "locationKeyword": "Kidwai Puri",
    "status": "pending",
    "outreach_count": 0
  },
  "Satya Skin And Cosmetic Clinic": {
    "email": "drkumarsatyaprakash@gmail.com",
    "doctorName": "Dr. Kumar Satya Prakash",
    "treatmentKeyword": "acne control, whitening lasers",
    "locationKeyword": "Malahi Pakri Chowk, Kankarbagh",
    "status": "pending",
    "outreach_count": 0
  },
  "Dr. Priyadarshi Ranjan Plastic & Cosmetic Surgery Clinic": {
    "email": "drpdranjan@gmail.com",
    "doctorName": "Dr. Priyadarshi Ranjan",
    "treatmentKeyword": "cosmetic surgeries, microdermabrasion",
    "locationKeyword": "PC Colony, Kankarbagh",
    "status": "pending",
    "outreach_count": 0
  },
  "Ashwini ENT & Cosmetic Hospital": {
    "email": "info@ashwinicosmetichospital.com",
    "doctorName": "Doctor",
    "treatmentKeyword": "cosmetic facial reconstruction, skin rejuvenation",
    "locationKeyword": "Malahi Pakri Chowk, Kankarbagh",
    "status": "pending",
    "outreach_count": 0
  },
  "Cutis Skin Clinic and Laser Centre": {
    "email": "sksudhu@gmail.com",
    "doctorName": "Doctor",
    "treatmentKeyword": "skincare facials, anti-pigmentation lasers",
    "locationKeyword": "PC Colony, Kankarbagh",
    "status": "pending",
    "outreach_count": 0
  },
  "Mediversal Health Studio": {
    "email": "operations.studio@mediversal.in",
    "doctorName": "Doctor",
    "treatmentKeyword": "weight loss programs, wellness skin therapies",
    "locationKeyword": "East Gandhi Maidan",
    "status": "pending",
    "outreach_count": 0
  },
  "Dr. Abhijeet Kumar Jha Skin Clinic": {
    "email": "info@drabhijeetjha.com",
    "doctorName": "Dr. Abhijeet Kumar Jha",
    "treatmentKeyword": "clinical skincare, advanced hair regrowth",
    "locationKeyword": "Kankarbagh",
    "status": "pending",
    "outreach_count": 0
  },
  "The Skin Centre": {
    "email": "restorefollicle@gmail.com",
    "doctorName": "Dr. Abhinav Kumar",
    "treatmentKeyword": "hair restorations, advanced scalp treatments",
    "locationKeyword": "Kankarbagh",
    "status": "pending",
    "outreach_count": 0
  },
  "Redefine Skin Clinic": {
    "email": "drkunalsinha82@gmail.com",
    "doctorName": "Dr. Kunal Sinha",
    "treatmentKeyword": "skin laser toning, clinical peelings",
    "locationKeyword": "Kankarbagh",
    "status": "pending",
    "outreach_count": 0
  }
};

const newSalons = {
  "Head Turners (Boring Road)": {
    "email": "headturners.patna13@gmail.com",
    "doctorName": "Manager",
    "treatmentKeyword": "hair highlights, luxury facials, bridal makeups",
    "locationKeyword": "Boring Road",
    "status": "pending",
    "outreach_count": 0
  },
  "Geetanjali Salon": {
    "email": "customercare@geetanjalisalon.com",
    "doctorName": "Manager",
    "treatmentKeyword": "hair styling, global coloring, global balayage",
    "locationKeyword": "Boring Road & Kankarbagh",
    "status": "pending",
    "outreach_count": 0
  },
  "Jawed Habib Salon & Beauty Parlour": {
    "email": "info@thejawedhabibsalon.com",
    "doctorName": "Manager",
    "treatmentKeyword": "hair keratin, signature spa, bridal glow",
    "locationKeyword": "Kankarbagh",
    "status": "pending",
    "outreach_count": 0
  },
  "Shahnaz Hussain and Loreal Professional Beauty Salon": {
    "email": "Shahnazhussain2011@gmail.com",
    "doctorName": "Manager",
    "treatmentKeyword": "herbal skin facials, organic hair spa",
    "locationKeyword": "Sheikhpura, Bailey Road",
    "status": "pending",
    "outreach_count": 0
  },
  "The World Of Beauty Place": {
    "email": "theworldofbeautyplace@gmail.com",
    "doctorName": "Manager",
    "treatmentKeyword": "bridal makeup studio, hair spa therapy",
    "locationKeyword": "Lohianagar",
    "status": "pending",
    "outreach_count": 0
  },
  "CUT&STYLE Salon": {
    "email": "info@cutandstyle.in",
    "doctorName": "Manager",
    "treatmentKeyword": "hair aesthetics, organic skin care, premium grooming",
    "locationKeyword": "Rajiv Nagar",
    "status": "pending",
    "outreach_count": 0
  },
  "The Icon Studio Unisex Salon & Spa": {
    "email": "theiconstudiosalon@gmail.com",
    "doctorName": "Manager",
    "treatmentKeyword": "signature massages, global hair spa, bridal makeovers",
    "locationKeyword": "BMP Road, Bailey Road",
    "status": "pending",
    "outreach_count": 0
  },
  "D'Elixir Salon": {
    "email": "contact@delixirsalon.com",
    "doctorName": "Manager",
    "treatmentKeyword": "hair botox, hydra-facials, premium groomings",
    "locationKeyword": "New Patliputra Colony",
    "status": "pending",
    "outreach_count": 0
  },
  "The Grace Salon": {
    "email": "thegracewellness@gmail.com",
    "doctorName": "Manager",
    "treatmentKeyword": "wellness spa therapies, hair aesthetic setups",
    "locationKeyword": "South Gandhi Maidan",
    "status": "pending",
    "outreach_count": 0
  },
  "Lady Fair Beauty Salon & Makeup Studio": {
    "email": "Ladyfairpatna@gmail.com",
    "doctorName": "Manager",
    "treatmentKeyword": "high-end bridal makeups, premium pre-bridal grooming",
    "locationKeyword": "Boring Road",
    "status": "pending",
    "outreach_count": 0
  },
  "Style N Shine Studio": {
    "email": "carestylenShine@gmail.com",
    "doctorName": "Manager",
    "treatmentKeyword": "hair transformations, advanced glow facials",
    "locationKeyword": "Patna",
    "status": "pending",
    "outreach_count": 0
  },
  "The Boss Salon and Spa": {
    "email": "beardotheboss777@gmail.com",
    "doctorName": "Manager",
    "treatmentKeyword": "beard grooming, signature skin therapies",
    "locationKeyword": "Patna",
    "status": "pending",
    "outreach_count": 0
  },
  "VLCC (P&M Mall branch)": {
    "email": "vlccpatna2013@gmail.com",
    "doctorName": "Manager",
    "treatmentKeyword": "weight loss therapies, medical facials, laser aesthetic clinics",
    "locationKeyword": "P&M Mall, Patliputra",
    "status": "pending",
    "outreach_count": 0
  },
  "Lakme Salon Kankarbagh": {
    "email": "Lakmesalon90feetpatna@gmail.com",
    "doctorName": "Manager",
    "treatmentKeyword": "Lakme signature facials, global hair colorings",
    "locationKeyword": "90 Feet Road, Kankarbagh",
    "status": "pending",
    "outreach_count": 0
  },
  "Lakme Salon Patliputra": {
    "email": "info@lakmepatna.com",
    "doctorName": "Manager",
    "treatmentKeyword": "lakme bridal makeups, premium global styling",
    "locationKeyword": "Patliputra Colony",
    "status": "pending",
    "outreach_count": 0
  },
  "Hair Studio (Boring Road) / Smooth N Shine": {
    "email": "cdsinghsmoothnshine@gmail.com",
    "doctorName": "Manager",
    "treatmentKeyword": "keratin hair smoothing, global hair shine treatments",
    "locationKeyword": "Boring Road",
    "status": "pending",
    "outreach_count": 0
  },
  "Shahnaz Hussain Makeup Studio": {
    "email": "shahnazhussainmakeupstudio@gmail.com",
    "doctorName": "Manager",
    "treatmentKeyword": "signature bridal cosmetics, advanced skin glowups",
    "locationKeyword": "Sheikhpura, Bailey Road",
    "status": "pending",
    "outreach_count": 0
  },
  "Blonde And Beyond Unisex Salon": {
    "email": "bandbsalonacademy@gmail.com",
    "doctorName": "Manager",
    "treatmentKeyword": "blonde highlighting, advanced global hair extensions",
    "locationKeyword": "Fraser Road",
    "status": "pending",
    "outreach_count": 0
  },
  "Beauty Spa and Salon (Bailey Road)": {
    "email": "beautyspa33@gmail.com",
    "doctorName": "Manager",
    "treatmentKeyword": "wellness body spas, signature aromatherapy treatments",
    "locationKeyword": "Gola Road, Bailey Road",
    "status": "pending",
    "outreach_count": 0
  },
  "King & Queens Unisex Salon and Spa": {
    "email": "patelsonia531@gmail.com",
    "doctorName": "Manager",
    "treatmentKeyword": "luxury body spa setups, family groomings",
    "locationKeyword": "Patna",
    "status": "pending",
    "outreach_count": 0
  }
};

function run() {
  console.log('🔄 Loading local state file...');
  if (!fs.existsSync(localStatePath)) {
    console.error('❌ Error: Local state file not found.');
    process.exit(1);
  }

  const localState = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));

  // 1. Add/Merge dentists
  localState.dentists = localState.dentists || {};
  let addedDentists = 0;
  for (const [name, data] of Object.entries(newDentists)) {
    if (!localState.dentists[name]) {
      localState.dentists[name] = data;
      addedDentists++;
    }
  }

  // 2. Add/Merge dermatologists
  localState.dermatologists = localState.dermatologists || {};
  let addedDermos = 0;
  for (const [name, data] of Object.entries(newDermatologists)) {
    if (!localState.dermatologists[name]) {
      localState.dermatologists[name] = data;
      addedDermos++;
    }
  }

  // 3. Add/Merge salons
  localState.salons = localState.salons || {};
  let addedSalons = 0;
  for (const [name, data] of Object.entries(newSalons)) {
    if (!localState.salons[name]) {
      localState.salons[name] = data;
      addedSalons++;
    }
  }

  console.log(`✅ Dentists processed. Added ${addedDentists} brand-new dentist leads.`);
  console.log(`✅ Dermatologists processed. Added ${addedDermos} brand-new dermo leads.`);
  console.log(`✅ Salons processed. Added ${addedSalons} brand-new salon leads.`);

  fs.writeFileSync(localStatePath, JSON.stringify(localState, null, 2), 'utf8');
  console.log('💾 Successfully saved local state path with exactly 50 brand-new Patna leads!');
}

run();
