/* globals ShapeManager: false */
/* globals console: false */

$(function() {

    var shapeManager = new ShapeManager("shapesCanvas", 512, 512);


    // set state depending on what we want to do,
    // for example to create Rectangle

    $("input[name='state']").click(function(){
        var state = $(this).val();
        shapeManager.setState(state);
    });

    $("input[name='color']").click(function(){
        var color = $(this).val();
        shapeManager.setColor(color);
    });

    shapeManager.setState("RECT");

    console.log("getState", shapeManager.getState());
});
