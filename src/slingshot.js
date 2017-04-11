/**
 * Created by 2014 on 8/24/2016.
 */

var nameInstance = null; // an image containing my name
var stoneInstance; // the dot in the 'i' in 'Lewis' used to navigate the website
var targetContainerInstance; // an object containing the three targets for the 'stone'
var helpInstance; // instructional text that appears after 2 seconds of inactivity
var containerWidth; // will vary
var containerHeight; // will vary

var pullbackLimit = 40; // limit, in pixels, that stone can be pulled back (pullback distance does not affect launch velocity)
var launchVelocity = 400; // initial velocity, in pixels per second, of launched stone
var slowdownRate = 560; // deceleration, in pixels per second squared, of stone

var targetGrowthRate = 30; // rate, in pixels per second, at which radii of targets grow in and out

var textFadeRate = 1.5; // rate, in 'alpha' per second, at which labels fade in and out

// font: Roboto Bold 700 Italic

// ----------------------------------------------------------------
// A word on coordinates: I keep my canvas square, limited by the
// lesser of the height and the width of the enclosing html window.
// The actual window width and height are stored in
// 'containerWidth' and 'containerHeight.' Whenever one of these
// changes, I resize the canvas object accordingly, expanding or
// shrinking both dimensions to equal the lesser of those of the
// window. I then call 'context.scale()' with the dimension of the
// canvas divided by 1000 as both arguments. This allows me to draw
// elements using a 1000x1000 coordinate system, which is then
// automatically resized to the canvas's actual pixel dimensions.
// Any coordinates or rates of change I use here will be relative
// to a 1000x1000 square.
// ----------------------------------------------------------------

// ----------------------------------------------------------------
// start - called by index.html, creates object instances
// ----------------------------------------------------------------
function start() {
    var img = document.createElement('img'); // loads name image, waits to draw until load is successful
    img.src = 'img/name.png';
    img.onload = function() {
        nameInstance = new Name(img);
    };
    stoneInstance = new Stone([728, 464], 8);
    targetContainerInstance = new TargetContainer();
    targetContainerInstance.addTarget(new Target([728, 464], 141, Math.PI * 4 / 10, 15, 'about.html', 'about me'));
    targetContainerInstance.addTarget(new Target([728, 464], 141, Math.PI * 3 / 10, 15, 'data/resume.pdf', 'resume'));
    targetContainerInstance.addTarget(new Target([728, 464], 141, Math.PI * 2 / 10, 15, 'https://github.com/kid-c-plus', 'github'));
    targetContainerInstance.addTarget(new Target([728, 464], 141, Math.PI / 10, 15, 'scroll/index.html', '"scroll"'));
    helpInstance = new Text([stoneInstance.coords[0] + (stoneInstance.radius * 2) + 15, stoneInstance.coords[1]], 'click and drag to launch', '16px Roboto', [148, 148, 184], 0);
    nameArea.createArea();
}

// ----------------------------------------------------------------
// Name - object encapsulating image with my name
// ----------------------------------------------------------------

function Name(img) {
    this.draw = function() {
        nameArea.context.drawImage(img, 200, 425, 600, 150);
    }
}

// ----------------------------------------------------------------
// Stone - object representing dot in 'i'
// ----------------------------------------------------------------

