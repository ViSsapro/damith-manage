
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyA6npygmtNl42_xnHjUnWf332QnrBDn1IM",
    authDomain: "vissapro-aa91d.firebaseapp.com",
    projectId: "vissapro-aa91d",
    storageBucket: "vissapro-aa91d.firebasestorage.app",
    messagingSenderId: "866553327331",
    appId: "1:866553327331:web:60ef47fa0c88a942571fd6"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

const MY_ADMIN_GMAIL = "vimukthithuhina754@gmail.com";

let singleVideos = [];
let playlistsData = [];

let currentView = "videos";
let selectedPlaylistId = null;

let isAdminLoggedIn = false;

let generatedOTP = null;
let pendingEmail = "";


/* =========================================================
   GOOGLE LOGIN
========================================================= */

window.triggerGoogleLogin = function () {

    const provider = new GoogleAuthProvider();

    signInWithPopup(auth, provider)

        .then((res) => {

            loginSuccess(res.user.email);

        })

        .catch((err) => {

            alert(
                "Google Sign-In Error: " +
                err.message
            );

        });
};


/* =========================================================
   FACEBOOK LOGIN
========================================================= */

window.triggerFacebookLogin = function () {

    const provider = new FacebookAuthProvider();

    signInWithPopup(auth, provider)

        .then((res) => {

            loginSuccess(
                res.user.email ||
                "facebook_user@vissapro.com"
            );

        })

        .catch((err) => {

            alert(
                "Facebook Sign-In Error: " +
                err.message
            );

        });
};


/* =========================================================
   LOGIN BUTTON EVENTS
========================================================= */

const googleLoginBtn =
    document.getElementById("googleLoginBtn");

if (googleLoginBtn) {

    googleLoginBtn.addEventListener(
        "click",
        window.triggerGoogleLogin
    );

}


const facebookLoginBtn =
    document.getElementById("facebookLoginBtn");

if (facebookLoginBtn) {

    facebookLoginBtn.addEventListener(
        "click",
        window.triggerFacebookLogin
    );

}


/* =========================================================
   FIRESTORE - LOAD DATA
========================================================= */

window.cloudFetchData = async function () {

    try {

        /* -------------------------------
           SINGLE VIDEOS
        -------------------------------- */

        const singleDocRef =
            doc(
                db,
                "appData",
                "singleVideosDoc"
            );

        const singleDocSnap =
            await getDoc(singleDocRef);

        let sVideos = [];

        if (singleDocSnap.exists()) {

            const data =
                singleDocSnap.data();

            if (Array.isArray(data.videos)) {

                sVideos = data.videos;

            } else if (
                Array.isArray(data.singleVideos)
            ) {

                sVideos =
                    data.singleVideos;

            }

        }


        /* -------------------------------
           PLAYLISTS
        -------------------------------- */

        const plSnap =
            await getDocs(
                collection(db, "playlists")
            );

        const pData = [];


        plSnap.forEach((d) => {

            const data = d.data();

            pData.push({

                id:
                    data.id ||
                    d.id,

                name:
                    data.name ||
                    "Untitled Playlist",

                videos:
                    Array.isArray(data.videos)
                        ? data.videos
                        : []

            });

        });


        return {

            singleVideos: sVideos,

            playlistsData: pData

        };


    } catch (e) {

        console.error(
            "Firestore Fetch Error:",
            e
        );

        return {

            singleVideos: [],

            playlistsData: []

        };

    }

};


/* =========================================================
   FIRESTORE - ADD PLAYLIST
========================================================= */

window.cloudAddPlaylistToDB =
    async function (plObj) {

        try {

            await setDoc(

                doc(
                    db,
                    "playlists",
                    plObj.id
                ),

                {

                    ...plObj,

                    videos:
                        Array.isArray(
                            plObj.videos
                        )
                            ? plObj.videos
                            : []

                }

            );

            return true;


        } catch (e) {

            console.error(
                "Add Playlist Error:",
                e
            );

            throw e;

        }

    };


/* =========================================================
   FIRESTORE - ADD VIDEO
========================================================= */

