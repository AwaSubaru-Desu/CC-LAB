let greWords = []
let currentSet = []
let quizSet = []
let currentQuizIndex = 0
let allCorrect = true
let isLocked = false
let statusDiv
let failCount = 0
let sessionStartTime = null

let serialPort, writer, reader
let incomingBuffer = ""

let bestScore = localStorage.getItem("bestScore") || 0
let historyLog = JSON.parse(localStorage.getItem("scoreHistory") || "[]")

let bgMusic, flushSound

fetch('gre_words.json')
  .then(r => r.json())
  .then(data => {
    greWords = data
    showWordSet()
  })

function startQuiz() {
  if (!sessionStartTime) sessionStartTime = millis()
  quizSet = getRandomSubset(currentSet, 5)
  currentQuizIndex = 0
  allCorrect = true
  bgMusic.play()
  showQuestion(quizSet[0])
}

function tryAgain() {
  allCorrect = true
  failCount = 0
  currentQuizIndex = 0
  sessionStartTime = null
  showWordSet()
}

function showWordSet() {
  document.getElementById("wordBox").style.display = 'block'
  document.getElementById("quizBox").style.display = 'none'
  sendToArduino(0)
  const wordList = document.getElementById("wordList")
  wordList.innerHTML = ''
  currentSet = getRandomSubset(greWords, 9)
  currentSet.forEach(w => {
    const p = document.createElement('p')
    p.innerHTML = `<strong>${w.word}</strong>: ${w.definition}`
    wordList.appendChild(p)
  })
  updateResultDisplay()
}

function showQuestion(wordObj) {
  if (isLocked) return
  document.getElementById("wordBox").style.display = 'none'
  document.getElementById("quizBox").style.display = 'block'
  statusDiv = document.getElementById("status")
  statusDiv.innerText = ''
  document.getElementById("questionText").innerText = `What does "${wordObj.word}" mean?`
  const choicesDiv = document.getElementById("choices")
  choicesDiv.innerHTML = ''
  const colors = ['#00f','#fff','#f00','#ff0']
  const shuffled = [...wordObj.choices].sort(() => Math.random() - 0.5)
  shuffled.forEach((c,i) => {
    const btn = document.createElement('button')
    btn.innerText = c
    btn.style.backgroundColor = colors[i]
    btn.classList.add('answer-btn')
    btn.onclick = () => handleChoice(c)
    choicesDiv.appendChild(btn)
  })
}

function handleChoice(choice) {
  if (isLocked) return
  const correct = quizSet[currentQuizIndex].correct
  if (choice === correct) {
    currentQuizIndex++
    if (currentQuizIndex < quizSet.length) {
      showQuestion(quizSet[currentQuizIndex])
    } else {
      finishQuiz(true)
    }
  } else {
    allCorrect = false
    isLocked = true
    bgMusic.pause()
    flushSound.currentTime = 0
    flushSound.play()
    flushSound.onended = () => bgMusic.play()
    let cnt = 0
    statusDiv.innerText = 'Analyzing your answer'
    const iv = setInterval(() => {
      cnt = (cnt + 1) % 4
      statusDiv.innerText = 'Analyzing your answer' + '.'.repeat(cnt)
    }, 500)
    setTimeout(() => {
      clearInterval(iv)
      statusDiv.innerText = ''
      isLocked = false
      currentQuizIndex++
      if (currentQuizIndex < quizSet.length) {
        showQuestion(quizSet[currentQuizIndex])
      } else {
        finishQuiz(false)
      }
    }, 20000)
  }
}