function Stone(center, radius) {
    this.centerCoords = center; // coordinates of resting place of center of stone (above 'i' in 'Lewis,' here)
    this.coords = this.centerCoords; // actual, variable coordinates of center of stone
    this.radius = radius;
    this.clicked = false; // true if stone has been clicked at least once, used in drawing help text
    this.dragged = false; // true if stone is currently being dragged
    this.moving = false; // true if stone was launched and has not been reset to center
    this.velocity = 0; // pixels per second
    this.angle = 0; // angle from center to stone when being pulled back
    this.restingPeriod = 0; // length of time a launched, stopped stone has left to rest before being reset
    var color = '#FF3333';

    // ----------------------------------------------------------------
    // isWithin - determines if a point is within the stone
    // @param coords - coordinates of point to test
    // @return true if coords are within stone area
    // ----------------------------------------------------------------
    this.isWithin = function(coords) {
        return distance(coords, this.coords) <= this.radius;
    };

    // ----------------------------------------------------------------
    // moved - determines if stone is away from center
    // @return true if stone is away
    // ----------------------------------------------------------------

    this.moved = function() {
        return this.coords[0] != this.centerCoords[0] || this.coords[1] != this.centerCoords[1];
    };

    // ----------------------------------------------------------------
    // click - called when left mouse is clicked, determines if click
    //         is inside stone, and sets 'dragged' to true if so
    // @return whether the stone is the thing being clicked
    // ----------------------------------------------------------------

    this.click = function(coords) {
        if (this.isWithin(coords)) {
            this.dragged = true;
            return true;
        }
        return false;
    };

    // ----------------------------------------------------------------
    // update - called every timeInterval, updates stone coordinates
    //          and state when it's moving
    // @param timeInterval - time, in seconds, since last 'update' call
    // @param targetContainer - object containing stone targets
    // ----------------------------------------------------------------

    this.update = function(timeInterval, targetContainer) {
        if (this.moving) { // has been launched, has not been reset
            if (this.velocity > 0) { // is moving
                this.coords[0] -= Math.cos(this.angle) * this.velocity * timeInterval; // update position
                this.coords[1] += Math.sin(this.angle) * this.velocity * timeInterval;
                if (this.coords[0] >= this.centerCoords[0] && this.coords[1] <= this.centerCoords[1])
                // about this: I don't want to start slowing the stone down until it passes its resting place,
                // because otherwise a shorter pullback would send a stone slightly farther than a longer one
                {
                    this.velocity -= slowdownRate * timeInterval;
                }

            } else { // stone has stopped
                targetContainer.testRedirect(this); // has it hit any targets?
                this.restingPeriod -= timeInterval; // decrease time left to rest before reset
                if (this.restingPeriod <= 0) {
                    this.moving = false;
                    this.coords = this.centerCoords.slice(); // reset stone back to center
                }
            }
        }
    };

    // ----------------------------------------------------------------
    // drag - updates stone position relative to dragging mouse
    // @param mouseCoords - coordinates (in 1000x1000 system) of
    //                      dragging mouse
    // ----------------------------------------------------------------

    this.drag = function(mouseCoords) {
        this.angle = Math.atan2(this.centerCoords[1] - mouseCoords[1], mouseCoords[0] - this.centerCoords[0]);
        if (this.angle >= -1 * Math.PI && this.angle <= -.5 * Math.PI)
        // if it's being dragged back in an appropriate direction (anywhere from 180 to 270 degrees)
        {
            if (distance(mouseCoords, this.centerCoords) > pullbackLimit)
            // place at mouse coordinates or pullbackLimit pixels away, whichever's closest
            {
                this.coords[0] = this.centerCoords[0] + (Math.cos(this.angle) * pullbackLimit);
                this.coords[1] = this.centerCoords[1] - (Math.sin(this.angle) * pullbackLimit);
            } else {
                this.coords = mouseCoords.slice();
            }
        } else {
            this.coords = this.centerCoords.slice(); // if it's not being pulled back in an appropriate direction, it stays still
        }
    };

    // ----------------------------------------------------------------
    // launch - called when being dragged, sends stone moving
    // ----------------------------------------------------------------

    this.launch = function() {
        if (this.coords[0] != this.centerCoords[0] || this.coords[1] != this.centerCoords[1])
        // the stone must currently be pulled back in an appropriate direction
        {
            this.velocity = launchVelocity;
            this.moving = true;
            this.restingPeriod = .5;
        }
        this.dragged = false;
    };

    // ----------------------------------------------------------------
    // draw - draws stone on canvas
    // ----------------------------------------------------------------

    this.draw = function() {
        nameArea.context.fillStyle = color;
        nameArea.context.beginPath();
        nameArea.context.arc(this.coords[0], this.coords[1], this.radius, 0, 2 * Math.PI);
        nameArea.context.fill();
    }
}

// ----------------------------------------------------------------
// drawLine - draws guiding line for dragged stone
// @param stoneInstance - stone to draw line for
// ----------------------------------------------------------------

function drawLine(stoneInstance) {
    nameArea.context.strokeStyle = '#9494b8';
    nameArea.context.setLineDash([5, 15]); // dashed line
    nameArea.context.beginPath();
    nameArea.context.moveTo(stoneInstance.coords[0], stoneInstance.coords[1]);
    nameArea.context.lineTo(stoneInstance.centerCoords[0] - Math.cos(stoneInstance.angle) * 121,
                            stoneInstance.centerCoords[1] + Math.sin(stoneInstance.angle) * 121);
    nameArea.context.stroke();
}

