/**
 * Created by 2014 on 9/9/2016.
 */
var numProfiles = 400;
var changeLikelihood = 30; // each stat increments or decrements an average of once every changeLikelihood screen update things

$('document').ready(function() {
    generateProfile();
    loadScrolls(40);
    pageProgress();
});

// ----------------------------------------------------------------
// generateProfile - called once on page load, randomly generates
//                   user profile
// ----------------------------------------------------------------

function generateProfile() {
    var profileobj = document.getElementById('userprofile');
    var profilepictureobj = document.createElement('img');
    profilepictureobj.src = 'img/profiles/profile' + parseInt(Math.floor(Math.random() * numProfiles + 1)) + '.png';
    profilepictureobj.id = 'userprofilepicture';
    profileobj.appendChild(profilepictureobj);
    profileobj.appendChild(document.createElement('br'));
    var statsdivobj = document.createElement('div');
    statsdivobj.id = 'userprofilestats';
    statsdivobj.className = 'light';
    for (var i = 0; i < 3; i++) {
        var statobj = document.createElement('p');
        statobj.id = 'stat' + parseInt(i);
        statobj.className = 'userprofilestatnum';
        var stat = Math.floor(Math.random() * 950 + 50);
        statobj.innerHTML += parseInt(stat) + '<br>';
        statsdivobj.appendChild(statobj);
        var statdescobj = document.createElement('img');
        statdescobj.src = 'img/words/width' + parseInt(Math.floor(Math.random() * 7 + 4)) + '.gif';
        statdescobj.className = 'userprofilestat';
        statsdivobj.appendChild(statdescobj);
        statsdivobj.appendChild(document.createElement('br'));
    }
    profileobj.appendChild(statsdivobj);
}

// ----------------------------------------------------------------
// updateStats - called twice per second, for each stat in user
//               profile, increments (more likely) or decrements
//               (less likely) with probability
//               1 / changeLikelihood
// ----------------------------------------------------------------

function updateStats() {
    for (var stat = 0; stat < 3; stat++) {
        if (Math.floor(Math.random() * changeLikelihood + 1) >= changeLikelihood) {
            var statobj = document.getElementById('stat' + parseInt(stat));
            var statval = parseInt(statobj.innerHTML);
            if (Math.random() >= .33) {
                statobj.innerHTML = statval + 1;
            } else {
                statobj.innerHTML = statval - 1;
            }
        }
    }
}

// ----------------------------------------------------------------
// loadScrolls - called once user approaches bottom of scrollbox,
//               generates and appends to document n new scrolls
// @param n - number of scrolls to add to scrollbox
// ----------------------------------------------------------------

function loadScrolls(n) {
    var content = document.getElementById('content');
    for (var i = 0; i < n; i++) {
        var scrollobj = document.createElement('div');
        scrollobj.className = 'scroll';
        var profileboxobj = document.createElement('div');
        profileboxobj.className = 'profilepicturebox';
        var profileobj = document.createElement('img');
        profileobj.src = 'img/profiles/profile' + parseInt(Math.floor(Math.random() * numProfiles + 1)) + '.png';
        profileobj.className = 'profilepicture';
        profileboxobj.appendChild(profileobj);
        scrollobj.appendChild(profileboxobj);
        var fillerboxobj = document.createElement('div');
        fillerboxobj.className = 'fillerbox';
        var totalnumwords = Math.floor(Math.random() * 30 + 5);
        for (var numwords = 0; numwords < totalnumwords; numwords++) {
            var numletters = Math.floor(Math.random() * 12) + 1;
            var word = document.createElement('img');
            word.src = 'img/words/width' + numletters + '.gif';
            word.className = 'filler';
            fillerboxobj.appendChild(word);
            if (numwords < totalnumwords - 1) {
                var space = document.createElement('img');
                space.src = 'img/words/space.png';
                space.className = 'filler';
                fillerboxobj.appendChild(space);
            }
        }
        scrollobj.appendChild(fillerboxobj);
        content.appendChild(scrollobj);
    }
}

// ----------------------------------------------------------------
// setLoading - appends 'loading' element to end of content stream
//              and initiates clearLoading callback
// @param n - number of scrolls to eventually load
// ----------------------------------------------------------------

function setLoading(n) {
    var content = document.getElementById('content');
    var loadobj = document.createElement('div');
    loadobj.className = 'scroll';
    loadobj.id = 'loading';
    loadobj.innerHTML = 'loading...';
    content.appendChild(loadobj);
    setTimeout('clearLoading(' + n + ');', 500); //pretends to load for half of a second
}

// ----------------------------------------------------------------
// clearLoading - generates n new scrolls, removes 'loading'
//                element, and restarts pageProcess
// @param n - number of scrolls to load
// ----------------------------------------------------------------

function clearLoading(n) {
    var loadobj = document.getElementById('loading');
    if (loadobj != null) {
        loadobj.parentNode.removeChild(loadobj);
    }
    loadScrolls(n);
    pageProgress();
}

// ----------------------------------------------------------------
// pageProgress - called twice per second, checks if user is close
//                to the bottom of the page and loads new scrolls
//                if so. Also, gives chance to update stats
// ----------------------------------------------------------------

function pageProgress() {
    document.getElementById('scrollcontainer').style.height = '' + (window.innerHeight * .94 - 48) + 'px';
    document.getElementById('scrollcontainer').style.padding = '' + (window.innerHeight * 0.03) + 'px 0';
    document.getElementById('userprofilecontainer').style.padding = '' + (window.innerHeight * 0.03) + 'px 0';
    var box = document.getElementById('scrollbox');
    var scrolltop = box.scrollTop;
    var scrollheight = box.scrollHeight;
    var windowheight = box.clientHeight;
    updateStats();
    if (windowheight + scrolltop >= scrollheight - 10) {
        setLoading(40);
    } else {
        setTimeout('pageProgress();', 500);
    }
}
