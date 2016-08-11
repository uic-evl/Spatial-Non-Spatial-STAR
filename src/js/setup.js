var App = App || {};

$(function() {

    /** Initialize the advanced menu accordion **/

    /** init the class **/
    var Accordion = function(el, multiple) {
        this.el = el || {};
        this.multiple = multiple || false;

        // Variables privadas
        var links = this.el.find('.link');
        // Evento
        links.on('click', {el: this.el, multiple: this.multiple}, this.dropdown)
    };

    /** define the dropdown function **/
    Accordion.prototype.dropdown = function(e) {
        var $el = e.data.el;
        var $this = $(this);
        var $next = $this.next();

        $next.slideToggle();
        $this.parent().toggleClass('open');

        if (!e.data.multiple) {
            $el.find('.submenu').not($next).slideUp().parent().removeClass('open');
        }
    };

    // create the menu
    App.accordion = new Accordion($('#accordion'), false);


    /** add a keyboard listener to the document for the ctrl key**/
    App.ctrl = false;

    // on press
    document.addEventListener("keydown", function(event) {
        if(event.which == 17) App.ctrl = true;
    });

    // on release
    document.addEventListener("keyup", function(event) {
        if(event.which) App.ctrl = false;
    });

});
