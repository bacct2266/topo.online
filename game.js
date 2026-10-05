```javascript
/* =========================================================
   TOPO GAME
   Main Game Engine
   ========================================================= */

/* =========================================================
   CANVAS
   ========================================================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;

function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;

    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;

    canvas.style.width = canvasWidth + "px";
    canvas.style.height = canvasHeight + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();


/* =========================================================
   SAVE SYSTEM
   ========================================================= */

const DEFAULT_SAVE = {
    coins: 0,

    unlockedLevel: 1,

    completedLevels: [],

    skins: ["neon"],

    selectedSkin: "neon",

    attempts: 0,

    deaths: 0,

    totalPlayTime: 0,

    bestScore: 0,

    bestLevel: 0,

    secretCoins: 0,

    best: {}
};

let gameSave = loadSave();

function loadSave() {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem("TOPO_SAVE")
            );

        if (!saved) {
            return structuredClone(DEFAULT_SAVE);
        }

        return {
            ...structuredClone(DEFAULT_SAVE),
            ...saved,

            best: {
                ...DEFAULT_SAVE.best,
                ...(saved.best || {})
            }
        };

    } catch (error) {

        console.warn(
            "Could not load save:",
            error
        );

        return structuredClone(DEFAULT_SAVE);
    }
}


function saveGame() {

    localStorage.setItem(
        "TOPO_SAVE",
        JSON.stringify(gameSave)
    );
}


/* =========================================================
   GAME STATE
   ========================================================= */

const game = {

    active: false,

    paused: false,

    levelIndex: 0,

    worldX: 0,

    startTime: 0,

    attempts: 0,

    coins: 0,

    secretCoins: 0,

    objects: [],

    particles: [],

    screenShake: 0,

    speedMultiplier: 1,

    lastTimestamp: 0,

    player: {

        x: 160,

        y: 300,

        width: 38,

        height: 38,

        velocityY: 0,

        gravity: 1,

        grounded: false,

        rotation: 0

    }

};


/* =========================================================
   SCREEN SYSTEM
   ========================================================= */

function showScreen(id) {

    document
        .querySelectorAll(".screen")
        .forEach(screen => {

            screen.classList.remove("active");

        });

    const target =
        document.getElementById(id);

    if (target) {
        target.classList.add("active");
    }
}


function openLevels() {

    renderLevels();

    showScreen("levelsScreen");
}


function openHowToPlay() {

    showScreen("howScreen");
}


function openShop() {

    if (typeof renderShop === "function") {
        renderShop();
    }

    showScreen("shopScreen");
}


function openStatistics() {

    renderStatistics();

    showScreen("statisticsScreen");
}


function openSettings() {

    showScreen("settingsScreen");
}


function openEditor() {

    showScreen("editorScreen");

    drawEditor();
}


/* =========================================================
   LEVEL SELECT
   ========================================================= */

function renderLevels() {

    const container =
        document.getElementById(
            "levelsContainer"
        );

    if (!container) return;

    container.innerHTML = "";

    LEVELS.forEach(level => {

        const unlocked =
            level.id <=
            gameSave.unlockedLevel;

        const best =
            gameSave.best[level.id] || {
                percent: 0,
                score: 0,
                attempts: 0
            };

        const card =
            document.createElement("div");

        card.className =
            "levelCard" +
            (
                unlocked
                    ? ""
                    : " locked"
            );

        card.style.setProperty(
            "--levelColor",
            level.color
        );

        card.innerHTML = `

            <div class="levelNumber">
                LEVEL ${level.id}
            </div>

            <div class="levelName">
                ${level.name}
            </div>

            <div class="difficulty">
                ${level.difficulty}
            </div>

            <p>
                Best:
                ${best.percent}%
            </p>

            <div class="levelProgress">
                <div
                    style="width:${best.percent}%"
                ></div>
            </div>

            ${
                unlocked

                    ? `
                        <button
                            class="levelPlay"
                            onclick="
                                startGame(${level.id - 1})
                            "
                        >
                            PLAY
                        </button>
                    `

                    : `
                        <div class="levelPlay">
                            🔒
                        </div>
                    `
            }

        `;

        container.appendChild(card);

    });
}


/* =========================================================
   START GAME
   ========================================================= */

function startSelectedLevel() {

    startGame(0);
}


function startGame(levelIndex) {

    if (
        !LEVELS ||
        !LEVELS[levelIndex]
    ) {

        console.error(
            "Level does not exist:",
            levelIndex
        );

        return;
    }

    const level =
        LEVELS[levelIndex];

    game.active = true;

    game.paused = false;

    game.levelIndex =
        levelIndex;

    game.worldX = 0;

    game.coins = 0;

    game.secretCoins = 0;

    game.speedMultiplier = 1;

    game.screenShake = 0;

    game.particles = [];

    game.startTime =
        performance.now();

    game.lastTimestamp =
        performance.now();

    game.objects =
        generateLevel(levelIndex);

    game.attempts =
        (
            gameSave.best[level.id]?.attempts ||
            0
        ) + 1;

    game.player = {

        x: 160,

        y:
            canvasHeight -
            138,

        width: 38,

        height: 38,

        velocityY: 0,

        gravity: 1,

        grounded: true,

        rotation: 0

    };

    gameSave.attempts++;

    saveGame();

    updateHUD();

    showScreen("gameScreen");

    requestAnimationFrame(gameLoop);
}


/* =========================================================
   LEVEL GENERATION
   ========================================================= */

function generateLevel(levelIndex) {

    const level =
        LEVELS[levelIndex];

    const objects = [];

    let x = 550;

    let seed =
        level.id * 928371;


    function random() {

        seed =
            (
                seed *
                1664525 +
                1013904223
            ) >>> 0;

        return seed / 4294967296;
    }


    while (
        x <
        level.length - 300
    ) {

        x +=
            170 +
            random() * 230;

        const mechanic =
            level.mechanics[
                Math.floor(
                    random() *
                    level.mechanics.length
                )
            ];


        if (
            mechanic === "spikes"
        ) {

            objects.push({

                type: "spike",

                x,

                y: 0,

                width: 42,

                height: 48

            });

        }


        else if (
            mechanic === "blocks"
        ) {

            objects.push({

                type: "block",

                x,

                y: 0,

                width: 80,

                height: 80

            });

        }


        else if (
            mechanic === "lasers"
        ) {

            objects.push({

                type: "laser",

                x,

                y:
                    150 +
                    random() * 180,

                width: 12,

                height: 250

            });

        }


        else if (
            mechanic === "moving"
        ) {

            objects.push({

                type: "moving",

                x,

                baseY: 320,

                y: 320,

                width: 100,

                height: 25,

                amplitude:
                    60 +
                    random() * 100,

                phase:
                    random() *
                    Math.PI * 2

            });

        }


        else if (
            mechanic === "gravity"
        ) {

            objects.push({

                type: "gravity",

                x,

                y: 300,

                width: 45,

                height: 45

            });

        }


        else if (
            mechanic === "teleport"
        ) {

            objects.push({

                type: "teleport",

                x,

                y: 300,

                width: 45,

                height: 45

            });

        }


        else if (
            mechanic === "speed"
        ) {

            objects.push({

                type: "speed",

                x,

                y: 300,

                width: 45,

                height: 45

            });

        }


        else if (
            mechanic === "enemies"
        ) {

            objects.push({

                type: "enemy",

                x,

                y: 390,

                width: 38,

                height: 38,

                phase:
                    random() *
                    Math.PI * 2

            });

        }


        else if (
            mechanic === "pads"
        ) {

            objects.push({

                type: "pad",

                x,

                y: 0,

                width: 70,

                height: 20

            });

        }


        else if (
            mechanic === "rings"
        ) {

            objects.push({

                type: "ring",

                x,

                y:
                    180 +
                    random() * 170,

                width: 45,

                height: 45

            });

        }


        /* Regular coin */

        if (
            random() > 0.35
        ) {

            objects.push({

                type: "coin",

                x:
                    x + 45,

                y:
                    160 +
                    random() * 190,

                width: 25,

                height: 25

            });

        }


        /* Secret coin */

        if (
            random() > 0.82
        ) {

            objects.push({

                type: "secret",

                x:
                    x + 25,

                y:
                    100 +
                    random() * 150,

                width: 30,

                height: 30

            });

        }

    }


    return objects;
}


/* =========================================================
   INPUT
   ========================================================= */

function jump() {

    if (
        !game.active ||
        game.paused
    ) {
        return;
    }

    const player =
        game.player;


    if (
        player.grounded
    ) {

        player.velocityY =
            -620 *
            player.gravity;

        player.grounded = false;

        if (
            typeof AudioSystem !==
            "undefined"
        ) {

            AudioSystem.jump();
        }

        createParticles(
            player.x + player.width / 2,
            player.y + player.height,
            "#5df4ff",
            10
        );
    }
}


window.addEventListener(
    "keydown",
    event => {

        if (
            event.code === "Space" ||
            event.code === "KeyW" ||
            event.code === "ArrowUp"
        ) {

            event.preventDefault();

            jump();
        }


        if (
            event.code === "Escape"
        ) {

            if (game.paused) {
                resumeGame();
            } else {
                pauseGame();
            }
        }
    }
);


canvas.addEventListener(
    "pointerdown",
    jump
);


/* =========================================================
   COLLISION
   ========================================================= */

function collision(a, b) {

    return (

        a.x <
        b.x + b.width &&

        a.x + a.width >
        b.x &&

        a.y <
        b.y + b.height &&

        a.y + a.height >
        b.y
    );
}


/* =========================================================
   GAME LOOP
   ========================================================= */

function gameLoop(timestamp) {

    if (!game.active) {
        return;
    }

    requestAnimationFrame(gameLoop);


    if (game.paused) {
        game.lastTimestamp = timestamp;
        return;
    }


    const delta =
        Math.min(
            (timestamp -
                game.lastTimestamp) /
                1000,
            0.035
        );


    game.lastTimestamp =
        timestamp;


    update(delta);

    draw();
}


/* =========================================================
   UPDATE
   ========================================================= */

function update(delta) {

    if (!game.active) {
        return;
    }


    const level =
        LEVELS[game.levelIndex];

    const player =
        game.player;


    const floor =
        canvasHeight - 100;


    /* -----------------------------------------
       WORLD
    ----------------------------------------- */

    game.worldX +=
        level.speed *
        game.speedMultiplier *
        delta;


    /* -----------------------------------------
       PLAYER PHYSICS
    ----------------------------------------- */

    player.velocityY +=
        1200 *
        player.gravity *
        delta;

    player.y +=
        player.velocityY *
        delta;


    player.rotation +=
        delta *
        5;


    /* -----------------------------------------
       FLOOR / CEILING
    ----------------------------------------- */

    if (
        player.gravity > 0
    ) {

        if (
            player.y +
            player.height >=
            floor
        ) {

            player.y =
                floor -
                player.height;

            player.velocityY = 0;

            player.grounded = true;

        } else {

            player.grounded = false;
        }

    } else {

        if (
            player.y <= 80
        ) {

            player.y = 80;

            player.velocityY = 0;

            player.grounded = true;

        } else {

            player.grounded = false;
        }
    }


    /* -----------------------------------------
       MOVING OBJECTS
    ----------------------------------------- */

    game.objects.forEach(object => {

        if (
            object.type === "moving"
        ) {

            object.y =
                object.baseY +
                Math.sin(
                    performance.now() /
                        500 +
                    object.phase
                ) *
                object.amplitude;
        }


        if (
            object.type === "enemy"
        ) {

            object.y =
                390 +
                Math.sin(
                    performance.now() /
                        350 +
                    object.phase
                ) *
                25;
        }

    });


    /* -----------------------------------------
       COLLISIONS
    ----------------------------------------- */

    const cameraX =
        game.worldX -
        player.x +
        160;


    const playerBox = {

        x: player.x,

        y: player.y,

        width: player.width,

        height: player.height

    };


    game.objects.forEach(object => {

        if (
            object.collected
        ) {
            return;
        }


        const screenX =
            object.x -
            cameraX;


        let objectY =
            object.y;


        if (
            object.type === "spike" ||
            object.type === "block" ||
            object.type === "pad"
        ) {

            objectY =
                floor -
                object.height;
        }


        const box = {

            x: screenX,

            y: objectY,

            width: object.width,

            height: object.height

        };


        if (
            collision(
                playerBox,
                box
            )
        ) {

            handleObject(object);
        }

    });


    /* -----------------------------------------
       END OF LEVEL
    ----------------------------------------- */

    if (
        game.worldX >=
        level.length
    ) {

        completeLevel();

        return;
    }


    /* -----------------------------------------
       PARTICLES
    ----------------------------------------- */

    updateParticles(delta);


    /* -----------------------------------------
       SHAKE
    ----------------------------------------- */

    if (
        game.screenShake > 0
    ) {

        game.screenShake -=
            delta * 25;

        if (
            game.screenShake < 0
        ) {
            game.screenShake = 0;
        }
    }


    updateHUD();
}


/* =========================================================
   OBJECT HANDLER
   ========================================================= */

function handleObject(object) {

    if (
        object.collected &&
        object.type !== "pad"
    ) {
        return;
    }


    switch (
        object.type
    ) {

        /* -------------------------------------
           DEADLY
        ------------------------------------- */

        case "spike":

        case "block":

        case "laser":

        case "enemy":

            playerDeath();

            break;


        /* -------------------------------------
           COIN
        ------------------------------------- */

        case "coin":

            object.collected = true;

            game.coins++;

            if (
                typeof AudioSystem !==
                "undefined"
            ) {

                AudioSystem.coin();
            }

            createParticles(
                game.player.x + 18,
                game.player.y + 18,
                "#ffe45e",
                12
            );

            break;


        /* -------------------------------------
           SECRET COIN
        ------------------------------------- */

        case "secret":

            object.collected = true;

            game.coins++;

            game.secretCoins++;

            if (
                typeof AudioSystem !==
                "undefined"
            ) {

                AudioSystem.coin();
            }

            createParticles(
                game.player.x + 18,
                game.player.y + 18,
                "#ffffff",
                20
            );

            break;


        /* -------------------------------------
           GRAVITY
        ------------------------------------- */

        case "gravity":

            object.collected = true;

            game.player.gravity *= -1;

            if (
                typeof AudioSystem !==
                "undefined"
            ) {

                AudioSystem.portal();
            }

            game.screenShake = 5;

            createParticles(
                game.player.x + 18,
                game.player.y + 18,
                "#bd54ff",
                25
            );

            break;


        /* -------------------------------------
           TELEPORT
        ------------------------------------- */

        case "teleport":

            object.collected = true;

            game.worldX += 450;

            if (
                typeof AudioSystem !==
                "undefined"
            ) {

                AudioSystem.portal();
            }

            createParticles(
                game.player.x + 18,
                game.player.y + 18,
                "#22e6ff",
                25
            );

            break;


        /* -------------------------------------
           SPEED
        ------------------------------------- */

        case "speed":

            object.collected = true;

            game.speedMultiplier = 1.35;

            setTimeout(() => {

                game.speedMultiplier = 1;

            }, 3000);

            if (
                typeof AudioSystem !==
                "undefined"
            ) {

                AudioSystem.portal();
            }

            break;


        /* -------------------------------------
           JUMP PAD
        ------------------------------------- */

        case "pad":

            game.player.velocityY =
                -850 *
                game.player.gravity;

            game.player.grounded = false;

            if (
                typeof AudioSystem !==
                "undefined"
            ) {

                AudioSystem.jump();
            }

            createParticles(
                game.player.x + 18,
                game.player.y + 38,
                "#22e6ff",
                12
            );

            break;


        /* -------------------------------------
           JUMP RING
        ------------------------------------- */

        case "ring":

            object.collected = true;

            game.player.velocityY =
                -720 *
                game.player.gravity;

            game.player.grounded = false;

            if (
                typeof AudioSystem !==
                "undefined"
            ) {

                AudioSystem.jump();
            }

            createParticles(
                game.player.x + 18,
                game.player.y + 18,
                "#ffe45e",
                12
            );

            break;
    }
}


/* =========================================================
   PLAYER DEATH
   ========================================================= */

function playerDeath() {

    if (!game.active) {
        return;
    }


    game.active = false;

    gameSave.deaths++;

    saveGame();


    if (
        typeof AudioSystem !==
        "undefined"
    ) {

        AudioSystem.death();
    }


    game.screenShake = 15;


    createParticles(
        game.player.x + 19,
        game.player.y + 19,
        "#ff5268",
        35
    );


    showResult(false);
}


/* =========================================================
   LEVEL COMPLETE
   ========================================================= */

function completeLevel() {

    if (!game.active) {
        return;
    }


    game.active = false;


    const level =
        LEVELS[game.levelIndex];


    const time =
        (
            performance.now() -
            game.startTime
        ) / 1000;


    gameSave.totalPlayTime +=
        time;


    const score =
        Math.max(
            0,

            Math.round(

                10000 +

                game.coins * 500 +

                game.secretCoins * 1000 -

                time * 15 -

                game.attempts * 30
            )
        );


    const old =
        gameSave.best[level.id] || {

            percent: 0,

            score: 0,

            attempts: 999999,

            coins: 0,

            time: Infinity

        };


    gameSave.best[level.id] = {

        percent: 100,

        score:
            Math.max(
                old.score,
                score
            ),

        attempts:
            Math.min(
                old.attempts,
                game.attempts
            ),

        coins:
            Math.max(
                old.coins,
                game.coins
            ),

        time:
            Math.min(
                old.time,
                time
            )
    };


    gameSave.coins +=
        game.coins;


    gameSave.secretCoins +=
        game.secretCoins;


    if (
        !gameSave.completedLevels.includes(
            level.id
        )
    ) {

        gameSave.completedLevels.push(
            level.id
        );
    }


    gameSave.unlockedLevel =
        Math.min(
            LEVELS.length,
            Math.max(
                gameSave.unlockedLevel,
                level.id + 1
            )
        );


    gameSave.bestScore =
        Math.max(
            gameSave.bestScore,
            score
        );


    gameSave.bestLevel =
        Math.max(
            gameSave.bestLevel,
            level.id
        );


    saveGame();


    if (
        typeof AudioSystem !==
        "undefined"
    ) {

        AudioSystem.victory();
    }


    showResult(
        true,
        score,
        time
    );
}


/* =========================================================
   RESULT SCREEN
   ========================================================= */

function showResult(
    complete,
    score = 0,
    time = 0
) {

    const overlay =
        document.getElementById(
            "resultOverlay"
        );

    const title =
        document.getElementById(
            "resultTitle"
        );

    const stats =
        document.getElementById(
            "resultStats"
        );

    const buttons =
        document.getElementById(
            "resultButtons"
        );


    if (
        !overlay ||
        !title ||
        !stats ||
        !buttons
    ) {
        return;
    }


    if (complete) {

        title.textContent =
            "LEVEL COMPLETE!";


        stats.innerHTML = `

            <p>
                SCORE:
                <strong>
                    ${score}
                </strong>
            </p>

            <p>
                COINS:
                <strong>
                    ${game.coins}
                </strong>
            </p>

            <p>
                SECRET COINS:
                <strong>
                    ${game.secretCoins}
                </strong>
            </p>

            <p>
                TIME:
                <strong>
                    ${time.toFixed(2)}s
                </strong>
            </p>

        `;


        buttons.innerHTML = `

            ${
                game.levelIndex <
                LEVELS.length - 1

                    ? `
                        <button
                            onclick="
                                closeResult();
                                startGame(
                                    ${game.levelIndex + 1}
                                );
                            "
                        >
                            NEXT LEVEL
                        </button>
                    `
                    : ""
            }

            <button
                onclick="
                    closeResult();
                    startGame(
                        ${game.levelIndex}
                    );
                "
            >
                REPLAY
            </button>

            <button
                onclick="
                    closeResult();
                    openLevels();
                "
            >
                LEVEL SELECT
            </button>

        `;

    } else {

        const level =
            LEVELS[game.levelIndex];


        const percent =
            Math.min(
                100,

                Math.floor(
                    game.worldX /
                    level.length *
                    100
                )
            );


        title.textContent =
            "TRY AGAIN";


        stats.innerHTML = `

            <p>
                YOU REACHED
                <strong>
                    ${percent}%
                </strong>
            </p>

            <p>
                COINS:
                <strong>
                    ${game.coins}
                </strong>
            </p>

        `;


        buttons.innerHTML = `

            <button
                onclick="
                    closeResult();
                    restartLevel();
                "
            >
                RESTART
            </button>

            <button
                onclick="
                    closeResult();
                    openLevels();
                "
            >
                LEVEL SELECT
            </button>

            <button
                onclick="
                    closeResult();
                    showScreen(
                        'menuScreen'
                    );
                "
            >
                MAIN MENU
            </button>

        `;
    }


    overlay.classList.add("active");
}


function closeResult() {

    const overlay =
        document.getElementById(
            "resultOverlay"
        );

    if (overlay) {
        overlay.classList.remove(
            "active"
        );
    }
}


/* =========================================================
   PAUSE
   ========================================================= */

function pauseGame() {

    if (!game.active) {
        return;
    }

    game.paused = true;

    document
        .getElementById(
            "pauseOverlay"
        )
        ?.classList.add("active");
}


function resumeGame() {

    game.paused = false;

    document
        .getElementById(
            "pauseOverlay"
        )
        ?.classList.remove("active");

    game.lastTimestamp =
        performance.now();
}


function restartLevel() {

    closeResult();

    document
        .getElementById(
            "pauseOverlay"
        )
        ?.classList.remove("active");

    startGame(
        game.levelIndex
    );
}


function openLevelsFromGame() {

    game.active = false;

    game.paused = false;

    document
        .getElementById(
            "pauseOverlay"
        )
        ?.classList.remove("active");

    openLevels();
}


/* =========================================================
   HUD
   ========================================================= */

function updateHUD() {

    const level =
        LEVELS[game.levelIndex];


    const percent =
        Math.min(
            100,

            game.worldX /
            level.length *
            100
        );


    const levelElement =
        document.getElementById(
            "hudLevel"
        );

    const percentElement =
        document.getElementById(
            "hudPercent"
        );

    const coinsElement =
        document.getElementById(
            "hudCoins"
        );

    const progressElement =
        document.getElementById(
            "progressBar"
        );


    if (levelElement) {

        levelElement.textContent =
            level.id;
    }


    if (percentElement) {

        percentElement.textContent =
            Math.floor(percent);
    }


    if (coinsElement) {

        coinsElement.textContent =
            game.coins;
    }


    if (progressElement) {

        progressElement.style.width =
            percent + "%";
    }
}


/* =========================================================
   DRAW
   ========================================================= */

function draw() {

    const level =
        LEVELS[game.levelIndex];


    ctx.clearRect(
        0,
        0,
        canvasWidth,
        canvasHeight
    );


    /* Screen shake */

    ctx.save();


    if (
        game.screenShake > 0
    ) {

        const shake =
            game.screenShake;

        ctx.translate(
            (
                Math.random() -
                0.5
            ) * shake,

            (
                Math.random() -
                0.5
            ) * shake
        );
    }


    drawBackground(level);

    drawWorld(level);

    drawParticles();

    drawPlayer(level.color);


    ctx.restore();
}


/* =========================================================
   BACKGROUND
   ========================================================= */

function drawBackground(level) {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            canvasHeight
        );


    gradient.addColorStop(
        0,
        "#050817"
    );

    gradient.addColorStop(
        1,
        "#10182e"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        canvasWidth,
        canvasHeight
    );


    /* Glow */

    const glow =
        ctx.createRadialGradient(
            canvasWidth * 0.7,
            canvasHeight * 0.3,
            20,
            canvasWidth * 0.7,
            canvasHeight * 0.3,
            500
        );


    glow.addColorStop(
        0,
        level.color + "30"
    );

    glow.addColorStop(
        1,
        "transparent"
    );


    ctx.fillStyle =
        glow;


    ctx.fillRect(
        0,
        0,
        canvasWidth,
        canvasHeight
    );


    /* Grid */

    const gridSize = 80;

    const offset =
        game.worldX %
        gridSize;


    ctx.strokeStyle =
        level.color + "18";

    ctx.lineWidth = 1;


    for (
        let x = -offset;
        x < canvasWidth;
        x += gridSize
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            canvasHeight
        );

        ctx.stroke();
    }


    for (
        let y = 0;
        y < canvasHeight;
        y += gridSize
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            canvasWidth,
            y
        );

        ctx.stroke();
    }
}


/* =========================================================
   WORLD
   ========================================================= */

function drawWorld(level) {

    const floor =
        canvasHeight - 100;


    /* Ground */

    ctx.fillStyle =
        "#0c1429";


    ctx.fillRect(
        0,
        floor,
        canvasWidth,
        100
    );


    ctx.fillStyle =
        level.color;


    ctx.shadowBlur = 20;

    ctx.shadowColor =
        level.color;


    ctx.fillRect(
        0,
        floor,
        canvasWidth,
        4
    );


    ctx.shadowBlur = 0;


    /* Camera */

    const cameraX =
        game.worldX -
        game.player.x +
        160;


    game.objects.forEach(object => {

        if (
            object.collected
        ) {
            return;
        }


        const screenX =
            object.x -
            cameraX;


        if (
            screenX <
                -150 ||
            screenX >
                canvasWidth + 150
        ) {
            return;
        }


        drawObject(
            object,
            screenX,
            object.y,
            level.color
        );
    });
}


/* =========================================================
   OBJECT DRAWING
   ========================================================= */

function drawObject(
    object,
    x,
    y,
    color
) {

    ctx.save();


    switch (object.type) {

        case "spike":

            y =
                canvasHeight -
                100 -
                object.height;


            ctx.fillStyle =
                "#ff5268";

            ctx.shadowBlur = 18;

            ctx.shadowColor =
                "#ff5268";


            ctx.beginPath();

            ctx.moveTo(
                x,
                y + object.height
            );

            ctx.lineTo(
                x +
                object.width / 2,
                y
            );

            ctx.lineTo(
                x +
                object.width,
                y + object.height
            );

            ctx.closePath();

            ctx.fill();

            break;


        case "block":

            y =
                canvasHeight -
                100 -
                object.height;


            ctx.fillStyle =
                color;

            ctx.shadowBlur = 15;

            ctx.shadowColor =
                color;


            ctx.fillRect(
                x,
                y,
                object.width,
                object.height
            );


            ctx.fillStyle =
                "#ffffff30";


            ctx.fillRect(
                x + 7,
                y + 7,
                object.width - 14,
                5
            );

            break;


        case "laser":

            ctx.fillStyle =
                "#ff385d";

            ctx.shadowBlur = 25;

            ctx.shadowColor =
                "#ff385d";


            ctx.fillRect(
                x,
                y,
                object.width,
                object.height
            );

            break;


        case "coin":

            drawCoin(
                x,
                y,
                "#ffe45e"
            );

            break;


        case "secret":

            drawCoin(
                x,
                y,
                "#ffffff"
            );

            break;


        case "gravity":

            drawPortal(
                x,
                y,
                "#bd54ff",
                "↕"
            );

            break;


        case "teleport":

            drawPortal(
                x,
                y,
                "#22e6ff",
                "↗"
            );

            break;


        case "speed":

            drawPortal(
                x,
                y,
                "#ff9a38",
                "»"
            );

            break;


        case "pad":

            y =
                canvasHeight -
                100 -
                object.height;


            ctx.fillStyle =
                "#22e6ff";

            ctx.shadowBlur = 20;

            ctx.shadowColor =
                "#22e6ff";


            ctx.fillRect(
                x,
                y,
                object.width,
                object.height
            );

            break;


        case "ring":

            ctx.strokeStyle =
                "#ffe45e";

            ctx.lineWidth = 5;

            ctx.shadowBlur = 20;

            ctx.shadowColor =
                "#ffe45e";


            ctx.beginPath();

            ctx.arc(
                x + 22,
                y + 22,
                17,
                0,
                Math.PI * 2
            );

            ctx.stroke();

            break;


        case "enemy":

            ctx.fillStyle =
                "#ff5268";

            ctx.shadowBlur = 20;

            ctx.shadowColor =
                "#ff5268";


            ctx.beginPath();

            ctx.arc(
                x + 19,
                y + 19,
                19,
                0,
                Math.PI * 2
            );

            ctx.fill();


            ctx.fillStyle =
                "#ffffff";


            ctx.fillRect(
                x + 9,
                y + 10,
                6,
                6
            );

            ctx.fillRect(
                x + 24,
                y + 10,
                6,
                6
            );

            break;
    }


    ctx.restore();
}


/* =========================================================
   COIN
   ========================================================= */

function drawCoin(
    x,
    y,
    color
) {

    ctx.save();

    ctx.strokeStyle =
        color;

    ctx.lineWidth = 5;

    ctx.shadowBlur = 20;

    ctx.shadowColor =
        color;


    ctx.beginPath();

    ctx.arc(
        x + 13,
        y + 13,
        10,
        0,
        Math.PI * 2
    );

    ctx.stroke();


    ctx.restore();
}


/* =========================================================
   PORTAL
   ========================================================= */

function drawPortal(
    x,
    y,
    color,
    symbol
) {

    ctx.save();

    ctx.strokeStyle =
        color;

    ctx.lineWidth = 5;

    ctx.shadowBlur = 25;

    ctx.shadowColor =
        color;


    ctx.beginPath();

    ctx.arc(
        x + 22,
        y + 22,
        17,
        0,
        Math.PI * 2
    );

    ctx.stroke();


    ctx.fillStyle =
        color;

    ctx.font =
        "bold 20px Arial";

    ctx.textAlign =
        "center";

    ctx.fillText(
        symbol,
        x + 22,
        y + 29
    );


    ctx.restore();
}


/* =========================================================
   PLAYER
   ========================================================= */

function drawPlayer(color) {

    const player =
        game.player;


    const skin =
        getCurrentSkin();


    ctx.save();


    ctx.translate(
        player.x +
            player.width / 2,
        player.y +
            player.height / 2
    );


    ctx.rotate(
        player.rotation
    );


    ctx.fillStyle =
        "#ffffff";


    ctx.shadowBlur = 25;

    ctx.shadowColor =
        skin.color ||
        color;


    ctx.fillRect(
        -19,
        -19,
        38,
        38
    );


    ctx.fillStyle =
        skin.color ||
        color;


    ctx.fillRect(
        -8,
        -8,
        16,
        16
    );


    ctx.restore();
}


/* =========================================================
   CURRENT SKIN
   ========================================================= */

function getCurrentSkin() {

    if (
        typeof SHOP_ITEMS ===
        "undefined"
    ) {

        return {
            color: "#22e6ff"
        };
    }


    return (
        SHOP_ITEMS.find(
            item =>
                item.id ===
                gameSave.selectedSkin
        ) ||
        SHOP_ITEMS[0] ||
        {
            color: "#22e6ff"
        }
    );
}


/* =========================================================
   PARTICLES
   ========================================================= */

function createParticles(
    x,
    y,
    color,
    amount
) {

    for (
        let i = 0;
        i < amount;
        i++
    ) {

        game.particles.push({

            x,

            y,

            vx:
                (
                    Math.random() -
                    0.5
                ) * 400,

            vy:
                (
                    Math.random() -
                    0.5
                ) * 400,

            life:
                0.5 +
                Math.random() * 0.7,

            maxLife: 1,

            size:
                2 +
                Math.random() * 5,

            color
        });
    }
}


function updateParticles(delta) {

    game.particles.forEach(
        particle => {

            particle.x +=
                particle.vx *
                delta;

            particle.y +=
                particle.vy *
                delta;

            particle.vy +=
                500 *
                delta;

            particle.life -=
                delta;
        }
    );


    game.particles =
        game.particles.filter(
            particle =>
                particle.life > 0
        );
}


function drawParticles() {

    game.particles.forEach(
        particle => {

            ctx.save();

            ctx.globalAlpha =
                Math.max(
                    0,
                    particle.life /
                    particle.maxLife
                );

            ctx.fillStyle =
                particle.color;

            ctx.shadowBlur = 12;

            ctx.shadowColor =
                particle.color;


            ctx.fillRect(
                particle.x,
                particle.y,
                particle.size,
                particle.size
            );


            ctx.restore();
        }
    );
}


/* =========================================================
   STATISTICS
   ========================================================= */

function renderStatistics() {

    const container =
        document.getElementById(
            "statisticsContainer"
        );

    if (!container) return;


    const stats = [

        [
            "TOTAL COINS",
            gameSave.coins
        ],

        [
            "TOTAL ATTEMPTS",
            gameSave.attempts
        ],

        [
            "DEATHS",
            gameSave.deaths
        ],

        [
            "LEVELS COMPLETED",
            gameSave.completedLevels.length
        ],

        [
            "BEST SCORE",
            gameSave.bestScore
        ],

        [
            "BEST LEVEL",
            gameSave.bestLevel
        ],

        [
            "SECRET COINS",
            gameSave.secretCoins
        ],

        [
            "PLAY TIME",
            formatTime(
                gameSave.totalPlayTime
            )
        ]

    ];


    container.innerHTML =
        stats.map(stat => `

            <div class="stat">

                <div class="statValue">
                    ${stat[1]}
                </div>

                <div class="statName">
                    ${stat[0]}
                </div>

            </div>

        `).join("");
}


function formatTime(seconds) {

    const minutes =
        Math.floor(
            seconds / 60
        );

    const remaining =
        Math.floor(
            seconds % 60
        );

    return (
        minutes +
        ":" +
        String(
            remaining
        ).padStart(2, "0")
    );
}


/* =========================================================
   FULLSCREEN
   ========================================================= */

function toggleFullscreen() {

    if (
        !document.fullscreenElement
    ) {

        document
            .documentElement
            .requestFullscreen()
            .catch(() => {});

    } else {

        document
            .exitFullscreen()
            .catch(() => {});
    }
}


/* =========================================================
   RESET
   ========================================================= */

function resetProgress() {

    const confirmed =
        confirm(
            "Reset all TOPO GAME progress?"
        );

    if (!confirmed) {
        return;
    }


    localStorage.removeItem(
        "TOPO_SAVE"
    );


    location.reload();
}


/* =========================================================
   SETTINGS
   ========================================================= */

const musicCheckbox =
    document.getElementById(
        "musicEnabled"
    );

const soundCheckbox =
    document.getElementById(
        "soundEnabled"
    );

const volumeSlider =
    document.getElementById(
        "volume"
    );

const languageSelect =
    document.getElementById(
        "language"
    );


if (musicCheckbox) {

    musicCheckbox.addEventListener(
        "change",
        () => {

            if (
                typeof AudioSystem !==
                "undefined"
            ) {

                AudioSystem.musicEnabled =
                    musicCheckbox.checked;
            }
        }
    );
}


if (soundCheckbox) {

    soundCheckbox.addEventListener(
        "change",
        () => {

            if (
                typeof AudioSystem !==
                "undefined"
            ) {

                AudioSystem.enabled =
                    soundCheckbox.checked;
            }
        }
    );
}


if (volumeSlider) {

    volumeSlider.addEventListener(
        "input",
        () => {

            if (
                typeof AudioSystem !==
                "undefined"
            ) {

                AudioSystem.volume =
                    Number(
                        volumeSlider.value
                    );
            }
        }
    );
}


if (languageSelect) {

    languageSelect.value =
        typeof currentLanguage !==
        "undefined"
            ? currentLanguage
            : "en";


    languageSelect.addEventListener(
        "change",
        () => {

            if (
                typeof setLanguage ===
                "function"
            ) {

                setLanguage(
                    languageSelect.value
                );
            }
        }
    );
}


/* =========================================================
   LEVEL EDITOR
   ========================================================= */

let editorTool = "block";

let customObjects = [];


const editorCanvas =
    document.getElementById(
        "editorCanvas"
    );


const editorContext =
    editorCanvas
        ? editorCanvas.getContext("2d")
        : null;


function setEditorTool(tool) {

    editorTool = tool;
}


if (editorCanvas) {

    editorCanvas.addEventListener(
        "pointerdown",
        event => {

            const rect =
                editorCanvas
                    .getBoundingClientRect();


            const scaleX =
                editorCanvas.width /
                rect.width;


            const scaleY =
                editorCanvas.height /
                rect.height;


            const x =
                Math.floor(
                    (
                        event.clientX -
                        rect.left
                    ) *
                    scaleX /
                    50
                ) * 50;


            const y =
                Math.floor(
                    (
                        event.clientY -
                        rect.top
                    ) *
                    scaleY /
                    50
                ) * 50;


            if (
                editorTool ===
                "eraser"
            ) {

                customObjects =
                    customObjects.filter(
                        object =>
                            !(
                                object.x === x &&
                                object.y === y
                            )
                    );

            } else {

                customObjects.push({

                    type:
                        editorTool,

                    x,

                    y
                });
            }


            drawEditor();
        }
    );
}


function drawEditor() {

    if (
        !editorCanvas ||
        !editorContext
    ) {
        return;
    }


    const width =
        editorCanvas.width;

    const height =
        editorCanvas.height;


    editorContext.fillStyle =
        "#080b18";


    editorContext.fillRect(
        0,
        0,
        width,
        height
    );


    editorContext.strokeStyle =
        "#1c2850";


    for (
        let x = 0;
        x < width;
        x += 50
    ) {

        editorContext.beginPath();

        editorContext.moveTo(
            x,
            0
        );

        editorContext.lineTo(
            x,
            height
        );

        editorContext.stroke();
    }


    for (
        let y = 0;
        y < height;
        y += 50
    ) {

        editorContext.beginPath();

        editorContext.moveTo(
            0,
            y
        );

        editorContext.lineTo(
            width,
            y
        );

        editorContext.stroke();
    }


    customObjects.forEach(
        object => {

            if (
                object.type ===
                "spike"
            ) {

                editorContext.fillStyle =
                    "#ff5268";

            }

            else if (
                object.type ===
                "coin"
            ) {

                editorContext.fillStyle =
                    "#ffe45e";

            }

            else if (
                object.type ===
                "portal"
            ) {

                editorContext.fillStyle =
                    "#bd54ff";

            }

            else {

                editorContext.fillStyle =
                    "#22e6ff";
            }


            editorContext.fillRect(
                object.x + 5,
                object.y + 5,
                40,
                40
            );
        }
    );
}


function saveCustomLevel() {

    localStorage.setItem(
        "TOPO_CUSTOM_LEVEL",
        JSON.stringify(
            customObjects
        )
    );


    alert(
        "Custom level saved!"
    );
}


function loadCustomLevel() {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    "TOPO_CUSTOM_LEVEL"
                )
            );

        if (
            Array.isArray(saved)
        ) {

            customObjects =
                saved;

            drawEditor();
        }

    } catch (error) {

        console.warn(
            "Could not load custom level:",
            error
        );
    }
}


function testCustomLevel() {

    saveCustomLevel();

    alert(
        "Custom level saved! The custom-level gameplay can be connected to the main engine."
    );
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

loadCustomLevel();

setLanguageSafe();


function setLanguageSafe() {

    if (
        typeof setLanguage ===
        "function"
    ) {

        const language =
            localStorage.getItem(
                "topoLanguage"
            ) || "en";

        setLanguage(
            language
        );
    }
}


saveGame();
```
