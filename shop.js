const SHOP_ITEMS = [

    {
        id: "neon",
        name: "Neon Cube",
        price: 100,
        icon: "◆",
        color: "#22e6ff"
    },

    {
        id: "plasma",
        name: "Plasma Cube",
        price: 250,
        icon: "◇",
        color: "#ff4fd8"
    },

    {
        id: "cyber",
        name: "Cyber Cube",
        price: 400,
        icon: "⬢",
        color: "#44aaff"
    },

    {
        id: "fire",
        name: "Fire Cube",
        price: 600,
        icon: "♦",
        color: "#ff5338"
    },

    {
        id: "ice",
        name: "Ice Cube",
        price: 800,
        icon: "❖",
        color: "#80f7ff"
    },

    {
        id: "galaxy",
        name: "Galaxy Cube",
        price: 1200,
        icon: "✦",
        color: "#bd54ff"
    },

    {
        id: "shadow",
        name: "Shadow Cube",
        price: 1600,
        icon: "■",
        color: "#777"
    },

    {
        id: "rainbow",
        name: "Rainbow Cube",
        price: 2500,
        icon: "⬣",
        color: "#fff"
    }

];


function renderShop() {

    const container =
        document.getElementById(
            "shopContainer"
        );

    document.getElementById(
        "shopCoins"
    ).textContent =
        gameSave.coins;


    container.innerHTML =
        SHOP_ITEMS.map(
            item => {

                const owned =
                    gameSave.skins.includes(
                        item.id
                    );

                const selected =
                    gameSave.selectedSkin ===
                    item.id;

                return `

                    <div
                        class="shopItem"
                        style="
                            --skinColor:
                            ${item.color}
                        "
                    >

                        <div class="skinPreview">
                            ${item.icon}
                        </div>

                        <h3>
                            ${item.name}
                        </h3>

                        <p>
                            ${selected
                                ? "EQUIPPED"
                                : owned
                                    ? "OWNED"
                                    : "◆ " + item.price}
                        </p>

                        <button
                            onclick="
                                purchaseSkin(
                                    '${item.id}'
                                )
                            "
                        >
                            ${
                                selected
                                    ? "EQUIPPED"
                                    : owned
                                        ? "EQUIP"
                                        : "BUY"
                            }
                        </button>

                    </div>

                `;

            }
        ).join("");

}


function purchaseSkin(id) {

    const item =
        SHOP_ITEMS.find(
            x => x.id === id
        );

    if (!item)
        return;


    if (
        gameSave.skins.includes(
            id
        )
    ) {

        gameSave.selectedSkin =
            id;

        saveGame();

        renderShop();

        return;
    }


    if (
        gameSave.coins <
        item.price
    ) {

        alert(
            "Not enough coins!"
        );

        return;
    }


    gameSave.coins -=
        item.price;

    gameSave.skins.push(
        id
    );

    gameSave.selectedSkin =
        id;

    saveGame();

    renderShop();

    AudioSystem.coin();

}
