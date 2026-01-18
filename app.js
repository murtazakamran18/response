// Import Supabase

// Supabase configuration
const SUPABASE_URL = "https://zcrwvfhnyfqcqefillok.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjcnd2ZmhueWZxY3FlZmlsbG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NzU3MjcsImV4cCI6MjA4NDI1MTcyN30.T4toORiptIeOHlMTQ72SZ6pnrLD4dSN8GaYYTQVu5Vc"
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

const soundManager = {
  clickSound: new Audio("data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=="),
  successSound: new Audio("data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=="),

  playClick: function () {
    this.clickSound.currentTime = 0
    this.clickSound.play().catch((e) => console.log("Click sound error:", e))
  },

  playSuccess: function () {
    this.playMelody([523, 587, 659, 784], [150, 150, 150, 300])
  },

  playBeep: (freq = 400, duration = 100) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const osc = audioContext.createOscillator()
    const gain = audioContext.createGain()
    osc.connect(gain)
    gain.connect(audioContext.destination)
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.1, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000)
    osc.start(audioContext.currentTime)
    osc.stop(audioContext.currentTime + duration / 1000)
  },

  playMelody: (frequencies, durations) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    let currentTime = audioContext.currentTime

    frequencies.forEach((freq, index) => {
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      osc.connect(gain)
      gain.connect(audioContext.destination)
      osc.frequency.value = freq
      const duration = durations[index] / 1000
      gain.gain.setValueAtTime(0.1, currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, currentTime + duration)
      osc.start(currentTime)
      osc.stop(currentTime + duration)
      currentTime += duration
    })
  },
}

// DOM elements
const nameModal = document.getElementById("nameModal")
const nameInput = document.getElementById("nameInput")
const nameSubmitBtn = document.getElementById("nameSubmitBtn")
const questionContainer = document.querySelector(".question-container")
const resultContainer = document.querySelector(".result-container")
const gifResult = document.querySelector(".gif-result")


const heartLoader = document.querySelector(".cssload-main")
const yesBtn = document.querySelector(".js-yes-btn")
const noBtn = document.querySelector(".js-no-btn")
const resetBtn = document.getElementById("resetBtn")
const storageToggleBtn = document.getElementById("storageToggleBtn")
const statsPanel = document.getElementById("statsPanel")
const statsCloseBtn = document.getElementById("statsCloseBtn")
const statsPasswordForm = document.getElementById("statsPasswordForm")
const statsUnlockBtn = document.getElementById("statsUnlockBtn")
const statsPassword = document.getElementById("statsPassword")
const statsContent = document.getElementById("statsContent")

let userName = ""
let noClickCount = 0

nameSubmitBtn.addEventListener("click", () => {
  if (nameInput.value.trim()) {
    userName = nameInput.value.trim()
    nameModal.style.display = "none"
    soundManager.playBeep(440, 200)
  }
})

nameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    nameSubmitBtn.click()
  }
})

noBtn.addEventListener("mouseover", () => {
  const newX = Math.floor(Math.random() * questionContainer.offsetWidth)
  const newY = Math.floor(Math.random() * questionContainer.offsetWidth)
  noBtn.style.left = `${newX}px`
  noBtn.style.top = `${newY}px`
  noClickCount++
  soundManager.playBeep(300, 100)
})
noBtn.addEventListener("click", async () => {
  await supabaseClient.from("love_responses").insert([
    {
      name: userName || "Anonymous",
      answer: "No",
      no_click_attempts: noClickCount,
      created_at: new Date().toISOString(),
    },
  ])
})


yesBtn.addEventListener("click", async () => {
  soundManager.playSuccess()

  questionContainer.style.display = "none"
  heartLoader.style.display = "inherit"

  const { error } = await supabaseClient.from("love_responses").insert([
    {
      name: userName || "Anonymous",
      answer: "Yes",
      no_click_attempts: noClickCount, // ✅ REAL VALUE
      created_at: new Date().toISOString(),
    },
  ])


  if (error) console.error("Supabase error:", error)

  setTimeout(() => {
    heartLoader.style.display = "none"
    resultContainer.style.display = "inherit"
    document.getElementById("resultName").textContent = userName ? `${userName}, ` : ""
    gifResult.play()

    
  }, 3000)
})

resetBtn.addEventListener("click", () => {
  resultContainer.style.display = "none"
  questionContainer.style.display = "inherit"
  nameModal.style.display = "flex"
  nameInput.value = ""
  userName = ""
  noClickCount = 0
  soundManager.playBeep(440, 200)
})

storageToggleBtn.addEventListener("click", () => {
  statsPanel.classList.toggle("open")
})

statsCloseBtn.addEventListener("click", () => {
  statsPanel.classList.remove("open")
  statsPasswordForm.style.display = "flex"
  statsContent.style.display = "none"
  statsPassword.value = ""
})

statsUnlockBtn.addEventListener("click", async () => {
  if (statsPassword.value === "MURTAZA") {
    statsPasswordForm.style.display = "none"
    statsContent.style.display = "block"
    soundManager.playBeep(523, 150)
    await loadStats()
  } else {
    soundManager.playBeep(200, 200)
    alert("Wrong password!")
  }
})

async function loadStats() {
  const { data, error } = await supabaseClient
    .from("love_responses")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching stats:", error)
    return
  }

  const totalResponses = data.length
  const yesCount = data.filter((r) => r.answer === "Yes").length
  const noCount = data.reduce((sum, r) => sum + r.no_click_attempts, 0)
  const successRate = totalResponses > 0 ? Math.round((yesCount / totalResponses) * 100) : 0

  document.getElementById("totalResponses").textContent = totalResponses
  document.getElementById("yesCount").textContent = yesCount
  document.getElementById("noCount").textContent = noCount
  document.getElementById("successRate").textContent = successRate + "%"

  const responsesContainer = document.getElementById("responsesContainer")
  responsesContainer.innerHTML = ""
  data.slice(0, 10).forEach((response) => {
    const responseEl = document.createElement("div")
    responseEl.className = "response-item"
    responseEl.innerHTML = `
      <strong>${response.name}</strong> - ${response.answer} 
      <br><small>${response.no_click_attempts} No attempts</small>
      <br><small>${new Date(response.created_at).toLocaleString()}</small>
    `
    responsesContainer.appendChild(responseEl)
  })
}

// Real-time updates
supabaseClient
  .channel("love-responses")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "love_responses" },
    () => {
      loadStats()
    }
  )
  .subscribe()