// ----------------------------------------------------------------
// Target - circular labeled target, opens new page if stone comes
//          to rest touching it
// @param stoneCoords - coordinates to draw target relative to
// @param dist - distance away from coordinates to draw
//                   target at
// @param angle - angle from coords to this target
//                (used also for drawing label)
// @param radius - radius of full circle
// @param dest - URL of new page to open
// @param name - label to draw alongside target
// ----------------------------------------------------------------

function Target(stoneCoords, dist, angle, radius, dest, name) {
    var coords = [stoneCoords[0] + dist * Math.cos(angle), stoneCoords[1] - dist * Math.sin(angle)];
    var dynamicRadius = 0; // actual current radius, grows and shrinks between 0 and radius
    var growth = 0; // radius is currently {growing = 1; constant = 0; shrinking = -1}
    var label = new Text([coords[0] + 30 * Math.cos(angle), coords[1] - 30 * Math.sin(angle)], name, '16px Roboto', [148, 148, 184], angle);
    // label to give to target, fades in and out alongside target growing and shrinking

    // ----------------------------------------------------------------
    // overlaps - determines if this target and another circle overlap
    // @param otherCoords - center of other circle
    // @param otherRadius - radius of other circle
    // @return true if they overlap
    // ----------------------------------------------------------------

    this.overlaps = function(otherCoords, otherRadius) {
        return distance(otherCoords, coords) < radius + otherRadius;
    };

    // ----------------------------------------------------------------
    // growIn - starts circle on growing in
    // ----------------------------------------------------------------

    this.growIn = function() {
        growth = 1;
        label.fadeIn(); // label fades in alongside circle
    };

    // ----------------------------------------------------------------
    // shrinkOut - starts circle on shrinking out
    // ----------------------------------------------------------------

    this.shrinkOut = function() {
        growth = -1;
        label.fadeOut(); // label fades out alongside circle
    };

    // ----------------------------------------------------------------
    // update - called every timeInterval, updates size of circle and
    //          opacity of label
    // @param timeInterval - length of time (in seconds) since last
    //                       update call
    // ----------------------------------------------------------------

    this.update = function(timeInterval) {
        if (growth == 1 && dynamicRadius < radius) {
            dynamicRadius = Math.min(dynamicRadius + targetGrowthRate * timeInterval, radius);
        } else if (growth == -1  && dynamicRadius > 0) {
            dynamicRadius = Math.max(dynamicRadius - targetGrowthRate * timeInterval, 0);
        }
        label.update(timeInterval);
    };

    // ----------------------------------------------------------------
    // draw - draws target and label on screen
    // ----------------------------------------------------------------

    this.draw = function() {
        if (dynamicRadius > 0) {
            nameArea.context.fillStyle = '#333333';
            nameArea.context.beginPath();
            nameArea.context.arc(coords[0], coords[1], dynamicRadius, 0, 2 * Math.PI);
            nameArea.context.fill();
        }
        label.draw();
    };

    // ----------------------------------------------------------------
    // redirect - loads target web page
    // ----------------------------------------------------------------

    this.redirect = function() {
        window.location = dest;
    }
}

// ----------------------------------------------------------------
// TargetContainer - object holding all target instances
// ----------------------------------------------------------------

function TargetContainer() {
    var targets = [];
    this.isDisplayed = false;

    // ----------------------------------------------------------------
    // addTarget - appends given Target instance to list of targets
    // @param target - Target instance to add
    // ----------------------------------------------------------------

    this.addTarget = function(target) {
        targets.push(target);
    };

    // ----------------------------------------------------------------
    // display - calls growIn() on each target in list
    // ----------------------------------------------------------------

    this.display = function() {
        this.isDisplayed = true;
        targets.forEach(function(element) {
            element.growIn();
        });
    };

    // ----------------------------------------------------------------
    // hide - calls shrinkOut() on each target in list
    // ----------------------------------------------------------------

    this.hide = function() {
        this.isDisplayed = false;
        targets.forEach(function(element) {
            element.shrinkOut();
        });
    };

    // ----------------------------------------------------------------
    // testRedirect - determines if any targets overlap the stone,
    // and if one does, calls redirect() on that target
    // @param stoneInstance - stone to test
    // ----------------------------------------------------------------

    this.testRedirect = function(stoneInstance) {
        targets.forEach(function(element) {
            if (element.overlaps(stoneInstance.coords, stoneInstance.radius)) {
                clearInterval(nameArea.interval); // keeps current page from being updated while next one is loaded
                element.redirect();
            }
        });
    };

    // ----------------------------------------------------------------
    // update - called every timeInterval, calls update(timeInterval on
    //          each target in list
    // @param timeInterval - time (in seconds) since last update call
    // ----------------------------------------------------------------

    this.update = function(timeInterval) {
        targets.forEach(function(element) {
            element.update(timeInterval);
        });
    };

    // ----------------------------------------------------------------
    // draw - calls draw() for each target in list
    // ----------------------------------------------------------------

    this.draw = function() {
        targets.forEach(function(element) {
            element.draw();
        });
    }
}