window.cloudAddVideoToDB =
    async function (
        targetPlId,
        newVidObj,
        singleVideosArr,
        playlistsArr
    ) {

        try {

            if (targetPlId === "none") {

                await setDoc(

                    doc(
                        db,
                        "appData",
                        "singleVideosDoc"
                    ),

                    {

                        videos:
                            Array.isArray(
                                singleVideosArr
                            )
                                ? singleVideosArr
                                : []

                    }

                );

            } else {

                const targetPl =
                    (playlistsArr || [])
                        .find(
                            p =>
                                p.id ===
                                targetPlId
                        );


                if (!targetPl) {

                    throw new Error(
                        "Selected playlist was not found."
                    );

                }


                await setDoc(

                    doc(
                        db,
                        "playlists",
                        targetPl.id
                    ),

                    {

                        ...targetPl,

                        videos:
                            Array.isArray(
                                targetPl.videos
                            )
                                ? targetPl.videos
                                : []

                    }

                );

            }

            return true;


        } catch (e) {

            console.error(
                "Add Video Error:",
                e
            );

            throw e;

        }

    };


/* =========================================================
   FIRESTORE - UPDATE DATABASE
========================================================= */

window.cloudUpdateDatabase =
    async function (
        singleVideosArr,
        playlistsArr
    ) {

        try {

            await setDoc(

                doc(
                    db,
                    "appData",
                    "singleVideosDoc"
                ),

                {

                    videos:
                        Array.isArray(
                            singleVideosArr
                        )
                            ? singleVideosArr
                            : []

                }

            );


            for (
                const pl
                of playlistsArr
            ) {

                await setDoc(

                    doc(
                        db,
                        "playlists",
                        pl.id
                    ),

                    {

                        id: pl.id,

                        name: pl.name,

                        videos:
                            Array.isArray(
                                pl.videos
                            )
                                ? pl.videos
                                : []

                    }

                );

            }

            return true;


        } catch (e) {

            console.error(
                "Cloud Update Error:",
                e
            );

            throw e;

        }

    };


/* =========================================================
   LOAD CLOUD DATA
========================================================= */

async function loadCloudData() {

    if (!window.cloudFetchData) {

        return false;

    }


    try {

        const dbRes =
            await window.cloudFetchData();


        singleVideos =
            Array.isArray(
                dbRes.singleVideos
            )
                ? dbRes.singleVideos
                : [];


        playlistsData =
            Array.isArray(
                dbRes.playlistsData
            )
                ? dbRes.playlistsData
                : [];


        localStorage.setItem(
            "vissaSingleVideos",
            JSON.stringify(
                singleVideos
            )
        );


        return true;


    } catch (e) {

        console.error(
            "loadCloudData Error:",
            e
        );

        return false;

    }

}


/* =========================================================
   PAGE LOAD
========================================================= */

window.onload = async function () {

    const loggedUser =
        localStorage.getItem(
            "vissaLoggedUser"
        );


    if (loggedUser) {

        await loadCloudData();

        initDashboard(
            loggedUser
        );

    }

};


/* =========================================================
   SIDE MENU
========================================================= */

window.toggleSideMenu =
    function () {

        const drawer =
            document.getElementById(
                "sideDrawer"
            );

        const overlay =
            document.getElementById(
                "menuOverlay"
            );


        if (
            drawer &&
            overlay
        ) {

            drawer.classList.toggle(
                "open"
            );


            overlay.style.display =
                drawer.classList.contains(
                    "open"
                )
                    ? "block"
                    : "none";

        }

    };


/* =========================================================
   PAGE SWITCH
========================================================= */

window.switchPageView =
    function (page) {

        document
            .querySelectorAll(
                ".page-view"
            )
            .forEach(
                v =>
                    v.classList.remove(
                        "active-view"
                    )
            );


        document
            .querySelectorAll(
                ".drawer-nav-item button"
            )
            .forEach(
                b =>
                    b.classList.remove(
                        "active"
                    )
            );


        const targetMap = {

            home:
                "viewHome",

            makemoney:
                "viewMakeMoney",

            comments:
                "viewComments",

            account:
                "viewAccount"

        };


        const targetView =
            document.getElementById(
                targetMap[page]
            );


        if (targetView) {

            targetView.classList.add(
                "active-view"
            );

        }


        const navBtn =
            document.getElementById(
                "nav" +
                page
                    .charAt(0)
                    .toUpperCase() +
                page.slice(1)
            );


        if (navBtn) {

            navBtn.classList.add(
                "active"
            );

        }


        window.toggleSideMenu();

    };


