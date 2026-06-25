// ========================================
// TIPS DATABASE
// Organized by time of day and risk level
// ========================================

export const tipsDatabase = {
  morning: {
    low: [
      "🌅 Start your day with a 5-minute gratitude journal",
      "☀️ Set one small intention for today and celebrate achieving it",
      "🥗 Eat a balanced breakfast to fuel your brain",
      "🚶 Take a 10-minute morning walk before studying",
      "💧 Drink a glass of water as soon as you wake up"
    ],
    moderate: [
      "🌤️ Take 3 deep breaths before checking your phone",
      "📝 Write down 3 things you're grateful for this morning",
      "🧘 Try a 5-minute morning stretch routine",
      "🎯 Break your biggest task into 3 smaller steps",
    ],
    high: [
      "🫂 Reach out to one person today - you don't have to struggle alone",
      "🌿 Start with just 5 minutes of studying, then take a break",
      "💬 Our community is here for you - consider sharing today",
      "🧘 Focus on breathing for 60 seconds - in through nose, out through mouth",
    ]
  },
  afternoon: {
    low: [
      "📚 Take a 5-minute break every hour to maintain focus",
      "🍎 Have a healthy snack to maintain energy levels",
      "💬 Connect with a friend during lunch",
      "🎵 Listen to calming music while studying",
    ],
    moderate: [
      "🚶 Step away from your desk for 10 minutes",
      "🌿 Find a quiet spot to reset your mind",
      "📝 Write down what's on your mind, then set it aside",
      "💧 Take a water break - dehydration affects mood",
    ],
    high: [
      "🛑 Stop and assess: What do you need most right now?",
      "🤝 Ask for help with one task today",
      "🧘 Try a 2-minute breathing exercise",
      "💬 Our community has peer supporters available",
    ]
  },
  evening: {
    low: [
      "🌙 Create a relaxing bedtime routine",
      "📵 Put away screens 30 minutes before sleep",
      "📖 Read a book for pleasure, not for school",
      "🕯️ Dim the lights to signal your body it's time to rest",
    ],
    moderate: [
      "🛁 Take a warm shower or bath to release tension",
      "📝 Write down tomorrow's tasks to clear your mind",
      "🎧 Listen to calming music or a podcast",
      "🧘 Try gentle evening stretches",
    ],
    high: [
      "🛌 Prioritize sleep over studying tonight",
      "🌙 Use a guided sleep meditation app",
      "📞 Call a trusted friend or family member",
      "💤 Aim for 8 hours of sleep - your brain needs rest",
    ]
  },
  night: {
    low: [
      "😴 Stick to your sleep schedule even on weekends",
      "📵 Keep your phone away from your bed",
      "🌌 Practice progressive muscle relaxation",
      "📖 Read something light before sleeping",
    ],
    moderate: [
      "🛌 If you can't sleep, get up and do something calming",
      "📝 Keep a notebook by your bed for racing thoughts",
      "🎧 Try white noise or rain sounds",
      "🧘 Focus on your breath for 5 minutes",
    ],
    high: [
      "🆘 Crisis resources are available 24/7 - don't hesitate to reach out",
      "🌙 Sleep is medicine - prioritize rest tonight",
      "🤝 Tomorrow is a new day. Be kind to yourself.",
      "💬 Our community is awake - you're not alone",
    ]
  }
}

// General wellness tips (shown when user has no assessments yet)
export const generalTips = [
  "✨ Taking care of your mental health is just as important as your grades",
  "💧 Stay hydrated - even mild dehydration affects your mood",
  "😴 Aim for 7-9 hours of sleep for better focus and well-being",
  "🚶 A 10-minute walk can boost your mood and reduce stress",
  "📝 Writing down your thoughts can help clear your mind",
  "🧘 Take 3 deep breaths when you feel overwhelmed",
  "💬 You're not alone - many students feel the same way",
  "📚 Take short breaks between study sessions",
  "🎵 Listen to calming music while studying",
  "🌿 Your mental health journey matters - every small step counts",
  "💪 Progress, not perfection - celebrate small wins today",
  "🤝 Reach out to someone you trust - connection helps healing"
]

// Helper function to get current time of day
export function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 22) return 'evening'
  return 'night'
}

// Helper function to get a random tip based on risk level
export function getRandomTip(riskLevel) {
  const timeOfDay = getTimeOfDay()
  let riskCategory = 'low'
  
  if (riskLevel === 'High Risk') riskCategory = 'high'
  else if (riskLevel === 'Moderate Risk') riskCategory = 'moderate'
  else riskCategory = 'low'
  
  const tips = tipsDatabase[timeOfDay][riskCategory]
  const randomIndex = Math.floor(Math.random() * tips.length)
  return tips[randomIndex]
}

// Helper function to get a general wellness tip (for users with no assessments)
export function getGeneralTip() {
  const randomIndex = Math.floor(Math.random() * generalTips.length)
  return generalTips[randomIndex]
}