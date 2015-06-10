/* globals ShapeEditor: false */
/* globals console: false */

$(function() {

    var shapeEd = new ShapeEditor("shapesCanvas", 512, 512);


    // set state depending on what we want to do,
    // for example to create Rectangle
    shapeEd.setState("RECT");

    shapeEd.setState("invalid");

    console.log("getState", shapeEd.getState());
});
