function startLoader() {
    showLoader();
    monitorLoading();
}

function startLoader() {
    showLoader();
    console.log('Loader démarré');
    monitorLoading();
}

function monitorLoading() {
    const interval = setInterval(() => {
        console.log('Vérification du flag isLoading:', isLoading);
        if (!isLoading) {
            hideLoader();
            console.log('Loader masqué car isLoading est false');
            document.body.classList.add("loaded");

            clearInterval(interval);

            setTimeout(() => {
                document.body.classList.remove("loaded");
            }, 500);
        }
    }, 500);
}




function showLoader() {
    const loaderWrapper = document.getElementById('loader-wrapper');
    if (loaderWrapper) {
        loaderWrapper.classList.add('display-block'); // Ajoute la classe pour afficher le loader
        console.log('Classes de loader-wrapper:', loaderWrapper.classList);
    }
}

function hideLoader() {
    const loaderWrapper = document.getElementById('loader-wrapper');
    if (loaderWrapper) {
        loaderWrapper.classList.remove('display-block'); // Supprime la classe pour cacher le loader
    }
}

var checkmarkIdPrefix = "loadingCheckSVG-";
var checkmarkCircleIdPrefix = "loadingCheckCircleSVG-";
var verticalSpacing = 50;

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

// Fonctions existantes...
function createSVG(tag, properties, opt_children) {
    var newElement = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (prop in properties) {
        newElement.setAttribute(prop, properties[prop]);
    }
    if (opt_children) {
        opt_children.forEach(function (child) {
            newElement.appendChild(child);
        });
    }
    return newElement;
}

function createPhraseSvg(phrase, yOffset) {
    var text = createSVG("text", {
        fill: "white",
        x: 50,
        y: yOffset,
        "font-size": 18,
        "font-family": "Arial"
    });
    text.appendChild(document.createTextNode(phrase + "..."));
    return text;
}

function createCheckSvg(yOffset, index) {
    var check = createSVG("polygon", {
        points: "21.661,7.643 13.396,19.328 9.429,15.361 7.075,17.714 13.745,24.384 24.345,9.708 ",
        fill: "rgba(255,255,255,1)",
        id: checkmarkIdPrefix + index
    });
    var circle_outline = createSVG("path", {
        d: "M16,0C7.163,0,0,7.163,0,16s7.163,16,16,16s16-7.163,16-16S24.837,0,16,0z M16,30C8.28,30,2,23.72,2,16C2,8.28,8.28,2,16,2 c7.72,0,14,6.28,14,14C30,23.72,23.72,30,16,30z",
        fill: "white"
    });
    var circle = createSVG("circle", {
        id: checkmarkCircleIdPrefix + index,
        fill: "rgba(255,255,255,0)",
        cx: 16,
        cy: 16,
        r: 15
    });
    var group = createSVG(
        "g",
        {
            transform: "translate(10 " + (yOffset - 20) + ") scale(.9)"
        },
        [circle, check, circle_outline]
    );
    return group;
}

function addPhrasesToDocument(phrases) {
    const phrasesContainer = document.getElementById("phrases");
    if (!phrasesContainer) {
        console.error('Élément avec l\'ID "phrases" introuvable');
        return;
    }

    phrases.forEach(function (phrase, index) {
        var yOffset = 30 + verticalSpacing * index;
        phrasesContainer.appendChild(createPhraseSvg(phrase, yOffset));
        phrasesContainer.appendChild(createCheckSvg(yOffset, index));
    });
}


function easeInOut(t) {
    var period = 200;
    return (Math.sin(t / period + 100) + 1) / 2;
}

document.addEventListener("DOMContentLoaded", function (event) {
    var phrases = shuffleArray([
        "Le hamster dans la roue accélère... encore un petit effort ! 🐹💨",
        "Les pigeons voyageurs sont en route... livraison imminente ! 🕊️📬",
        "Les serveurs chauffent... c'est le moment de la grande révélation ! 🔥💻",
        "Les algorithmes font un concours de vitesse... on approche de la ligne d'arrivée ! 🏁⚡",
        "Lustrage du contenu... l'IA passe un dernier coup de polish ! 🧽✨",
        "L'IA trie les données... elle a trouvé des memes, ça prend un peu plus de temps ! 📁😂",
        "Synchronisation des neurones artificiels... les neurones sont encore en pause café ! ☕🧠",
        "Les pixels sont en train de se faire beaux... ils mettent leur plus belle résolution ! 🖼️✨",
        "L'IA bricole le contenu... elle cherche encore la notice ! 🛠️📚",
        "L'IA révise son dictionnaire... elle cherche un synonyme de 'presque prêt' ! 📖🔍",
        "Mélange de code et de magie... espérons que ça fasse des étincelles ! ✨💻",
        "Les neurones artificiels sont en réunion de crise... brainstorming intense ! 🧠💥",
        "Les données cherchent leur chemin... elles devraient arriver à destination sous peu ! 🗺️🧭",
        "L'IA ajuste ses lunettes... vision claire sur un contenu en approche ! 👓🔍",
        "L'algorithme est dans la matrice... en train de choisir la pilule bleue ou rouge ! 🔵🔴",
        "L'algorithme vérifie son horoscope... il paraît que c'est un bon jour pour les chargements ! 🌟🖥️"
    ]);
    addPhrasesToDocument(phrases);
    var start_time = new Date().getTime();
    var upward_moving_group = document.getElementById("phrases");
    upward_moving_group.currentY = 0;
    var checks = phrases.map(function (_, i) {
        return {
            check: document.getElementById(checkmarkIdPrefix + i),
            circle: document.getElementById(checkmarkCircleIdPrefix + i)
        };
    });
    function animateLoading() {
        var now = new Date().getTime();
        upward_moving_group.setAttribute(
            "transform",
            "translate(0 " + upward_moving_group.currentY + ")"
        );
        upward_moving_group.currentY -= 8 * easeInOut(now);
        checks.forEach(function (check, i) {
            var color_change_boundary = -i * verticalSpacing + verticalSpacing + 15;
            if (upward_moving_group.currentY < color_change_boundary) {
                var alpha = Math.max(
                    Math.min(
                        1 -
                            (upward_moving_group.currentY - color_change_boundary + 15) / 30,
                        1
                    ),
                    0
                );
                check.circle.setAttribute("fill", "rgba(255, 255, 255, " + alpha + ")");
                var check_color = [
                    Math.round(255 * (1 - alpha) + 120 * alpha),
                    Math.round(255 * (1 - alpha) + 154 * alpha)
                ];
                check.check.setAttribute(
                    "fill",
                    "rgba(255, " + check_color[0] + "," + check_color[1] + ", 1)"
                );
            }
        });
        if (now - start_time < 30000 && upward_moving_group.currentY > -710) {
            requestAnimationFrame(animateLoading);
        }
    }
    //animateLoading();
});