/* =========================================================
   COMMENTS
========================================================= */

window.postComment =
    function () {

        const commentInput =
            document.getElementById(
                "newCommentText"
            );


        const text =
            commentInput
                ? commentInput.value.trim()
                : "";


        const loggedUser =
            localStorage.getItem(
                "vissaLoggedUser"
            ) || "User";


        if (!text) {

            alert(
                "කරුණාකර Comment එකක් ලියන්න!"
            );

            return;

        }


        const list =
            document.getElementById(
                "commentsList"
            );


        if (list) {

            const newComment =
                document.createElement(
                    "div"
                );


            newComment.style =
                "background:#222;" +
                "border-radius:8px;" +
                "padding:15px;" +
                "margin-bottom:12px;" +
                "border-left:3px solid #ff0000;";


            newComment.innerHTML = `

                <div
                    style="
                    font-size:0.85rem;
                    color:#ff0000;
                    font-weight:bold;
                    margin-bottom:4px;
                    "
                >
                    ${loggedUser}
                </div>

                <div
                    style="
                    font-size:0.95rem;
                    color:#ddd;
                    "
                >
                    ${text}
                </div>

            `;


            list.prepend(
                newComment
            );

        }


        if (commentInput) {

            commentInput.value = "";

        }

    };


/* =========================================================
   EMAIL AUTH MODAL
========================================================= */

window.openEmailModal =
    function () {

        const modal =
            document.getElementById(
                "emailAuthModal"
            );


        if (modal) {

            modal.style.display =
                "flex";

        }

    };


window.closeAuthModal =
    function () {

        const modal =
            document.getElementById(
                "emailAuthModal"
            );


        if (modal) {

            modal.style.display =
                "none";

        }

    };


/* =========================================================
   EMAIL OTP LOGIN
   EmailJS is kept because it is used
   for login verification.
========================================================= */

window.sendOTPCode =
    function () {

        const emailInput =
            document.getElementById(
                "userEmailInput"
            );


        const userEmail =
            emailInput
                ? emailInput.value.trim()
                : "";


        if (
            !userEmail ||
            !userEmail.includes("@")
        ) {

            alert(
                "කරුණාකර නිවැරදි Email එකක් ඇතුළත් කරන්න!"
            );

            return;

        }


        pendingEmail =
            userEmail;


        generatedOTP =
            Math.floor(
                100000 +
                Math.random() *
                900000
            ).toString();


        if (
            typeof emailjs ===
            "undefined"
        ) {

            alert(
                "EmailJS library එක load වී නැත."
            );

            return;

        }


        emailjs.send(

            "service_0dhcgr3",

            "template_cu3r1wj",

            {

                email:
                    userEmail,

                passcode:
                    generatedOTP

            }

        )

        .then(
            function () {

                alert(
                    `Verification Code එක ${userEmail} වෙත යවන ලදී.`
                );


                const step1 =
                    document.getElementById(
                        "otpStep1"
                    );


                const step2 =
                    document.getElementById(
                        "otpStep2"
                    );


                if (step1) {

                    step1.style.display =
                        "none";

                }


                if (step2) {

                    step2.style.display =
                        "block";

                }

            }
        )

        .catch(
            function (err) {

                alert(
                    "Email යැවීමේදී දෝෂයක්: " +
                    JSON.stringify(err)
                );

            }
        );

    };


/* =========================================================
   VERIFY OTP
========================================================= */

window.verifyOTPCode =
    function () {

        const otpInput =
            document.getElementById(
                "otpInput"
            );


        if (
            otpInput &&
            otpInput.value.trim() ===
            generatedOTP
        ) {

            window.closeAuthModal();

            loginSuccess(
                pendingEmail
            );

        } else {

            alert(
                "වැරදි Verification Code එකකි!"
            );

        }

    };


