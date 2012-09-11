var slideMutex = false;
var barOut = false;
var currentSlide = 1;

pageLoad = function(){
    attachListeners();
};
function getSliderValue(){
    var url = window.location.href;
    if (url.match(/slider1=(\d+)/)){
        return RegExp.$1;
    }
    else{
        return '3';
    }
}

attachListeners = function(){
    $('.categoryLinks').each(function(ele){
        $(this).hover(
            function(){
                // Mouse enter
                $(this).animate({
                    height: '90',
                    fontSize: '25'
                }, 500, function(){
                            $(this).animate({
                                width: '170'
                            },'slow',function(){
                                       $(this).children('.categoryDescription').fadeIn();
                                    });
                        }
                );    
            },
            function(){
               // Mouse exit
               $(this).stop();
               $(this).css('width','120px');
               $(this).css('height','30px');
               $(this).css('font-size','15px');
               $(this).children('.categoryDescription').hide();
            }
        );
    });
    
    //click
     $('.categoryLinks').each(function(ele){
        $(this).click(
                function(){
                    var catLink = $(this).children('.categoryText').attr('id');
                    if(catLink == 'home'){
                        catLink = 'index';
                    }
                    catLink += ".html";
                    window.location=catLink;
                });
    });
    
    // captions
    $('.contentHover').each(function(ele){
        $(this).hover(
                function(){
                    // Mouse enter
                    if(getSliderValue() == $(this).children('.contentImg').attr('slider')){
                        $(this).children('.hoverText').slideDown();
                    }
                },
                function(){
                    $(this).stop();
                    $(this).children('.hoverText').slideUp();
                }
        );
    });
    
    // Collapse skills
    $('.viewSkill').each(function(ele){
        $(this).click(
            function(){
                if($(this).attr('class') === 'viewSkill'){
                    $(this).attr('src','images/plus.png');
                    $(this).attr('class','hideSkill');
                    $(this).siblings('.skillDescription').slideUp();
                }else{
                    $(this).attr('src','images/minus.png');
                    $(this).attr('class','viewSkill');
                    $(this).siblings('.skillDescription').slideDown();
                }
            }
        );
    });
    
    // Collapse skills
    $('.hideSkill').each(function(ele){
        $(this).siblings('.skillDescription').hide();
        $(this).click(
            function(){
                if($(this).attr('class') === 'viewSkill'){
                    $(this).attr('src','images/plus.png');
                    $(this).attr('class','hideSkill');
                    $(this).siblings('.skillDescription').slideUp();
                }else{
                    $(this).attr('src','images/minus.png');
                    $(this).attr('class','viewSkill');
                    $(this).siblings('.skillDescription').slideDown();
                }
            }
        );
    });

    $('.viewCase').each(function(ele){
        $(this).children('.caseDescription').hide();
        $(this).click(
            function(){
                if($(this).attr('class') === 'viewCase'){
                    $(this).attr('class','hideCase');
                    $(this).children('.expandArrow').attr('src','images/arrowexpand.png');
                    $(this).children('.caseDescription').slideDown();
                    var newSkillImg = '' + $(this).children('.newSkill').text();
                    var oldSkillImg = $(this).parent().siblings('.skillsImg').attr('src');
                    if (newSkillImg != ''){
                        $(this).parent().siblings('.skillsImg').attr('src',newSkillImg);
                        $(this).children('.newSkill').html(oldSkillImg);
                    }
                }else{
                    $(this).attr('class','viewCase');
                    $(this).children('.expandArrow').attr('src','images/arrowcollapse.png');
                    $(this).children('.caseDescription').slideUp();
                    var newSkillImg = $(this).children('.newSkill').text();
                    var oldSkillImg = $(this).parent().siblings('.skillsImg').attr('src');
                    if (newSkillImg && newSkillImg != ''){
                        $(this).parent().siblings('.skillsImg').attr('src',newSkillImg);
                        $(this).children('.newSkill').html(oldSkillImg);
                    }
                }
            }
        );
    });
    
    $('.hideCase').each(function(ele){
        $(this).children('.caseDescription').hide();
        $(this).click(
            function(){
                if($(this).attr('class') === 'viewCase'){
                    $(this).attr('class','hideCase');
                    $(this).children('.caseDescription').slideDown();
                }else{
                    $(this).attr('class','viewCase');
                    $(this).children('.caseDescription').slideUp();
                }
            }
        );
    });
    
    //Hover listeners for slider
    $('#slider').hover(
        function(){ // mouse enter
            barOut = true;
            $('#barRight').animate({
                width: 300
            },500,
                function(){
                    var hideSlide = "#desc" + currentSlide;
                    $(hideSlide).show();
                }
            );
        },
        function(){
            //do nothing on mouse exit
        }
    );
    
    
    // Arrow listeners for slider
    $('#slideLeft').bind('click',
        function(event){
            //event.stopImmediatePropogation();
            if($('#sliderBox').css('left') !== "0px" && slideMutex === false){
                slideMutex = true;
                $('#sliderBox').animate({
                    left: '+=673'
                }, 500, function(){
                    if(barOut === true){
                        var hideSlide = "#desc" + currentSlide;
                        $(hideSlide).hide();
                    }
                    currentSlide--;
                    slideMutex = false;
                    if(barOut === true){
                        var hideSlide = "#desc" + currentSlide;
                        $(hideSlide).show();
                    }
                });
            }
        }
    );
    
    // Arrow listeners for slider
    $('#slideRight').bind('click',
        function(event){
            //event.stopImmediatePropogation();
            if($('#sliderBox').css('left') !== "-1346px" && slideMutex === false){
                slideMutex = true;
                $('#sliderBox').animate({
                    left: '-=673'
                }, 500, function(){
                    if(barOut === true){
                        var hideSlide = "#desc" + currentSlide;
                        $(hideSlide).hide();
                    }
                    currentSlide++;
                    slideMutex = false;
                    if(barOut === true){
                        var hideSlide = "#desc" + currentSlide;
                        $(hideSlide).show();
                    }
                });
            }
        }
    );
    
    //Close description listeners
    $('.closeButton').each(function(ele){
        $(this).click(
            function(){
                barOut = false;
                var hideSlide = "#desc" + currentSlide;
                $(hideSlide).hide();
                $('#barRight').animate({
                    width: 45
                });
            }
        );
    });
    
};

$(document).ready(function() {
    pageLoad();
});