function finishQuiz(success) {
  document.getElementById("quizBox").style.display = 'none'
  const resultDiv = document.getElementById("result")
  resultDiv.innerHTML = ''
  const end = millis()
  const totalSec = sessionStartTime ? Math.floor((end - sessionStartTime) / 1000) : 0
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  const timeUsed = `Time used: ${m}m ${s}s`
  let score = 0
  let comment = ''
  if (success) {
    if (totalSec < 180) {
      score = getRandomInt(50, 70)
      comment = 'Diarrhea 💩'
    } else if (totalSec < 300) {
      score = getRandomInt(70, 90)
      comment = 'Healthy Poop 🧻'
    } else {
      score = getRandomInt(30, 59)
      comment = 'Constipation 🚽'
    }
    if (score > bestScore) {
      bestScore = score
      localStorage.setItem('bestScore', bestScore)
    }
    sendToArduino(1)
  } else {
    failCount++
    comment = 'Not perfect.'
  }
  historyLog.push({ score, comment, time: `${m}m ${s}s`, failCount })
  localStorage.setItem('scoreHistory', JSON.stringify(historyLog))
  resultDiv.innerHTML = success
    ? `✅ <strong>Success! Toilet unlocked.</strong><br>Score: ${score}<br>Comment: ${comment}<br>${timeUsed}<br>Failures: ${failCount}<br><br>`
    : `❌ <strong>Not perfect. Try again.</strong><br>Failures: ${failCount}<br><br>`
  const btn = document.createElement('button')
  btn.innerText = 'Try Again'
  btn.style.backgroundColor = '#ff0'
  btn.onclick = tryAgain
  resultDiv.appendChild(btn)
  updateResultDisplay()
}

function updateResultDisplay() {
  const div = document.getElementById("result")
  const best = document.createElement('div')
  best.innerHTML = `<hr><strong>Best Score:</strong> ${bestScore}`
  const title = document.createElement('div')
  title.innerHTML = '<strong>Recent Attempts:</strong>'
  const ul = document.createElement('ul')
  ul.style.maxHeight = '160px'
  ul.style.overflowY = 'auto'
  historyLog.slice(-5).reverse().forEach(e => {
    const li = document.createElement('li')
    li.innerText = `Score:${e.score} |${e.comment} |${e.time} |Fail:${e.failCount}`
    ul.appendChild(li)
  })
  div.appendChild(best)
  div.appendChild(title)
  div.appendChild(ul)
}

async function sendToArduino(v) {
  if (writer) await writer.write(v.toString() + '\n')
}

document.getElementById("connectBtn").onclick = async () => {
  serialPort = await navigator.serial.requestPort()
  await serialPort.open({ baudRate: 57600 })
  const enc = new TextEncoderStream()
  enc.readable.pipeTo(serialPort.writable)
  writer = enc.writable.getWriter()
  const dec = new TextDecoderStream()
  serialPort.readable.pipeTo(dec.writable)
  reader = dec.readable.getReader()
  readLoop()
}

function readLoop() {
  reader.read().then(({ value, done }) => {
    if (!done && value) {
      incomingBuffer += value
      if (incomingBuffer.includes('\n')) {
        const parts = incomingBuffer.split('\n')
        incomingBuffer = parts.pop()
        parts.forEach(handleInput)
      }
    }
    readLoop()
  })
}

function handleInput(line) {
  const val = parseInt(line.trim(), 10)
  if (isNaN(val)) return
  const quizVisible = document.getElementById("quizBox").style.display === 'block'
  const wordVisible = document.getElementById("wordBox").style.display === 'block'
  const resultVisible = document.getElementById("result").innerText.includes("Try Again")
  if (quizVisible && [2,3,4,5].includes(val)) {
    const idxMap = {2:0,3:1,4:2,5:3}
    const btns = document.querySelectorAll(".answer-btn")
    const i = idxMap[val]
    if (btns[i]) btns[i].click()
  } else if (wordVisible && val === 2) {
    document.getElementById("startQuizBtn").style.backgroundColor = '#00f'
    startQuiz()
  } else if (resultVisible && val === 5) {
    tryAgain()
  }
}

window.addEventListener("DOMContentLoaded", () => {
  bgMusic = new Audio("good music.mp3")
  bgMusic.loop = true
  flushSound = new Audio("flush.mp3")
  const startBtn = document.getElementById("startQuizBtn")
  startBtn.style.backgroundColor = '#00f'
  startBtn.onclick = () => startQuiz()
})

function getRandomSubset(arr, n) {
  return arr.slice().sort(() => Math.random() - 0.5).slice(0, n)
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function millis() {
  return new Date().getTime()
}