/* =========================================================
   LOGIN SUCCESS
========================================================= */

async function loginSuccess(email) {

    localStorage.setItem(
        "vissaLoggedUser",
        email
    );


    await loadCloudData();


    initDashboard(
        email
    );

}


/* =========================================================
   INITIALIZE DASHBOARD
========================================================= */

function initDashboard(email) {

    const loginScreen =
        document.getElementById(
            "loginScreen"
        );


    const appScreen =
        document.getElementById(
            "appScreen"
        );


    if (loginScreen) {

        loginScreen.style.display =
            "none";

    }


    if (appScreen) {

        appScreen.style.display =
            "flex";

    }


    const displayUserEmail =
        document.getElementById(
            "displayUserEmail"
        );


    const accEmail =
        document.getElementById(
            "accEmail"
        );


    if (displayUserEmail) {

        displayUserEmail.innerText =
            email;

    }


    if (accEmail) {

        accEmail.innerText =
            email;

    }


    const roleElem =
        document.getElementById(
            "displayUserRole"
        );


    const fabElem =
        document.getElementById(
            "fabContainer"
        );


    if (
        email.toLowerCase() ===
        MY_ADMIN_GMAIL.toLowerCase()
    ) {

        if (roleElem) {

            roleElem.innerText =
                "Admin (Creator)";

            roleElem.className =
                "badge-role admin";

        }


        if (fabElem) {

            fabElem.style.display =
                "flex";

        }


        isAdminLoggedIn =
            true;


    } else {

        if (roleElem) {

            roleElem.innerText =
                "Viewer";

            roleElem.className =
                "badge-role";

        }


        if (fabElem) {

            fabElem.style.display =
                "none";

        }


        isAdminLoggedIn =
            false;

    }


    render();

}


/* =========================================================
   LOGOUT
========================================================= */

window.logout =
    function () {

        localStorage.removeItem(
            "vissaLoggedUser"
        );


        const appScreen =
            document.getElementById(
                "appScreen"
            );


        const loginScreen =
            document.getElementById(
                "loginScreen"
            );


        if (appScreen) {

            appScreen.style.display =
                "none";

        }


        if (loginScreen) {

            loginScreen.style.display =
                "flex";

        }

    };


/* =========================================================
   ADMIN FAB
========================================================= */

window.toggleFab =
    function () {

        const fab =
            document.getElementById(
                "fabContainer"
            );


        if (fab) {

            fab.classList.toggle(
                "active"
            );

        }

    };


/* =========================================================
   MAIN VIDEO / PLAYLIST VIEW
========================================================= */

window.switchMainView =
    function (view) {

        currentView =
            view;


        selectedPlaylistId =
            null;


        const tabVideos =
            document.getElementById(
                "tabAllVideosBtn"
            );


        const tabPlaylists =
            document.getElementById(
                "tabPlaylistsBtn"
            );


        if (tabVideos) {

            tabVideos.classList.toggle(
                "active",
                view === "videos"
            );

        }


        if (tabPlaylists) {

            tabPlaylists.classList.toggle(
                "active",
                view === "playlists"
            );

        }


        render();

    };


/* =========================================================
   RENDER
========================================================= */

