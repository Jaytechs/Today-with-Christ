// src/context/LanguageContext.jsx
// Global language context — toggle between English and Bemba anywhere in the app

import { createContext, useContext, useState } from "react";

const LanguageContext = createContext(null);

export function useLanguage() {
  return useContext(LanguageContext);
}

// ── Translation strings ───────────────────────────────────────────────────────
const translations = {
  en: {
    // Nav
    home: "Home",
    features: "Features",
    dailyFlow: "Daily Flow",
    login: "Login",
    getStarted: "Get Started",
    dashboard: "Dashboard",
    scripture: "Scripture",
    prayer: "Prayer",
    reflection: "Reflection",
    progress: "Progress",
    pathway: "Pathway",
    settings: "Settings",
    logout: "Logout",
    community: "Community",
    videos: "Videos",
    communityFeed: "Community Feed",
    communityIntro: "A gentle space to share reflections and encouragement.",
    shareYourJourney:
      "Share your journey in a respectful, growth-centered way.",
    communitySafetyNote: "Posts are public and moderated with kindness.",
    dailySpiritualTopic: "Spiritual Topic",
    category: "Category",
    type: "Type",
    scripturePlaceholder: "Reference scripture or verse",
    writeReflection: "Write your reflection, testimony, or teaching.",
    postReflection: "Post to the Feed",
    posting: "Posting…",
    amen: "Amen",
    comments: "Comments",
    noCommentsYet: "No comments yet",
    shareEncouragement: "Leave a kind encouragement…",
    postComment: "Post Comment",
    teaching: "Teaching",
    videoLibrary: "Video Library",
    videoIntro:
      "Watch short guided teachings focused on prayer, faith, discipline, and leadership.",
    videoCategories: "Video Library",
    playVideo: "Play Video",
    watchNow: "Watch Now",
    markComplete: "Mark Complete",
    nowPlaying: "Now Playing",
    uploadVideo: "Upload Video",
    uploadNote: "Only admins and verified mentors can add new videos.",
    videoTitle: "Video Title",
    videoDescription: "Video Description",
    thumbnailUrl: "Thumbnail URL",
    videoUrl: "Video URL",
    uploading: "Uploading…",
    close: "Close",

    // Hero
    heroTitle: "Today with Christ",
    heroTagline: "One day. One step. With Christ.",
    heroDesc:
      "A daily spiritual companion that helps you build consistency in prayer, scripture, and reflection — one day at a time.",

    // Features
    featuresTitle: "Everything You Need to Grow Daily",
    featuresSubtitle:
      "A complete system for spiritual discipline and daily Christian living.",
    feat1Title: "Daily Devotions",
    feat1Desc:
      "Fresh scripture and devotional content every morning to anchor your day.",
    feat2Title: "Prayer Guidance",
    feat2Desc: "Structured guided prayers for morning, midday, and evening.",
    feat3Title: "Daily Reflection",
    feat3Desc: "Evening journaling questions to help you process and grow.",
    feat4Title: "Growth Paths",
    feat4Desc:
      "Step-by-step spiritual levels from foundational faith to Kingdom impact.",
    feat5Title: "Smart Reminders",
    feat5Desc: "Gentle notifications that keep you aligned throughout the day.",
    feat6Title: "Progress Tracking",
    feat6Desc:
      "Streaks, milestones, and visual progress to celebrate consistency.",
    feat7Title: "English & Bemba",
    feat7Desc: "Full support for both languages so no one is left behind.",

    // Daily Flow
    flowTitle: "Your Daily Spiritual Rhythm",
    flowSubtitle: "A simple, repeatable structure that transforms each day.",
    morning: "Morning",
    midday: "Midday",
    evening: "Evening",
    morningItems: [
      "Read today's scripture",
      "Guided morning prayer",
      "Set your daily focus",
    ],
    middayItems: [
      "Check-in reminder",
      "Midday alignment prayer",
      "Review your focus",
    ],
    eveningItems: [
      "Evening reflection",
      "Journal your growth",
      "Prayer of gratitude",
    ],

    // Dashboard
    greeting: "Good morning",
    greetingAfternoon: "Good afternoon",
    greetingEvening: "Good evening",
    streakDays: "day streak",
    todaysWord: "Today's Word",
    todaysFocus: "Today's Focus",
    dailyPrayer: "Daily Prayer",
    dailyReflection: "Daily Reflection",
    growthPathway: "Growth Pathway",
    startDevotion: "Start Devotion",
    prayNow: "Pray Now",
    reflectTonight: "Reflect Tonight",
    completed: "Completed",
    inProgress: "In Progress",
    locked: "Locked",

    // Reflection
    prayedToday: "Did you pray today?",
    challengeQ: "What challenged you today?",
    learnedQ: "What did you learn today?",
    howFeeling: "How are you feeling?",
    saveReflection: "Save Reflection",
    thankYou: "Reflection saved. Well done.",

    // Auth
    fullName: "Full Name",
    email: "Email Address",
    password: "Password",
    confirmPassword: "Confirm Password",
    language: "Preferred Language",
    register: "Create Account",
    loginBtn: "Sign In",
    forgotPassword: "Forgot Password?",
    resetPassword: "Reset Password",
    orContinueWith: "or continue with",
    alreadyHave: "Already have an account?",
    dontHave: "Don't have an account?",
    signInGoogle: "Sign in with Google",

    // Growth levels
    level0: "Knowing God",
    level1: "Faith & Salvation",
    level2: "Daily Discipline",
    level3: "Purpose & Calling",
    level4: "Kingdom Leadership",
  },

  bem: {
    // Nav
    home: "Kweba",
    features: "Ifintu",
    dailyFlow: "Inshila ya Lelo",
    login: "Ingila",
    getStarted: "Tangila",
    dashboard: "Ifunde",
    scripture: "Baibolo",
    prayer: "Umulombo",
    reflection: "Ukulinganya",
    progress: "Ukushamuka",
    pathway: "Inshila",
    settings: "Ifintu",
    logout: "Fuma",
    community: "Umubili",
    videos: "Amavidiyo",
    communityFeed: "Umubili wa Umutima",
    communityIntro: "Icikwata ukupeleka ifyo wafumya mu cine cinono.",
    shareYourJourney: "Shita ifintu fya kuwa mu mutima, ukutambika.",
    communitySafetyNote:
      "Amaposta yinshi yayalafye bonse, bonse bali mu bukabomfi.",
    dailySpiritualTopic: "Icikwata Cesu Ca Lelo",
    category: "Icinga",
    type: "Ubusuma",
    scripturePlaceholder: "Landa inkamba ya Baibolo palyo",
    writeReflection: "Longulula icishinka caku, ubufyashi, kapena ukufundisha.",
    postReflection: "Posta pa umubili",
    posting: "Kulisapo…",
    amen: "Amina",
    comments: "Amapepo",
    noCommentsYet: "Takuli amapepe lelo",
    shareEncouragement: "Shita intebo yabupondo…",
    postComment: "Posta Umapepo",
    teaching: "Ukufundisha",
    videoLibrary: "Amasambilisho ya Video",
    videoIntro: "Landa amavidiyo ya kupusa pa umulombo, ukwikala, naku luse.",
    videoCategories: "Amavidiyo",
    playVideo: "Tabula Video",
    watchNow: "Tala Nomba",
    markComplete: "Pela Ukwenda",
    nowPlaying: "Tala Nomba",
    uploadVideo: "Tushanya Video",
    uploadNote:
      "Bale ba admin ne bantu aba bane pa mumpanda baishibe ukupanga amavidiyo.",
    videoTitle: "Ishina lya Video",
    videoDescription: "Icisambilisho ca Video",
    thumbnailUrl: "URL ya Thambuni",
    videoUrl: "URL ya Video",
    uploading: "Kulisapo…",
    close: "Fumya",

    // Hero
    heroTitle: "Lelo na Kristu",
    heroTagline: "Ubushiku bumo. Icuma. Na Kristu.",
    heroDesc:
      "Umufwilisha wa mapepo wa lelo uukusambilisha ukukwata ukulingana mu mulombo, Baibolo, ne kulinganya — ubushiku ubweka ubweka.",

    // Features
    featuresTitle: "Fyonse Ifintu Ifikwata Ukushamuka Lelo",
    featuresSubtitle:
      "Ubulanda bwaba bwonse bwa indiscipline ya mapepo ne Bukristu bwa lelo.",
    feat1Title: "Amadevosho ya Lelo",
    feat1Desc:
      "Baibolo ne fya mapepo ubushiku bonse uluchelo ukupanga lelo lyenu.",
    feat2Title: "Ukulongolola Umulombo",
    feat2Desc: "Imilombo ukulongolola uluchelo, ubushiku, ne nachipaku.",
    feat3Title: "Ukuinganya kwa Lelo",
    feat3Desc: "Emibuzo ya nachipaku yawama ukusambilila ukuya pali fye.",
    feat4Title: "Inshila sha Kukula",
    feat4Desc:
      "Inshila sha ngandu ukufuma ku kusambilila Lesa uko ku bulimi bwa Bufumu.",
    feat5Title: "Ukukumbusha",
    feat5Desc: "Ukukumbusha kwafwinika ukukulinganya ubushiku bonse.",
    feat6Title: "Ukulandula Ukushamuka",
    feat6Desc:
      "Imilaka ya lelo, amafinikilo, ne ukushamuka ukutontonkanya ukulingana.",
    feat7Title: "Iciengeleshi ne Icibemba",
    feat7Desc: "Ukulingana kwa malembo yonse yombi ukuti tamwafikwa kubulwa.",

    // Daily Flow
    flowTitle: "Inshila Yenu ya Mapepo ya Lelo",
    flowSubtitle: "Inshila iisababa ne ukulangilisha ukupanga ubushiku bonse.",
    morning: "Uluchelo",
    midday: "Ubushiku",
    evening: "Nachipaku",
    morningItems: [
      "Soma Baibolo ya lelo",
      "Umulombo wa uluchelo",
      "Imba icitabo cenu ca lelo",
    ],
    middayItems: [
      "Ukukumbusha kwa ubushiku",
      "Umulombo wa ubushiku",
      "Elula icitabo cenu",
    ],
    eveningItems: [
      "Ukuinganya kwa nachipaku",
      "Lemba ukushamuka kwenu",
      "Umulombo wa matontonkanya",
    ],

    // Dashboard
    greeting: "Mwabuka bwino",
    greetingAfternoon: "Mwashibukeni",
    greetingEvening: "Mwabombeni bwino",
    streakDays: "insiku shalumba",
    todaysWord: "Amashiwi ya Lelo",
    todaysFocus: "Icilengwa ca Lelo",
    dailyPrayer: "Umulombo wa Lelo",
    dailyReflection: "Ukuinganya kwa Lelo",
    growthPathway: "Inshila ya Kukula",
    startDevotion: "Tangila Amadevosho",
    prayNow: "Lomba Nomba",
    reflectTonight: "Inganya Nachipaku",
    completed: "Fyapwa",
    inProgress: "Fyalimo",
    locked: "Fyafungwa",

    // Reflection
    prayedToday: "Waomba lelo?",
    challengeQ: "Ni cintu nshi cakukansa lelo?",
    learnedQ: "Wasambilila nshi lelo?",
    howFeeling: "Ukumona shani?",
    saveReflection: "Lonsha Ukuinganya",
    thankYou: "Ukuinganya kwalonshiwa. Wabomba bwino.",

    // Auth
    fullName: "Ishina Lyonse",
    email: "Email",
    password: "Icisakamano",
    confirmPassword: "Posha Icisakamano",
    language: "Ulimi Ulondolwa",
    register: "Panga Akaunti",
    loginBtn: "Ingila",
    forgotPassword: "Waishukwa Icisakamano?",
    resetPassword: "Bweza Icisakamano",
    orContinueWith: "pana umwine na",
    alreadyHave: "Uli naakaunti kale?",
    dontHave: "Uli naakaunti?",
    signInGoogle: "Ingila na Google",

    // Growth levels
    level0: "Ukumanya Lesa",
    level1: "Ukulumfwa ne Chipulumuko",
    level2: "Indiscipline ya Lelo",
    level3: "Icilengwa ne Ukuitwa",
    level4: "Ubulimi bwa Bufumu",
  },
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");

  function t(key) {
    return translations[lang]?.[key] || translations.en[key] || key;
  }

  function toggleLang() {
    setLang((l) => (l === "en" ? "bem" : "en"));
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
