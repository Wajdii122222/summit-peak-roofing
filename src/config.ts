// ─────────────────────────────────────────────────────────────────────────────
// Summit Peak Roofing — business + product configuration
// CUSTOMIZE HERE: every business detail on the site reads from this file.
// The two plan IDs come from the Whop dashboard: create two one-time
// products ("Roof Inspection" $149 and "Project Deposit" $500) under
// Checkout links / Products, then paste their plan_... IDs below.
// Until real IDs are set, checkout runs in demo mode and visitors are
// offered an emailed invoice instead (see CheckoutModal.tsx).
// ─────────────────────────────────────────────────────────────────────────────

export const BUSINESS = {
  name: "Summit Peak Roofing",
  tagline: "Dallas–Fort Worth's trusted roofers since 2009",
  phoneDisplay: "(214) 555-0148",
  phoneHref: "tel:+12145550148",
  email: "hello@summitpeakroofing.com",
  address: "1200 W Mockingbird Ln, Dallas, TX 75247",
  hours: "Mon–Sat 7:00 AM – 7:00 PM · 24/7 storm emergency line",
  serviceArea:
    "Dallas, Fort Worth, Plano, Frisco, Arlington, Irving, Garland, McKinney, Richardson, Grand Prairie & all of DFW",
  license: "TX Roofing Contractor License #RC-88412 · Fully licensed & insured",
  rating: 4.9,
  reviewCount: 487,
  yearsInBusiness: 17,
  roofsCompleted: 6400,
};

// Whop product / variant IDs. The pixel and the checkout both use these.
// Demo placeholders: replace with real IDs from your Whop dashboard.
export const PRODUCTS = {
  inspection: {
    productId: "prod_Hfz1VM1jN4aNM",
    planId: "plan_jySwAUlkQ7bbG",
    name: "Roof Inspection",
    price: 149,
    currency: "usd",
    blurb:
      "A 21-point inspection with photos, a written report, and an honest repair-or-replace recommendation.",
  },
  deposit: {
    productId: "prod_ZrcPT2iIwJnR5",
    planId: "plan_TJ1ohauUu8fm9",
    name: "Project Deposit",
    price: 500,
    currency: "usd",
    blurb:
      "Locks your install date and material pricing. Fully credited toward your project total — refundable up to 7 days before work starts.",
  },
};

export const PLANS_CONFIGURED =
  PRODUCTS.inspection.planId !== "plan_xxxxxxxxxxxxx" &&
  PRODUCTS.deposit.planId !== "plan_xxxxxxxxxxxxx";

export const SERVICES = [
  {
    id: "replacement",
    title: "Roof Replacement",
    icon: "🏠",
    desc: "Full tear-off and install in architectural shingles, metal, or tile — most homes done in 1–2 days.",
    points: ["Architectural shingles, metal & tile", "50-year material warranty", "Free haul-away & yard cleanup"],
    image: "/images/roofers-at-work.webp",
  },
  {
    id: "repair",
    title: "Roof Repair",
    icon: "🔧",
    desc: "Leaks, missing shingles, flashing and vent fixes — diagnosed same day, repaired right the first time.",
    points: ["Same-day leak diagnosis", "Matching shingles sourced", "2-year repair workmanship warranty"],
    image: "/images/storm-damage.webp",
  },
  {
    id: "storm",
    title: "Storm & Hail Damage",
    icon: "🌩️",
    desc: "We document the damage, meet your adjuster on the roof, and handle the insurance paperwork with you.",
    points: ["Free storm damage inspection", "Adjuster meeting on-site", "Insurance claim guidance"],
    image: "/images/storm-damage.webp",
  },
  {
    id: "inspection",
    title: "21-Point Inspection",
    icon: "🔍",
    desc: "A full photo-documented health check of your roof, attic ventilation, flashing and gutters — $149, credited toward any repair.",
    points: ["Drone + on-roof inspection", "Written report with photos", "$149 credited toward repairs"],
    image: "/images/hero-house.webp",
  },
  {
    id: "gutters",
    title: "Gutters & Guards",
    icon: "💧",
    desc: "Seamless aluminum gutters and leaf guards sized to your roofline, installed with every replacement or standalone.",
    points: ["Seamless 5\" & 6\" gutters", "Leaf-guard systems", "Downspout drainage solutions"],
    image: "/images/roofers-at-work.webp",
  },
  {
    id: "ventilation",
    title: "Attic Ventilation & Insulation",
    icon: "🌬️",
    desc: "Proper airflow extends shingle life and cuts cooling bills. Ridge vents, soffit vents, and attic insulation top-ups.",
    points: ["Ridge & soffit venting", "Attic insulation top-up", "Lower summer cooling bills"],
    image: "/images/hero-house.webp",
  },
];