// ----------------------------------------------------------------
// Text - text at a particular location and angle on screen,
//        capable of fading in and out
// @param coords - location on screen to draw text (location of
//                 vertical middle, left-hand side)
// @param content - text to draw
// @param font - system font to draw text in
// @param color - color to draw text in
// @param angle - angle at which to draw text
// ----------------------------------------------------------------

function Text(coords, content, font, color, angle) {
    var alpha = 0; // opacity of text, initially transparent
    var fade = 0; // like growth in Target, {1 = fading in; 0 = constant; -1 = fading out}

    // ----------------------------------------------------------------
    // fadeIn - starts text to fading in
    // ----------------------------------------------------------------

    this.fadeIn = function() {
        fade = 1;
    };

    // ----------------------------------------------------------------
    // fadeOut - starts text to fading out
    // ----------------------------------------------------------------

    this.fadeOut = function() {
        fade = -1;
    };

    // ----------------------------------------------------------------
    // update - called every timeInterval, updates opacity of text
    // @param timeInterval - time (in seconds) since last update call
    // ----------------------------------------------------------------

    this.update = function(timeInterval) {
        if (fade == 1 && alpha < 1) {
            alpha += textFadeRate * timeInterval;
        } else if (fade == -1 && alpha > 0) {
            alpha -= textFadeRate * timeInterval;
        }
    };

    // ----------------------------------------------------------------
    // draw - draws text on canvas
    // ----------------------------------------------------------------

    this.draw = function() {
        nameArea.context.save();
        nameArea.context.translate(coords[0], coords[1]); // grips canvas at start point of message
        nameArea.context.rotate(-1 * angle);
        // rotates canvas (-1 * angle) so that when it's rotated back text will be angle radians above the horizontal
        nameArea.context.font = font;
        nameArea.context.fillStyle = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + alpha + ')';
        // current color and opacity
        nameArea.context.textBaseline = 'middle';
        nameArea.context.fillText(content, 0, 0);
        nameArea.context.restore();
    }
}

// ----------------------------------------------------------------
// nameArea - array containing canvas context reference, handles
//            resizing and scaling
// ----------------------------------------------------------------

var nameArea = {
    canvas : document.createElement('canvas'), // creates enclosing canvas html element

    // ----------------------------------------------------------------
    // createArea - called at beginning of execution, inserts canvas
    //              element into html, sizes and scales canvas, and
    //              adds mouse event listeners
    // ----------------------------------------------------------------

    createArea : function() {
        containerWidth = window.innerWidth;
        containerHeight = window.innerHeight;
        var factor = Math.min(containerWidth, containerHeight); // the size of the square canvas
        this.canvas.width = factor;
        this.canvas.height = factor;
        this.canvas.id = 'namebox';
        this.context = this.canvas.getContext('2d');
        this.context.scale(factor / 1000, factor / 1000); // enables 1000x1000 grid drawing
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.canvas.addEventListener('mousedown', mouseDownListener);
        this.canvas.addEventListener('mousemove', mouseMoveListener);
        this.canvas.addEventListener('mouseup', mouseUpListener);
        this.interval = setInterval(updateAll, 20); // calls updateAll every 20 milliseconds
        this.idleTime = 0; // time since load where user has not clicked the stone (for use with help text)
    },

    // ----------------------------------------------------------------
    // updateArea - resizes and rescales canvas, if necessary
    // ----------------------------------------------------------------

    updateArea : function() {
        if (containerWidth != window.innerWidth || containerHeight != window.innerHeight) {
            containerWidth = window.innerWidth;
            containerHeight = window.innerHeight;
            var factor = Math.min(containerWidth, containerHeight);
            this.canvas.width = factor;
            this.canvas.height = factor;
            this.context.scale(factor / 1000, factor / 1000);
        }
    },

    // ----------------------------------------------------------------
    // clearArea - wipes clean last cycle's draw
    // ----------------------------------------------------------------

    clearArea : function() {
        this.context.clearRect(0, 0, 1000, 1000);
    }
};

