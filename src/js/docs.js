/* globals ShapeManager: false */
/* globals console: false */

$(function() {

    var shapeManager = new ShapeManager("shapesCanvas", 512, 512);


    // set state depending on what we want to do,
    // for example to create Rectangle
    shapeManager.setState("RECT");

    console.log("getState", shapeManager.getState());
});
