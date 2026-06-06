import { readFileSync, writeFileSync } from 'fs';

const da = JSON.parse(readFileSync('dictionaries/da.json', 'utf8'));
const en = JSON.parse(readFileSync('dictionaries/en.json', 'utf8'));

// Nav extensions
const navKeysDa = {
  browseCars: "Se biler",
  browseBusiness: "Se erhvervsbiler",
  dealers: "Forhandlere",
  myBusiness: "Min virksomhed",
  myAccount: "Min konto",
  createListing: "Opret bil",
  language: "Sprog",
  openMenu: "Åbn menu",
  adminDashboard: "Admin Dashboard",
  signIn: "Log ind",
  signUp: "Opret konto",
  signOut: "Log ud"
};
const navKeysEn = {
  browseCars: "Browse Cars",
  browseBusiness: "Commercial Cars",
  dealers: "Dealers",
  myBusiness: "My Business",
  myAccount: "My Account",
  createListing: "List a Car",
  language: "Language",
  openMenu: "Open menu",
  adminDashboard: "Admin Dashboard",
  signIn: "Sign in",
  signUp: "Sign up",
  signOut: "Sign out"
};

Object.assign(da.nav, navKeysDa);
Object.assign(en.nav, navKeysEn);

// Home types extensions
da.home.auctionTypes = {
  privateLabel: "Aktive Auktioner",
  privateHeading: "Find Din Næste Bil",
  privateSubtext: "Køb bil direkte fra private sælgere",
  businessLabel: "Erhvervsauktioner",
  businessHeading: "Professionelle Forhandlere",
  businessSubtext: "Godkendte erhvervsforhandlere og virksomheder"
};
en.home.auctionTypes = {
  privateLabel: "Active Auctions",
  privateHeading: "Find Your Next Car",
  privateSubtext: "Buy a car directly from private sellers",
  businessLabel: "Commercial Auctions",
  businessHeading: "Professional Dealers",
  businessSubtext: "Approved commercial dealers and businesses"
};

da.home.finalCta = {
  heading: "Klar til at komme i gang?",
  subtext: "Opret din gratis konto i dag",
  btnSignUp: "Opret konto gratis",
  btnBrowse: "Se aktive auktioner"
};
en.home.finalCta = {
  heading: "Ready to get started?",
  subtext: "Create your free account today",
  btnSignUp: "Create account for free",
  btnBrowse: "Browse active auctions"
};

da.home.buyerSteps = {
  step1title: "Opret konto",
  step1desc: "Gratis og hurtigt. Klar på 2 minutter.",
  step2title: "Find din bil",
  step2desc: "Søg, filtrer og gem favoritter.",
  step3title: "Afgiv bud og vind",
  step3desc: "Højeste bud ved udløb vinder."
};
en.home.buyerSteps = {
  step1title: "Create account",
  step1desc: "Free and fast. Ready in 2 minutes.",
  step2title: "Find your car",
  step2desc: "Search, filter and save favorites.",
  step3title: "Place bid and win",
  step3desc: "Highest bid at end wins."
};

writeFileSync('dictionaries/da.json', JSON.stringify(da, null, 2));
writeFileSync('dictionaries/en.json', JSON.stringify(en, null, 2));
console.log('Dictionaries updated successfully.');