function render() {

    const container =
        document.getElementById(
            "mainContent"
        );


    const subTabs =
        document.getElementById(
            "playlistSubTabs"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    if (subTabs) {

        subTabs.style.display =
            "none";

    }


    /* -------------------------------
       ALL VIDEOS
    -------------------------------- */

    if (
        currentView ===
        "videos"
    ) {

        let allCombined =
            [...singleVideos];


        playlistsData.forEach(
            pl => {

                allCombined =
                    allCombined.concat(
                        pl.videos
                    );

            }
        );


        if (
            allCombined.length ===
            0
        ) {

            container.innerHTML = `

                <p
                    style="
                    color:#888;
                    text-align:center;
                    padding:40px;
                    "
                >
                    තවමත් වීඩියෝ නොමැත.
                </p>

            `;

            return;

        }


        renderVideoCards(
            allCombined,
            container,
            "none"
        );

        return;

    }


    /* -------------------------------
       PLAYLISTS
    -------------------------------- */

    if (
        currentView ===
        "playlists"
    ) {

        if (
            selectedPlaylistId ===
            null
        ) {

            if (
                playlistsData.length ===
                0
            ) {

                container.innerHTML = `

                    <p
                        style="
                        color:#888;
                        text-align:center;
                        padding:40px;
                        "
                    >
                        තවමත් Playlists නොමැත.
                    </p>

                `;

                return;

            }


            const grid =
                document.createElement(
                    "div"
                );


            grid.className =
                "playlist-grid";


            playlistsData.forEach(
                pl => {

                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "playlist-card animated-box-frame";


                    card.onclick =
                        () => {

                            selectedPlaylistId =
                                pl.id;

                            render();

                        };


                    card.innerHTML = `

                        <i
                            class="fa-solid fa-layer-group"
                        ></i>

                        <h3>
                            ${pl.name}
                        </h3>

                        <span
                            style="
                            color:#777;
                            font-size:0.85rem;
                            "
                        >
                            ${pl.videos.length}
                            Videos
                        </span>

                    `;


                    grid.appendChild(
                        card
                    );

                }
            );


            container.appendChild(
                grid
            );


        } else {

            if (subTabs) {

                subTabs.style.display =
                    "flex";

            }


            renderSubTabs();


            const currentPl =
                playlistsData.find(
                    pl =>
                        pl.id ===
                        selectedPlaylistId
                );


            if (currentPl) {

                renderVideoCards(
                    currentPl.videos,
                    container,
                    currentPl.id
                );

            }

        }

    }

}


/* =========================================================
   PLAYLIST SUB TABS
========================================================= */

function renderSubTabs() {

    const subTabs =
        document.getElementById(
            "playlistSubTabs"
        );


    if (!subTabs) {

        return;

    }


    subTabs.innerHTML = `

        <button
            class="sub-tab-btn animated-box-frame"
            onclick="
                selectedPlaylistId=null;
                render();
            "
        >

            <i
                class="fa-solid fa-arrow-left"
            ></i>

            All Playlists

        </button>

    `;


    playlistsData.forEach(
        pl => {

            const btn =
                document.createElement(
                    "button"
                );


            btn.className =
                `sub-tab-btn animated-box-frame ${
                    pl.id === selectedPlaylistId
                        ? "active"
                        : ""
                }`;


            btn.innerText =
                pl.name;


            btn.onclick =
                () => {

                    selectedPlaylistId =
                        pl.id;

                    render();

                };


            subTabs.appendChild(
                btn
            );

        }
    );

}


/* =========================================================
   VIDEO CARDS
========================================================= */

function renderVideoCards(
    videos,
    targetElem,
    playlistContextId
) {

    videos.forEach(
        vid => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "video-container animated-box-frame";


            let deleteButtonHTML =
                "";


            if (isAdminLoggedIn) {

                const vidIdentifier =
                    vid.firebaseId ||
                    vid.id;


                deleteButtonHTML = `

                    <button
                        onclick="
                            removeVideo(
                                '${playlistContextId}',
                                '${vidIdentifier}'
                            )
                        "
                        style="
                        background:#ff4d4d;
                        color:white;
                        border:none;
                        padding:6px 12px;
                        border-radius:6px;
                        cursor:pointer;
                        margin-top:10px;
                        font-weight:bold;
                        "
                    >

                        <i
                            class="fa-solid fa-trash"
                        ></i>

                        Delete Video

                    </button>

                `;

            }


            card.innerHTML = `

                <div
                    class="video-wrapper"
                >

                    <iframe
                        src="
                            https://www.youtube.com/embed/${vid.id}
                        "
                        allowfullscreen
                    ></iframe>

                </div>


                <div
                    class="video-details"
                >

                    <h2
                        class="video-title"
                    >
                        ${vid.title}
                    </h2>


                    <div
                        class="video-description"
                    >
                        ${vid.description}
                    </div>


                    <div
                        style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        flex-wrap:wrap;
                        gap:10px;
                        "
                    >

                        <a
                            href="
                                https://www.youtube.com/watch?v=${vid.id}
                            "
                            target="_blank"
                            class="yt-btn"
                        >

                            <i
                                class="fa-brands fa-youtube"
                            ></i>

                            Watch on YouTube

                        </a>


                        ${deleteButtonHTML}

                    </div>

                </div>

            `;


            targetElem.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   ADD PLAYLIST
========================================================= */

window.addPlaylist =
    async function () {

        const nameInput =
            document.getElementById(
                "playlistNameInput"
            );


        const name =
            nameInput
                ? nameInput.value.trim()
                : "";


        if (!name) {

            alert(
                "කරුණාකර Playlist Name එකක් ඇතුළත් කරන්න!"
            );

            return;

        }


        const newPl = {

            id:
                "pl_" +
                Date.now(),

            name:
                name,

            videos: []

        };


        try {

            await window.cloudAddPlaylistToDB(
                newPl
            );


            playlistsData.push(
                newPl
            );


            closeAdminModals();


            if (nameInput) {

                nameInput.value = "";

            }


            switchMainView(
                "playlists"
            );


            alert(
                "Playlist එක සාර්ථකව සාදන ලදී."
            );


        } catch (e) {

            alert(
                "Playlist save කිරීමට නොහැකි විය: " +
                e.message
            );

        }

    };


/* =========================================================
   EXTRACT YOUTUBE VIDEO ID
========================================================= */

function extractVideoID(url) {

    let cleanUrl =
        url
            .split("?")[0]
            .split("&")[0];


    const match =
        cleanUrl.match(
            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/
        );


    return (
        match &&
        match[2].length === 11
    )
        ? match[2]
        : null;

}


/* =========================================================
   ADD VIDEO
========================================================= */

window.addVideo =
    async function () {

        const targetPlEl =
            document.getElementById(
                "playlistSelect"
            );


        const linkInputEl =
            document.getElementById(
                "ytLinkInput"
            );


        const targetPlId =
            targetPlEl
                ? targetPlEl.value
                : "none";


        const linkInput =
            linkInputEl
                ? linkInputEl.value.trim()
                : "";


        const titleInputElem =
            document.getElementById(
                "customTitle"
            );


        const descInputElem =
            document.getElementById(
                "customDesc"
            );


        const title =
            (
                titleInputElem &&
                titleInputElem.value.trim()
            )
                ? titleInputElem.value.trim()
                : "VissaPro Exclusive Video";


        const description =
            (
                descInputElem &&
                descInputElem.value.trim()
            )
                ? descInputElem.value.trim()
                : "මෙම වීඩියෝව VissaPro Hub එක හරහා නරඹන්න.";


        if (!linkInput) {

            alert(
                "කරුණාකර YouTube Link එකක් ඇතුළත් කරන්න!"
            );

            return;

        }


        const videoId =
            extractVideoID(
                linkInput
            );


        if (
            !videoId ||
            videoId.length !== 11
        ) {

            alert(
                "නිවැරදි YouTube Video Link එකක් ඇතුළත් කරන්න!"
            );

            return;

        }


        const newVidObj = {

            firebaseId:
                "vid_" +
                Date.now(),

            id:
                videoId,

            title:
                title,

            description:
                description

        };


        try {

            let nextSingleVideos =
                [...singleVideos];


            let nextPlaylistsData =
                playlistsData.map(
                    pl => ({

                        ...pl,

                        videos:
                            [...pl.videos]

                    })
                );


            if (
                targetPlId ===
                "none"
            ) {

                nextSingleVideos.unshift(
                    newVidObj
                );


            } else {

                const targetPl =
                    nextPlaylistsData.find(
                        pl =>
                            pl.id ===
                            targetPlId
                    );


                if (!targetPl) {

                    alert(
                        "Selected playlist එක හමු වුණේ නැහැ."
                    );

                    return;

                }


                targetPl.videos.unshift(
                    newVidObj
                );

            }


            await window.cloudAddVideoToDB(

                targetPlId,

                newVidObj,

                nextSingleVideos,

                nextPlaylistsData

            );


            singleVideos =
                nextSingleVideos;


            playlistsData =
                nextPlaylistsData;


            localStorage.setItem(

                "vissaSingleVideos",

                JSON.stringify(
                    singleVideos
                )

            );


            closeAdminModals();


            if (linkInputEl) {

                linkInputEl.value = "";

            }


            if (titleInputElem) {

                titleInputElem.value = "";

            }


            if (descInputElem) {

                descInputElem.value = "";

            }


            render();


            alert(
                "Video එක, Title එක සහ Description එක සාර්ථකව Save විය!"
            );


        } catch (e) {

            alert(
                "Video save කිරීමට නොහැකි විය: " +
                e.message
            );

        }

    };


/* =========================================================
   REMOVE VIDEO
========================================================= */

window.removeVideo =
    async function (
        playlistId,
        videoFirebaseId
    ) {

        if (
            !confirm(
                "මෙම වීඩියෝව ඉවත් කිරීමට ඔබට අවශ්‍ය බව විශ්වාසද?"
            )
        ) {

            return;

        }


        try {

            let nextSingleVideos =
                [...singleVideos];


            let nextPlaylistsData =
                playlistsData.map(
                    pl => ({

                        ...pl,

                        videos:
                            [...pl.videos]

                    })
                );


            if (
                playlistId ===
                "none"
            ) {

                nextSingleVideos =
                    nextSingleVideos.filter(

                        v =>

                            v.firebaseId !==
                            videoFirebaseId &&

                            v.id !==
                            videoFirebaseId

                    );


            } else {

                const targetPl =
                    nextPlaylistsData.find(
                        pl =>
                            pl.id ===
                            playlistId
                    );


                if (targetPl) {

                    targetPl.videos =
                        targetPl.videos.filter(

                            v =>

                                v.firebaseId !==
                                videoFirebaseId &&

                                v.id !==
                                videoFirebaseId

                        );

                }

            }


            if (
                typeof window.cloudUpdateDatabase ===
                "function"
            ) {

                await window.cloudUpdateDatabase(

                    nextSingleVideos,

                    nextPlaylistsData

                );

            }


            singleVideos =
                nextSingleVideos;


            playlistsData =
                nextPlaylistsData;


            localStorage.setItem(

                "vissaSingleVideos",

                JSON.stringify(
                    singleVideos
                )

            );


            render();


            alert(
                "වීඩියෝව සාර්ථකව ඉවත් කරන ලදී!"
            );


        } catch (e) {

            alert(
                "වීඩියෝව ඉවත් කිරීම අසාර්ථක විය: " +
                e.message
            );

        }

    };


/* =========================================================
   PLAYLIST MODAL
========================================================= */

window.openPlaylistModal =
    function () {

        toggleFab();


        const modal =
            document.getElementById(
                "playlistModal"
            );


        if (modal) {

            modal.style.display =
                "flex";

        }

    };


/* =========================================================
   VIDEO MODAL
========================================================= */

window.openVideoModal =
    function () {

        toggleFab();


        const select =
            document.getElementById(
                "playlistSelect"
            );


        if (select) {

            select.innerHTML =
                '<option value="none">' +
                "-- None (Single Video / Direct Upload) --" +
                "</option>";


            playlistsData.forEach(
                pl => {

                    select.innerHTML += `

                        <option
                            value="${pl.id}"
                        >
                            ${pl.name}
                        </option>

                    `;

                }
            );

        }


        const modal =
            document.getElementById(
                "videoModal"
            );


        if (modal) {

            modal.style.display =
                "flex";

        }

    };


/* =========================================================
   CLOSE ADMIN MODALS
========================================================= */

window.closeAdminModals =
    function () {

        const plModal =
            document.getElementById(
                "playlistModal"
            );


        const vidModal =
            document.getElementById(
                "videoModal"
            );


        if (plModal) {

            plModal.style.display =
                "none";

        }


        if (vidModal) {

            vidModal.style.display =
                "none";

        }

    };