export const FINANCING = [
  {
    name: "0% APR for 12 months",
    desc: "Same-as-cash for a full year on approved credit. No interest, no prepayment penalty.",
    example: "A $12,000 roof = $1,000/mo for 12 months, $0 interest.",
  },
  {
    name: "6.99% APR up to 60 months",
    desc: "Low fixed monthly payments for larger projects — replacement, metal, or tile.",
    example: "A $18,000 roof ≈ $354/mo for 60 months.",
  },
  {
    name: "12.99% APR up to 120 months",
    desc: "The lowest monthly payment for whole-home projects and storm rebuilds.",
    example: "A $24,000 roof ≈ $364/mo for 120 months.",
  },
];

export const REVIEWS = [
  {
    name: "Marcus T.",
    location: "Plano, TX",
    rating: 5,
    date: "October 2026",
    service: "Roof Replacement",
    text: "Hail took out our roof in May. Summit Peak met the adjuster, handled the paperwork, and had a new roof on in two days. The crew cleaned the yard so well you'd never know they'd been here.",
  },
  {
    name: "Danielle R.",
    location: "Fort Worth, TX",
    rating: 5,
    date: "September 2026",
    service: "Roof Repair",
    text: "A leak over the kitchen had two other companies guessing. Their inspector found a bad vent boot in 20 minutes, fixed it the same day, and the $149 inspection fee came off the repair.",
  },
  {
    name: "James & Priya K.",
    location: "Frisco, TX",
    rating: 5,
    date: "August 2026",
    service: "Roof Replacement",
    text: "Financing made it possible — 0% for 12 months and the monthly payment was exactly what they quoted. No surprises, no upsell, and the foreman texted photos at every step.",
  },
  {
    name: "Angela M.",
    location: "Arlington, TX",
    rating: 5,
    date: "July 2026",
    service: "Storm & Hail Damage",
    text: "After the storm, three roofers knocked on my door the same week. Summit Peak was the only one who put everything in writing and never asked for money up front. Honest people.",
  },
  {
    name: "Robert S.",
    location: "Dallas, TX",
    rating: 5,
    date: "June 2026",
    service: "Gutters & Guards",
    text: "New seamless gutters and leaf guards installed in one morning. They re-graded two downspouts that were flooding my flower beds — didn't charge extra for it.",
  },
  {
    name: "Karen L.",
    location: "McKinney, TX",
    rating: 4,
    date: "May 2026",
    service: "21-Point Inspection",
    text: "Thorough inspection with drone photos and a clear written report. They told me my roof had 5+ years left and NOT to replace it yet — that's the kind of honesty that earns a customer for life.",
  },
];

export const FAQS = [
  {
    q: "How much does a new roof cost?",
    a: "Most DFW homes run $11,000–$19,000 for architectural shingles, depending on size, pitch, and material. Metal runs $20,000–$35,000 and tile $25,000+. Your free estimate gives you an exact price — use the estimator above for a ballpark in 60 seconds.",
  },
  {
    q: "How long does a roof replacement take?",
    a: "Most single-family homes take 1–2 days from tear-off to final cleanup. Larger or steeper roofs can take 3–4 days. We never leave a roof open overnight — every day ends watertight.",
  },
  {
    q: "Do you work with insurance after storms?",
    a: "Yes — storm damage is half our business. We document everything with photos, meet your adjuster on the roof, and help you through the claim. You only pay your deductible; we never ask for it to be waived or inflated.",
  },
  {
    q: "What does the $149 inspection include?",
    a: "A 21-point check of shingles, flashing, vents, valleys, gutters and attic ventilation, with drone photos and a written report. If you hire us for a repair or replacement within 30 days, the $149 is credited toward the work.",
  },
  {
    q: "Is financing really 0%?",
    a: "Yes — 0% APR for 12 months on approved credit, with no prepayment penalty. Longer terms (up to 120 months) carry fixed APRs shown above. Financing is through our lending partners; approval takes about 5 minutes.",
  },
];

// Estimate calculator rates (rough ballpark only — the form says so).
export const ESTIMATE_RATES: Record<string, { low: number; high: number }> = {
  asphalt: { low: 4.5, high: 7.5 },
  metal: { low: 9, high: 15 },
  tile: { low: 11, high: 18 },
  flat: { low: 6, high: 10 },
};
