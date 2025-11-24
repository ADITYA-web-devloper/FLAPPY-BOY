const container = document.getElementById('game-container');
const bird = document.getElementById('bird');
const scoreBoard = document.getElementById('score-board');
const highScoreDisplay = document.getElementById('high-score-display');
const gameOverScreen = document.getElementById('game-over-screen');
const startScreen = document.getElementById('start-screen');
const finalScoreDisplay = document.getElementById('final-score');

// Audio Context setup
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'score') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    }
}

// Game Variables
let birdY = 200;
let birdVelocity = 0;
let gravity = 0.25;
let jumpStrength = -5.5;
let isGameOver = false;
let isGameRunning = false;
let score = 0;
let highScore = localStorage.getItem('flappyHighScore') || 0;
let gameLoop;
let obstacleTimer;
let obstacles = [];

highScoreDisplay.innerText = "Best: " + highScore;

function control(e) {
    if (e.type === 'keydown' && e.code !== 'Space') return;
    if(e.code === 'Space') e.preventDefault();

    if (!isGameRunning) {
        startGame();
        return;
    }

    if (!isGameOver) {
        birdVelocity = jumpStrength;
        playSound('jump');
        bird.style.transform = "rotate(-20deg)";
    }
}

document.addEventListener('keydown', control);
document.addEventListener('click', control);

function startGame() {
    if (isGameRunning) return;
    isGameRunning = true;
    startScreen.style.display = 'none';
    
    gameLoop = setInterval(updateGame, 20);
    obstacleTimer = setInterval(createObstacle, 2000);
}

function updateGame() {
    birdVelocity += gravity;
    birdY += birdVelocity;
    bird.style.top = birdY + 'px';

    if (birdVelocity > 0) {
            bird.style.transform = "rotate(20deg)";
    }

    if (birdY > 570 || birdY < 0) {
        handleGameOver();
    }

    obstacles.forEach((obs, index) => {
        obs.x -= 3;
        obs.element.style.left = obs.x + 'px';
        obs.bottomElement.style.left = obs.x + 'px';

        if (obs.x < 80 && obs.x > 20) {
            if (birdY < obs.topHeight || birdY + 30 > (600 - obs.bottomHeight)) {
                handleGameOver();
            }
        }

        if (obs.x < 48 && obs.x > 44 && !obs.passed) {
            score++;
            scoreBoard.innerText = score;
            obs.passed = true;
            playSound('score');
        }

        if (obs.x < -60) {
            obs.element.remove();
            obs.bottomElement.remove();
            obstacles.splice(index, 1);
        }
    });
}

function createObstacle() {
    if (isGameOver) return;

    // --- DIFFICULTY SETTING ---
    const gap = 130; 
    // --------------------------

    const containerHeight = 600;
    const minHeight = 50;
    
    const topHeight = Math.floor(Math.random() * (containerHeight - gap - minHeight * 2)) + minHeight;
    const bottomHeight = containerHeight - gap - topHeight;

    const topObstacle = document.createElement('div');
    topObstacle.classList.add('obstacle', 'obstacle-top');
    topObstacle.style.height = topHeight + 'px';
    topObstacle.style.left = '400px';
    topObstacle.style.top = '0';
    container.appendChild(topObstacle);

    const bottomObstacle = document.createElement('div');
    bottomObstacle.classList.add('obstacle', 'obstacle-bottom');
    bottomObstacle.style.height = bottomHeight + 'px';
    bottomObstacle.style.left = '400px';
    bottomObstacle.style.bottom = '0';
    container.appendChild(bottomObstacle);

    obstacles.push({
        x: 400,
        element: topObstacle,
        bottomElement: bottomObstacle,
        topHeight: topHeight,
        bottomHeight: bottomHeight,
        passed: false
    });
}

function handleGameOver() {
    if(isGameOver) return;
    isGameOver = true;
    playSound('hit');
    clearInterval(gameLoop);
    clearInterval(obstacleTimer);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyHighScore', highScore);
        highScoreDisplay.innerText = "Best: " + highScore;
    }

    finalScoreDisplay.innerText = "Score: " + score;
    gameOverScreen.style.display = 'flex';
}

function resetGame() {
    birdY = 200;
    birdVelocity = 0;
    isGameOver = false;
    isGameRunning = false;
    score = 0;
    scoreBoard.innerText = 0;
    bird.style.transform = "rotate(0deg)";
    
    obstacles.forEach(obs => {
        obs.element.remove();
        obs.bottomElement.remove();
    });
    obstacles = [];
    
    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'flex';
}