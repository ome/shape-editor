/* globals ShapeManager: false */
/* globals console: false */

$(function() {

    var shapeManager = new ShapeManager("shapesCanvas", 512, 512);

    var zoomPercent = 100;

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

    $("select[name='lineWidth']").change(function(){
        var lineWidth = $(this).val();
        shapeManager.setLineWidth(lineWidth);
    });

    $("button[name='zoomIn']").click(function(){
        console.log("zoomIn");
        zoomPercent += 20;
        $("#zoomDisplay").text(zoomPercent + " %");
    });
    $("button[name='zoomOut']").click(function(){
        console.log("zoomOut");
        zoomPercent -= 20;
        $("#zoomDisplay").text(zoomPercent + " %");
    });


    $("#shapesCanvas").bind("change:selected", function(){
        var color = shapeManager.getColor();
        $("input[value='" + color + "']").prop('checked', 'checked');
        var lineWidth = shapeManager.getLineWidth();
        console.log(lineWidth);
        $("select[name='lineWidth']").val(lineWidth);
    });

    shapeManager.setState("RECT");

});