// ----------------------------------------------------------------
// mouseDownListener - called on mouse button press, checks if
//                     mouse is over stone, begins dragging stone
//                     if so
// ----------------------------------------------------------------

function mouseDownListener(e) {
    var mouseCoords = correctCoordinates(e); // gets mouse coordinates in terms of 1000x1000 canvas square
    if (stoneInstance.click(mouseCoords)) {
        nameArea.idleTime = 0; // the stone has been clicked, so we can eliminate the help text
        stoneInstance.clicked = true;
        helpInstance.fadeOut();
    }
}

// ----------------------------------------------------------------
// mouseMoveListener - called on mouse movement, updates stone
//                     position if it's being dragged
// ----------------------------------------------------------------

function mouseMoveListener(e) {
    var coords = correctCoordinates(e);
    if (stoneInstance.dragged) { // obviously only update stone coordinates if it's currently being dragged
        stoneInstance.drag(coords);
    } else if (stoneInstance.isWithin(coords) && !targetContainerInstance.isDisplayed)
    // makes targets visible if mouse is inside stone
    {
       targetContainerInstance.display();
    } else if (!stoneInstance.isWithin(coords) && targetContainerInstance.isDisplayed && !stoneInstance.moving)
    // hides targets if stone is not moving and mouse is outside stone
    {
        targetContainerInstance.hide();
    }
}

// ----------------------------------------------------------------
// mouseUpListener - called on mouse button release, launches stone
//                   if it's currently being dragged
// ----------------------------------------------------------------

function mouseUpListener() {
    if (stoneInstance.dragged) {
        stoneInstance.launch();
    }
}

// ----------------------------------------------------------------
// correctCoordinates - converts given mouse coordinates to
//                      values relative to 1000x1000 grid
// ----------------------------------------------------------------

function correctCoordinates(e) {
    var mouseCoords = [0, 0];
    var factor = Math.min(containerWidth, containerHeight) / 1000;
    // ratio of actual coordinate from start of canvas / 1000x1000 coordinate
    if (containerWidth > containerHeight) {
        mouseCoords[0] = (e.clientX - (containerWidth - containerHeight) / 2) / factor;
        mouseCoords[1] = e.clientY / factor;
    } else {
        mouseCoords[0] = e.clientX / factor;
        mouseCoords[1] = (e.clientY - (containerHeight - containerWidth) / 2) / factor;
    }
    return mouseCoords;
}

// ----------------------------------------------------------------
// distance - returns Euclidean distance between two sets of coords
// @param coords1, coords2 - pairs of xy-coordinates to evaluate
// @return - distance between them
// ----------------------------------------------------------------

function distance(coords1, coords2) {
    return Math.sqrt(Math.pow(coords1[0] - coords2[0], 2) + Math.pow(coords1[1] - coords2[1], 2));
}
// ----------------------------------------------------------------
// updateAll - called every 20 milliseconds, updates and draws
//             everything that needs updating and drawing
// ----------------------------------------------------------------

function updateAll() {
    nameArea.updateArea();
    nameArea.clearArea();
    if (nameInstance != null) { // only draw name once the image is loaded
        nameInstance.draw();
    }
    if (stoneInstance.dragged && stoneInstance.moved()) { // only draw guiding line if stone is being dragged
        drawLine(stoneInstance);
    }
    targetContainerInstance.update(.02);
    targetContainerInstance.draw();
    stoneInstance.update(.02, targetContainerInstance);
    stoneInstance.draw();
    if (!stoneInstance.clicked) { // update length of time since page load that user hasn't clicked stone
        nameArea.idleTime += .02;
    }
    if (nameArea.idleTime >= 3) { // draw help text once idle time reaches 3 seconds
        helpInstance.fadeIn();
    }
    helpInstance.update(.02);
    helpInstance.draw();
}
